/**
 * Error Types and Mappers
 * Standardizes error handling across API calls
 */

import type { ApiError } from './common';

/**
 * Frontend-facing error with user-friendly message
 */
export interface AppError {
  code: string;
  message: string;
  displayMessage: string; // User-friendly message
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Error codes values and type
 */
export const ErrorCodeValues = {
  // Search errors
  SEARCH_FAILED: 'SEARCH_FAILED',
  INVALID_DESTINATION: 'INVALID_DESTINATION',
  INVALID_DATES: 'INVALID_DATES',
  NO_AVAILABILITY: 'NO_AVAILABILITY',

  // Booking errors
  BOOKING_FAILED: 'BOOKING_FAILED',
  BOOKING_HOLD_EXPIRED: 'BOOKING_HOLD_EXPIRED',
  INVALID_GUEST_INFO: 'INVALID_GUEST_INFO',
  RATE_NO_LONGER_AVAILABLE: 'RATE_NO_LONGER_AVAILABLE',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',

  // Policy errors
  POLICY_BLOCKED: 'POLICY_BLOCKED',
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',

  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',

  // Refund errors
  REFUND_FAILED: 'REFUND_FAILED',
  REFUND_NOT_ELIGIBLE: 'REFUND_NOT_ELIGIBLE',

  // Auth/Access errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // System errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
} as const;
export type ErrorCode = (typeof ErrorCodeValues)[keyof typeof ErrorCodeValues];

/**
 * Error severity values and type
 */
export const ErrorSeverityValues = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const;
export type ErrorSeverity = (typeof ErrorSeverityValues)[keyof typeof ErrorSeverityValues];

/**
 * Error metadata for tracking and debugging
 */
export interface ErrorMetadata {
  requestId?: string;
  traceId?: string;
  source: 'API' | 'VALIDATION' | 'NETWORK' | 'CLIENT';
  retryable: boolean;
  retryCount?: number;
}

/**
 * Extended application error
 */
export interface ExtendedAppError extends AppError {
  severity: ErrorSeverity;
  metadata: ErrorMetadata;
}

/**
 * HTTP status code map to error code
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: ErrorCodeValues.INVALID_DESTINATION,
  401: ErrorCodeValues.UNAUTHORIZED,
  403: ErrorCodeValues.FORBIDDEN,
  404: ErrorCodeValues.BOOKING_NOT_FOUND,
  408: ErrorCodeValues.TIMEOUT,
  409: ErrorCodeValues.RATE_NO_LONGER_AVAILABLE,
  422: ErrorCodeValues.INVALID_GUEST_INFO,
  500: ErrorCodeValues.SERVER_ERROR,
  503: ErrorCodeValues.SERVER_ERROR,
};

/**
 * Error code to user-friendly message map
 */
export const ERROR_MESSAGES: Record<ErrorCode, { title: string; message: string }> = {
  [ErrorCodeValues.SEARCH_FAILED]: {
    title: 'Search Failed',
    message: 'Unable to search hotels. Please try again.',
  },
  [ErrorCodeValues.INVALID_DESTINATION]: {
    title: 'Invalid Destination',
    message: 'Please select a valid destination.',
  },
  [ErrorCodeValues.INVALID_DATES]: {
    title: 'Invalid Dates',
    message: 'Check-in date must be before check-out date.',
  },
  [ErrorCodeValues.NO_AVAILABILITY]: {
    title: 'No Availability',
    message: 'No hotels available for your selected dates. Try different dates.',
  },
  [ErrorCodeValues.BOOKING_FAILED]: {
    title: 'Booking Failed',
    message: 'Unable to create booking. Please try again.',
  },
  [ErrorCodeValues.BOOKING_HOLD_EXPIRED]: {
    title: 'Hold Expired',
    message: 'Your booking hold has expired. Please search and select a hotel again.',
  },
  [ErrorCodeValues.INVALID_GUEST_INFO]: {
    title: 'Invalid Guest Information',
    message: 'Please check your guest information and try again.',
  },
  [ErrorCodeValues.RATE_NO_LONGER_AVAILABLE]: {
    title: 'Rate No Longer Available',
    message: 'This rate is no longer available. Please search again for current rates.',
  },
  [ErrorCodeValues.BOOKING_NOT_FOUND]: {
    title: 'Booking Not Found',
    message: 'The requested booking could not be found.',
  },
  [ErrorCodeValues.POLICY_BLOCKED]: {
    title: 'Booking Not Permitted',
    message: 'This booking does not comply with your organization policy.',
  },
  [ErrorCodeValues.POLICY_VIOLATION]: {
    title: 'Policy Warning',
    message: 'This booking may violate your organization policy.',
  },
  [ErrorCodeValues.APPROVAL_REQUIRED]: {
    title: 'Approval Required',
    message: 'This booking requires approval from your manager.',
  },
  [ErrorCodeValues.APPROVAL_EXPIRED]: {
    title: 'Approval Expired',
    message: 'Your approval request has expired.',
  },
  [ErrorCodeValues.APPROVAL_REJECTED]: {
    title: 'Approval Rejected',
    message: 'Your booking request has been rejected.',
  },
  [ErrorCodeValues.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    message: 'Payment processing failed. Please try again.',
  },
  [ErrorCodeValues.INVALID_PAYMENT_METHOD]: {
    title: 'Invalid Payment Method',
    message: 'The selected payment method is invalid.',
  },
  [ErrorCodeValues.REFUND_FAILED]: {
    title: 'Refund Failed',
    message: 'Unable to process refund. Please contact support.',
  },
  [ErrorCodeValues.REFUND_NOT_ELIGIBLE]: {
    title: 'Refund Not Eligible',
    message: 'This booking is not eligible for refund.',
  },
  [ErrorCodeValues.UNAUTHORIZED]: {
    title: 'Unauthorized',
    message: 'You are not authorized to perform this action.',
  },
  [ErrorCodeValues.FORBIDDEN]: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
  },
  [ErrorCodeValues.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Unable to connect. Please check your internet connection.',
  },
  [ErrorCodeValues.SERVER_ERROR]: {
    title: 'Server Error',
    message: 'Something went wrong. Please try again later.',
  },
  [ErrorCodeValues.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
  },
  [ErrorCodeValues.UNKNOWN]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
  },
};
