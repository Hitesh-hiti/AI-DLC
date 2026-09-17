/**
 * E2E-HP-001 — Full Booking Happy Path
 *
 * Journey:
 *   1. Open TravelPlatform
 *   2. Search LHR → JFK (14 days ahead)
 *   3. View flight results — verify airline, route, fare with currency
 *   4. Expand fare breakdown on first card
 *   5. Select first available flight
 *   6. Fill passenger details (JOHN SMITH)
 *   7. Review & Confirm panel — verify flight summary, fare, ALLOW policy
 *   8. Click Confirm Booking
 *   9. Verified confirmed screen — booking ref, PNR, ticket, coupon (OPEN),
 *      void window, fare with currency, payment reference
 *  10. Click "Search Another Flight" → lands back on search form
 *
 * Traceability:
 *   REQ-EXP-01 → AC-EXP-01-01  (search & results)
 *   REQ-EXP-02 → AC-EXP-02-01  (hold / booking ref / hold expiry / policy)
 *   REQ-EXP-03 → AC-EXP-03-01  (confirm)
 *   REQ-EXP-03 → AC-EXP-03-08  (ticket, coupons, void window, fare)
 *   REQ-XCT-05 → AC-XCT-05-03  (no raw error codes in any error alert)
 *
 * Precondition: VITE_MOCK_POLICY=ALLOW (default — no env var needed)
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH, PASSENGER_JOHN } from '../../test-data/search';

test(
  'E2E-HP-001 | Full booking happy path — search → select → passenger → confirm → confirmed',
  async ({
    page,
    searchPage,
    passengerFormPage,
    reviewBookingPage,
    confirmedPage,
  }) => {

    // ── Step 1: Open application ─────────────────────────────────────────────
    await searchPage.goto();
    await expect(searchPage.form).toBeVisible();

    // ── Step 2: Search LHR → JFK ─────────────────────────────────────────────
    await searchPage.search(STANDARD_SEARCH);

    // ── Step 3: Results list is displayed ────────────────────────────────────
    await searchPage.waitForResults();

    // Results heading confirms flights were found
    const heading = searchPage.searchResults.locator('h2.search-results-title');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Flight');
    await expect(heading).toContainText('Found');

    // First card shows airline, cabin badge, and price with currency
    const firstCard = searchPage.flightCards().first();
    await expect(firstCard.locator('.flight-airline')).toBeVisible();
    await expect(firstCard.locator('.cabin-badge')).toBeVisible();
    const priceText = await firstCard.locator('.flight-price-block').textContent();
    expect(priceText).toMatch(/\$|USD|EUR|GBP/);

    // ── Step 4: Expand fare breakdown on first card ───────────────────────────
    const priceToggle = firstCard.locator('.price-toggle');
    await priceToggle.click();
    const fareBreakdown = firstCard.locator('.fare-breakdown');
    await expect(fareBreakdown).toBeVisible();
    await expect(fareBreakdown).toContainText('Base fare');
    await expect(fareBreakdown).toContainText('Taxes');
    await expect(fareBreakdown).toContainText('Fees');
    await expect(fareBreakdown).toContainText('Total');
    // Close it before proceeding
    await priceToggle.click();
    await expect(fareBreakdown).not.toBeVisible();

    // ── Step 5: Select first available flight ────────────────────────────────
    await searchPage.selectFirstAvailableFlight();

    // ── Step 6: Passenger form appears (step 2) ───────────────────────────────
    await passengerFormPage.assertVisible();
    await expect(passengerFormPage.firstNameInput(0)).toBeVisible();
    await expect(passengerFormPage.lastNameInput(0)).toBeVisible();

    // Fill passenger: JOHN SMITH
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);

    // ── Step 7: Review & Confirm panel (step 3) ───────────────────────────────
    await reviewBookingPage.assertVisible();

    // Flight summary visible
    const flightCard = reviewBookingPage.holdPanel.getByRole('region', { name: 'Selected flight' });
    await expect(flightCard).toBeVisible();

    // Passenger listed
    await reviewBookingPage.assertPassengerListed('JOHN', 'SMITH');

    // Fare breakdown on hold panel
    await reviewBookingPage.assertFareBreakdown();

    // Policy: ALLOW — "Policy Check Passed"
    await reviewBookingPage.assertPolicyAllow();

    // Confirm Booking button is enabled
    await expect(reviewBookingPage.confirmBookingBtn).toBeEnabled();

    // ── Step 8: Confirm Booking ───────────────────────────────────────────────
    await reviewBookingPage.confirmBooking();

    // ── Step 9: Confirmed screen ──────────────────────────────────────────────
    await confirmedPage.assertVisible();

    // 9a. Booking reference — non-empty (AC-EXP-02-01)
    await confirmedPage.assertBookingReference();
    const bookingRef = await confirmedPage.bookingRef.textContent();
    expect(bookingRef?.trim().length).toBeGreaterThan(0);

    // 9b. PNR — 6-char alphanumeric (AC-EXP-03-08)
    await confirmedPage.assertPnr();

    // 9c. Ticket number (AC-EXP-03-08)
    await confirmedPage.assertTicketNumber();

    // 9d. Coupon table with OPEN status (AC-EXP-03-08)
    await confirmedPage.assertCouponTable();

    // 9e. Void window expiry (AC-EXP-03-08)
    await confirmedPage.assertVoidWindow();

    // 9f. Fare breakdown with currency code (AC-EXP-03-08)
    await confirmedPage.assertFareWithCurrency();

    // 9g. Payment reference
    await confirmedPage.assertPaymentReference();

    // 9h. No error alert visible anywhere (AC-XCT-05-03)
    await expect(page.getByTestId('app-error-alert')).not.toBeVisible();

    // ── Step 10: Search Another Flight → back to search form ─────────────────
    await confirmedPage.searchAnother();
    await expect(searchPage.form).toBeVisible({ timeout: 10000 });
    // Form fields are reset (empty)
    await expect(searchPage.originInput).toHaveValue('');
    await expect(searchPage.destinationInput).toHaveValue('');
  },
);
