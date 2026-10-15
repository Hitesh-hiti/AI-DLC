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

export type {
  HealerConfig,
  HealingResult,
  HealerEvent,
  LocatorCandidate,
  HealerMode,
  ActionName,
  DomFingerprint,
  BaselineRecord,
} from './types.js';