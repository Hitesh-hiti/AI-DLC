/**
 * Canonical Error Codes
 * 
 * RFC 7807 problem+json error codes used across the platform.
 * Matches be_acceptance_criteria.md error specifications.
 */

export const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  IDEMPOTENCY_KEY_MISSING: 'IDEMPOTENCY_KEY_MISSING',

  // Authentication errors (401)
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',

  // Authorization errors (403)
  AUTHORIZATION_DENIED: 'AUTHORIZATION_DENIED',

  // Not found errors (404)
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict errors (409)
  BOOKING_STATE_INVALID: 'BOOKING_STATE_INVALID',
  CONFIRM_EXCEPTION: 'CONFIRM_EXCEPTION',
  SUPPLIER_OUTCOME_UNKNOWN: 'SUPPLIER_OUTCOME_UNKNOWN',
  CONFLICT_DUPLICATE: 'CONFLICT_DUPLICATE',

  // Business logic errors (422)
  POLICY_BLOCKED: 'POLICY_BLOCKED',
  INVARIANT_VIOLATED: 'INVARIANT_VIOLATED',
  REFUND_NOT_ELIGIBLE: 'REFUND_NOT_ELIGIBLE',
  VOID_WINDOW_EXPIRED: 'VOID_WINDOW_EXPIRED',

  // GDS errors (502, 503)
  GDS_HOLD_FAILED: 'GDS_HOLD_FAILED',
  GDS_TIMEOUT: 'GDS_TIMEOUT',
  GDS_UNAVAILABLE: 'GDS_UNAVAILABLE',
  GDS_RESPONSE_INVALID: 'GDS_RESPONSE_INVALID',
  GDS_CAPABILITY_UNSUPPORTED: 'GDS_CAPABILITY_UNSUPPORTED',

  // Downstream errors (503)
  DOWNSTREAM_UNAVAILABLE: 'DOWNSTREAM_UNAVAILABLE',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

export const ErrorMessages = {
  [ErrorCodes.VALIDATION_ERROR]: 'Validation error: missing or invalid required field',
  [ErrorCodes.IDEMPOTENCY_KEY_MISSING]: 'Idempotency-Key header is required for mutating requests',
  [ErrorCodes.AUTHENTICATION_FAILED]: 'Missing or invalid authentication token',
  [ErrorCodes.AUTHORIZATION_DENIED]: 'User does not have permission for this operation',
  [ErrorCodes.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCodes.BOOKING_STATE_INVALID]: 'Cannot perform operation on booking in this state',
  [ErrorCodes.POLICY_BLOCKED]: 'Booking blocked by policy',
  [ErrorCodes.INVARIANT_VIOLATED]: 'Data invariant violation',
  [ErrorCodes.GDS_UNAVAILABLE]: 'GDS service is unavailable',
  [ErrorCodes.DOWNSTREAM_UNAVAILABLE]: 'Downstream service did not respond within SLO',
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error'
};

/**
 * RFC 7807 problem+json structure
 */
export interface ProblemJson {
  type: string;
  title: string;
  status: number;
  error_code: string;
  detail: string;
  correlation_id: string;
  instance?: string;
}
