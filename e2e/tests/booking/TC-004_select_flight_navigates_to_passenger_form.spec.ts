/**
 * TC-004 — Selecting a flight navigates to the passenger form
 *
 * Requirement : REQ-EXP-02
 * AC          : AC-EXP-02-01
 * Priority    : P0
 * Type        : Positive / Navigation
 *
 * Scenario:
 *   Given results are displayed
 *   When the traveler clicks Select on an available flight
 *   Then the passenger details form (step 2) is shown
 *   And the search results are no longer visible
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH } from '../../test-data/search';

test.describe('TC-004 | Booking — selecting a flight opens passenger form', () => {

  test('clicking Select on an available flight shows the passenger form', async ({
    searchPage,
    passengerFormPage,
  }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    await searchPage.selectFirstAvailableFlight();

    // Passenger form (step 2) must be visible
    await passengerFormPage.assertVisible();
  });

  test('search results are hidden after a flight is selected', async ({
    searchPage,
    passengerFormPage,
  }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();

    // Results list must be gone
    await expect(searchPage.searchResults).not.toBeVisible();
  });

  test('passenger form contains First Name, Last Name fields for passenger 1', async ({
    searchPage,
    passengerFormPage,
  }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();

    await expect(passengerFormPage.firstNameInput(0)).toBeVisible();
    await expect(passengerFormPage.lastNameInput(0)).toBeVisible();
  });

  test('Review Booking button is visible on the passenger form', async ({
    searchPage,
    passengerFormPage,
  }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();

    await expect(passengerFormPage.reviewBookingBtn).toBeVisible();
  });

  test('Back to Results button navigates back to results', async ({
    searchPage,
    passengerFormPage,
  }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
    await searchPage.selectFirstAvailableFlight();
    await passengerFormPage.assertVisible();

    await passengerFormPage.backToResultsBtn.click();
    await expect(searchPage.searchResults).toBeVisible();
  });

});
