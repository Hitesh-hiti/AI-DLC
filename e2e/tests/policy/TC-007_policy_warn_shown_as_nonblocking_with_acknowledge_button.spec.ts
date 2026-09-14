/**
 * TC-007 — WARN policy outcome displayed as non-blocking notice with acknowledge button
 *
 * Requirement : REQ-EXP-02, REQ-POL-01
 * AC          : AC-EXP-02-10, AC-POL-01-05
 * Priority    : P0
 * Type        : Positive / Policy Flow
 *
 * Precondition: VITE_MOCK_POLICY=WARN  (set via env before starting dev server)
 *
 * Scenario:
 *   Given policy evaluation returns WARN
 *   Then a yellow warning panel is visible with the policy rule
 *   And an "I understand — continue anyway" button is present
 *   And clicking it shows a confirmation and does NOT suppress the Confirm Booking button
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH, PASSENGER_JOHN } from '../../test-data/search';

test.describe('TC-007 | Policy WARN — non-blocking panel with acknowledge button', () => {

  /**
   * This suite requires VITE_MOCK_POLICY=WARN.
   * The dev server is started by playwright.config.ts webServer block.
   * Set the env var before running: VITE_MOCK_POLICY=WARN npx playwright test
   */
  test.beforeEach(async ({ searchPage, passengerFormPage }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
  });

  test('WARN policy panel is visible on the review panel', async ({ reviewBookingPage }) => {
    // AC-POL-01-05: warning panel visible and distinct
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.policyWarn).toBeVisible();
    await expect(reviewBookingPage.policyWarn).toContainText('Policy Warning');
  });

  test('WARN panel contains the policy rule name and details', async ({
    reviewBookingPage,
    page,
  }) => {
    await reviewBookingPage.assertVisible();
    const warnReasons = page.getByTestId('policy-warn-reason');
    await expect(warnReasons.first()).toBeVisible();
    const text = await warnReasons.first().textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('acknowledge button is visible before acknowledgement', async ({ reviewBookingPage }) => {
    // AC-POL-01-05: traveler can acknowledge and continue
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.acknowledgeWarningBtn).toBeVisible();
    await expect(reviewBookingPage.acknowledgeWarningBtn).toContainText('I understand');
  });

  test('clicking acknowledge shows confirmed message', async ({ reviewBookingPage }) => {
    await reviewBookingPage.assertVisible();
    await reviewBookingPage.acknowledgeWarningBtn.click();
    await expect(reviewBookingPage.warnAcknowledgedMsg).toBeVisible();
    await expect(reviewBookingPage.warnAcknowledgedMsg).toContainText('Warning acknowledged');
  });

  test('Confirm Booking button is still present after acknowledging WARN — non-blocking', async ({
    reviewBookingPage,
  }) => {
    // AC-EXP-02-10: warning does NOT prevent the user from proceeding
    await reviewBookingPage.assertVisible();
    await reviewBookingPage.acknowledgeWarningBtn.click();
    await expect(reviewBookingPage.confirmBookingBtn).toBeVisible();
    await expect(reviewBookingPage.confirmBookingBtn).toBeEnabled();
  });

  test('WARN panel remains visible after acknowledgement (notice, not dismissed)', async ({
    reviewBookingPage,
  }) => {
    // AC-EXP-02-10: warning is shown alongside booking, not removed
    await reviewBookingPage.assertVisible();
    await reviewBookingPage.acknowledgeWarningBtn.click();
    await expect(reviewBookingPage.policyWarn).toBeVisible();
  });

});
