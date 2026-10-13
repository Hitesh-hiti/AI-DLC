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
    maxCandidates: number
  ): Promise<LocatorCandidate[]> {
    const candidates: LocatorCandidate[] = [];

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

    for (const item of unique.values()) {
      const locator =
        page.locator(item.selector);

      const count = Math.min(
        await locator.count().catch(() => 0),
        maxCandidates
      );

      for (
        let index = 0;
        index < count;
        index++
      ) {
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
                baselineFingerprint,
                index,
                count
              ),

            score: scored.score,

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
        } catch {
          // Ignore invalid candidates.
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

function cssEscape(
  value: string
): string {
  return value.replace(
    /["\\]/g,
    '\\$&'
  );
}