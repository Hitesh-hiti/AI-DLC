/**
 * TC-006 — Confirm booking displays booking reference and transitions to confirmed screen
 *
 * Requirement : REQ-EXP-02
 * AC          : AC-EXP-02-01
 * Priority    : P0
 * Type        : Positive / Happy Path
 *
 * Precondition: VITE_MOCK_POLICY=ALLOW (default)
 *
 * Scenario:
 *   Given the Review & Confirm panel is shown with ALLOW policy
 *   When the traveler clicks Confirm Booking
 *   Then the confirmed screen renders with a non-empty booking reference
 *   And no error alert is shown
 */

import { test, expect } from '../../fixtures/base';
import { navigateToReviewPanel } from '../../utils/booking';

test.describe('TC-006 | Booking — confirm transitions to confirmed screen with booking reference', () => {

  test.beforeEach(async ({ page }) => {
    await navigateToReviewPanel(page);
  });

  test('clicking Confirm Booking transitions to the confirmed screen', async ({
    reviewBookingPage,
    confirmedPage,
  }) => {
    // AC-EXP-02-01: booking_id displayed, policy decision shown
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
  });

  test('confirmed screen shows a non-empty booking reference', async ({
    reviewBookingPage,
    confirmedPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
    await confirmedPage.assertBookingReference();
  });

  test('no error alert is shown after successful confirmation', async ({
    reviewBookingPage,
    confirmedPage,
    page,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('review panel is gone after confirmation', async ({
    reviewBookingPage,
    confirmedPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
    await expect(reviewBookingPage.holdPanel).not.toBeVisible();
  });

});
