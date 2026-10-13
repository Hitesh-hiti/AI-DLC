import { BaselineStore } from './dist/baseline-store.js';
import { readFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve('.healer-test-baselines');
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });

const store = new BaselineStore(dir);
const baseline = {
  version: 2,
  locator: 'getByTestId("input-origin")',
  url: 'http://localhost:5173/',
  fingerprint: {
    tag: 'select',
    testId: 'input-origin',
    id: 'origin',
    classes: ['search-form-select'],
    parentTag: 'div',
    parentClasses: ['search-form-field', 'origin-field'],
    childCount: 11,
    siblingIndex: 1
  },
  fingerprintHash: 'verification',
  updatedAt: new Date().toISOString()
};

await store.save('test__getByTestId("input-origin")', baseline);
const all = await store.loadAll();

if (all.length !== 1 || all[0].fingerprint.testId !== 'input-origin') {
  throw new Error('BaselineStore verification failed');
}

console.log('BaselineStore verification: PASS');
await rm(dir, { recursive: true, force: true });
