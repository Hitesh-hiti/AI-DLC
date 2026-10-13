# Playwright Healer fixed package

## Included fixes

- Fixed reporter registration by passing the registered `healer` instance directly to `playwright-healer/reporter`.
- Removed the duplicate/incorrect `createHealer` initialization from `playwright.config.ts`.
- Fixed reporter type imports for Playwright 1.63.
- Changed-testId healing is stronger: a mutation such as `input-origin` -> `input-origin-active` receives sufficient fingerprint weight to pass the default 0.85 threshold when the surrounding DOM fingerprint matches.
- Multi-element healing preserves an explicit historical `.nth(index)` / `.first()` selection when a replacement locator matches multiple elements.
- If a replacement testId matches multiple elements, the healer generates an index-aware locator instead of blindly clicking the first match.
- Generic candidate generation continues to score each matching element independently using the historical DOM fingerprint.

## Build

```powershell
npm --prefix .\packages\playwright-healer run build
```

## Test

```powershell
npx playwright test tests/e2e/E2E-HP-001_full_booking_happy_path.spec.ts --headed
```

The project already contains the local `playwright-healer` dependency and the baseline data from the uploaded project.
