/**
 * TC-011 — Confirmed screen displays ticket number, coupons, void window, total fare
 *
 * Requirement : REQ-EXP-03
 * AC          : AC-EXP-03-08
 * Priority    : P0
 * Type        : Positive / Happy Path
 *
 * Precondition: VITE_MOCK_POLICY=ALLOW (default)
 *
 * Scenario:
 *   Given the booking is confirmed (CONFIRMED status)
 *   Then the confirmed screen shows:
 *     - "Flight Confirmed!" heading
 *     - Booking reference
 *     - PNR (6-char alphanumeric)
 *     - Ticket number
 *     - Coupon table with OPEN status
 *     - Void window expiry date/time
 *     - Fare breakdown with currency
 *     - Payment reference
 */

import { test, expect } from '../../fixtures/base';
import { navigateToReviewPanel } from '../../utils/booking';

test.describe('TC-011 | Confirmed — ticket, coupons, void window, fare (AC-EXP-03-08)', () => {

  test.beforeEach(async ({ page, reviewBookingPage, confirmedPage }) => {
    await navigateToReviewPanel(page);
    await reviewBookingPage.confirmBooking();
    await confirmedPage.assertVisible();
  });

  test('confirmed screen heading is "Flight Confirmed!"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Flight Confirmed!' })
    ).toBeVisible();
  });

  test('booking reference is shown and non-empty', async ({ confirmedPage }) => {
    // AC-EXP-03-08: ticket number visible
    await confirmedPage.assertBookingReference();
  });

  test('PNR is shown as a 6-character alphanumeric code', async ({ confirmedPage }) => {
    await confirmedPage.assertPnr();
  });

  test('at least one ticket number is displayed', async ({ confirmedPage }) => {
    // AC-EXP-03-08: ticket number displayed
    await confirmedPage.assertTicketNumber();
  });

  test('coupon table shows at least one OPEN coupon', async ({ confirmedPage }) => {
    // AC-EXP-03-08: coupon list with statuses
    await confirmedPage.assertCouponTable();
  });

  test('void window section is visible with a non-empty expiry date/time', async ({
    confirmedPage,
  }) => {
    // AC-EXP-03-08: void window expiry date/time
    await confirmedPage.assertVoidWindow();
  });

  test('fare breakdown shows total with currency code', async ({ confirmedPage }) => {
    // AC-EXP-03-08: total amount with currency
    await confirmedPage.assertFareWithCurrency();
  });

  test('payment reference is shown', async ({ confirmedPage }) => {
    await confirmedPage.assertPaymentReference();
  });

  test('success subtitle prompts user to check email', async ({ page }) => {
    await expect(
      page.getByText('Your e-ticket has been issued')
    ).toBeVisible();
  });

  test('"Search Another Flight" button is present', async ({ confirmedPage }) => {
    await expect(confirmedPage.searchAnotherBtn).toBeVisible();
  });

  test('clicking Search Another Flight returns to search form', async ({
    confirmedPage,
    searchPage,
  }) => {
    await confirmedPage.searchAnother();
    await expect(searchPage.form).toBeVisible({ timeout: 10000 });
  });

});
