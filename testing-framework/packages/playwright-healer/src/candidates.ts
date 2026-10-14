import type {
  Locator,
  Page,
} from '@playwright/test';

import {
  fingerprintLocator,
  fingerprintSelector,
} from './fingerprint.js';

import {
  scoreFingerprint,
} from './scoring.js';

import type {
  LocatorCandidate,
} from './types.js';

export class CandidateGenerator {
  async generate(
    page: Page,
    baselineFingerprint: Awaited<
      ReturnType<typeof fingerprintLocator>
    >,
    maxCandidates: number,
    preferredIndex?: number
  ): Promise<LocatorCandidate[]> {
    const candidates: LocatorCandidate[] = [];

    /*
     * IMPORTANT:
     * If the historical baseline contains a testId and that testId
     * uniquely exists in the live DOM, treat it as a decisive match.
     *
     * We must NOT compare it against alternative selectors such as
     * #id, placeholder, structural selectors, etc.
     *
     * Otherwise an equally-valid secondary selector can incorrectly
     * trigger the ambiguityMargin check.
     */
    if (baselineFingerprint.testId) {
      const testId = baselineFingerprint.testId;

      const locator = page.getByTestId(testId);
      const count = await locator.count().catch(() => 0);

      console.log('[HEALER DEBUG] historical testId live check', {
        testId,
        count,
      });

      if (count === 1) {
        let fingerprint;

        try {
          fingerprint = await fingerprintLocator(locator);
        } catch (error) {
          console.log(
            '[HEALER DEBUG] candidate fingerprint failed; using exact historical testId',
            {
              testId,
              error: String(error),
            }
          );

          return [
            {
              expression: `getByTestId(${JSON.stringify(testId)})`,
              score: 1,
              strategy: 'testId',
              reason:
                'Exact historical testId uniquely matched live DOM',
              resolve: (_page: Page) =>
                _page.getByTestId(testId),
              indexHint: preferredIndex,
            },
          ];
        }

        const scored = scoreFingerprint(
          baselineFingerprint,
          fingerprint
        );

        console.log(
          '[HEALER DEBUG] exact historical testId uniquely validated',
          {
            testId,
            score: scored.score,
            reasons: scored.reasons,
          }
        );

        return [
          {
            expression: `getByTestId(${JSON.stringify(testId)})`,
            score: Math.max(scored.score, 1),
            strategy: 'testId',
            reason:
              `${scored.reasons.join(', ')}, ` +
              'exact historical testId uniquely matched live DOM',
            resolve: (_page: Page) =>
              _page.getByTestId(testId),
            indexHint: preferredIndex,
          },
        ];
      }
    }

    /*
     * No unique historical testId match.
     * Fall back to normal candidate generation.
     */
    const selectors: Array<{
      selector: string;
      strategy: string;
    }> = [];

    if (baselineFingerprint.testId) {
      selectors.push({
        selector:
          `[data-testid="${cssEscape(
            baselineFingerprint.testId
          )}"]`,
        strategy: 'testId',
      });
    }

    if (baselineFingerprint.id) {
      selectors.push({
        selector:
          `#${cssEscape(
            baselineFingerprint.id
          )}`,
        strategy: 'id',
      });
    }

    if (
      baselineFingerprint.role &&
      baselineFingerprint.ariaLabel
    ) {
      selectors.push({
        selector:
          `[role="${cssEscape(
            baselineFingerprint.role
          )}"][aria-label="${cssEscape(
            baselineFingerprint.ariaLabel
          )}"]`,
        strategy: 'role+ariaLabel',
      });
    }

    if (baselineFingerprint.placeholder) {
      selectors.push({
        selector:
          `[placeholder="${cssEscape(
            baselineFingerprint.placeholder
          )}"]`,
        strategy: 'placeholder',
      });
    }

    if (baselineFingerprint.name) {
      selectors.push({
        selector:
          `[name="${cssEscape(
            baselineFingerprint.name
          )}"]`,
        strategy: 'name',
      });
    }

    const structural =
      fingerprintSelector(
        baselineFingerprint
      );

    if (structural) {
      selectors.push({
        selector: structural,
        strategy: 'structural',
      });
    }

    const unique = new Map<
      string,
      {
        selector: string;
        strategy: string;
      }
    >();

    for (const item of selectors) {
      unique.set(
        item.selector,
        item
      );
    }

    // If the historical testId disappeared or mutated, inspect live testIds
    // and score them against the historical DOM fingerprint. This is what makes
    // deterministic healing work for data-testid changes such as
    // `login-submit` -> `login-submit-v2`.
    if (baselineFingerprint.testId) {
      const allTestIds = page.locator('[data-testid]');
      const liveCount = await allTestIds.count().catch(() => 0);
      const limit = Math.min(liveCount, Math.max(maxCandidates * 4, 32));
      const indexes = Array.from({ length: limit }, (_, i) => i);
      if (preferredIndex !== undefined && preferredIndex >= 0 && preferredIndex < liveCount) {
        indexes.sort((a, b) => (a === preferredIndex ? -1 : b === preferredIndex ? 1 : a - b));
      }
      const seenByTestId = new Map<string, number>();
      for (const globalIndex of indexes) {
        try {
          const candidate = allTestIds.nth(globalIndex);
          const fingerprint = await fingerprintLocator(candidate);
          if (!fingerprint.testId) continue;
          const occurrenceIndex = seenByTestId.get(fingerprint.testId) ?? 0;
          seenByTestId.set(fingerprint.testId, occurrenceIndex + 1);
          const scored = scoreFingerprint(baselineFingerprint, fingerprint);
          if (fingerprint.testId !== baselineFingerprint.testId && scored.score >= 0.45) {
            const sameTestIdCount = await _countTestId(page, fingerprint.testId);
            candidates.push({
              expression: `getByTestId(${JSON.stringify(fingerprint.testId)})${sameTestIdCount > 1 ? `.nth(${occurrenceIndex})` : ''}`,
              score: Math.min(1, scored.score + (preferredIndex === occurrenceIndex ? 0.06 : 0)),
              strategy: 'mutatedTestId',
              reason: `${scored.reasons.join(', ')}, live testId differs from historical testId`,
              resolve: (_page: Page) => {
                const base = _page.getByTestId(fingerprint.testId!);
                return sameTestIdCount > 1 ? base.nth(occurrenceIndex) : base;
              },
              indexHint: occurrenceIndex,
            });
          }
        } catch {
          // Ignore inaccessible DOM candidates.
        }
      }
    }

    for (const item of unique.values()) {
      const locator =
        page.locator(item.selector);

      const totalCount = await locator.count().catch(() => 0);
      const count = Math.min(totalCount, maxCandidates);
      const indexes = Array.from({ length: count }, (_, i) => i);
      if (preferredIndex !== undefined && preferredIndex >= 0 && preferredIndex < totalCount) {
        indexes.sort((a, b) => (a === preferredIndex ? -1 : b === preferredIndex ? 1 : a - b));
      }

      for (const index of indexes) {
        const candidate =
          locator.nth(index);

        try {
          const fingerprint =
            await fingerprintLocator(
              candidate
            );

          const scored =
            scoreFingerprint(
              baselineFingerprint,
              fingerprint
            );

          candidates.push({
            expression:
              this.expression(
                item.strategy,
                fingerprint,
                index,
                totalCount
              ),
            score: Math.min(1, scored.score + (preferredIndex === index ? 0.06 : 0)),
            strategy:
              item.strategy,
            reason:
              scored.reasons.join(', '),
            resolve:
              (_page: Page) =>
                _page
                  .locator(item.selector)
                  .nth(index),
          });
        } catch (error) {
          if (
            item.strategy === 'testId' &&
            baselineFingerprint.testId &&
            count === 1
          ) {
            candidates.push({
              expression:
                `getByTestId(${JSON.stringify(
                  baselineFingerprint.testId
                )})`,
              score: 1,
              strategy: 'testId',
              reason:
                'Exact historical testId matched live DOM',
              resolve:
                (_page: Page) =>
                  _page.getByTestId(
                    baselineFingerprint.testId!
                  ),
            });
          }
        }
      }
    }

    candidates.sort(
      (a, b) =>
        b.score - a.score
    );

    return candidates.slice(
      0,
      maxCandidates
    );
  }

  private expression(
    strategy: string,
    fingerprint: Awaited<
      ReturnType<typeof fingerprintLocator>
    >,
    index: number,
    count: number
  ): string {
    if (
      strategy === 'testId' &&
      fingerprint.testId &&
      count === 1
    ) {
      return `getByTestId(${JSON.stringify(
        fingerprint.testId
      )})`;
    }

    if (
      strategy === 'role+ariaLabel' &&
      fingerprint.role &&
      fingerprint.ariaLabel &&
      count === 1
    ) {
      return `getByRole(${JSON.stringify(
        fingerprint.role
      )}, { name: ${JSON.stringify(
        fingerprint.ariaLabel
      )} })`;
    }

    if (
      strategy === 'placeholder' &&
      fingerprint.placeholder &&
      count === 1
    ) {
      return `getByPlaceholder(${JSON.stringify(
        fingerprint.placeholder
      )})`;
    }

    if (
      strategy === 'id' &&
      fingerprint.id &&
      count === 1
    ) {
      return `locator(${JSON.stringify(
        `#${fingerprint.id}`
      )})`;
    }

    return `locator(<${strategy}>).nth(${index})`;
  }
}

function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

async function _countTestId(page: Page, testId: string): Promise<number> {
  return page.getByTestId(testId).count().catch(() => 0);
}
