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
}

export interface LocatorCandidate {
  expression: string;
  score: number;
  strategy: string;
  reason: string;
  resolve: (page: Page) => Locator;
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
  timestamp: string;
  reason?: string;
}

export interface HealerEvent extends HealingResult {
  type:
    | 'baseline-recorded'
    | 'healing-attempt'
    | 'healed'
    | 'healing-failed';
  url: string;
}
