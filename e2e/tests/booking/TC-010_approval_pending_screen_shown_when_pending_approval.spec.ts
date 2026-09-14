/**
 * TC-010 — Approval pending screen shown when booking requires manager approval
 *
 * Requirement : REQ-EXP-02, REQ-EXP-07
 * AC          : AC-EXP-02-05, AC-EXP-07-05
 * Priority    : P0
 * Type        : Positive / Approval Flow
 *
 * Precondition: VITE_MOCK_POLICY=APPROVAL
 *
 * Scenario:
 *   Given policy requires approval
 *   When Confirm Booking is clicked
 *   Then the approval pending screen is shown with:
 *     - heading "Booking Submitted for Approval"
 *     - booking reference
 *     - status badge "Pending Approval"
 *     - approver name
 *     - approval expiry date/time
 *     - confirm-blocked notice
 *     - NO Confirm Booking button
 */

import { test, expect } from '../../fixtures/base';
import { navigateToReviewPanel } from '../../utils/booking';

test.describe('TC-010 | Approval — approval pending screen (AC-EXP-02-05, AC-EXP-07-05)', () => {

  test.beforeEach(async ({ page }) => {
    // navigateToReviewPanel navigates, searches, selects and fills passenger
    await navigateToReviewPanel(page);
  });

  test('clicking Confirm Booking shows approval pending screen', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertVisible();
  });

  test('approval pending screen heading is "Booking Submitted for Approval"', async ({
    reviewBookingPage,
    approvalPendingPage,
    page,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertVisible();
    await expect(
      page.getByRole('heading', { name: 'Booking Submitted for Approval' })
    ).toBeVisible();
  });

  test('booking reference is present and non-empty (AC-EXP-02-01)', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertBookingReference();
  });

  test('status badge shows "Pending Approval" (AC-EXP-07-05)', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertStatusBadge();
  });

  test('approver name is displayed (AC-EXP-07-05)', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertApproverName();
  });

  test('approval expiry date/time is displayed (AC-EXP-07-05)', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertApprovalExpiry();
  });

  test('confirm-blocked notice is shown (AC-EXP-02-05)', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertConfirmBlocked();
  });

  test('no Confirm Booking button is present (AC-EXP-02-05)', async ({
    reviewBookingPage,
    approvalPendingPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertNoConfirmButton();
  });

  test('Back to Search button navigates back to search form', async ({
    reviewBookingPage,
    approvalPendingPage,
    searchPage,
  }) => {
    await reviewBookingPage.confirmBooking();
    await approvalPendingPage.assertVisible();
    await approvalPendingPage.backToSearch();
    await expect(searchPage.form).toBeVisible({ timeout: 10000 });
  });

});
