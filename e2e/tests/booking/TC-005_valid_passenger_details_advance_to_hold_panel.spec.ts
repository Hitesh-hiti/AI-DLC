/**
 * TC-005 — Submitting valid passenger details advances to the review panel
 *
 * Requirement : REQ-EXP-02
 * AC          : AC-EXP-02-01
 * Priority    : P0
 * Type        : Positive / Happy Path
 *
 * Precondition: VITE_MOCK_POLICY defaults to ALLOW
 *
 * Scenario:
 *   Given the passenger form is displayed
 *   When a valid first/last name is entered and Review Booking is clicked
 *   Then the Review & Confirm Flight panel appears with:
 *     - Flight summary (airline, route)
 *     - Passenger listed
 *     - Fare breakdown
 *     - Policy Check Passed (ALLOW)
 *     - Confirm Booking button enabled
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH, PASSENGER_JOHN } from '../../test-data/search';

test.describe('TC-005 | Booking — valid passenger advances to review panel (ALLOW policy)', () => {

  test.beforeEach(async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
  });

  test('review panel is shown after submitting valid passenger', async ({
    passengerFormPage,
    reviewBookingPage,
  }) => {
    await passengerFormPage.assertVisible();
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
  });

  test('review panel shows step heading "Review & Confirm Flight"', async ({
    passengerFormPage,
    reviewBookingPage,
    page,
  }) => {
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await expect(
      page.getByRole('heading', { name: 'Review & Confirm Flight' })
    ).toBeVisible();
  });

  test('review panel shows the passenger full name', async ({
    passengerFormPage,
    reviewBookingPage,
  }) => {
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
    // Component auto-uppercases — verify JOHN SMITH appears
    await reviewBookingPage.assertPassengerListed('JOHN', 'SMITH');
  });

  test('review panel shows fare breakdown with Base fare, Taxes, Fees, Total', async ({
    passengerFormPage,
    reviewBookingPage,
  }) => {
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
    await reviewBookingPage.assertFareBreakdown();
  });

  test('ALLOW policy panel is shown — Policy Check Passed', async ({
    passengerFormPage,
    reviewBookingPage,
  }) => {
    // AC-EXP-02-01: policy decision outcome shown
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
    await reviewBookingPage.assertPolicyAllow();
  });

  test('Confirm Booking button is visible and enabled when policy is ALLOW', async ({
    passengerFormPage,
    reviewBookingPage,
  }) => {
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
    await expect(reviewBookingPage.confirmBookingBtn).toBeVisible();
    await expect(reviewBookingPage.confirmBookingBtn).toBeEnabled();
  });

  test('selected flight summary is shown on the review panel', async ({
    passengerFormPage,
    reviewBookingPage,
  }) => {
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
    const flightCard = reviewBookingPage.holdPanel.getByRole('region', { name: 'Selected flight' });
    await expect(flightCard).toBeVisible();
  });

});
