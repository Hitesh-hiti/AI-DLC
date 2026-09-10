/**
 * Policy API Types
 * Covers policy evaluation and compliance (AC-POL)
 */

import type { PolicyOutcome, Money, AuditContext } from './common';

/**
 * Policy evaluation request (AC-POL-01-05, AC-POL-01-06)
 * Sent during booking hold to evaluate organizational policies
 */
export interface PolicyEvaluationRequest {
  organizationId: string;
  propertyId: string;
  destination: {
    city: string;
    country: string;
  };
  checkIn: string; // ISO 8601
  checkOut: string; // ISO 8601
  totalPrice: Money;
  travelerId: string;
  travelerDepartment?: string;
  purpose?: 'BUSINESS' | 'PERSONAL' | 'BLENDED';
  audit: AuditContext;
}

/**
 * Policy evaluation response
 */
export interface PolicyEvaluationResponse {
  evaluationId: string;
  outcome: PolicyOutcome;
  timestamp: string;
  policies: PolicyResult[];
  requiresApproval: boolean;
  approvalDetails?: {
    approverIds: string[];
    deadline: string;
    reason: string;
  };
  warnings?: PolicyWarning[];
  messages?: string[];
}

/**
 * Individual policy evaluation result
 */
export interface PolicyResult {
  policyId: string;
  policyName: string;
  outcome: PolicyOutcome;
  details: string;
  threshold?: Money;
  actualValue?: Money | string;
  isBreached?: boolean;
}

/**
 * Policy warning message
 */
export interface PolicyWarning {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  field?: string;
}

/**
 * Approval request (AC-POL-04-03)
 * Created when policy evaluation requires approval
 */
export interface ApprovalRequest {
  approvalId: string;
  bookingId?: string;
  organizationId: string;
  travelerId: string;
  requestReason: string;
  details: {
    propertyName: string;
    destination: string;
    checkIn: string;
    checkOut: string;
    totalPrice: Money;
    policyViolations: PolicyResult[];
  };
  assignedTo: string[];
  deadline: string; // ISO 8601
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  respondedAt?: string;
  responseComments?: string;
}

/**
 * Approval decision request
 */
export interface ApprovalDecisionRequest {
  approvalId: string;
  decision: 'APPROVED' | 'REJECTED';
  comments?: string;
  approverUserId: string;
  audit: AuditContext;
}

/**
 * Approval decision response
 */
export interface ApprovalDecisionResponse {
  approvalId: string;
  decision: 'APPROVED' | 'REJECTED';
  decidedAt: string;
  decidedBy: string;
  comments?: string;
  nextSteps?: string[];
}

/**
 * Policy for display to user (AC-POL-01-06)
 * Shown in UI to explain policy outcomes
 */
export interface DisplayPolicy {
  name: string;
  description: string;
  outcome: PolicyOutcome;
  message: string;
  actionRequired?: 'NONE' | 'CONTACT_APPROVER' | 'MODIFY_BOOKING';
  contactInfo?: {
    approverName: string;
    approverEmail: string;
    deadline?: string;
  };
}

/**
 * Policy history (for audit trail)
 */
export interface PolicyEvaluationHistory {
  evaluationId: string;
  bookingId?: string;
  organizationId: string;
  timestamp: string;
  outcome: PolicyOutcome;
  evaluatedBy: string;
  policySetVersion: string;
}

/**
 * Organization policy configuration (backend reference only)
 */
export interface OrganizationPolicies {
  organizationId: string;
  policies: {
    maxDailyRate?: Money;
    maxTotalTripCost?: Money;
    approvalRequiredAbove?: Money;
    blockedDestinations?: string[];
    requiresBusinessJustification?: boolean;
    advanceBookingDays?: number;
  };
}
