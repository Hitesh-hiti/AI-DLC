/**
 * Playwright Configuration — TravelPlatform E2E Suite
 *
 * Traceability: REQ-EXP-01, REQ-EXP-02, REQ-EXP-03, REQ-EXP-07,
 *               REQ-POL-01, REQ-POL-04, REQ-XCT-05
 *
 * The dev server (apps/web-frontend) must be running on port 5173
 * before tests execute. The webServer block below starts it automatically.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  /* Run each test in isolation — no shared state between tests */
  fullyParallel: false,

  /* Fail the build on CI if test.only is accidentally committed */
  forbidOnly: !!process.env.CI,

  /* No automatic retries — failures should be real */
  retries: 0,

  /* Serial execution to avoid port conflicts during dev server startup */
  workers: 1,

  /* Reporter */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  /* Global timeout for each test */
  timeout: 30000,

  /* Shared settings for all tests */
  use: {
    /* Base URL for all page.goto() calls */
    baseURL: 'http://localhost:5173',

    /* Always collect trace on first retry — useful for CI debugging */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Viewport */
    viewport: { width: 1280, height: 720 },

    /* Action timeout */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 15000,
  },

  /* Test projects */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start the Vite dev server before tests */
  webServer: {
    command: 'npm run dev',
    cwd: '../apps/web-frontend',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results',
});
