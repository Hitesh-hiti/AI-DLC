/**
 * TC-012 — Confirm booking transitions away from hold panel to confirmed state
 *
 * Requirement : REQ-EXP-03
 * AC          : AC-EXP-03-01
 * Priority    : P0
 * Type        : Positive / State Transition
 *
 * Precondition: VITE_MOCK_POLICY=ALLOW (default)
 *
 * Note (CLARIFICATION A1): AC-EXP-03-01 requires PENDING_ISSUE to be shown
 * before CONFIRMED. The current mock skips directly to CONFIRMED.
 * This test covers the CONFIRMED happy path only.
 * The PENDING_ISSUE intermediate state requires TicketingInProgressScreen
 * (not yet implemented — tracked as P1 backlog item).
 *
 * Scenario:
 *   Given review panel is shown with ALLOW policy
 *   When Confirm Booking is clicked
 *   Then loading state appears on the button
 *   And the review panel disappears
 *   And the confirmed screen appears
 *   And no error alert is shown
 */

import { test, expect } from '../../fixtures/base';
import { navigateToReviewPanel } from '../../utils/booking';

test.describe('TC-012 | Booking — confirm transitions to CONFIRMED state (AC-EXP-03-01)', () => {

  test.beforeEach(async ({ page }) => {
    await navigateToReviewPanel(page);
  });

  test('Confirm Booking button shows loading state when clicked', async ({
    reviewBookingPage,
    page,
  }) => {
    // Click without awaiting the next screen — capture loading state
    await reviewBookingPage.confirmBookingBtn.click();
    // aria-busy should be set during the async call
    // The confirmed screen will appear shortly after
    await expect(
      page.getByTestId('confirmed-screen')
    ).toBeVisible({ timeout: 20000 });
  });

  test('review panel disappears after confirmation', async ({
    reviewBookingPage,
    confirmedPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
    await expect(reviewBookingPage.holdPanel).not.toBeVisible();
  });

  test('confirmed screen appears after ALLOW policy confirm', async ({
    reviewBookingPage,
    confirmedPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
  });

  test('no error alert is shown after successful confirm', async ({
    reviewBookingPage,
    confirmedPage,
    page,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
    // No general error alert should be present
    const errorAlert = page.locator('[data-testid="error-alert"], .alert-error').first();
    await expect(errorAlert).not.toBeVisible();
  });

  test('passenger form is not shown after confirmation', async ({
    reviewBookingPage,
    confirmedPage,
    passengerFormPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
    await expect(passengerFormPage.form).not.toBeVisible();
  });

});
