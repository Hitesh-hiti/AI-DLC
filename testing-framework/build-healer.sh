#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PKG="$ROOT/packages/playwright-healer"
rm -rf "$PKG"
mkdir -p "$PKG/src"
cat > "$PKG/package.json" <<'JSON'
{
  "name": "playwright-healer",
  "version": "0.2.0",
  "description": "Runtime locator healing for Playwright using failure-time DOM snapshots and live verification.",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": { "build": "tsc -p tsconfig.json" },
  "peerDependencies": { "@playwright/test": ">=1.45.0" },
  "devDependencies": { "@playwright/test": "^1.63.0", "typescript": "^5.8.0" }
}
JSON
cat > "$PKG/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"]
}
JSON
cat > "$PKG/src/types.ts" <<'TS'
import type { Locator, Page, TestInfo } from '@playwright/test';

export type HealerMode = 'runtime' | 'observe';
export type ActionName = 'click' | 'dblclick' | 'fill' | 'press' | 'check' | 'uncheck' | 'selectOption' | 'hover' | 'focus';

export interface HealerConfig {
  enabled?: boolean;
  mode?: HealerMode;
  confidenceThreshold?: number;
  maxCandidates?: number;
  timeoutMs?: number;
  artifactsDir?: string;
  log?: (event: HealerEvent) => void;
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
  html: string;
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
  timestamp: string;
  reason?: string;
}

export interface HealerEvent extends HealingResult {
  type: 'healing-attempt' | 'healed' | 'healing-failed';
  url: string;
}
TS
cat > "$PKG/src/dom.ts" <<'TS'
export interface DomElementSnapshot {
  tag: string;
  attrs: Record<string, string>;
  text: string;
  index: number;
}

function decode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function attrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) out[m[1]] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}

export function parseHtml(html: string): DomElementSnapshot[] {
  const result: DomElementSnapshot[] = [];
  const re = /<([a-zA-Z][\w:-]*)([^>]*)>([\s\S]*?)<\/\1\s*>|<([a-zA-Z][\w:-]*)([^>]*)\/?\s*>/g;
  let m: RegExpExecArray | null;
  let index = 0;
  while ((m = re.exec(html))) {
    const tag = (m[1] ?? m[4]).toLowerCase();
    if (!['button','input','textarea','select','option','a','label','[... ELLIPSIZATION ...]ex, index);
    result.push({ tag, attrs: attrs(m[2] ?? m[5] ?? ''), text, index: index++ });
  }
  return result;
}

export function textOf(el: DomElementSnapshot): string {
  return el.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
TS
