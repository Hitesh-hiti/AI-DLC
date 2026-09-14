/**
 * ApprovalPendingPage — Page Object Model
 *
 * Covers: ApprovalPendingScreen component
 * Traceability: REQ-EXP-02, REQ-EXP-07, AC-EXP-02-05, AC-EXP-07-05
 * Test Cases: TC-010
 */

import { type Page, type Locator, expect } from '@playwright/test';

export class ApprovalPendingPage {
  readonly page: Page;

  readonly screen: Locator;
  readonly bookingRef: Locator;
  readonly statusBadge: Locator;
  readonly approverName: Locator;
  readonly blockedNotice: Locator;
  readonly backToSearchBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.screen         = page.getByTestId('approval-pending-screen');
    this.bookingRef     = page.getByTestId('approval-booking-ref');
    this.statusBadge    = page.getByTestId('approval-status-badge');
    this.approverName   = page.getByTestId('approval-approver-name');
    this.blockedNotice  = page.getByTestId('approval-blocked-notice');
    this.backToSearchBtn= page.getByTestId('btn-back-to-search-approval');
  }

  /** Assert the approval pending screen is visible */
  async assertVisible() {
    await expect(this.screen).toBeVisible({ timeout: 20000 });
    await expect(
      this.page.getByRole('heading', { name: 'Booking Submitted for Approval' })
    ).toBeVisible();
  }

  /** Assert booking reference is non-empty (AC-EXP-02-01) */
  async assertBookingReference() {
    await expect(this.bookingRef).toBeVisible();
    const ref = await this.bookingRef.textContent();
    expect(ref?.trim().length).toBeGreaterThan(0);
  }

  /** Assert status badge shows "Pending Approval" (AC-EXP-07-05) */
  async assertStatusBadge() {
    await expect(this.statusBadge).toBeVisible();
    await expect(this.statusBadge).toContainText('Pending Approval');
  }

  /** Assert approver name is shown (AC-EXP-07-05) */
  async assertApproverName() {
    await expect(this.approverName).toBeVisible();
    const name = await this.approverName.textContent();
    expect(name?.trim().length).toBeGreaterThan(0);
  }

  /** Assert the approval expiry date/time is shown (AC-EXP-07-05) */
  async assertApprovalExpiry() {
    // The expiry is in a row labelled "Decision Deadline"
    const row = this.screen.locator('.approval-detail-row')
      .filter({ hasText: 'Decision Deadline' });
    await expect(row).toBeVisible();
    const expiry = row.locator('.approval-expiry');
    await expect(expiry).toBeVisible();
    const text = await expiry.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  }

  /** Assert the confirm-blocked notice is present (AC-EXP-02-05) */
  async assertConfirmBlocked() {
    await expect(this.blockedNotice).toBeVisible();
    await expect(this.blockedNotice).toContainText('blocked until your manager approves');
  }

  /** Assert no Confirm Booking button is present anywhere (AC-EXP-02-05) */
  async assertNoConfirmButton() {
    await expect(
      this.page.getByTestId('btn-confirm-booking')
    ).not.toBeVisible();
  }

  /** Click Back to Search */
  async backToSearch() {
    await this.backToSearchBtn.click();
  }
}
