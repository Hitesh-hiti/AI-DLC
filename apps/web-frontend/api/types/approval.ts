/**
 * Approval API Types
 * Covers approval workflows (Phase 1 support for future expansion)
 */

import type { ApprovalStatus, Money, AuditContext } from './common';

/**
 * Approval workflow state
 */
export interface ApprovalWorkflow {
  approvalId: string;
  bookingId: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
  decision?: 'APPROVED' | 'REJECTED';
  approverComments?: string;
}

/**
 * Get approval status request
 */
export interface GetApprovalStatusRequest {
  approvalId: string;
  audit: AuditContext;
}

/**
 * Get approval status response
 */
export interface GetApprovalStatusResponse {
  approval: ApprovalWorkflow;
  canRetry: boolean;
  retryDeadline?: string;
}
