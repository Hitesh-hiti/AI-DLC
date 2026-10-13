import {
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

import type { HealingCacheRecord } from './types.js';

/**
 * Persistent store for proven healing mappings.
 *
 * Baselines remain historical evidence. This store is the fast path for a
 * locator that has already healed successfully and whose replacement action
 * has completed successfully at least once.
 */
export class HealingCacheStore {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  private hash(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private filename(key: string): string {
    return `${this.hash(key)}.json`;
  }

  private async ensure(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  async save(key: string, record: HealingCacheRecord): Promise<void> {
    await this.ensure();

    const filename = this.filename(key);
    const destination = path.join(this.dir, filename);
    const temporary = path.join(
      this.dir,
      `.${filename}.${process.pid}.${Date.now()}.tmp`
    );

    await writeFile(
      temporary,
      JSON.stringify(record, null, 2),
      'utf8'
    );
    await rename(temporary, destination);
  }

  async load(key: string): Promise<HealingCacheRecord | null> {
    try {
      const content = await readFile(
        path.join(this.dir, this.filename(key)),
        'utf8'
      );
      return JSON.parse(content) as HealingCacheRecord;
    } catch {
      return null;
    }
  }

  async loadAll(): Promise<HealingCacheRecord[]> {
    try {
      const files = await readdir(this.dir);
      const records: HealingCacheRecord[] = [];

      for (const file of files.filter((file: string) => file.endsWith('.json'))) {
        try {
          const content = await readFile(
            path.join(this.dir, file),
            'utf8'
          );
          const record = JSON.parse(content) as HealingCacheRecord;
          if (
            record &&
            typeof record === 'object' &&
            typeof record.originalLocator === 'string' &&
            typeof record.replacementLocator === 'string'
          ) {
            records.push(record);
          }
        } catch {
          // Ignore malformed cache records.
        }
      }

      return records;
    } catch {
      return [];
    }
  }
}
