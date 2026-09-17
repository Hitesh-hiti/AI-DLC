/**
 * Base Playwright Fixture
 * Extends the default `test` with typed Page Object instances.
 * All specs import `test` and `expect` from this file — never from @playwright/test directly.
 *
 * Traceability: All TCs (TC-001 → TC-015)
 */

import { test as base, expect } from '@playwright/test';
import { SearchPage }         from '../pages/SearchPage';
import { PassengerFormPage }  from '../pages/PassengerFormPage';
import { ReviewBookingPage }  from '../pages/ReviewBookingPage';
import { BookingConfirmedPage } from '../pages/BookingConfirmedPage';
import { ApprovalPendingPage } from '../pages/ApprovalPendingPage';

export type TravelPlatformFixtures = {
  searchPage:         SearchPage;
  passengerFormPage:  PassengerFormPage;
  reviewBookingPage:  ReviewBookingPage;
  confirmedPage:      BookingConfirmedPage;
  approvalPendingPage: ApprovalPendingPage;
};

export const test = base.extend<TravelPlatformFixtures>({
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  passengerFormPage: async ({ page }, use) => {
    await use(new PassengerFormPage(page));
  },
  reviewBookingPage: async ({ page }, use) => {
    await use(new ReviewBookingPage(page));
  },
  confirmedPage: async ({ page }, use) => {
    await use(new BookingConfirmedPage(page));
  },
  approvalPendingPage: async ({ page }, use) => {
    await use(new ApprovalPendingPage(page));
  },
});

export { expect };
