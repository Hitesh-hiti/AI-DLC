/**
 * Refund API Types
 * Covers refund workflows (Phase 1 support for future expansion)
 */

import type { Money, AuditContext } from './common';

/**
 * Refund Status Values and Type
 */
export const RefundStatusValues = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PARTIAL: 'PARTIAL',
} as const;
export type RefundStatus = (typeof RefundStatusValues)[keyof typeof RefundStatusValues];

/**
 * Refund request
 */
export interface RefundRequest {
  bookingId: string;
  reason: 'CANCELLATION' | 'POLICY_VIOLATION' | 'BOOKING_ERROR' | 'OTHER';
  amount?: Money;
  audit: AuditContext;
}

/**
 * Refund response
 */
export interface RefundResponse {
  refundId: string;
  bookingId: string;
  amount: Money;
  status: RefundStatus;
  reason: string;
  createdAt: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
}

/**
 * Refund status request
 */
export interface RefundStatusRequest {
  refundId: string;
  audit: AuditContext;
}

/**
 * Refund status response
 */
export interface RefundStatusResponse {
  refund: RefundResponse;
  statusDetails?: string;
  nextSteps?: string[];
}
