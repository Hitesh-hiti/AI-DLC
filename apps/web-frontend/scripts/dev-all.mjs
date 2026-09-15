import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const backend = resolve(root, 'backend');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('Starting backend...');
console.log('Backend directory:', backend);

console.log('Starting frontend...');
console.log('Frontend directory:', root);

const api = spawn(npm, ['start'], {
  cwd: backend,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

const web = spawn(npm, ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

const shutdown = (code = 0) => {
  console.log('\nStopping frontend and backend...');

  if (!api.killed) {
    api.kill();
  }

  if (!web.killed) {
    web.kill();
  }

  process.exit(code);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

api.on('error', (error) => {
  console.error('Backend failed to start:', error);
  shutdown(1);
});

web.on('error', (error) => {
  console.error('Frontend failed to start:', error);
  shutdown(1);
});

api.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Backend exited with code ${code}`);
    shutdown(code);
  }
});

web.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`Frontend exited with code ${code}`);
    shutdown(code);
  }
});