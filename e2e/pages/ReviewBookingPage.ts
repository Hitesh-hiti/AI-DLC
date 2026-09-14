/**
 * ReviewBookingPage — Page Object Model
 *
 * Covers: BookingHoldPanel + PolicyOutcomePanel (step 3 of booking flow)
 * Traceability: REQ-EXP-02, REQ-POL-01, REQ-POL-04
 * Test Cases: TC-005, TC-006, TC-007, TC-008, TC-009
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ReviewBookingPage {
  readonly page: Page;

  readonly holdPanel: Locator;
  readonly confirmBookingBtn: Locator;
  readonly editPassengersBtn: Locator;

  // Policy panels
  readonly policyAllow: Locator;
  readonly policyWarn: Locator;
  readonly policyBlock: Locator;
  readonly acknowledgeWarningBtn: Locator;
  readonly warnAcknowledgedMsg: Locator;
  readonly returnToSearchBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.holdPanel          = page.getByTestId('hold-panel');
    this.confirmBookingBtn  = page.getByTestId('btn-confirm-booking');
    this.editPassengersBtn  = page.getByRole('button', { name: '← Edit Passengers' });

    this.policyAllow        = page.getByTestId('policy-panel-allow');
    this.policyWarn         = page.getByTestId('policy-panel-warn');
    this.policyBlock        = page.getByTestId('policy-panel-block');
    this.acknowledgeWarningBtn = page.getByTestId('btn-acknowledge-warning');
    this.warnAcknowledgedMsg   = page.getByTestId('policy-warn-acknowledged');
    this.returnToSearchBtn  = page.getByTestId('btn-return-to-search');
  }

  /** Assert the review panel is visible */
  async assertVisible() {
    await expect(this.holdPanel).toBeVisible({ timeout: 15000 });
    await expect(
      this.page.getByRole('heading', { name: 'Review & Confirm Flight' })
    ).toBeVisible();
  }

  /** Assert the ALLOW policy panel is shown */
  async assertPolicyAllow() {
    await expect(this.policyAllow).toBeVisible();
    await expect(this.policyAllow).toContainText('Policy Check Passed');
  }

  /** Assert the WARN policy panel is shown, then acknowledge it */
  async assertPolicyWarnAndAcknowledge() {
    await expect(this.policyWarn).toBeVisible();
    await expect(this.policyWarn).toContainText('Policy Warning');
    await expect(this.acknowledgeWarningBtn).toBeVisible();
    await this.acknowledgeWarningBtn.click();
    await expect(this.warnAcknowledgedMsg).toBeVisible();
    await expect(this.warnAcknowledgedMsg).toContainText('Warning acknowledged');
  }

  /** Assert the BLOCK panel is shown and Confirm Booking is absent */
  async assertPolicyBlock() {
    await expect(this.policyBlock).toBeVisible();
    await expect(this.policyBlock).toContainText('Booking Blocked by Policy');
    await expect(this.returnToSearchBtn).toBeVisible();
    await expect(this.confirmBookingBtn).not.toBeVisible();
  }

  /** Click Confirm Booking */
  async confirmBooking() {
    await expect(this.confirmBookingBtn).toBeEnabled();
    await this.confirmBookingBtn.click();
  }

  /** Assert fare breakdown section is visible with all rows */
  async assertFareBreakdown() {
    const fareSection = this.holdPanel.getByRole('region', { name: 'Fare breakdown' });
    await expect(fareSection).toBeVisible();
    await expect(fareSection).toContainText('Base fare');
    await expect(fareSection).toContainText('Taxes');
    await expect(fareSection).toContainText('Fees');
    await expect(fareSection).toContainText('Total');
  }

  /** Assert the passengers section lists the given passenger name */
  async assertPassengerListed(firstName: string, lastName: string) {
    const passengersSection = this.holdPanel.getByRole('region', { name: 'Passengers' });
    await expect(passengersSection).toContainText(`${firstName} ${lastName}`);
  }
}
