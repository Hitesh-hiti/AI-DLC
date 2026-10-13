export {
  createHealer,
  PlaywrightHealer,
} from './healer.js';

export {
  extendWithHealer,
} from './fixture.js';

export {
  fingerprintHash,
  fingerprintLocator,
  fingerprintSelector,
} from './fingerprint.js';

export {
  BaselineStore,
} from './baseline-store.js';

export {
  LruCache,
} from './cache.js';

export {
  HealingCacheStore,
} from './healing-cache-store.js';

export {
  writeHealingReport,
} from './report.js';

export type {
  HealerConfig,
  HealingResult,
  HealerEvent,
  LocatorCandidate,
  HealerMode,
  ActionName,
  DomFingerprint,
  BaselineRecord,
  HealingCacheRecord,
} from './types.js';

export type { CacheMetrics } from './cache.js';
import PlaywrightHealerReporter from './reporter.js';
export { PlaywrightHealerReporter };

export { registerHealer, getRegisteredHealer } from './registry.js';
