import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type IstanbulCoverage = Record<string, unknown>;

export async function saveIstanbulCoverage(page: Page, id: string): Promise<void> {
  if (process.env.E2E_COVERAGE !== 'true') return;

  const coverage = await page.evaluate(() => {
    const value = (globalThis as { __coverage__?: IstanbulCoverage }).__coverage__;
    return value ?? null;
  });

  if (!coverage || Object.keys(coverage).length === 0) return;

  const dir = path.resolve('coverage/e2e');
  await mkdir(dir, { recursive: true });
  const safeId = id.replace(/[^a-zA-Z0-9._-]/g, '_');
  await writeFile(path.join(dir, `${safeId}.json`), JSON.stringify(coverage), 'utf8');
}
