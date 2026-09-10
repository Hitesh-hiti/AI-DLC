/**
 * Common API Types
 * Shared types across all API domains
 */

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  hasMore: boolean;
}

/**
 * Standard API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY';

/**
 * Money representation with currency
 */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

/**
 * User/Traveler reference
 */
export interface TravelerRef {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

/**
 * Organization reference
 */
export interface OrganizationRef {
  id: string;
  name: string;
}

/**
 * Booking status values and type
 */
export const BookingStatusValues = {
  HELD: 'HELD',
  PENDING_ISSUE: 'PENDING_ISSUE',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  VOIDED: 'VOIDED',
  REFUNDING: 'REFUNDING',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;
export type BookingStatus = (typeof BookingStatusValues)[keyof typeof BookingStatusValues];

/**
 * Policy outcome values and type
 */
export const PolicyOutcomeValues = {
  ALLOW: 'ALLOW',
  WARN: 'WARN',
  BLOCK: 'BLOCK',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
} as const;
export type PolicyOutcome = (typeof PolicyOutcomeValues)[keyof typeof PolicyOutcomeValues];

/**
 * Approval status values and type
 */
export const ApprovalStatusValues = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
export type ApprovalStatus = (typeof ApprovalStatusValues)[keyof typeof ApprovalStatusValues];

/**
 * Date range filter
 */
export interface DateRange {
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
}

/**
 * Location/Address information
 */
export interface Location {
  city: string;
  country: string;
  state?: string;
  postalCode?: string;
}

/**
 * Audit context - included in most operations
 */
export interface AuditContext {
  userId: string;
  organizationId: string;
  timestamp: string;
  requestId: string;
  source: 'WEB' | 'MOBILE' | 'API' | 'ADMIN';
}
