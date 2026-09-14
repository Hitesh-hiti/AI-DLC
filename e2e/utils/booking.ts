/**
 * Booking flow helpers — shared across multiple specs.
 * Executes the common steps: navigate → search → select → fill passenger.
 *
 * Traceability: TC-005, TC-006, TC-007, TC-008, TC-010, TC-011, TC-012
 */

import type { Page }            from '@playwright/test';
import { SearchPage }           from '../pages/SearchPage';
import { PassengerFormPage }    from '../pages/PassengerFormPage';
import { ReviewBookingPage }    from '../pages/ReviewBookingPage';
import { STANDARD_SEARCH, PASSENGER_JOHN } from '../test-data/search';

/**
 * Executes the full flow up to and including the Review & Confirm panel.
 * Precondition: VITE_MOCK_POLICY must already be set in the server env.
 */
export async function navigateToReviewPanel(page: Page): Promise<void> {
  const searchPage        = new SearchPage(page);
  const passengerFormPage = new PassengerFormPage(page);

  // Step 1 — open app
  await searchPage.goto();

  // Step 2 — search
  await searchPage.search(STANDARD_SEARCH);
  await searchPage.waitForResults();

  // Step 3 — select first available flight
  await searchPage.selectFirstAvailableFlight();

  // Step 4 — fill passenger and advance to review
  await passengerFormPage.assertVisible();
  await passengerFormPage.submitPassengers([PASSENGER_JOHN]);

  // Step 5 — review panel appears (policy is evaluated)
  const reviewPage = new ReviewBookingPage(page);
  await reviewPage.assertVisible();
}
