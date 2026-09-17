/**
 * Environment utilities
 * Sets VITE_MOCK_POLICY before launching the dev server by exposing
 * helpers used in playwright.config.ts or global setup.
 */

export type MockPolicy = 'ALLOW' | 'WARN' | 'BLOCK' | 'APPROVAL';

/**
 * Returns the base URL for the app under test.
 * Falls back to localhost:5173 when APP_BASE_URL is not set.
 */
export function getBaseUrl(): string {
  return process.env.APP_BASE_URL ?? 'http://localhost:5173';
}
