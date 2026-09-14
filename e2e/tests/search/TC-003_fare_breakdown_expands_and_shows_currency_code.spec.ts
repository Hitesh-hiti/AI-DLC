/**
 * TC-003 — Expandable fare breakdown shows itemised amounts with currency
 *
 * Requirement : REQ-EXP-01
 * AC          : AC-EXP-01-01
 * Priority    : P1
 * Type        : Positive / UI Interaction
 *
 * Scenario:
 *   Given results are displayed
 *   When the traveler clicks the price toggle on the first card
 *   Then a breakdown with base fare, taxes, fees, total, and currency note appears
 *   And clicking again collapses it
 */

import { test, expect } from '../../fixtures/base';
import { STANDARD_SEARCH } from '../../test-data/search';

test.describe('TC-003 | Search — fare breakdown toggle', () => {

  test.beforeEach(async ({ searchPage }) => {
    await searchPage.goto();
    await searchPage.search(STANDARD_SEARCH);
    await searchPage.waitForResults();
  });

  test('price toggle button is visible on each flight card', async ({ searchPage }) => {
    const firstCard = searchPage.flightCards().first();
    await expect(firstCard.locator('.price-toggle')).toBeVisible();
  });

  test('clicking price toggle expands fare breakdown with all rows', async ({ searchPage }) => {
    // AC-EXP-01-01: base fare, taxes, fees, total with currency code
    const firstCard = searchPage.flightCards().first();
    const toggle    = firstCard.locator('.price-toggle');

    await toggle.click();

    const breakdown = firstCard.locator('.fare-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText('Base fare');
    await expect(breakdown).toContainText('Taxes');
    await expect(breakdown).toContainText('Fees');
    await expect(breakdown).toContainText('Total');
  });

  test('fare breakdown shows a currency code', async ({ searchPage }) => {
    const firstCard = searchPage.flightCards().first();
    await firstCard.locator('.price-toggle').click();

    const breakdown = firstCard.locator('.fare-breakdown');
    const text      = await breakdown.textContent();
    // Must contain either a currency symbol or ISO code
    expect(text).toMatch(/\$|USD|EUR|GBP|Currency:/);
  });

  test('clicking toggle again collapses the fare breakdown', async ({ searchPage }) => {
    const firstCard = searchPage.flightCards().first();
    const toggle    = firstCard.locator('.price-toggle');

    // Open
    await toggle.click();
    await expect(firstCard.locator('.fare-breakdown')).toBeVisible();

    // Close
    await toggle.click();
    await expect(firstCard.locator('.fare-breakdown')).not.toBeVisible();
  });

  test('aria-expanded attribute reflects open/closed state', async ({ searchPage }) => {
    const firstCard = searchPage.flightCards().first();
    const toggle    = firstCard.locator('.price-toggle');

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

});
