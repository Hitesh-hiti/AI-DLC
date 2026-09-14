/**
 * PassengerFormPage — Page Object Model
 *
 * Covers: PassengerForm component (step 2 of booking flow)
 * Traceability: REQ-EXP-02, AC-EXP-02-01
 * Test Cases: TC-004, TC-005
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class PassengerFormPage {
  readonly page: Page;

  readonly form: Locator;
  readonly reviewBookingBtn: Locator;
  readonly backToResultsBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form             = page.getByTestId('passenger-form');
    this.reviewBookingBtn = page.getByTestId('btn-review-booking');
    this.backToResultsBtn = page.getByTestId('btn-back-to-results');
  }

  /** Assert the passenger form is visible */
  async assertVisible() {
    await expect(this.form).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByRole('heading', { name: 'Passenger Details' })).toBeVisible();
  }

  /** Locator for the first name input of passenger at index (0-based) */
  firstNameInput(passengerIndex: number) {
    return this.page.getByTestId(`pax-${passengerIndex}-first-name`);
  }

  /** Locator for the last name input of passenger at index (0-based) */
  lastNameInput(passengerIndex: number) {
    return this.page.getByTestId(`pax-${passengerIndex}-last-name`);
  }

  /**
   * Fill in a single passenger's details.
   * Names are auto-uppercased by the component — pass any case.
   */
  async fillPassenger(index: number, firstName: string, lastName: string) {
    await this.firstNameInput(index).fill(firstName);
    await this.lastNameInput(index).fill(lastName);
  }

  /** Fill all passengers and click Review Booking */
  async submitPassengers(passengers: Array<{ firstName: string; lastName: string }>) {
    for (let i = 0; i < passengers.length; i++) {
      await this.fillPassenger(i, passengers[i].firstName, passengers[i].lastName);
    }
    await this.reviewBookingBtn.click();
  }
}
