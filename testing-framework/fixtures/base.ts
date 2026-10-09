/**
 * Base Playwright Fixture
 * Extends the default `test` with typed Page Object instances and Allure context.
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
import { saveIstanbulCoverage } from '../utils/istanbulCoverage';
import { healer } from '../utils/healer';

export type TravelPlatformFixtures = {
  _istanbulCoverage: void;
  searchPage:         SearchPage;
  passengerFormPage:  PassengerFormPage;
  reviewBookingPage:  ReviewBookingPage;
  confirmedPage:      BookingConfirmedPage;
  approvalPendingPage: ApprovalPendingPage;
};

export const test = base.extend<TravelPlatformFixtures>({
  page: async ({ page }, use, testInfo) => {
    const healedPage = healer.wrapPage(page, testInfo);
    await use(healedPage);
  },
  _istanbulCoverage: [async ({ page }, use, testInfo) => {
    await use();
    await saveIstanbulCoverage(page, `${testInfo.testId}-${testInfo.retry}`);
  }, { auto: true }],
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
