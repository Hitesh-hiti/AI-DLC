import type {
  Locator,
  Page,
  TestInfo,
} from '@playwright/test';

export type HealerMode =
  | 'runtime'
  | 'observe';

export type ActionName =
  | 'click'
  | 'dblclick'
  | 'fill'
  | 'press'
  | 'check'
  | 'uncheck'
  | 'selectOption'
  | 'hover'
  | 'focus'
  | 'type';

export interface HealerConfig {
  enabled?: boolean;
  mode?: HealerMode;
  confidenceThreshold?: number;
  ambiguityMargin?: number;
  maxCandidates?: number;
  timeoutMs?: number;
  artifactsDir?: string;
  baselineDir?: string;
  recordBaselines?: boolean;
  replaceLocator?: boolean;
  /** Persist a successfully healed locator back into its Page Object/source file. */
  updateSourceOnHeal?: boolean;
  cacheEnabled?: boolean;
  cacheMaxEntries?: number;
  cacheTtlMs?: number;
  reportEnabled?: boolean;
  /** Persistent directory for proven healing mappings. */
  healingCacheDir?: string;
  reportFileName?: string;
  openReport?: boolean;
  log?: (event: HealerEvent) => void;
}

export interface DomFingerprint {
  tag: string;

  testId?: string;

  role?: string;

  ariaLabel?: string;

  placeholder?: string;

  name?: string;

  type?: string;

  text?: string;

  value?: string;

  id?: string;

  attributes?: Record<string, string>;

  classes: string[];

  parentTag: string;

  parentClasses: string[];

  childCount: number;

  siblingIndex: number;

  parentSignature?: Array<{
    tag: string;
    text?: string;
    testId?: string;
  }>;

  parent?: {
    tag?: string;
    testId?: string;
    role?: string;
  };

  ancestors?: Array<{
    tag?: string;
    testId?: string;
    role?: string;
  }>;

  children?: Array<{
    tag?: string;
    testId?: string;
    role?: string;
  }>;
}

export interface BaselineRecord {
  version: number;
  locator: string;
  url: string;
  fingerprint: DomFingerprint;
  fingerprintHash: string;
  updatedAt: string;
  /** Index used when the original locator targeted one item from a multi-element set. */
  index?: number;
}

export interface LocatorCandidate {
  expression: string;
  score: number;
  strategy: string;
  reason: string;
  resolve: (page: Page) => Locator;
  /** Preferred item index for multi-element/index-aware healing. */
  indexHint?: number;
}

export interface HealingContext {
  expression: string;
  action: ActionName;
  args: unknown[];
  url: string;
  error: string;
  html?: string;
  page: Page;
  testInfo?: TestInfo;

  /**
   * Source file that created the locator.
   *
   * testInfo.file points to the currently running spec, which is not
   * necessarily the file where a Page Object declared the locator.
   * Capturing this at locator creation allows source healing to update
   * pages/SearchPage.ts (or another Page Object) instead of the test spec.
   */
  sourceFile?: string;
}

export interface HealingCacheRecord {
  version: number;
  key: string;
  originalLocator: string;
  replacementLocator: string;
  confidence: number;
  strategy: string;
  fingerprintHash?: string;
  url: string;
  index?: number;
  sourceFile?: string;
  updatedAt: string;
}

export interface HealingResult {
  healed: boolean;
  originalLocator: string;
  replacementLocator?: string;
  action: ActionName;
  confidence?: number;
  strategy?: string;
  candidateCount: number;
  liveDomValidated: boolean;
  baselineFound?: boolean;
  fingerprintHash?: string;
  sourceRewritten?: boolean;
  sourceFile?: string;
  retrySucceeded?: boolean;
  cacheHit?: boolean;
  timestamp: string;
  reason?: string;
}

export interface HealerEvent extends HealingResult {
  type:
    | 'baseline-recorded'
    | 'healing-attempt'
    | 'healed'
    | 'healing-failed'
    | 'cache-hit'
    | 'cache-miss'
    | 'healed-action-retry';
  url: string;
}
