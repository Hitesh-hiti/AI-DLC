/**
 * TC-001 — Submit valid flight search and receive results with fare breakdown
 *
 * Requirement : REQ-EXP-01
 * AC          : AC-EXP-01-01
 * Priority    : P0
 * Type        : Positive / Happy Path
 *
 * Scenario:
 *   Given a traveler enters valid LHR→JFK search criteria
 *   When they click Search Flights
 *   Then the results list renders with flight cards containing
 *        airline, cabin badge, route times, and price with currency
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH } from '../../test-data/search';

test.describe('TC-001 | Search — valid flight search returns results with fare', () => {

  test.beforeEach(async ({ searchPage }) => {
    await searchPage.goto();
  });

  test('search form is visible on load', async ({ searchPage }) => {
    await expect(searchPage.form).toBeVisible();
    await expect(searchPage.originInput).toBeVisible();
    await expect(searchPage.destinationInput).toBeVisible();
    await expect(searchPage.departureDateInput).toBeVisible();
    await expect(searchPage.cabinSelect).toBeVisible();
    await expect(searchPage.searchBtn).toBeVisible();
  });

  test('submitting valid search displays a list of flight offers', async ({ searchPage }) => {
    // AC-EXP-01-01: UI sends request and renders returned list of available offers
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    const heading = searchPage.resultsHeading();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Flight');
    await expect(heading).toContainText('Found');

    const cards = searchPage.flightCards();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each flight card shows airline, flight number, and cabin badge', async ({ searchPage }) => {
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    const firstCard = searchPage.flightCards().first();

    // Airline name
    await expect(firstCard.locator('.flight-airline')).toBeVisible();
    // Flight number
    await expect(firstCard.locator('.flight-number')).toBeVisible();
    // Cabin class badge
    await expect(firstCard.locator('.cabin-badge')).toBeVisible();
  });

  test('each flight card shows origin and destination IATA codes', async ({ searchPage }) => {
    // AC-EXP-01-01: offer shows route
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    const firstCard = searchPage.flightCards().first();
    const airports  = firstCard.locator('.airport');
    await expect(airports.first()).toBeVisible();
    await expect(airports.last()).toBeVisible();
  });

  test('each flight card shows a price with currency symbol', async ({ searchPage }) => {
    // AC-EXP-01-01: base fare, taxes, fees, total — all with currency code
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    const firstCard    = searchPage.flightCards().first();
    const priceBlock   = firstCard.locator('.flight-price-block');
    await expect(priceBlock).toBeVisible();
    const priceText = await priceBlock.textContent();
    // Currency symbol or code must be present
    expect(priceText).toMatch(/\$|USD|EUR|GBP/);
  });

  test('Select button is enabled for an available flight', async ({ searchPage }) => {
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();

    const cards = searchPage.flightCards();
    const count = await cards.count();
    let foundAvailable = false;
    for (let i = 0; i < count; i++) {
      const btn = cards.nth(i).getByRole('button', { name: 'Select' });
      if (!(await btn.isDisabled())) {
        foundAvailable = true;
        await expect(btn).toBeEnabled();
        break;
      }
    }
    expect(foundAvailable, 'At least one flight should be available').toBe(true);
  });

});
