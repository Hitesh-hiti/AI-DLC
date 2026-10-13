
import {
  mkdir,
  readFile,
  readdir,
  unlink,
  writeFile,
  rename,
} from 'node:fs/promises';

import path from 'node:path';
import crypto from 'node:crypto';

import type { BaselineRecord } from './types.js';

export class BaselineStore {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  private hash(key: string): string {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  }

  private legacy(key: string): string {
    return (
      key
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .slice(0, 180) + '.json'
    );
  }

  private hashedFile(key: string): string {
    return `${this.hash(key)}.json`;
  }

  private async ensure(): Promise<void> {
    await mkdir(this.dir, {
      recursive: true,
    });
  }

  async save(
    key: string,
    baseline: BaselineRecord
  ): Promise<void> {
    await this.ensure();

    const hash = this.hash(key);

    const destination = path.join(
      this.dir,
      `${hash}.json`
    );

    const temporary = path.join(
      this.dir,
      `.${hash}.${process.pid}.${Date.now()}.tmp`
    );

    await writeFile(
      temporary,
      JSON.stringify(
        baseline,
        null,
        2
      ),
      'utf8'
    );

    await rename(
      temporary,
      destination
    );
  }

  async load(
    key: string
  ): Promise<BaselineRecord | null> {
    const files = [
      this.hashedFile(key),
      this.legacy(key),
    ];

    for (const file of files) {
      try {
        const content =
          await readFile(
            path.join(
              this.dir,
              file
            ),
            'utf8'
          );

        return JSON.parse(
          content
        ) as BaselineRecord;
      } catch {
        // Try the next filename.
      }
    }

    return null;
  }

  /**
   * Loads every valid historical baseline.
   *
   * This is intentionally separate from `list()`.
   * `list()` returns filenames while this method
   * returns the actual baseline records.
   */
  async loadAll(): Promise<BaselineRecord[]> {
    try {
      const files =
        await readdir(this.dir);

      const jsonFiles =
        files.filter(
          file =>
            file.endsWith('.json')
        );

      const baselines: BaselineRecord[] =
        [];

      for (const file of jsonFiles) {
        try {
          const content =
            await readFile(
              path.join(
                this.dir,
                file
              ),
              'utf8'
            );

          const baseline =
            JSON.parse(
              content
            ) as BaselineRecord;

          if (
            baseline &&
            typeof baseline === 'object' &&
            typeof baseline.locator ===
              'string' &&
            baseline.fingerprint
          ) {
            baselines.push(
              baseline
            );
          }
        } catch {
          // Ignore malformed baseline files.
        }
      }

      return baselines;
    } catch {
      return [];
    }
  }

  async list(): Promise<string[]> {
    try {
      const files =
        await readdir(
          this.dir
        );

      return files.filter(
        file =>
          file.endsWith('.json')
      );
    } catch {
      return [];
    }
  }

  async remove(
    key: string
  ): Promise<void> {
    const files = [
      this.hashedFile(key),
      this.legacy(key),
    ];

    for (const file of files) {
      try {
        await unlink(
          path.join(
            this.dir,
            file
          )
        );
      } catch {
        // Already absent.
      }
    }
  }
}
