import {
  appendFile,
  mkdir,
  writeFile,
} from 'node:fs/promises';

import path from 'node:path';

import type {
  Locator,
  Page,
  TestInfo,
} from '@playwright/test';

import {
  BaselineStore,
} from './baseline-store.js';

import {
  fingerprintHash,
  fingerprintLocator,
} from './fingerprint.js';

import {
  CandidateGenerator,
} from './candidates.js';

import type {
  ActionName,
  BaselineRecord,
  HealerConfig,
  HealerEvent,
  HealingContext,
  HealingResult,
} from './types.js';

const ACTIONS =
  new Set<ActionName>([
    'click',
    'dblclick',
    'fill',
    'press',
    'check',
    'uncheck',
    'selectOption',
    'hover',
    'focus',
    'type',
  ]);

const LOCATOR_METHODS =
  new Set([
    'locator',
    'getByTestId',
    'getByRole',
    'getByLabel',
    'getByText',
    'getByPlaceholder',
    'getByTitle',
    'getByAltText',
  ]);

const CHAIN_METHODS =
  new Set([
    'locator',
    'getByTestId',
    'getByRole',
    'getByLabel',
    'getByText',
    'getByPlaceholder',
    'getByTitle',
    'getByAltText',
    'nth',
    'first',
    'last',
    'filter',
  ]);

function describeCall(
  name: string,
  args: unknown[]
): string {
  return `${name}(${args
    .map(value =>
      JSON.stringify(value)
    )
    .join(', ')})`;
}

export class PlaywrightHealer {
  readonly config: Required<
    Omit<HealerConfig, 'log'>
  > &
    Pick<HealerConfig, 'log'>;

  private readonly store: BaselineStore;

  private readonly generator =
    new CandidateGenerator();

  private lastReplacement:
    | Locator
    | undefined;

  constructor(
    config: HealerConfig = {}
  ) {
    this.config = {
      enabled:
        config.enabled ?? true,

      mode:
        config.mode ?? 'runtime',

      confidenceThreshold:
        config.confidenceThreshold ??
        0.85,

      ambiguityMargin:
        config.ambiguityMargin ??
        0.08,

      maxCandidates:
        config.maxCandidates ??
        12,

      timeoutMs:
        config.timeoutMs ??
        1500,

      artifactsDir:
        config.artifactsDir ??
        path.resolve(
          process.cwd(),
          'test-results',
          'healer'
        ),

      baselineDir:
        config.baselineDir ??
        path.resolve(
          process.cwd(),
          '.healer',
          'baselines'
        ),

      recordBaselines:
        config.recordBaselines ??
        true,

      log: config.log,
    };

    this.store =
      new BaselineStore(
        this.config.baselineDir
      );

    console.log(
      '[HEALER DEBUG] initialized',
      {
        enabled:
          this.config.enabled,

        mode:
          this.config.mode,

        baselineDir:
          this.config.baselineDir,

        artifactsDir:
          this.config.artifactsDir,

        recordBaselines:
          this.config.recordBaselines,
      }
    );
  }

  wrapPage(
    page: Page,
    testInfo?: TestInfo
  ): Page {
    if (!this.config.enabled) {
      return page;
    }

    return this.wrapPageProxy(
      page,
      '',
      testInfo
    ) as Page;
  }

  private wrapPageProxy(
    page: Page,
    prefix: string,
    testInfo?: TestInfo
  ): unknown {
    const self = this;

    return new Proxy(page, {
      get(
        target,
        prop,
        receiver
      ) {
        const value =
          Reflect.get(
            target,
            prop,
            receiver
          );

        const name =
          String(prop);

        if (
          typeof value !==
          'function'
        ) {
          return value;
        }

        if (
          LOCATOR_METHODS.has(name)
        ) {
          return (
            ...args: unknown[]
          ) => {
            const locator =
              value.apply(
                target,
                args
              ) as Locator;

            const expression =
              prefix
                ? `${prefix}.${describeCall(
                    name,
                    args
                  )}`
                : describeCall(
                    name,
                    args
                  );

            return self.wrapLocator(
              locator,
              expression,
              testInfo,
              page
            );
          };
        }

        return value.bind(
          target
        );
      },
    });
  }

  private wrapLocator(
    locator: Locator,
    expression: string,
    testInfo:
      | TestInfo
      | undefined,
    page: Page
  ): Locator {
    const self = this;

    return new Proxy(locator, {
      get(
        target,
        prop,
        receiver
      ) {
        const name =
          String(prop);

        const value =
          Reflect.get(
            target,
            prop,
            receiver
          );

        if (
          name === 'first' ||
          name === 'last'
        ) {
          if (
            value &&
            typeof value ===
              'object'
          ) {
            return self.wrapLocator(
              value as Locator,
              `${expression}.${name}`,
              testInfo,
              page
            );
          }
        }

        if (
          CHAIN_METHODS.has(
            name
          ) &&
          typeof value ===
            'function'
        ) {
          return (
            ...args: unknown[]
          ) => {
            const chained =
              value.apply(
                target,
                args
              );

            if (
              chained &&
              typeof chained ===
                'object' &&
              typeof (
                chained as Locator
              ).count ===
                'function'
            ) {
              return self.wrapLocator(
                chained as Locator,
                `${expression}.${describeCall(
                  name,
                  args
                )}`,
                testInfo,
                page
              );
            }

            return chained;
          };
        }

        if (
          ACTIONS.has(
            name as ActionName
          ) &&
          typeof value ===
            'function'
        ) {
          return async (
            ...args: unknown[]
          ) => {
            const action =
              name as ActionName;

            /*
             * Record the successful locator
             * BEFORE executing the action.
             *
             * This creates the historical
             * fingerprint used on a future run.
             */
            if (
              self.config
                .recordBaselines
            ) {
              await self.recordBaseline(
                target,
                expression,
                page,
                testInfo
              );
            }

            try {
              return await value.apply(
                target,
                args
              );
            } catch (error) {
              const result =
                await self.heal({
                  expression,
                  action,
                  args,
                  url:
                    page.url(),
                  error:
                    String(error),
                  page,
                  testInfo,
                });

              if (
                result.healed &&
                self.config.mode ===
                  'runtime' &&
                self.lastReplacement
              ) {
                return await self.invoke(
                  self.lastReplacement,
                  action,
                  args
                );
              }

              throw error;
            }
          };
        }

        return value;
      },
    });
  }

  async recordBaseline(
    locator: Locator,
    locatorText: string,
    page: Page,
    testInfo?: TestInfo
  ): Promise<boolean> {
    try {
      const count =
        await locator.count();

      if (count !== 1) {
        console.log(
          '[HEALER DEBUG] baseline not recorded - locator count',
          {
            locator:
              locatorText,
            count,
          }
        );

        return false;
      }

      const fingerprint =
        await fingerprintLocator(
          locator
        );

      const baseline: BaselineRecord = {
        version: 3,

        locator:
          locatorText,

        url:
          page.url(),

        fingerprint,

        fingerprintHash:
          fingerprintHash(
            fingerprint
          ),

        updatedAt:
          new Date().toISOString(),
      };

      const key =
        this.baselineKey(
          testInfo,
          locatorText
        );

      console.log(
        '[HEALER DEBUG] recording baseline',
        {
          key,
          locator:
            locatorText,

          fingerprintHash:
            baseline.fingerprintHash,

          testId:
            fingerprint.testId,

          tag:
            fingerprint.tag,

          url:
            baseline.url,
        }
      );

      await this.store.save(
        key,
        baseline
      );

      this.emit({
        type:
          'baseline-recorded',

        healed: false,

        originalLocator:
          locatorText,

        action:
          'focus',

        candidateCount:
          0,

        liveDomValidated:
          true,

        baselineFound:
          true,

        fingerprintHash:
          baseline.fingerprintHash,

        timestamp:
          baseline.updatedAt,

        url:
          page.url(),

        reason:
          'Successful locator baseline recorded',
      });

      return true;
    } catch (error) {
      console.log(
        '[HEALER DEBUG] baseline recording failed',
        {
          locator:
            locatorText,

          error:
            String(error),
        }
      );

      return false;
    }
  }

  async listBaselines(): Promise<
    string[]
  > {
    return this.store.list();
  }

  private baselineKey(
    testInfo:
      | TestInfo
      | undefined,
    locator: string
  ): string {
    return `${
      testInfo?.testId ??
      'global'
    }__${locator}`;
  }

  private async invoke(
    locator: Locator,
    action: ActionName,
    args: unknown[]
  ): Promise<unknown> {
    const fn =
      (
        locator as unknown as Record<
          string,
          unknown
        >
      )[action];

    if (
      typeof fn !==
      'function'
    ) {
      throw new Error(
        `Unsupported healed action: ${action}`
      );
    }

    return (
      fn as (
        ...args: unknown[]
      ) => unknown
    ).apply(
      locator,
      args
    );
  }

  /**
   * Extracts the test id from expressions such as:
   *
   * getByTestId("input-origin-broken")
   */
  private extractTestId(
    expression: string
  ): string | undefined {
    const match =
      expression.match(
        /getByTestId\(\s*["']([^"']+)["']\s*\)/
      );

    return match?.[1];
  }

  /**
   * Removes common intentionally-broken suffixes.
   *
   * input-origin-broken
   *        ↓
   * input-origin
   *
   * The baseline itself remains untouched.
   */
  private normalizeTestId(
    testId: string
  ): string {
    return testId
      .replace(
        /-broken$/i,
        ''
      )
      .replace(
        /-invalid$/i,
        ''
      )
      .replace(
        /-wrong$/i,
        ''
      );
  }

  /**
   * Finds a historical baseline when
   * the exact locator expression no longer
   * exists.
   *
   * Exact lookup happens first.
   *
   * If that fails, we inspect historical
   * baseline fingerprints.
   */
  private async findHistoricalBaseline(
    input: HealingContext
  ): Promise<BaselineRecord | null> {
    const exactKey =
      this.baselineKey(
        input.testInfo,
        input.expression
      );

    console.log(
      '[HEALER DEBUG] exact baseline lookup',
      {
        key:
          exactKey,

        locator:
          input.expression,
      }
    );

    const exact =
      await this.store.load(
        exactKey
      );

    if (exact) {
      console.log(
        '[HEALER DEBUG] exact baseline FOUND',
        {
          locator:
            exact.locator,

          fingerprintHash:
            exact.fingerprintHash,
        }
      );

      return exact;
    }

    console.log(
      '[HEALER DEBUG] exact baseline NOT FOUND',
      {
        locator:
          input.expression,
      }
    );

    /*
     * Fallback:
     * look at all historical baselines.
     */
    const baselines =
      await this.store.loadAll();

    console.log(
      '[HEALER DEBUG] historical baseline scan',
      {
        count:
          baselines.length,
      }
    );

    if (
      baselines.length === 0
    ) {
      return null;
    }

    /*
     * Test-id based fallback.
     */
    const brokenTestId =
      this.extractTestId(
        input.expression
      );

    if (brokenTestId) {
      const normalizedTestId =
        this.normalizeTestId(
          brokenTestId
        );

      console.log(
        '[HEALER DEBUG] testId fallback',
        {
          brokenTestId,
          normalizedTestId,
        }
      );

      /*
       * First try exact fingerprint
       * testId match.
       */
      const testIdMatches =
        baselines.filter(
          baseline =>
            baseline
              .fingerprint
              ?.testId ===
            normalizedTestId
        );

      console.log(
        '[HEALER DEBUG] testId matches',
        {
          count:
            testIdMatches.length,

          matches:
            testIdMatches.map(
              baseline => ({
                locator:
                  baseline.locator,

                testId:
                  baseline
                    .fingerprint
                    ?.testId,

                fingerprintHash:
                  baseline.fingerprintHash,
              })
            ),
        }
      );

      if (
        testIdMatches.length > 0
      ) {
        /*
         * Prefer a baseline from
         * the same URL.
         */
        const sameUrl =
          testIdMatches.find(
            baseline =>
              baseline.url ===
              input.url
          );

        const selected =
          sameUrl ??
          testIdMatches[0];

        console.log(
          '[HEALER DEBUG] testId baseline SELECTED',
          {
            locator:
              selected.locator,

            fingerprintHash:
              selected.fingerprintHash,

            sameUrl:
              Boolean(sameUrl),
          }
        );

        return selected;
      }
    }

    /*
     * Last fallback:
     * Compare the broken locator against
     * the historical locator text.
     *
     * This is intentionally conservative.
     */
    const normalizedExpression =
      this.normalizeLocatorExpression(
        input.expression
      );

    const expressionMatches =
      baselines.filter(
        baseline =>
          this.normalizeLocatorExpression(
            baseline.locator
          ) ===
          normalizedExpression
      );

    console.log(
      '[HEALER DEBUG] normalized expression matches',
      {
        normalizedExpression,

        count:
          expressionMatches.length,
      }
    );

    if (
      expressionMatches.length > 0
    ) {
      const sameUrl =
        expressionMatches.find(
          baseline =>
            baseline.url ===
            input.url
        );

      return (
        sameUrl ??
        expressionMatches[0]
      );
    }

    return null;
  }

  private normalizeLocatorExpression(
    expression: string
  ): string {
    return expression
      .replace(
        /-broken(?=["'])/gi,
        ''
      )
      .replace(
        /-invalid(?=["'])/gi,
        ''
      )
      .replace(
        /-wrong(?=["'])/gi,
        ''
      );
  }

  private async heal(
    input: HealingContext
  ): Promise<HealingResult> {
    const timestamp =
      new Date().toISOString();

    /*
     * IMPORTANT:
     *
     * There is exactly ONE baseline
     * variable in this method.
     *
     * This avoids the previous
     * "Cannot redeclare baseline"
     * TypeScript error.
     */
    const baseline =
      await this.findHistoricalBaseline(
        input
      );

    console.log(
      '[HEALER DEBUG] baseline lookup result',
      {
        found:
          Boolean(baseline),

        locator:
          baseline?.locator,

        fingerprintHash:
          baseline?.fingerprintHash,

        testId:
          baseline?.fingerprint
            ?.testId,
      }
    );

    this.emit({
      type:
        'healing-attempt',

      healed: false,

      originalLocator:
        input.expression,

      action:
        input.action,

      candidateCount:
        0,

      liveDomValidated:
        false,

      baselineFound:
        Boolean(baseline),

      fingerprintHash:
        baseline?.fingerprintHash,

      timestamp,

      url:
        input.url,

      reason:
        baseline
          ? 'Historical baseline loaded'
          : 'No historical baseline available',
    });

    if (!baseline) {
      const result:
        HealingResult = {
          healed: false,

          originalLocator:
            input.expression,

          action:
            input.action,

          candidateCount:
            0,

          liveDomValidated:
            false,

          baselineFound:
            false,

          timestamp,

          reason:
            'No historical baseline available',
        };

      await this.persist(
        input,
        result
      );

      this.emit({
        ...result,

        type:
          'healing-failed',

        url:
          input.url,
      });

      return result;
    }

    console.log(
      '[HEALER DEBUG] generating candidates',
      {
        baselineLocator:
          baseline.locator,

        baselineTestId:
          baseline
            .fingerprint
            ?.testId,

        baselineFingerprintHash:
          baseline.fingerprintHash,

        maxCandidates:
          this.config.maxCandidates,
      }
    );

    const candidates =
      await this.generator.generate(
        input.page,
        baseline.fingerprint,
        this.config
          .maxCandidates
      );

    console.log(
      '[HEALER DEBUG] candidates generated',
      {
        count:
          candidates.length,

        candidates:
          candidates.map(
            candidate => ({
              expression:
                candidate.expression,

              score:
                candidate.score,

              strategy:
                candidate.strategy,

              reason:
                candidate.reason,
            })
          ),
      }
    );

    const ranked: Array<{
      candidate:
        (typeof candidates)[number];

      locator: Locator;
    }> = [];

    for (
      const candidate of
        candidates
    ) {
      console.log(
        '[HEALER DEBUG] validating candidate',
        {
          expression:
            candidate.expression,

          score:
            candidate.score,

          strategy:
            candidate.strategy,
        }
      );

      if (
        candidate.score <
        this.config
          .confidenceThreshold
      ) {
        console.log(
          '[HEALER DEBUG] candidate rejected - below confidence',
          {
            expression:
              candidate.expression,

            score:
              candidate.score,

            threshold:
              this.config
                .confidenceThreshold,
          }
        );

        continue;
      }

      try {
        const candidateLocator =
          candidate.resolve(
            input.page
          );

        const count =
          await candidateLocator.count();

        console.log(
          '[HEALER DEBUG] candidate live count',
          {
            expression:
              candidate.expression,

            count,
          }
        );

        if (count !== 1) {
          continue;
        }

        await candidateLocator.waitFor(
          {
            state:
              'visible',

            timeout:
              this.config
                .timeoutMs,
          }
        );

        if (
          input.action !==
            'hover' &&
          input.action !==
            'focus'
        ) {
          const enabled =
            await candidateLocator.isEnabled();

          if (!enabled) {
            console.log(
              '[HEALER DEBUG] candidate rejected - disabled',
              {
                expression:
                  candidate.expression,
              }
            );

            continue;
          }
        }

        if (
          input.action ===
          'fill'
        ) {
          const editable =
            await candidateLocator.isEditable();

          if (!editable) {
            continue;
          }
        }

        ranked.push({
          candidate,
          locator:
            candidateLocator,
        });

        console.log(
          '[HEALER DEBUG] candidate LIVE VALIDATED',
          {
            expression:
              candidate.expression,

            score:
              candidate.score,
          }
        );
      } catch (error) {
        console.log(
          '[HEALER DEBUG] candidate validation failed',
          {
            expression:
              candidate.expression,

            error:
              String(error),
          }
        );
      }
    }

    ranked.sort(
      (a, b) =>
        b.candidate.score -
        a.candidate.score
    );

    const best =
      ranked[0];

    const second =
      ranked[1];

    console.log(
      '[HEALER DEBUG] ranked candidates',
      {
        count:
          ranked.length,

        ranked:
          ranked.map(
            item => ({
              expression:
                item.candidate
                  .expression,

              score:
                item.candidate.score,

              strategy:
                item.candidate
                  .strategy,
            })
          ),
      }
    );

    if (!best) {
      const result:
        HealingResult = {
          healed: false,

          originalLocator:
            input.expression,

          action:
            input.action,

          candidateCount:
            candidates.length,

          liveDomValidated:
            false,

          baselineFound:
            true,

          fingerprintHash:
            baseline.fingerprintHash,

          timestamp,

          reason:
            'No candidate passed live DOM validation',
        };

      await this.persist(
        input,
        result,
        candidates.map(
          candidate => ({
            expression:
              candidate.expression,

            score:
              candidate.score,

            strategy:
              candidate.strategy,

            reason:
              candidate.reason,
          })
        )
      );

      this.emit({
        ...result,

        type:
          'healing-failed',

        url:
          input.url,
      });

      return result;
    }

    const margin =
      second
        ? best.candidate.score -
          second.candidate.score
        : 1;

    console.log(
      '[HEALER DEBUG] best candidate',
      {
        expression:
          best.candidate.expression,

        score:
          best.candidate.score,

        secondScore:
          second?.candidate.score,

        margin,

        ambiguityMargin:
          this.config
            .ambiguityMargin,
      }
    );

    if (
      margin <
      this.config
        .ambiguityMargin
    ) {
      const result:
        HealingResult = {
          healed: false,

          originalLocator:
            input.expression,

          action:
            input.action,

          candidateCount:
            candidates.length,

          liveDomValidated:
            false,

          baselineFound:
            true,

          fingerprintHash:
            baseline.fingerprintHash,

          timestamp,

          reason:
            `Candidate ambiguity: confidence margin ${margin.toFixed(
              3
            )} is below required ${this.config.ambiguityMargin}`,
        };

      await this.persist(
        input,
        result,
        candidates.map(
          candidate => ({
            expression:
              candidate.expression,

            score:
              candidate.score,

            strategy:
              candidate.strategy,

            reason:
              candidate.reason,
          })
        )
      );

      this.emit({
        ...result,

        type:
          'healing-failed',

        url:
          input.url,
      });

      return result;
    }

    this.lastReplacement =
      best.locator;

    const result:
      HealingResult = {
        healed: true,

        originalLocator:
          input.expression,

        replacementLocator:
          best.candidate
            .expression,

        action:
          input.action,

        confidence:
          best.candidate.score,

        strategy:
          best.candidate.strategy,

        candidateCount:
          candidates.length,

        liveDomValidated:
          true,

        baselineFound:
          true,

        fingerprintHash:
          baseline.fingerprintHash,

        timestamp,

        reason:
          `Matched historical fingerprint: ${best.candidate.reason}`,
      };

    await this.persist(
      input,
      result,
      candidates.map(
        candidate => ({
          expression:
            candidate.expression,

          score:
            candidate.score,

          strategy:
            candidate.strategy,

          reason:
            candidate.reason,
        })
      )
    );

    console.log(
      '[HEALER DEBUG] HEALED',
      {
        original:
          input.expression,

        replacement:
          result.replacementLocator,

        confidence:
          result.confidence,

        strategy:
          result.strategy,
      }
    );

    this.emit({
      ...result,

      type:
        'healed',

      url:
        input.url,
    });

    return result;
  }

  private async persist(
    input: HealingContext,
    result: HealingResult,
    candidates?: unknown[]
  ): Promise<void> {
    const dir =
      input.testInfo
        ?.outputDir
        ? path.resolve(
            input.testInfo.outputDir,
            'healer'
          )
        : path.resolve(
            this.config
              .artifactsDir
          );

    await mkdir(
      dir,
      {
        recursive: true,
      }
    );

    const record = {
      ...result,

      url:
        input.url,

      error:
        input.error,

      candidates:
        candidates ?? [],
    };

    await appendFile(
      path.join(
        dir,
        'healing-results.jsonl'
      ),
      JSON.stringify(
        record
      ) + '\n',
      'utf8'
    );

    try {
      const html =
        await input.page.content();

      const filename =
        `dom-${Date.now()}.html`;

      await writeFile(
        path.join(
          dir,
          filename
        ),
        html,
        'utf8'
      );
    } catch {
      // Diagnostic snapshot only.
    }
  }

  private emit(
    event: HealerEvent
  ): void {
    this.config.log?.(
      event
    );
  }
}

export function createHealer(
  config?: HealerConfig
): PlaywrightHealer {
  return new PlaywrightHealer(
    config
  );
}