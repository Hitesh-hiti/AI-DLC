# Istanbul Coverage

This framework supports two Istanbul coverage paths:

1. **Vitest** — `@vitest/coverage-istanbul` is already configured.
2. **Playwright E2E** — browser coverage is collected from `window.__coverage__`.

## Instrument the frontend

`testing-framework` is separate from `apps/web-frontend`, so its Vitest config
cannot instrument the frontend bundle used by Playwright.

In the frontend application's Vite config, add `vite-plugin-istanbul`:

```ts
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  plugins: [
    istanbul({
      include: 'src/**/*',
      exclude: ['node_modules/**', 'test/**', 'coverage/**'],
      extension: ['.js', '.ts', '.jsx', '.tsx'],
      requireEnv: false,
      forceBuildInstrument: true,
    }),
  ],
  build: { sourcemap: true },
});
```

If the frontend already has a Vite plugin list, add `istanbul(...)` to it.

## Run E2E coverage

```bash
npm install
npm run test:e2e:coverage
npm run test:e2e:coverage:merge
```

Raw per-test Istanbul data is written to `coverage/e2e/*.json`.
Merged Istanbul data is written to `coverage/istanbul/coverage-final.json`.

The merged file is standard Istanbul coverage JSON and can be consumed by
Istanbul/nyc reporting tools in CI.

## Vitest coverage

```bash
npm run test:coverage
```

Reports are written to `reports/vitest/coverage-report/`.

## CI

```bash
npm run test:coverage
npm run test:e2e:coverage
npm run test:e2e:coverage:merge
```

Keep Vitest and Playwright coverage as separate test-layer metrics unless a
combined frontend metric is explicitly required.
