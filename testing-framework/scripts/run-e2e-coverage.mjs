import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test'],
  {
    stdio: 'inherit',
    env: { ...process.env, E2E_COVERAGE: 'true', VITE_COVERAGE: 'true' },
  },
);

process.exit(result.status ?? 1);
