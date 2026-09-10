/**
 * Error Mapper
 * Converts API errors to app-level errors with user-friendly messages
 */

import type {
  AppError,
  ErrorCode,
  ErrorSeverity,
  ExtendedAppError,
} from '../types/errors';
import {
  ERROR_MESSAGES,
  HTTP_STATUS_TO_ERROR_CODE,
  ErrorCodeValues,
  ErrorSeverityValues,
} from '../types/errors';
import type { ApiError } from '../types/common';

/**
 * Map API error to app error
 */
export function mapApiError(apiError: ApiError | Error | unknown, statusCode?: number): ExtendedAppError {
  let code: ErrorCode = ErrorCodeValues.UNKNOWN;
  let message = '';
  let details: Record<string, unknown> | undefined;

  // Handle ApiError from response
  if (apiError && typeof apiError === 'object' && 'code' in apiError) {
    const err = apiError as ApiError;
    code = (err.code as ErrorCode) || ErrorCodeValues.UNKNOWN;
    message = err.message || '';
    details = err.details;
  }
  // Handle regular Error
  else if (apiError instanceof Error) {
    message = apiError.message;
    if (apiError.message.includes('Network')) {
      code = ErrorCodeValues.NETWORK_ERROR;
    } else if (apiError.message.includes('Timeout')) {
      code = ErrorCodeValues.TIMEOUT;
    }
  }
  // Handle unknown types
  else if (typeof apiError === 'string') {
    message = apiError;
  }

  // If no code determined from error, use status code mapping
  if (code === ErrorCodeValues.UNKNOWN && statusCode) {
    code = HTTP_STATUS_TO_ERROR_CODE[statusCode as keyof typeof HTTP_STATUS_TO_ERROR_CODE] || ErrorCodeValues.UNKNOWN;
  }

  const { message: userMessage } = ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES];

  return {
    code,
    message: message || userMessage,
    displayMessage: userMessage,
    statusCode,
    details,
    severity: determineSeverity(code),
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'API',
      retryable: isRetryable(code),
    },
  };
}

/**
 * Map network error
 */
export function mapNetworkError(error: Error): ExtendedAppError {
  return {
    code: ErrorCodeValues.NETWORK_ERROR,
    message: error.message || 'Network error occurred',
    displayMessage: ERROR_MESSAGES[ErrorCodeValues.NETWORK_ERROR as keyof typeof ERROR_MESSAGES].message,
    severity: ErrorSeverityValues.ERROR,
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'NETWORK',
      retryable: true,
    },
  };
}

/**
 * Map validation error
 */
export function mapValidationError(field: string, reason: string): ExtendedAppError {
  return {
    code: ErrorCodeValues.INVALID_GUEST_INFO,
    message: `Validation failed for ${field}: ${reason}`,
    displayMessage: `Invalid ${field}. ${reason}`,
    severity: ErrorSeverityValues.WARNING,
    timestamp: new Date().toISOString(),
    metadata: {
      source: 'VALIDATION',
      retryable: false,
    },
  };
}

/**
 * Determine error severity based on code
 */
function determineSeverity(code: ErrorCode): ErrorSeverity {
  switch (code) {
    case ErrorCodeValues.POLICY_BLOCKED:
    case ErrorCodeValues.UNAUTHORIZED:
    case ErrorCodeValues.FORBIDDEN:
      return ErrorSeverityValues.CRITICAL;
    case ErrorCodeValues.POLICY_VIOLATION:
    case ErrorCodeValues.APPROVAL_REQUIRED:
    case ErrorCodeValues.INVALID_GUEST_INFO:
      return ErrorSeverityValues.WARNING;
    case ErrorCodeValues.SERVER_ERROR:
    case ErrorCodeValues.PAYMENT_FAILED:
      return ErrorSeverityValues.ERROR;
    default:
      return ErrorSeverityValues.INFO;
  }
}

/**
 * Determine if error is retryable
 */
function isRetryable(code: ErrorCode): boolean {
  const retryableCodes: ErrorCode[] = [
    ErrorCodeValues.NETWORK_ERROR,
    ErrorCodeValues.TIMEOUT,
    ErrorCodeValues.SERVER_ERROR,
    ErrorCodeValues.SEARCH_FAILED,
    ErrorCodeValues.BOOKING_FAILED,
  ];
  return retryableCodes.includes(code);
}

/**
 * Format error for display
 */
export function formatErrorDisplay(error: ExtendedAppError): { title: string; message: string } {
  const msg = ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES];
  return {
    title: msg?.title || 'Error',
    message: error.displayMessage,
  };
}
