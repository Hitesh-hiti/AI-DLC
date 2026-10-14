import {
  appendFile,
  mkdir,
  writeFile,
  readFile,
  rename
} from 'node:fs/promises';

import path from 'node:path';
import { registerHealer } from './registry.js';

import type {
  Locator,
  Page,
  TestInfo,
} from '@playwright/test';

import {
  BaselineStore,
} from './baseline-store.js';
import { LruCache, type CacheMetrics } from './cache.js';
import { HealingCacheStore } from './healing-cache-store.js';
import { writeHealingReport } from './report.js';

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
  HealingCacheRecord,
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
  private readonly replacementMap =
    new WeakMap<object, Locator>();

  private readonly proxyMap =
    new WeakMap<object, Locator>();
  readonly config: Required<
    Omit<HealerConfig, 'log'>
  > &
    Pick<HealerConfig, 'log'>;

  private readonly store: BaselineStore;
  private readonly cache: LruCache<BaselineRecord>;
  private readonly healingCache: LruCache<HealingCacheRecord>;
  private readonly healingCacheStore: HealingCacheStore;
  private readonly events: HealerEvent[] = [];

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

      replaceLocator:
        config.replaceLocator ??
        true,

      updateSourceOnHeal:
        config.updateSourceOnHeal ??
        true,

      cacheEnabled:
        config.cacheEnabled ?? true,

      cacheMaxEntries:
        config.cacheMaxEntries ?? 500,

      cacheTtlMs:
        config.cacheTtlMs ?? 0,

      healingCacheDir:
        config.healingCacheDir ??
        path.resolve(
          process.cwd(),
          '.healer',
          'cache'
        ),

      reportEnabled:
        config.reportEnabled ?? true,

      reportFileName:
        config.reportFileName ?? 'healing-report.html',

      openReport:
        config.openReport ?? true,

      log: config.log,
    };

    this.store =
      new BaselineStore(
        this.config.baselineDir
      );

    this.cache = new LruCache<BaselineRecord>(
      this.config.cacheMaxEntries,
      this.config.cacheTtlMs
    );

    this.healingCache = new LruCache<HealingCacheRecord>(
      this.config.cacheMaxEntries,
      this.config.cacheTtlMs
    );

    this.healingCacheStore = new HealingCacheStore(
      this.config.healingCacheDir
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

        replaceLocator:
          this.config.replaceLocator,

        healingCacheDir:
          this.config.healingCacheDir,
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
              page,
              self.findCreatorSourceFile()
            );
          };
        }

        return value.bind(
          target
        );
      },
    });
  }

  /**
   * Find the source file that actually created the locator.
   *
   * Playwright's TestInfo.file identifies the test spec, but Page
   * Object locators are commonly created from files such as
   * pages/SearchPage.ts.  The stack at locator construction contains
   * that Page Object frame.
   */
  private findCreatorSourceFile(): string | undefined {
    const stack =
      new Error().stack?.split('\n') ?? [];

    for (const line of stack.slice(2)) {
      const match =
        line.match(
          /(?:at .*?\()?(.+\.tsx?):\d+:\d+\)?$/
        );

      if (!match) {
        continue;
      }

      const file = match[1].trim();

      if (
        file.includes('node_modules') ||
        file.includes('packages\\\\playwright-healer') ||
        file.endsWith('packages/playwright-healer/src/healer.ts') ||
        file.endsWith('packages\\playwright-healer\\src\\healer.ts')
      ) {
        continue;
      }

      return path.resolve(file);
    }

    return undefined;
  }


  private normalizeSourceFile(
    rawFile: string | undefined
  ): string | null {
    if (!rawFile) {
      return null;
    }

    let value =
      String(rawFile).trim();

    /*
     * The incoming value can look like:
     *
     * C:\project\at new SearchPage (file:\C:\project\pages\SearchPage.ts
     *
     * We MUST take the LAST Windows path because the first
     * C:\... belongs to the malformed stack prefix.
     */

    const windowsPaths =
      [
        ...value.matchAll(
          /[A-Za-z]:[\\/][^)\r\n]*/g
        ),
      ];

    if (windowsPaths.length > 0) {
      value =
        windowsPaths[
        windowsPaths.length - 1
        ][0];
    }

    /*
     * Remove file: prefix if still present.
     */
    value =
      value.replace(
        /^file:\s*/i,
        ''
      );

    /*
     * Remove file:/// prefix.
     */
    value =
      value.replace(
        /^file:\/\/\//i,
        ''
      );

    /*
     * Remove line/column information.
     *
     * Example:
     *
     * SearchPage.ts:73:5
     *
     * becomes:
     *
     * SearchPage.ts
     */
    value =
      value.replace(
        /:\d+:\d+$/,
        ''
      );

    /*
     * Remove trailing stack characters.
     */
    value =
      value.replace(
        /[)\]]+$/,
        ''
      );

    /*
     * Normalize separators.
     */
    value =
      value.replace(
        /\//g,
        path.sep
      );

    value =
      path.normalize(
        value
      );

    /*
     * Make sure we ended up with an actual Windows
     * absolute path.
     */
    if (
      !/^[A-Za-z]:[\\/]/.test(
        value
      )
    ) {
      return null;
    }

    return value;
  }


  private async rewriteSourceLocator(
  input: HealingContext,
  replacement: string
): Promise<boolean> {
  const sourceLocation =
    input.sourceFile ??
    input.testInfo?.file;

  if (!sourceLocation) {
    console.log(
      '[HEALER DEBUG] source rewrite skipped - source file unavailable'
    );

    return false;
  }

  const raw =
    String(sourceLocation).trim();

  let file: string | null = null;

  /*
   * Example malformed source location:
   *
   * C:\project\at new SearchPage (file:\C:\project\pages\SearchPage.ts
   *
   * The actual source file starts after "file:\"
   */

  const fileMarkerMatch =
    raw.match(
      /file:\\(.*)$/i
    );

  if (fileMarkerMatch?.[1]) {
    file =
      fileMarkerMatch[1].trim();
  }

  /*
   * Handle file:///C:/...
   */
  if (!file) {
    const fileUrlMatch =
      raw.match(
        /file:\/\/\/([A-Za-z]:[\\/].*)$/i
      );

    if (fileUrlMatch?.[1]) {
      file =
        fileUrlMatch[1].trim();
    }
  }

  /*
   * Fallback: find all Windows paths and use the last one.
   */
  if (!file) {
    const windowsPaths =
      [
        ...raw.matchAll(
          /[A-Za-z]:[\\/][^)\r\n]*/g
        ),
      ];

    if (windowsPaths.length > 0) {
      file =
        windowsPaths[
          windowsPaths.length - 1
        ][0].trim();
    }
  }

  if (!file) {
    console.log(
      '[HEALER DEBUG] SOURCE FILE PATH EXTRACTION FAILED',
      {
        sourceLocation: raw,
      }
    );

    return false;
  }

  /*
   * Remove remaining file: prefixes.
   */
  file =
    file.replace(
      /^file:\\?/i,
      ''
    );

  file =
    file.replace(
      /^file:\/\/\//i,
      ''
    );

  /*
   * Remove line / column information.
   */
  file =
    file.replace(
      /:\d+:\d+$/,
      ''
    );

  /*
   * Remove trailing stack characters.
   */
  file =
    file.replace(
      /[)\]]+$/,
      ''
    );

  /*
   * Normalize Windows separators.
   */
  file =
    file.replace(
      /\//g,
      path.sep
    );

  file =
    path.normalize(
      file
    );

  console.log(
    '[HEALER DEBUG] SOURCE REWRITE START',
    {
      sourceLocation: raw,
      normalizedFile: file,
      original:
        input.expression,
      replacement,
    }
  );

  try {
    const source =
      await readFile(
        file,
        'utf8'
      );

    let updated =
      source.replace(
        input.expression,
        replacement
      );

    /*
     * Simple locator replacement.
     */
    if (
      updated === source
    ) {
      const originalMatch =
        input.expression.match(
          /^(getByTestId|getByPlaceholder|getByLabel|getByText|getByTitle|getByAltText|locator)\(\s*["']([^"']+)["']\s*\)$/
        );

      const replacementMatch =
        replacement.match(
          /^(getByTestId|getByPlaceholder|getByLabel|getByText|getByTitle|getByAltText|locator)\(\s*["']([^"']+)["']\s*\)$/
        );

      if (
        originalMatch &&
        replacementMatch &&
        originalMatch[1] ===
          replacementMatch[1]
      ) {
        const method =
          originalMatch[1];

        const originalValue =
          originalMatch[2];

        const replacementValue =
          replacementMatch[2];

        const escaped =
          originalValue.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );

        const pattern =
          new RegExp(
            `(${method}\\(\\s*["'])${escaped}(["']\\s*\\))`,
            'g'
          );

        updated =
          source.replace(
            pattern,
            `$1${replacementValue}$2`
          );
      }
    }

    /*
     * Locator-chain replacement.
     */
    if (
      updated === source
    ) {
      const escapeRegex =
        (value: string): string =>
          value.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );

      const calls =
        [
          ...input.expression.matchAll(
            /(getByTestId|getByPlaceholder|getByLabel|getByText|getByTitle|getByAltText|locator|nth)\(([^()]*)\)/g
          ),
        ];

      if (calls.length > 0) {
        const pieces =
          calls.map(
            match => {
              const method =
                match[1];

              const args =
                match[2].trim();

              const stringArg =
                args.match(
                  /^["'](.*)["']$/
                );

              if (stringArg) {
                return `${method}\\(\\s*["']${escapeRegex(
                  stringArg[1]
                )}["']\\s*\\)`;
              }

              return `${method}\\(\\s*${escapeRegex(
                args
              )}\\s*\\)`;
            }
          );

        const chainRegex =
          new RegExp(
            pieces.join(
              '\\s*\\.\\s*'
            )
          );

        updated =
          source.replace(
            chainRegex,
            replacement
          );
      }
    }

    /*
     * Nothing changed.
     */
    if (
      updated === source
    ) {
      console.log(
        '[HEALER DEBUG] SOURCE REWRITE - no source change',
        {
          file,
          original:
            input.expression,
          replacement,
        }
      );

      return false;
    }

    /*
     * Atomic write.
     */
    const temporary =
      `${file}.healer.${process.pid}.${Date.now()}.tmp`;

    await writeFile(
      temporary,
      updated,
      'utf8'
    );

    await rename(
      temporary,
      file
    );

    console.log(
      '[HEALER DEBUG] SOURCE REWRITTEN',
      {
        file,
        from:
          input.expression,
        to:
          replacement,
      }
    );

    return true;
  } catch (error) {
    console.log(
      '[HEALER DEBUG] SOURCE REWRITE FAILED',
      {
        sourceLocation: raw,
        normalizedFile: file,
        error:
          String(error),
      }
    );

    return false;
  }
}

  private wrapLocator(
    locator: Locator,
    expression: string,
    testInfo: TestInfo | undefined,
    page: Page,
    sourceFile?: string
  ): Locator {
    const self = this;

    /*
     * This is the locator that the proxy currently represents.
     *
     * Initially:
     *   input-origin-broken
     *
     * After healing:
     *   input-origin
     */
    let activeLocator: Locator = locator;

    const proxy = new Proxy(
      locator,
      {
        get(
          _target,
          prop,
          _receiver
        ) {
          const name = String(prop);

          /*
           * Always operate on the CURRENT locator.
           *
           * activeLocator starts as the original locator.
           * If replaceLocator=true and healing succeeds,
           * activeLocator is replaced with the healed locator.
           */
          const current = activeLocator;

          const value = Reflect.get(
            current,
            prop,
            current
          );

          /*
           * ---------------------------------------------------------
           * first / last
           * ---------------------------------------------------------
           */
          if (
            name === 'first' ||
            name === 'last'
          ) {
            if (
              value &&
              typeof value === 'object'
            ) {
              return self.wrapLocator(
                value as Locator,
                `${expression}.${name}`,
                testInfo,
                page,
                sourceFile
              );
            }
          }

          /*
           * ---------------------------------------------------------
           * Locator chaining
           *
           * locator(...)
           * getByTestId(...)
           * getByRole(...)
           * nth(...)
           * filter(...)
           * locator(...)
           * etc.
           * ---------------------------------------------------------
           */
          if (
            CHAIN_METHODS.has(name) &&
            typeof value === 'function'
          ) {
            return (
              ...args: unknown[]
            ) => {
              const chained =
                value.apply(
                  current,
                  args
                );

              if (
                chained &&
                typeof chained === 'object' &&
                typeof (
                  chained as Locator
                ).count === 'function'
              ) {
                return self.wrapLocator(
                  chained as Locator,
                  `${expression}.${describeCall(
                    name,
                    args
                  )}`,
                  testInfo,
                  page,
                  sourceFile
                );
              }

              return chained;
            };
          }

          /*
           * ---------------------------------------------------------
           * Actions that can fail and trigger healing.
           * ---------------------------------------------------------
           */
          if (
            ACTIONS.has(
              name as ActionName
            ) &&
            typeof value === 'function'
          ) {
            return async (
              ...args: unknown[]
            ) => {
              const action =
                name as ActionName;

              /*
               * Record the CURRENT locator.
               *
               * This is important because after a successful
               * replacement, the next action should record the
               * healed locator rather than the original broken one.
               */
              if (
                self.config.recordBaselines
              ) {
                await self.recordBaseline(
                  activeLocator,
                  expression,
                  page,
                  testInfo
                );
              }

              try {
                /*
                 * IMPORTANT:
                 *
                 * Always invoke the action against the
                 * CURRENT active locator.
                 */
                const method =
                  Reflect.get(
                    activeLocator,
                    prop
                  );

                return await method.apply(
                  activeLocator,
                  args
                );
              } catch (error) {
                /*
                 * The current locator failed.
                 *
                 * Ask the healer to find a replacement.
                 */
                const result =
                  await self.heal({
                    expression,
                    action,
                    args,
                    url: page.url(),
                    error: String(error),
                    page,
                    testInfo,
                    sourceFile,
                  });

                /*
                 * ---------------------------------------------------
                 * HEALING SUCCEEDED
                 * ---------------------------------------------------
                 */
                if (
                  result.healed &&
                  self.lastReplacement
                ) {
                  /*
                   * IMPORTANT:
                   *
                   * Only replace/rebind the locator when the
                   * user explicitly enabled:
                   *
                   * replaceLocator: true
                   */
                  if (
                    self.config.replaceLocator === true
                  ) {
                    /*
                     * Replace the locator represented by THIS proxy.
                     */
                    activeLocator =
                      self.lastReplacement;

                    /*
                     * Keep replacement mapping.
                     */
                    self.replacementMap.set(
                      locator,
                      activeLocator
                    );

                    console.log(
                      '[HEALER DEBUG] LOCATOR REBOUND',
                      {
                        original:
                          expression,

                        replacement:
                          result.replacementLocator,

                        replaceLocator:
                          true,
                      }
                    );

                    /*
                     * Retry the failed action against
                     * the newly healed locator.
                     */
                    const healedMethod =
                      Reflect.get(
                        activeLocator,
                        prop
                      );

                    console.log(
                      '[HEALER DEBUG] RETRYING ACTION WITH HEALED LOCATOR',
                      {
                        action,
                        original: expression,
                        replacement: result.replacementLocator,
                      }
                    );

                    let healedValue: unknown;

                    try {
                      healedValue = await healedMethod.apply(
                        activeLocator,
                        args
                      );
                    } catch (retryError) {
                      result.healed = false;
                      result.retrySucceeded = false;
                      result.reason = `Replacement action retry failed: ${String(retryError)}`;

                      console.log(
                        '[HEALER DEBUG] HEALED ACTION RETRY FAILED',
                        {
                          action,
                          original: expression,
                          replacement: result.replacementLocator,
                          error: String(retryError),
                        }
                      );

                      await self.persist(
                        {
                          expression,
                          action,
                          args,
                          url: page.url(),
                          error: String(retryError),
                          page,
                          testInfo,
                          sourceFile,
                        },
                        result
                      );

                      self.emit({
                        ...result,
                        type: 'healing-failed',
                        url: page.url(),
                      });

                      throw retryError;
                    }

                    result.retrySucceeded = true;

                    console.log(
                      '[HEALER DEBUG] HEALED ACTION SUCCEEDED',
                      {
                        action,
                        replacement: result.replacementLocator,
                      }
                    );

                    if (result.replacementLocator) {
                      const healContext: HealingContext = {
                        expression, action, args, url: page.url(),
                        error: String(error), page, testInfo, sourceFile,
                      };

                      // Persist/cache the learned locator only after the replacement
                      // action itself has succeeded. Keep both expressions as aliases.
                      const persisted = await self.persistHealedBaseline(
                        healContext,
                        activeLocator,
                        result.replacementLocator,
                        self.extractLocatorIndex(result.replacementLocator)
                      );

                      const cachePersisted = await self.persistHealingCache(
                        healContext,
                        result
                      );

                      let rewritten = false;
                      if (persisted && self.config.updateSourceOnHeal) {
                        rewritten = await self.rewriteSourceLocator(
                          healContext,
                          result.replacementLocator
                        );
                      }

                      result.sourceRewritten = rewritten;
                      result.sourceFile = sourceFile ?? testInfo?.file;

                      if (!persisted || !cachePersisted) {
                        result.reason = `${result.reason ?? 'Healing succeeded'}; persistence synchronization incomplete`;
                      }
                    }

                    await self.persist(
                      {
                        expression,
                        action,
                        args,
                        url: page.url(),
                        error: String(error),
                        page,
                        testInfo,
                        sourceFile,
                      },
                      result
                    );

                    self.emit({
                      ...result,
                      type: 'healed',
                      url: page.url(),
                    });

                    self.emit({
                      ...result,
                      type: 'healed-action-retry',
                      url: page.url(),
                      reason: 'Replacement locator successfully executed the failed action',
                    });

                    return healedValue;
                  }

                  /*
                   * -------------------------------------------------
                   * replaceLocator === false
                   * -------------------------------------------------
                   *
                   * Healing was successful, but the user has
                   * explicitly requested NOT to replace the
                   * original locator.
                   *
                   * We report the successful healing but leave
                   * activeLocator untouched.
                   */
                  console.log(
                    '[HEALER DEBUG] LOCATOR REPLACEMENT DISABLED',
                    {
                      original:
                        expression,

                      suggestedReplacement:
                        result.replacementLocator,

                      replaceLocator:
                        false,
                    }
                  );
                }

                /*
                 * If healing failed, preserve the original
                 * behaviour and throw the original error.
                 */
                throw error;
              }
            };
          }

          /*
           * ---------------------------------------------------------
           * Everything else
           *
           * Bind functions to the CURRENT locator.
           *
           * This is important for Playwright assertions and
           * locator inspection.
           * ---------------------------------------------------------
           */
          if (
            typeof value === 'function'
          ) {
            return value.bind(
              current
            );
          }

          return value;
        },
      }
    );

    console.log(
      '[HEALER DEBUG] WRAPPED LOCATOR',
      expression
    );

    return proxy;
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
        index: this.extractLocatorIndex(locatorText),
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

      if (this.config.cacheEnabled) {
        this.cache.set(key, baseline);
      }

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

  getCacheMetrics(): CacheMetrics {
    return this.healingCache.getMetrics();
  }

  getBaselineCacheMetrics(): CacheMetrics {
    return this.cache.getMetrics();
  }

  clearCache(): void {
    this.cache.clear();
    this.healingCache.clear();
  }

  getReportPath(): string {
    return path.resolve(
      this.config.artifactsDir,
      this.config.reportFileName
    );
  }

  async writeReport(): Promise<void> {
    if (!this.config.reportEnabled) return;
    await writeHealingReport(
      path.resolve(this.config.artifactsDir, this.config.reportFileName),
      { events: [...this.events], cache: this.getCacheMetrics() }
    );
  }

  private baselineKey(
    testInfo:
      | TestInfo
      | undefined,
    locator: string
  ): string {
    return `${testInfo?.testId ??
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

  /** Extract the final explicit nth index from a locator expression. */
  private extractLocatorIndex(expression: string): number | undefined {
    const nth = expression.match(/\.nth\(\s*(\d+)\s*\)\s*$/);
    if (nth) return Number(nth[1]);
    if (/\.first\(\s*\)\s*$/.test(expression)) return 0;
    return undefined;
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
  private testIdSimilarity(a: string, b: string): number {
    const left = a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const right = b.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (left.includes(right) || right.includes(left)) return 0.85;
    const distance = this.levenshtein(left, right);
    return 1 - distance / Math.max(left.length, right.length);
  }

  private levenshtein(a: string, b: string): number {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const temp = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = temp;
      }
    }
    return row[b.length];
  }

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

  private healingCacheKey(input: HealingContext): string {
    return [
      input.testInfo?.testId ?? 'global',
      input.url,
      input.expression,
    ].join('__');
  }

  private async findCachedHealing(
    input: HealingContext
  ): Promise<HealingCacheRecord | null> {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const key = this.healingCacheKey(input);
    let record = this.healingCache.get(key);

    if (!record) {
      record = (await this.healingCacheStore.load(key)) ?? undefined;
      if (record) {
        this.healingCache.set(key, record);
      }
    }

    if (!record) {
      this.emit({
        type: 'cache-miss',
        healed: false,
        originalLocator: input.expression,
        action: input.action,
        candidateCount: 0,
        liveDomValidated: false,
        baselineFound: false,
        timestamp: new Date().toISOString(),
        url: input.url,
        reason: 'No proven healing mapping in cache',
      });
      console.log('[HEALER DEBUG] healing cache MISS', { key });
      return null;
    }

    try {
      const locator = this.resolveCachedLocator(
        input.page,
        record.replacementLocator
      );
      const count = await locator.count();

      console.log('[HEALER DEBUG] healing cache candidate', {
        key,
        replacementLocator: record.replacementLocator,
        count,
      });

      if (count !== 1) {
        this.healingCache.delete(key);
        this.emit({
          type: 'cache-miss',
          healed: false,
          originalLocator: input.expression,
          action: input.action,
          candidateCount: 0,
          liveDomValidated: false,
          baselineFound: false,
          timestamp: new Date().toISOString(),
          url: input.url,
          reason: `Cached replacement no longer uniquely matches live DOM (count=${count})`,
        });
        return null;
      }

      await locator.waitFor({
        state: 'visible',
        timeout: this.config.timeoutMs,
      });

      if (input.action !== 'hover' && input.action !== 'focus') {
        if (!(await locator.isEnabled())) {
          this.healingCache.delete(key);
          return null;
        }
      }

      if (input.action === 'fill' && !(await locator.isEditable())) {
        this.healingCache.delete(key);
        return null;
      }

      this.emit({
        type: 'cache-hit',
        healed: true,
        originalLocator: input.expression,
        replacementLocator: record.replacementLocator,
        action: input.action,
        confidence: record.confidence,
        strategy: record.strategy,
        candidateCount: 1,
        liveDomValidated: true,
        baselineFound: true,
        fingerprintHash: record.fingerprintHash,
        cacheHit: true,
        timestamp: new Date().toISOString(),
        url: input.url,
        reason: 'Previously proven healing mapping validated against live DOM',
      });

      this.lastReplacement = locator;

      console.log('[HEALER DEBUG] healing cache HIT', {
        key,
        replacementLocator: record.replacementLocator,
        confidence: record.confidence,
      });

      return record;
    } catch (error) {
      this.healingCache.delete(key);
      console.log('[HEALER DEBUG] healing cache invalidated', {
        key,
        error: String(error),
      });
      return null;
    }
  }

  private resolveCachedLocator(
    page: Page,
    expression: string
  ): Locator {
    const nthMatch = expression.match(/\.nth\(\s*(\d+)\s*\)$/);
    const firstMatch = expression.match(/\.first\(\s*\)$/);
    const lastMatch = expression.match(/\.last\(\s*\)$/);
    const baseExpression = expression
      .replace(/\.nth\(\s*\d+\s*\)$/, '')
      .replace(/\.(?:first|last)\(\s*\)$/, '');

    const testId = baseExpression.match(
      /^getByTestId\(\s*["']([^"']+)["']\s*\)$/
    );
    if (testId) {
      let locator = page.getByTestId(testId[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const placeholder = baseExpression.match(
      /^getByPlaceholder\(\s*["']([^"']+)["']\s*\)$/
    );
    if (placeholder) {
      let locator = page.getByPlaceholder(placeholder[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const label = baseExpression.match(
      /^getByLabel\(\s*["']([^"']+)["']\s*\)$/
    );
    if (label) {
      let locator = page.getByLabel(label[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const text = baseExpression.match(
      /^getByText\(\s*["']([^"']+)["']\s*\)$/
    );
    if (text) {
      let locator = page.getByText(text[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const title = baseExpression.match(
      /^getByTitle\(\s*["']([^"']+)["']\s*\)$/
    );
    if (title) {
      let locator = page.getByTitle(title[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const alt = baseExpression.match(
      /^getByAltText\(\s*["']([^"']+)["']\s*\)$/
    );
    if (alt) {
      let locator = page.getByAltText(alt[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const role = baseExpression.match(
      /^getByRole\(\s*["']([^"']+)["']\s*,\s*\{\s*name\s*:\s*["']([^"']+)["']\s*\}\s*\)$/
    );
    if (role) {
      let locator = page.getByRole(role[1] as any, { name: role[2] });
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    const css = baseExpression.match(
      /^locator\(\s*["']([^"']+)["']\s*\)$/
    );
    if (css) {
      let locator = page.locator(css[1]);
      if (nthMatch) locator = locator.nth(Number(nthMatch[1]));
      else if (firstMatch) locator = locator.first();
      else if (lastMatch) locator = locator.last();
      return locator;
    }

    throw new Error(`Unsupported cached locator expression: ${expression}`);
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

    let exact: BaselineRecord | null = null;
    if (this.config.cacheEnabled) {
      exact = this.cache.get(exactKey) ?? null;
    }
    if (!exact) {
      exact = await this.store.load(exactKey);
      if (exact && this.config.cacheEnabled) {
        this.cache.set(exactKey, exact);
      }
    }

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

    // If the locator itself was edited and its testId mutated (for example
    // `login-submit-v1` -> `login-submit-v2`), use the historical baseline whose
    // testId is most similar. Same-URL baselines are preferred.
    if (brokenTestId) {
      const fuzzy = baselines
        .filter(b => Boolean(b.fingerprint?.testId))
        .map(b => ({ baseline: b, score: this.testIdSimilarity(brokenTestId!, b.fingerprint.testId!) }))
        .filter(x => x.score >= 0.45)
        .sort((a, b) => {
          const urlA = a.baseline.url === input.url ? 1 : 0;
          const urlB = b.baseline.url === input.url ? 1 : 0;
          return (urlB - urlA) || (b.score - a.score);
        });
      if (fuzzy.length) {
        console.log('[HEALER DEBUG] fuzzy testId baseline SELECTED', {
          inputTestId: brokenTestId,
          baselineTestId: fuzzy[0].baseline.fingerprint.testId,
          score: fuzzy[0].score,
        });
        return fuzzy[0].baseline;
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

    // Never carry a replacement from a previous healing attempt into
    // this attempt. A replacement is valid only when this invocation
    // reaches the successful-candidate path below.
    this.lastReplacement = undefined;

    // Fast path: a previously proven replacement is validated against the
    // current live DOM before it is trusted. The actual action retry is still
    // performed by the locator proxy after this method returns.
    const cachedHealing = await this.findCachedHealing(input);
    if (cachedHealing && this.lastReplacement) {
      const cachedResult: HealingResult = {
        healed: true,
        originalLocator: input.expression,
        replacementLocator: cachedHealing.replacementLocator,
        action: input.action,
        confidence: cachedHealing.confidence,
        strategy: cachedHealing.strategy,
        candidateCount: 1,
        liveDomValidated: true,
        baselineFound: true,
        fingerprintHash: cachedHealing.fingerprintHash,
        cacheHit: true,
        retrySucceeded: false,
        sourceRewritten: false,
        sourceFile: input.sourceFile ?? input.testInfo?.file,
        timestamp,
        reason: 'Previously proven healing mapping validated from cache',
      };

      this.emit({
        type: 'healing-attempt',
        ...cachedResult,
        healed: false,
        retrySucceeded: false,
        reason: 'Healing cache hit; retrying action with cached replacement',
        url: input.url,
      });

      return cachedResult;
    }

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
        this.config.maxCandidates,
        baseline.index
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
      targetKey: string;
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

        // Different selectors can identify the same live DOM element.
        // Do NOT treat equivalent selectors as ambiguity. Fingerprints alone
        // are insufficient because two different elements can legitimately
        // have the same fingerprint. Use the actual DOM ancestry/path as the
        // primary identity, with the fingerprint as a useful fallback.
        let targetKey = candidate.expression;
        try {
          const liveFingerprint =
            await fingerprintLocator(candidateLocator);

          const domIdentity =
            await this.liveDomIdentity(candidateLocator);

          targetKey =
            domIdentity
              ? `dom=${domIdentity}`
              : `fingerprint=${fingerprintHash(liveFingerprint)}`;
        } catch {
          // Expression fallback is conservative when DOM identity lookup fails.
        }

        const duplicateTarget =
          ranked.find(
            item =>
              item.targetKey === targetKey
          );

        if (duplicateTarget) {
          console.log(
            '[HEALER DEBUG] duplicate candidate target ignored',
            {
              expression:
                candidate.expression,

              score:
                candidate.score,

              existing:
                duplicateTarget.candidate.expression,

              targetKey,
            }
          );
          continue;
        }

        ranked.push({
          candidate,
          locator:
            candidateLocator,
          targetKey,
        });

        console.log(
          '[HEALER DEBUG] candidate LIVE VALIDATED',
          {
            expression:
              candidate.expression,

            score:
              candidate.score,

            targetKey,
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

      sourceRewritten: false,
      retrySucceeded: false,
      cacheHit: false,
      sourceFile: input.sourceFile ?? input.testInfo?.file,

      timestamp,

      reason:
        `Matched historical fingerprint: ${best.candidate.reason}`,
    };

    console.log(
      '[HEALER DEBUG] HEAL CANDIDATE SELECTED',
      {
        original: input.expression,
        replacement: result.replacementLocator,
        confidence: result.confidence,
        strategy: result.strategy,
      }
    );

    return result;
  }

  /**
   * Returns a stable identity for the currently matched DOM element.
   *
   * This is intentionally scoped to the current healing attempt. It lets
   * different selectors such as `getByTestId(...)` and `locator("#origin")`
   * be recognized as the same target while keeping two genuinely different
   * elements distinct even when their fingerprints are identical.
   */
  private async liveDomIdentity(
    locator: Locator
  ): Promise<string | null> {
    try {
      return await locator.evaluate(
        (element) => {
          const parts: string[] = [];
          let current: Element | null = element;

          while (current) {
            let index = 1;
            let sibling = current.previousElementSibling;

            while (sibling) {
              index += 1;
              sibling = sibling.previousElementSibling;
            }

            parts.unshift(
              `${current.tagName.toLowerCase()}:nth-child(${index})`
            );

            current = current.parentElement;
          }

          return parts.join('>');
        }
      );
    } catch {
      return null;
    }
  }

  private async persistHealedBaseline(
    input: HealingContext,
    locator: Locator,
    replacementLocator: string,
    index?: number
  ): Promise<boolean> {
    try {
      const healedFingerprint = await fingerprintLocator(locator);
      const healedBaseline: BaselineRecord = {
        version: 4,
        locator: replacementLocator,
        url: input.url,
        fingerprint: healedFingerprint,
        fingerprintHash: fingerprintHash(healedFingerprint),
        updatedAt: new Date().toISOString(),
        index,
      };

      const originalKey = this.baselineKey(input.testInfo, input.expression);
      const replacementKey = this.baselineKey(input.testInfo, replacementLocator);

      // Persist both keys: the broken expression becomes an alias to the healed
      // locator, while the replacement expression becomes the new canonical baseline.
      await this.store.save(originalKey, healedBaseline);
      if (replacementKey !== originalKey) {
        await this.store.save(replacementKey, healedBaseline);
      }

      // Populate memory only after both disk writes succeed.
      if (this.config.cacheEnabled) {
        this.cache.set(originalKey, healedBaseline);
        if (replacementKey !== originalKey) {
          this.cache.set(replacementKey, healedBaseline);
        }
      }

      console.log('[HEALER DEBUG] healed state synchronized', {
        originalKey,
        replacementKey,
        replacementLocator,
        fingerprintHash: healedBaseline.fingerprintHash,
        index,
      });
      return true;
    } catch (error) {
      console.log('[HEALER DEBUG] healed baseline persistence failed', { error: String(error) });
      return false;
    }
  }

  private async persistHealingCache(
    input: HealingContext,
    result: HealingResult
  ): Promise<boolean> {
    if (!this.config.cacheEnabled || !result.replacementLocator) {
      return true;
    }

    try {
      const key = this.healingCacheKey(input);
      const record: HealingCacheRecord = {
        version: 1,
        key,
        originalLocator: input.expression,
        replacementLocator: result.replacementLocator,
        confidence: result.confidence ?? 0,
        strategy: result.strategy ?? 'unknown',
        fingerprintHash: result.fingerprintHash,
        url: input.url,
        index: this.extractLocatorIndex(result.replacementLocator),
        sourceFile: input.sourceFile ?? input.testInfo?.file,
        updatedAt: new Date().toISOString(),
      };

      // Disk first. Only make the mapping a memory-cache hit after the durable
      // record has been written successfully.
      await this.healingCacheStore.save(key, record);
      this.healingCache.set(key, record);

      console.log('[HEALER DEBUG] healing cache UPDATED', {
        key,
        originalLocator: record.originalLocator,
        replacementLocator: record.replacementLocator,
        confidence: record.confidence,
        strategy: record.strategy,
      });

      return true;
    } catch (error) {
      console.log('[HEALER DEBUG] healing cache update failed', {
        error: String(error),
      });
      return false;
    }
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
    this.events.push(event);
    this.config.log?.(event);

    // Persist events in the shared artifacts directory so the Playwright
    // reporter running in the parent process can see events produced by all
    // worker processes. The in-memory array is still used for direct API calls.
    if (this.config.reportEnabled) {
      void (async () => {
        await mkdir(this.config.artifactsDir, { recursive: true });
        await appendFile(
          path.join(this.config.artifactsDir, 'healing-events.jsonl'),
          JSON.stringify(event) + '\n',
          'utf8'
        );
      })().catch(error => {
        console.warn('[HEALER] event persistence failed', String(error));
      });

      void this.writeReport().catch(error => {
        console.warn('[HEALER] report update failed', String(error));
      });
    }
  }
}

export function createHealer(
  config?: HealerConfig
): PlaywrightHealer {
  const healer = new PlaywrightHealer(config);

  registerHealer(healer);

  return healer;
}