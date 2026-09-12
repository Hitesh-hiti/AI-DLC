/**
 * Status Mapping Utilities
 * Maps booking and policy statuses to display information.
 * Aligned with BookingStatusValues in common.ts (flight booking domain).
 */

import type { BookingStatus, PolicyOutcome } from '../api/types/common';
import { BookingStatusValues, PolicyOutcomeValues } from '../api/types/common';

// ─── Display shape ────────────────────────────────────────────────────────────

export interface StatusDisplay {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon: string;
  description: string;
}

// ─── Booking status display ───────────────────────────────────────────────────

export function getBookingStatusDisplay(status: BookingStatus): StatusDisplay {
  switch (status) {
    case BookingStatusValues.DRAFT:
      return { label: 'Draft',               color: 'neutral', icon: 'edit',       description: 'Search criteria entered; no booking created yet' };
    case BookingStatusValues.HELD:
      return { label: 'On Hold',             color: 'info',    icon: 'clock',      description: 'Seat reserved — confirm before hold expires' };
    case BookingStatusValues.PENDING_APPROVAL:
      return { label: 'Pending Approval',    color: 'warning', icon: 'user-check', description: 'Waiting for manager approval before ticketing' };
    case BookingStatusValues.PENDING_ISSUE:
      return { label: 'Ticketing In Progress', color: 'warning', icon: 'loader',   description: 'Ticket number is being issued — check back shortly' };
    case BookingStatusValues.CONFIRMED:
      return { label: 'Confirmed',           color: 'success', icon: 'check',      description: 'Ticket issued and booking confirmed' };
    case BookingStatusValues.COMPLETED:
      return { label: 'Travel Complete',     color: 'success', icon: 'flag',       description: 'Travel has been completed' };
    case BookingStatusValues.CANCELLED:
      return { label: 'Cancelled',           color: 'error',   icon: 'x',          description: 'Booking has been cancelled' };
    case BookingStatusValues.EXPIRED:
      return { label: 'Hold Expired',        color: 'error',   icon: 'clock-off',  description: 'Hold window lapsed without confirmation' };
    case BookingStatusValues.CONFIRM_EXCEPTION:
      return { label: 'Action Required',     color: 'error',   icon: 'alert',      description: 'Ticket issued but confirmation failed — contact support' };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

// ─── Policy outcome display ───────────────────────────────────────────────────

export interface PolicyDisplay {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info';
  icon: string;
  userFriendlyMessage: string;
}

export function getPolicyOutcomeDisplay(outcome: PolicyOutcome): PolicyDisplay {
  switch (outcome) {
    case PolicyOutcomeValues.ALLOW:
      return {
        label: 'Compliant',
        color: 'success',
        icon: 'check-circle',
        userFriendlyMessage: 'This booking is compliant with your organisation\'s travel policy.',
      };
    case PolicyOutcomeValues.WARN:
      return {
        label: 'Warning',
        color: 'warning',
        icon: 'alert-circle',
        userFriendlyMessage: 'This booking triggers a policy warning. You may proceed, but please review the details.',
      };
    case PolicyOutcomeValues.BLOCK:
      return {
        label: 'Blocked',
        color: 'error',
        icon: 'x-circle',
        userFriendlyMessage: 'This booking violates your organisation\'s travel policy and cannot proceed.',
      };
    case PolicyOutcomeValues.REQUIRE_APPROVAL:
      return {
        label: 'Approval Required',
        color: 'warning',
        icon: 'user-check',
        userFriendlyMessage: 'This booking requires manager approval before ticketing.',
      };
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

// ─── Allowed actions ──────────────────────────────────────────────────────────

/** Returns true if the booking can still be cancelled */
export function canCancelBooking(status: BookingStatus): boolean {
  const cancellable: BookingStatus[] = [
    BookingStatusValues.HELD,
    BookingStatusValues.PENDING_APPROVAL,
    BookingStatusValues.PENDING_ISSUE,
    BookingStatusValues.CONFIRMED,
  ];
  return cancellable.includes(status);
}

/** Returns true if the booking can be modified (e.g. passenger details) */
export function canModifyBooking(status: BookingStatus): boolean {
  const modifiable: BookingStatus[] = [
    BookingStatusValues.HELD,
    BookingStatusValues.PENDING_ISSUE,
    BookingStatusValues.CONFIRMED,
  ];
  return modifiable.includes(status);
}

/** Human-readable next actions per status (used in Trip Detail UI) */
export function getNextActionsForBooking(status: BookingStatus): string[] {
  const actions: Record<BookingStatus, string[]> = {
    [BookingStatusValues.DRAFT]:             ['Search Flights'],
    [BookingStatusValues.HELD]:              ['Confirm', 'Cancel'],
    [BookingStatusValues.PENDING_APPROVAL]:  ['Wait for Approval'],
    [BookingStatusValues.PENDING_ISSUE]:     ['Wait', 'Contact Support'],
    [BookingStatusValues.CONFIRMED]:         ['View Ticket', 'Cancel'],
    [BookingStatusValues.COMPLETED]:         ['View Details'],
    [BookingStatusValues.CANCELLED]:         ['Book Again'],
    [BookingStatusValues.EXPIRED]:           ['Search Again'],
    [BookingStatusValues.CONFIRM_EXCEPTION]: ['Contact Support'],
  };
  return actions[status] ?? [];
}

// ─── CSS class helpers ────────────────────────────────────────────────────────

export function getBookingStatusClass(status: BookingStatus): string {
  const base = 'badge-status';
  const map: Record<BookingStatus, string> = {
    [BookingStatusValues.DRAFT]:             `${base} status-neutral`,
    [BookingStatusValues.HELD]:              `${base} status-info`,
    [BookingStatusValues.PENDING_APPROVAL]:  `${base} status-warning`,
    [BookingStatusValues.PENDING_ISSUE]:     `${base} status-warning`,
    [BookingStatusValues.CONFIRMED]:         `${base} status-success`,
    [BookingStatusValues.COMPLETED]:         `${base} status-success`,
    [BookingStatusValues.CANCELLED]:         `${base} status-error`,
    [BookingStatusValues.EXPIRED]:           `${base} status-error`,
    [BookingStatusValues.CONFIRM_EXCEPTION]: `${base} status-error`,
  };
  return map[status] ?? base;
}

export function getPolicyOutcomeClass(outcome: PolicyOutcome): string {
  const base = 'badge-policy';
  const map: Record<PolicyOutcome, string> = {
    [PolicyOutcomeValues.ALLOW]:            `${base} outcome-allow`,
    [PolicyOutcomeValues.WARN]:             `${base} outcome-warn`,
    [PolicyOutcomeValues.BLOCK]:            `${base} outcome-block`,
    [PolicyOutcomeValues.REQUIRE_APPROVAL]: `${base} outcome-approval`,
  };
  return map[outcome] ?? base;
}
