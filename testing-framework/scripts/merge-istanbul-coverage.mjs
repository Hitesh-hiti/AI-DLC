import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('coverage/e2e');
const outDir = path.resolve('coverage/istanbul');
fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(dir)) {
  console.error(`No E2E coverage directory found: ${dir}`);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
const merged = {};

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const [source, entry] of Object.entries(data)) {
    if (!merged[source]) {
      merged[source] = structuredClone(entry);
      continue;
    }
    const target = merged[source];
    for (const key of ['s', 'f', 'b']) {
      if (!entry[key] || !target[key]) continue;
      for (const id of Object.keys(entry[key])) {
        if (Array.isArray(entry[key][id])) {
          target[key][id] = (target[key][id] ?? []).map(
            (value, index) => value + (entry[key][id][index] ?? 0),
          );
        } else {
          target[key][id] = (target[key][id] ?? 0) + entry[key][id];
        }
      }
    }
  }
}

const output = path.join(outDir, 'coverage-final.json');
fs.writeFileSync(output, JSON.stringify(merged, null, 2));
console.log(`Merged ${files.length} E2E coverage file(s) -> ${output}`);
