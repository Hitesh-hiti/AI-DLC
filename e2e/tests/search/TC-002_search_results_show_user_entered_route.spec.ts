/**
 * TC-002 — Search results display origin and destination from user input
 *
 * Requirement : REQ-EXP-01
 * AC          : AC-EXP-01-01
 * Priority    : P0
 * Type        : Positive / Data Integrity
 *
 * Scenario:
 *   Given the user enters SYD → DXB
 *   When results are returned
 *   Then every flight card shows SYD and DXB, not the hardcoded mock values
 */

import { test, expect } from '../../fixtures/base';
import { ALTERNATIVE_ROUTE_SEARCH } from '../../test-data/search';

test.describe('TC-002 | Search — results reflect user-entered origin/destination', () => {

  test('all flight cards show the origin the user typed', async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search(ALTERNATIVE_ROUTE_SEARCH);
    await searchPage.waitForResults();

    const cards = searchPage.flightCards();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const airports = cards.nth(i).locator('.airport');
      // First airport = departure = user's origin
      await expect(airports.first()).toHaveText(ALTERNATIVE_ROUTE_SEARCH.origin);
    }
  });

  test('all flight cards show the destination the user typed', async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search(ALTERNATIVE_ROUTE_SEARCH);
    await searchPage.waitForResults();

    const cards = searchPage.flightCards();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const airports = cards.nth(i).locator('.airport');
      // Last airport = arrival = user's destination
      await expect(airports.last()).toHaveText(ALTERNATIVE_ROUTE_SEARCH.destination);
    }
  });

  test('no card shows the default mock hardcoded values LHR or JFK when a different route is searched', async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search(ALTERNATIVE_ROUTE_SEARCH);
    await searchPage.waitForResults();

    // Collect all airport text on the page
    const allAirportText = await searchPage.flightList.locator('.airport').allTextContents();
    for (const code of allAirportText) {
      expect(code.trim()).not.toBe('LHR');
      expect(code.trim()).not.toBe('JFK');
    }
  });

});
