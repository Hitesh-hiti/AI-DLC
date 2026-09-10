/**
 * Status Mapping Utilities
 * Maps internal statuses to display information
 */

import type { BookingStatus, PolicyOutcome } from '../api/types/common';
import { BookingStatusValues, PolicyOutcomeValues } from '../api/types/common';

/**
 * Booking status display information
 */
export interface StatusDisplay {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  icon: string;
  description: string;
}

/**
 * Get booking status display info
 */
export function getBookingStatusDisplay(status: BookingStatus): StatusDisplay {
  switch (status) {
    case BookingStatusValues.HELD:
      return {
        label: 'On Hold',
        color: 'info',
        icon: 'clock',
        description: 'Booking is temporarily held',
      };
    case BookingStatusValues.PENDING_ISSUE:
      return {
        label: 'Pending Resolution',
        color: 'warning',
        icon: 'alert',
        description: 'Booking has an issue that needs attention',
      };
    case BookingStatusValues.CONFIRMED:
      return {
        label: 'Confirmed',
        color: 'success',
        icon: 'check',
        description: 'Booking is confirmed',
      };
    case BookingStatusValues.CANCELLED:
      return {
        label: 'Cancelled',
        color: 'error',
        icon: 'x',
        description: 'Booking has been cancelled',
      };
    case BookingStatusValues.VOIDED:
      return {
        label: 'Voided',
        color: 'neutral',
        icon: 'x',
        description: 'Booking has been voided',
      };
    case BookingStatusValues.REFUNDING:
      return {
        label: 'Processing Refund',
        color: 'info',
        icon: 'undo',
        description: 'Refund is being processed',
      };
    case BookingStatusValues.REFUNDED:
      return {
        label: 'Refunded',
        color: 'success',
        icon: 'check',
        description: 'Refund has been processed',
      };
    case BookingStatusValues.FAILED:
      return {
        label: 'Failed',
        color: 'error',
        icon: 'x',
        description: 'Booking failed',
      };
    default:
      const exhaustive: never = status;
      return exhaustive;
  }
}

/**
 * Get policy outcome display info
 */
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
        userFriendlyMessage: 'This booking is compliant with your organization policy.',
      };
    case PolicyOutcomeValues.WARN:
      return {
        label: 'Warning',
        color: 'warning',
        icon: 'alert-circle',
        userFriendlyMessage:
          'This booking triggers a policy warning. You may proceed, but review the details.',
      };
    case PolicyOutcomeValues.BLOCK:
      return {
        label: 'Blocked',
        color: 'error',
        icon: 'x-circle',
        userFriendlyMessage:
          'This booking violates your organization policy and cannot be completed.',
      };
    case PolicyOutcomeValues.REQUIRE_APPROVAL:
      return {
        label: 'Approval Required',
        color: 'warning',
        icon: 'user-check',
        userFriendlyMessage:
          'This booking requires manager approval before it can be confirmed.',
      };
    default:
      const exhaustive: never = outcome;
      return exhaustive;
  }
}

/**
 * Check if booking can be cancelled
 */
export function canCancelBooking(status: BookingStatus): boolean {
  const cancellableStatuses: BookingStatus[] = [
    BookingStatusValues.HELD,
    BookingStatusValues.PENDING_ISSUE,
    BookingStatusValues.CONFIRMED,
  ];
  return cancellableStatuses.includes(status);
}

/**
 * Check if booking can be modified
 */
export function canModifyBooking(status: BookingStatus): boolean {
  const modifiableStatuses: BookingStatus[] = [
    BookingStatusValues.HELD,
    BookingStatusValues.CONFIRMED,
    BookingStatusValues.PENDING_ISSUE,
  ];
  return modifiableStatuses.includes(status);
}

/**
 * Get next possible actions for booking status
 */
export function getNextActionsForBooking(status: BookingStatus): string[] {
  const actions: Record<BookingStatus, string[]> = {
    [BookingStatusValues.HELD]: ['Confirm', 'Cancel'],
    [BookingStatusValues.PENDING_ISSUE]: ['Resolve Issue', 'Cancel'],
    [BookingStatusValues.CONFIRMED]: ['Modify', 'Cancel', 'View Details'],
    [BookingStatusValues.CANCELLED]: ['Book Again'],
    [BookingStatusValues.VOIDED]: ['Book Again'],
    [BookingStatusValues.REFUNDING]: ['View Status'],
    [BookingStatusValues.REFUNDED]: ['Book Again'],
    [BookingStatusValues.FAILED]: ['Retry', 'Support'],
  };
  return actions[status] || [];
}

/**
 * Get CSS class for booking status
 */
export function getBookingStatusClass(status: BookingStatus): string {
  const baseClass = 'badge-status';
  const statusMap: Record<BookingStatus, string> = {
    [BookingStatusValues.HELD]: `${baseClass} status-info`,
    [BookingStatusValues.PENDING_ISSUE]: `${baseClass} status-warning`,
    [BookingStatusValues.CONFIRMED]: `${baseClass} status-success`,
    [BookingStatusValues.CANCELLED]: `${baseClass} status-error`,
    [BookingStatusValues.VOIDED]: `${baseClass} status-neutral`,
    [BookingStatusValues.REFUNDING]: `${baseClass} status-info`,
    [BookingStatusValues.REFUNDED]: `${baseClass} status-success`,
    [BookingStatusValues.FAILED]: `${baseClass} status-error`,
  };
  return statusMap[status] || `${baseClass}`;
}

/**
 * Get CSS class for policy outcome
 */
export function getPolicyOutcomeClass(outcome: PolicyOutcome): string {
  const baseClass = 'badge-policy';
  const outcomeMap: Record<PolicyOutcome, string> = {
    [PolicyOutcomeValues.ALLOW]: `${baseClass} outcome-allow`,
    [PolicyOutcomeValues.WARN]: `${baseClass} outcome-warn`,
    [PolicyOutcomeValues.BLOCK]: `${baseClass} outcome-block`,
    [PolicyOutcomeValues.REQUIRE_APPROVAL]: `${baseClass} outcome-approval`,
  };
  return outcomeMap[outcome] || `${baseClass}`;
}
