/**
 * TC-009 — BLOCK panel "Return to Search" button resets to search form
 *
 * Requirement : REQ-POL-04
 * AC          : AC-POL-04-03
 * Priority    : P1
 * Type        : Positive / Navigation
 *
 * Precondition: VITE_MOCK_POLICY=BLOCK
 *
 * Scenario:
 *   Given the BLOCK panel is displayed
 *   When the traveler clicks "← Return to Search"
 *   Then the search form is shown again in its empty/reset state
 *   And no booking details are visible
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH, PASSENGER_JOHN } from '../../test-data/search';

test.describe('TC-009 | Policy BLOCK — Return to Search resets to search form', () => {

  test.beforeEach(async ({ searchPage, passengerFormPage, reviewBookingPage }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();
    await passengerFormPage.submitPassengers([PASSENGER_JOHN]);
    await reviewBookingPage.assertVisible();
  });

  test('clicking Return to Search shows the search form', async ({
    reviewBookingPage,
    searchPage,
  }) => {
    await reviewBookingPage.returnToSearchBtn.click();
    await expect(searchPage.form).toBeVisible({ timeout: 10000 });
  });

  test('search form fields are empty after reset', async ({
    reviewBookingPage,
    searchPage,
  }) => {
    await reviewBookingPage.returnToSearchBtn.click();
    await expect(searchPage.form).toBeVisible({ timeout: 10000 });
    // Origin and destination should be empty
    await expect(searchPage.originInput).toHaveValue('');
    await expect(searchPage.destinationInput).toHaveValue('');
  });

  test('review panel is no longer visible after returning to search', async ({
    reviewBookingPage,
  }) => {
    await reviewBookingPage.returnToSearchBtn.click();
    await expect(reviewBookingPage.holdPanel).not.toBeVisible({ timeout: 10000 });
  });

  test('no booking confirmation details are shown after returning to search', async ({
    reviewBookingPage,
    confirmedPage,
  }) => {
    await reviewBookingPage.returnToSearchBtn.click();
    await expect(confirmedPage.screen).not.toBeVisible();
  });

});
