/**
 * Allure Utility Functions
 * Provides helpers for adding attachments and metadata to Allure reports.
 * Traceability: TC-001 → TC-015
 */

import type { TestInfo } from '@playwright/test';
import { test as baseTest } from '@playwright/test';

/**
 * Attach text content to Allure report
 */
export function attachText(name: string, text: string, type = 'text/plain') {
  baseTest.info().attachments.push({
    name,
    body: Buffer.from(text),
    contentType: type,
  });
}

/**
 * Attach JSON content to Allure report
 */
export function attachJson(name: string, data: unknown) {
  baseTest.info().attachments.push({
    name,
    body: Buffer.from(JSON.stringify(data, null, 2)),
    contentType: 'application/json',
  });
}

/**
 * Attach screenshot to Allure report
 */
export async function attachScreenshot(testInfo: TestInfo, name: string) {
  const screenshot = await testInfo.page.screenshot();
  testInfo.attachments.push({
    name,
    body: screenshot,
    contentType: 'image/png',
  });
}

/**
 * Add environment information to Allure report
 */
export function setEnvironmentInfo(env: Record<string, string>) {
  baseTest.info().annotations.push({
    type: 'environment',
    description: JSON.stringify(env),
  });
}

/**
 * Add test case reference to Allure report
 */
export function addTestCaseRef(ref: string) {
  baseTest.info().annotations.push({
    type: 'testcase',
    description: ref,
  });
}

/**
 * Add severity annotation to Allure report
 */
export function addSeverity(severity: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial') {
  baseTest.info().annotations.push({
    type: 'severity',
    description: severity,
  });
}

/**
 * Add feature/epic annotation to Allure report
 */
export function addFeature(feature: string) {
  baseTest.info().annotations.push({
    type: 'feature',
    description: feature,
  });
}

/**
 * Add story annotation to Allure report
 */
export function addStory(story: string) {
  baseTest.info().annotations.push({
    type: 'story',
    description: story,
  });
}

/**
 * Add issue link to Allure report
 */
export function addIssue(issue: string) {
  baseTest.info().annotations.push({
    type: 'issue',
    description: issue,
  });
}

/**
 * Add tms link to Allure report
 */
export function addTms(tms: string) {
  baseTest.info().annotations.push({
    type: 'tms',
    description: tms,
  });
}

/**
 * Mark test as flaky
 */
export function markAsFlaky() {
  baseTest.info().annotations.push({
    type: 'flaky',
    description: 'Test is known to be flaky',
  });
}