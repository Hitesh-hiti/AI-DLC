/**
 * SearchPage — Page Object Model
 *
 * Covers: SearchForm + SearchResults components
 * Traceability: REQ-EXP-01, AC-EXP-01-01
 * Test Cases: TC-001, TC-002, TC-003, TC-004
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class SearchPage {
  readonly page: Page;

  // ── Form locators ────────────────────────────────────────────────────────
  readonly form: Locator;
  readonly originInput: Locator;
  readonly destinationInput: Locator;
  readonly departureDateInput: Locator;
  readonly returnDateInput: Locator;
  readonly cabinSelect: Locator;
  readonly passengerCount: Locator;
  readonly addPassengerBtn: Locator;
  readonly removePassengerBtn: Locator;
  readonly searchBtn: Locator;
  readonly clearFormBtn: Locator;

  // ── Results locators ─────────────────────────────────────────────────────
  readonly searchResults: Locator;
  readonly flightList: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form              = page.getByTestId('search-form');
    this.originInput       = page.getByTestId('input-origin');
    this.destinationInput  = page.getByTestId('input-destination');
    this.departureDateInput= page.getByTestId('input-departure');
    this.returnDateInput   = page.getByTestId('input-return');
    this.cabinSelect       = page.getByTestId('select-cabin');
    this.passengerCount    = page.getByTestId('passenger-count');
    this.addPassengerBtn   = page.getByTestId('btn-add-passenger');
    this.removePassengerBtn= page.getByTestId('btn-remove-passenger');
    this.searchBtn         = page.getByTestId('btn-search');
    this.clearFormBtn      = page.getByTestId('btn-clear-form');
    this.searchResults     = page.getByTestId('search-results');
    this.flightList        = page.getByTestId('flight-list');
  }

  /** Navigate to app root */
  async goto() {
    await this.page.goto('/');
    await expect(this.form).toBeVisible();
  }

  /**
   * Fill and submit the search form.
   * departureDate and returnDate must be ISO date strings (YYYY-MM-DD).
   */
  async search({
    origin,
    destination,
    departureDate,
    returnDate,
    cabin = 'ECONOMY',
  }: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    cabin?: string;
  }) {
    await this.originInput.fill(origin);
    await this.destinationInput.fill(destination);
    // Use fill + dispatchEvent to reliably set date inputs across browsers
    await this.departureDateInput.fill(departureDate);
    if (returnDate) {
      await this.returnDateInput.fill(returnDate);
    }
    await this.cabinSelect.selectOption(cabin);
    await this.searchBtn.click();
  }

  /** Wait for results list to be visible */
  async waitForResults() {
    await expect(this.searchResults).toBeVisible({ timeout: 15000 });
    await expect(this.flightList).toBeVisible();
  }

  /** Return all flight cards */
  flightCards() {
    return this.flightList.getByTestId('flight-card');
  }

  /** Return the Select button for a specific offerId */
  selectBtnForOffer(offerId: string) {
    return this.page.getByTestId(`btn-select-flight-${offerId}`);
  }

  /** Click the first available (non-disabled) Select button */
  async selectFirstAvailableFlight() {
    const cards = this.flightList.getByTestId('flight-card');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const btn = cards.nth(i).getByRole('button', { name: 'Select' });
      const disabled = await btn.isDisabled();
      if (!disabled) {
        await btn.click();
        return;
      }
    }
    throw new Error('No available (non-sold-out) flight found in results');
  }

  /** Open fare breakdown for the nth flight card (0-indexed) */
  async openFareBreakdown(cardIndex = 0) {
    const card = this.flightList.getByTestId('flight-card').nth(cardIndex);
    const toggle = card.locator('.price-toggle');
    await toggle.click();
    await expect(card.locator('.fare-breakdown')).toBeVisible();
  }

  /** Return the heading showing results count */
  resultsHeading() {
    return this.searchResults.locator('h2.search-results-title');
  }

  /** Verify a flight card shows the expected origin and destination codes */
  async expectRouteOnCard(cardIndex: number, origin: string, destination: string) {
    const card = this.flightList.getByTestId('flight-card').nth(cardIndex);
    await expect(card.locator('.airport').first()).toHaveText(origin);
    await expect(card.locator('.airport').last()).toHaveText(destination);
  }
}
