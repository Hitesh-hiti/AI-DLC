/**
 * Policy API Types
 * Covers flight policy evaluation and compliance (AC-POL-01-05, AC-POL-01-06, AC-POL-03-05, AC-POL-04-03)
 */

import type { PolicyOutcome, Money, AuditContext } from './common';

// ─── Evaluation request ───────────────────────────────────────────────────────

/**
 * Policy evaluation request
 * Sent during flight booking hold to check organisational travel policy
 */
export interface PolicyEvaluationRequest {
  organizationId: string;
  travelerId: string;
  travelerDepartment?: string;

  /** The flight offer being evaluated */
  offerId: string;

  flight: {
    origin: string;        // IATA code e.g. "LHR"
    destination: string;   // IATA code e.g. "JFK"
    departureDate: string; // ISO 8601
    returnDate?: string;   // ISO 8601 (round-trip)
    cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    airline: string;
    nonStop: boolean;
    advanceBookingDays: number; // days between booking date and departure
  };

  totalFare: Money;

  purpose?: 'BUSINESS' | 'PERSONAL' | 'BLENDED';

  audit: AuditContext;
}

// ─── Evaluation response ──────────────────────────────────────────────────────

/**
 * Policy evaluation response (AC-POL-01-05, AC-POL-01-06)
 */
export interface PolicyEvaluationResponse {
  evaluationId: string;
  outcome: PolicyOutcome;
  timestamp: string;

  policies: PolicyResult[];

  requiresApproval: boolean;
  approvalDetails?: {
    approverIds: string[];
    deadline: string; // ISO 8601
    reason: string;
  };

  warnings?: PolicyWarning[];
  messages?: string[];
}

/**
 * Result for one evaluated policy rule
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
 * Policy warning message (shown in UI per AC-POL-01-06)
 */
export interface PolicyWarning {
  code: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  field?: string;
}

// ─── Approval ─────────────────────────────────────────────────────────────────

/**
 * Approval request — created when outcome is REQUIRE_APPROVAL (AC-POL-04-03)
 */
export interface ApprovalRequest {
  approvalId: string;
  bookingId?: string;

  organizationId: string;
  travelerId: string;

  requestReason: string;

  flightSummary: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    airline: string;
    cabinClass: string;
    totalFare: Money;
  };

  policyViolations: PolicyResult[];

  assignedTo: string[]; // approver user IDs
  deadline: string;     // ISO 8601

  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

  createdAt: string;
  respondedAt?: string;
  responseComments?: string;
}

/**
 * Approval decision request (approver submits this)
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

// ─── UI display ───────────────────────────────────────────────────────────────

/**
 * Policy outcome rendered in the UI (AC-POL-01-06)
 * Maps from PolicyEvaluationResponse to human-readable panel content
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

// ─── History / audit ──────────────────────────────────────────────────────────

/**
 * Policy evaluation audit record
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

// ─── Organisation policy configuration ───────────────────────────────────────

/**
 * Organisation flight policy rules (backend reference — not used directly in FE UI)
 */
export interface OrganizationPolicies {
  organizationId: string;
  policies: {
    /** Maximum permitted one-way fare */
    maxFare?: Money;
    /** Maximum total trip cost (all segments) */
    maxTotalTripCost?: Money;
    /** Fares above this amount require manager approval */
    approvalRequiredAbove?: Money;
    /** IATA country codes that are blocked for travel */
    blockedDestinations?: string[];
    /** Minimum days in advance a booking must be made */
    advanceBookingDays?: number;
    /** Permitted cabin classes */
    allowedCabinClasses?: Array<'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'>;
    /** Whether non-stop flights are required where available */
    nonStopRequired?: boolean;
    /** Whether a business justification is mandatory */
    requiresBusinessJustification?: boolean;
  };
}
