# Allure Report Integration

This document describes the Allure report integration for the TravelPlatform testing framework.

## Overview

Allure Report provides a comprehensive, interactive test execution dashboard with detailed analytics, history trends, and lifecycle tracking.

## Configuration

The Allure report is configured in `playwright.config.ts`:

```typescript
reporter: [
  ['list'],
  ['allure-playwright', { 
    detail: true,
    outputFolder: 'allure-results',
    suiteTitle: false,
  }],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
],
```

## Running Tests with Allure

To run E2E tests and generate Allure results:

```bash
npx playwright test tests/e2e/
```

## Viewing the Allure Report

To view the Allure report, run:

```bash
npx allure serve allure-results
```

Or to generate a static report:

```bash
npx allure generate allure-results -o allure-report --clean
npx allure open allure-report
```

## Allure Features

### Test Annotations

The framework includes utility functions in `utils/allure.ts` for adding metadata:

- `addFeature(feature: string)` - Add feature/epic
- `addStory(story: string)` - Add user story
- `addSeverity(severity)` - Add severity (blocker|critical|normal|minor|trivial)
- `addTms(tms: string)` - Add test management system reference
- `addIssue(issue: string)` - Add issue link
- `addTestCaseRef(ref: string)` - Add test case reference

### Attachments

- `attachText(name, text, type)` - Attach plain text
- `attachJson(name, data)` - Attach JSON data
- `attachScreenshot(testInfo, name)` - Attach screenshot

### Example Usage

```typescript
import { test } from '@playwright/test';
import { addFeature, addSeverity, attachJson } from '../utils/allure';

test('Sample test', async ({ page }, testInfo) => {
  addFeature('Experience');
  addSeverity('critical');
  
  // Test logic...
  
  // Attach JSON data
  attachJson('api-response', response.data);
});
```

## CI/CD Integration

For CI/CD pipelines, generate a static report:

```bash
npx allure generate allure-results -o allure-report --clean
# Upload allure-report to artifact storage
```

## Jenkins Integration

Use the Allure Jenkins Plugin to integrate with Jenkins:

1. Install the Allure Jenkins Plugin
2. Configure the report path: `allure-results`
3. The plugin will automatically generate the report