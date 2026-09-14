/**
 * TC-008 — BLOCK policy outcome: non-dismissible panel, Return to Search only
 *
 * Requirement : REQ-POL-01, REQ-POL-04
 * AC          : AC-POL-01-06, AC-POL-04-03
 * Priority    : P0
 * Type        : Positive / Policy Block Flow
 *
 * Precondition: VITE_MOCK_POLICY=BLOCK
 *
 * Scenario:
 *   Given policy evaluation returns BLOCK
 *   Then a red error panel is displayed with the block reason
 *   And only "← Return to Search" is available
 *   And no Confirm, Override, or Approval option is present
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH, PASSENGER_JOHN } from '../../test-data/search';

test.describe('TC-008 | Policy BLOCK — non-dismissible panel, no confirm/override/approval', () => {

  test.beforeEach(async ({ searchPage, passengerFormPage }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
  });

  test('BLOCK policy panel is visible with correct role="alert"', async ({
    reviewBookingPage,
  }) => {
    // AC-POL-01-06: non-dismissible error panel — aria role must be alert
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.policyBlock).toBeVisible();
    await expect(reviewBookingPage.policyBlock).toHaveAttribute('role', 'alert');
  });

  test('BLOCK panel contains "Booking Blocked by Policy" heading', async ({
    reviewBookingPage,
  }) => {
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.policyBlock).toContainText('Booking Blocked by Policy');
  });

  test('BLOCK panel shows the policy block reason text', async ({
    reviewBookingPage,
    page,
  }) => {
    await reviewBookingPage.assertVisible();
    const reasons = page.getByTestId('policy-block-reason');
    await expect(reasons.first()).toBeVisible();
    const text = await reasons.first().textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('Return to Search button is visible inside the BLOCK panel', async ({
    reviewBookingPage,
  }) => {
    // AC-POL-04-03: only Return to Search is rendered
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.returnToSearchBtn).toBeVisible();
  });

  test('Confirm Booking button is NOT visible when policy is BLOCK', async ({
    reviewBookingPage,
  }) => {
    // AC-POL-01-06 + AC-POL-04-03: no confirm button
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.confirmBookingBtn).not.toBeVisible();
  });

  test('no override or approval path is visible', async ({ reviewBookingPage, page }) => {
    // AC-POL-04-03: no override/approval path visible or accessible
    await reviewBookingPage.assertVisible();
    await expect(page.getByTestId('btn-acknowledge-warning')).not.toBeVisible();
    await expect(page.getByText('Request Approval')).not.toBeVisible();
    await expect(page.getByText('Override')).not.toBeVisible();
  });

  test('BLOCK panel has aria-live="assertive" for accessibility', async ({
    reviewBookingPage,
  }) => {
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.policyBlock).toHaveAttribute('aria-live', 'assertive');
  });

});
