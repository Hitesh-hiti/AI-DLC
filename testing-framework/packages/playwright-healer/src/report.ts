import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CacheMetrics } from './cache.js';
import type { HealerEvent } from './types.js';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export interface HealingReportSummary {
  events: HealerEvent[];
  cache: CacheMetrics;
}



export async function readHealingEvents(filename: string): Promise<HealerEvent[]> {
  try {
    const content = await readFile(filename, 'utf8');
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line: string) => JSON.parse(line) as HealerEvent);
  } catch {
    return [];
  }
}

export function cacheMetricsFromEvents(
  events: HealerEvent[],
  currentSize = 0,
  maxEntries = 500,
  ttlMs = 0
): CacheMetrics {
  const hits = events.filter(event => event.type === 'cache-hit').length;
  const misses = events.filter(event => event.type === 'cache-miss').length;
  const evictions = events.filter(event => event.reason?.includes('cache eviction')).length;
  const expirations = events.filter(event => event.reason?.includes('cache expiration')).length;
  const requests = hits + misses;

  return {
    hits,
    misses,
    evictions,
    expirations,
    size: currentSize,
    maxEntries,
    ttlMs,
    hitRate: requests === 0 ? 0 : hits / requests,
  };
}

export async function writeHealingReport(
  filename: string,
  summary: HealingReportSummary
): Promise<void> {
  await mkdir(path.dirname(filename), { recursive: true });

  const healingEvents = summary.events.filter(e =>
    e.type === 'healed' ||
    e.type === 'healing-failed' ||
    e.type === 'cache-hit' ||
    e.type === 'healed-action-retry'
  );
  const healed = summary.events.filter(e => e.type === 'healed');
  const failed = summary.events.filter(e => e.type === 'healing-failed');
  const attempts = summary.events.filter(e => e.type === 'healing-attempt');
  const baselines = summary.events.filter(e => e.type === 'baseline-recorded');
  const confidences = healed.map(e => e.confidence).filter((v): v is number => typeof v === 'number');
  const averageConfidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;

  const rows = healingEvents.map(event => `
    <tr>
      <td>${escapeHtml(event.timestamp)}</td>
      <td><span class="badge ${event.type === 'healed' || event.type === 'cache-hit' ? 'ok' : event.type === 'healed-action-retry' ? 'info' : 'bad'}">${escapeHtml(event.type)}</span></td>
      <td>${escapeHtml(event.action)}</td>
      <td><code>${escapeHtml(event.originalLocator)}</code></td>
      <td><code>${escapeHtml(event.replacementLocator ?? '-')}</code></td>
      <td>${typeof event.confidence === 'number' ? pct(event.confidence) : '-'}</td>
      <td>${escapeHtml(event.strategy ?? '-')}</td>
      <td>${escapeHtml(event.reason ?? '-')}</td>
    </tr>`).join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Playwright Healer Report</title>
<style>
body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;margin:0;background:#f5f7fb;color:#172033}
main{max-width:1400px;margin:32px auto;padding:0 20px}.hero{display:flex;justify-content:space-between;align-items:end;gap:20px}
h1{margin:0 0 6px}.muted{color:#667085}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin:24px 0}
.card{background:#fff;border:1px solid #e4e7ec;border-radius:12px;padding:18px;box-shadow:0 1px 2px #0000000a}.value{font-size:28px;font-weight:700;margin-top:8px}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden}th,td{padding:11px 12px;border-bottom:1px solid #eaecf0;text-align:left;vertical-align:top;font-size:13px}th{background:#f9fafb}.badge{display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700}.ok{background:#dcfae6;color:#067647}.bad{background:#fee4e2;color:#b42318}.info{background:#e0ecff;color:#175cd3}code{word-break:break-word}.section{margin-top:28px}
</style></head>
<body><main>
<div class="hero"><div><h1>Playwright Healer Report</h1><div class="muted">Generated ${escapeHtml(new Date().toISOString())}</div></div></div>
<div class="grid">
<div class="card"><div class="muted">Healing attempts</div><div class="value">${attempts.length}</div></div>
<div class="card"><div class="muted">Successful heals</div><div class="value">${healed.length}</div></div>
<div class="card"><div class="muted">Failed heals</div><div class="value">${failed.length}</div></div>
<div class="card"><div class="muted">Baselines recorded</div><div class="value">${baselines.length}</div></div>
<div class="card"><div class="muted">Avg. confidence</div><div class="value">${pct(averageConfidence)}</div></div>
<div class="card"><div class="muted">Cache hit rate</div><div class="value">${pct(summary.cache.hitRate)}</div></div>
</div>
<div class="section"><h2>Cache</h2><div class="grid">
<div class="card"><div class="muted">Hits</div><div class="value">${summary.cache.hits}</div></div>
<div class="card"><div class="muted">Misses</div><div class="value">${summary.cache.misses}</div></div>
<div class="card"><div class="muted">Evictions</div><div class="value">${summary.cache.evictions}</div></div>
<div class="card"><div class="muted">Expirations</div><div class="value">${summary.cache.expirations}</div></div>
<div class="card"><div class="muted">Current size</div><div class="value">${summary.cache.size}</div></div>
</div></div>
<div class="section"><h2>Healing activity</h2><table><thead><tr><th>Time</th><th>Event</th><th>Action</th><th>Original</th><th>Replacement</th><th>Confidence</th><th>Strategy</th><th>Reason</th></tr></thead><tbody>${rows || '<tr><td colspan="8">No healing activity recorded.</td></tr>'}</tbody></table></div>
</main></body></html>`;

  await writeFile(filename, html, 'utf8');
}
