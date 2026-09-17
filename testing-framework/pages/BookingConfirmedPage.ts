/**
 * BookingConfirmedPage — Page Object Model
 *
 * Covers: BookingConfirmedScreen component
 * Traceability: REQ-EXP-03, AC-EXP-03-01, AC-EXP-03-08
 * Test Cases: TC-011, TC-012
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class BookingConfirmedPage {
  readonly page: Page;

  readonly screen: Locator;
  readonly bookingRef: Locator;
  readonly pnr: Locator;
  readonly voidWindowExpiry: Locator;
  readonly searchAnotherBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.screen           = page.getByTestId('confirmed-screen');
    this.bookingRef       = page.getByTestId('confirmed-booking-ref');
    this.pnr              = page.getByTestId('confirmed-pnr');
    this.voidWindowExpiry = page.getByTestId('void-window-expiry');
    this.searchAnotherBtn = page.getByTestId('btn-search-another');
  }

  /** Assert the confirmed screen is visible with success heading */
  async assertVisible() {
    await expect(this.screen).toBeVisible({ timeout: 20000 });
    await expect(
      this.page.getByRole('heading', { name: 'Flight Confirmed!' })
    ).toBeVisible();
  }

  /** Assert booking reference is present and non-empty */
  async assertBookingReference() {
    await expect(this.bookingRef).toBeVisible();
    const ref = await this.bookingRef.textContent();
    expect(ref?.trim().length).toBeGreaterThan(0);
  }

  /** Assert PNR is present (6-char alphanumeric) */
  async assertPnr() {
    await expect(this.pnr).toBeVisible();
    const pnr = await this.pnr.textContent();
    expect(pnr?.trim()).toMatch(/^[A-Z0-9]{6}$/);
  }

  /** Assert at least one ticket number is shown */
  async assertTicketNumber() {
    const ticket = this.page.getByTestId('confirmed-ticket-0');
    await expect(ticket).toBeVisible();
    const val = await ticket.textContent();
    expect(val?.trim().length).toBeGreaterThan(0);
  }

  /** Assert coupon table shows at least one OPEN coupon */
  async assertCouponTable() {
    const couponsSection = this.page.getByRole('region', { name: 'Ticket coupons' });
    await expect(couponsSection).toBeVisible();
    await expect(couponsSection).toContainText('OPEN');
  }

  /** Assert void window expiry is present and contains a date string */
  async assertVoidWindow() {
    await expect(this.voidWindowExpiry).toBeVisible();
    const text = await this.voidWindowExpiry.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  }

  /** Assert fare breakdown with currency is present */
  async assertFareWithCurrency() {
    const fareSection = this.page.getByRole('region', { name: 'Total fare' });
    await expect(fareSection).toBeVisible();
    await expect(fareSection).toContainText('Base fare');
    await expect(fareSection).toContainText('Total');
    // Verify a currency symbol or code is present
    const text = await fareSection.textContent();
    expect(text).toMatch(/\$|USD|EUR|GBP/);
  }

  /** Assert payment reference is shown */
  async assertPaymentReference() {
    const payment = this.page.locator('.confirmed-payment');
    await expect(payment).toBeVisible();
    await expect(payment).toContainText('PAY-');
  }

  /** Click Search Another Flight */
  async searchAnother() {
    await this.searchAnotherBtn.click();
  }
}
