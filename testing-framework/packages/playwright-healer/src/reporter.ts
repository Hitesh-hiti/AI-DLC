import path from 'node:path';
import { readFile } from 'node:fs/promises';

import {
  getRegisteredHealer,
} from './registry.js';

import {
  cacheMetricsFromEvents,
  readHealingEvents,
  writeHealingReport,
} from './report.js';
import { HealingCacheStore } from './healing-cache-store.js';

import type { PlaywrightHealer } from './healer.js';

export interface PlaywrightHealerReporterOptions {
  healer?: PlaywrightHealer;
  openReport?: boolean;
  artifactsDir?: string;
  reportFileName?: string;
  healingCacheDir?: string;
}

/**
 * Reporter bridge that aggregates healer events from every Playwright worker.
 *
 * A reporter instance is created by the Playwright runner process, while the
 * healer instances normally live in worker processes. Therefore the reporter
 * must not depend on the worker's in-memory healer state. Worker events are
 * persisted to healing-events.jsonl and the final report is rebuilt from that
 * shared event stream in onEnd().
 */
export default class PlaywrightHealerReporter {
  private healer?: PlaywrightHealer;
  private readonly openReport: boolean;
  private readonly artifactsDir?: string;
  private readonly reportFileName?: string;
  private readonly healingCacheDir?: string;

  constructor(options?: PlaywrightHealerReporterOptions) {
    this.healer = options?.healer;
    this.openReport = options?.openReport ?? true;
    this.artifactsDir = options?.artifactsDir;
    this.reportFileName = options?.reportFileName;
    this.healingCacheDir = options?.healingCacheDir;
  }

  private tryGetHealer(): PlaywrightHealer | undefined {
    if (this.healer) return this.healer;
    try {
      this.healer = getRegisteredHealer();
      return this.healer;
    } catch {
      return undefined;
    }
  }

  async onEnd(_result: unknown): Promise<void> {
    const healer = this.tryGetHealer();

    const artifactsDir =
      this.artifactsDir ??
      healer?.config.artifactsDir ??
      path.resolve(process.cwd(), 'test-results', 'healer');

    const reportFileName =
      this.reportFileName ??
      healer?.config.reportFileName ??
      'healing-report.html';

    const events = await readHealingEvents(
      path.join(artifactsDir, 'healing-events.jsonl')
    );

    const cacheDir =
      this.healingCacheDir ??
      healer?.config.healingCacheDir ??
      path.resolve(process.cwd(), '.healer', 'cache');

    const cacheStore = new HealingCacheStore(cacheDir);
    const cacheEntries = await cacheStore.loadAll();

    const maxEntries = healer?.config.cacheMaxEntries ?? 500;
    const ttlMs = healer?.config.cacheTtlMs ?? 0;
    const cache = cacheMetricsFromEvents(
      events,
      cacheEntries.length,
      maxEntries,
      ttlMs
    );

    await writeHealingReport(
      path.resolve(artifactsDir, reportFileName),
      { events, cache }
    );

    console.log('[HEALER DEBUG] final report generated', {
      reportPath: path.resolve(artifactsDir, reportFileName),
      events: events.length,
      cacheEntries: cacheEntries.length,
      cacheHits: cache.hits,
      cacheMisses: cache.misses,
    });

    if (!this.openReport || process.env.CI) {
      return;
    }

    try {
      const reportPath = path.resolve(artifactsDir, reportFileName);
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);

      if (process.platform === 'win32') {
        await execAsync(`start "" "${reportPath}"`);
      } else if (process.platform === 'darwin') {
        await execAsync(`open "${reportPath}"`);
      } else {
        await execAsync(`xdg-open "${reportPath}"`);
      }
    } catch {
      // Opening the report is best-effort only.
    }
  }
}
