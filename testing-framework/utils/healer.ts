import path from 'node:path';
import { createHealer, registerHealer } from 'playwright-healer';

export const healer = createHealer({
  mode: 'runtime',
  confidenceThreshold: 0.85,
  ambiguityMargin: 0.08,
  maxCandidates: 12,
  timeoutMs: 1500,
  recordBaselines: true,
  replaceLocator: true,
  reportEnabled: true,
  reportFileName: 'healing-report.html',
  // Opens automatically after a local Playwright run. CI is suppressed by the reporter.
  openReport: true,
  baselineDir: path.resolve(
    process.cwd(),
    '.healer',
    'baselines'
  ),

  artifactsDir: path.resolve(
    process.cwd(),
    'test-results',
    'healer'
  ),

  log: event => {
    console.log(
      '[PLAYWRIGHT HEALER]',
      JSON.stringify(event, null, 2)
    );
  },
});
registerHealer(healer);
