/**
 * Booking API Types
 * Covers flight booking lifecycle (AC-EXP-02, AC-EXP-03, AC-EXP-04, AC-EXP-06)
 */

import type { BookingStatus, Money, AuditContext, PaginationMeta } from './common';

// ─── Hold ─────────────────────────────────────────────────────────────────────

export interface BookingHoldRequest {
  offerId: string;
  organizationId: string;
  travelerId: string;

  flightDetails: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    passengers: number;
  };

  passengerInfo: PassengerInfo[];
  paymentReference?: string;
  audit: AuditContext;
}

export interface PassengerInfo {
  passengerType: 'ADT' | 'CHD' | 'INF';
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  frequentFlyerNumber?: string;
  specialRequests?: string[];
}

export interface BookingHoldResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  confirmationNumber: string;
  holdExpiresAt: string;

  flightSummary: {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    cabinClass: string;
    passengers: number;
  };

  fareBreakdown: {
    baseFare: Money;
    taxes: Money;
    fees: Money;
    totalFare: Money;
  };

  cancellationPolicy: {
    refundable: boolean;
    cancellationDeadline?: string;
    penaltyAmount?: Money;
  };

  /** Present when policy outcome is REQUIRE_APPROVAL */
  approvalDetails?: {
    approvalId: string;
    approverName: string;
    approverEmail: string;
    approvalExpiresAt: string;   // ISO 8601
    reason: string;
  };

  createdAt: string;
}

// ─── PNR stub ─────────────────────────────────────────────────────────────────

/**
 * PNR (Passenger Name Record) generation stub (AC-EXP-02-01)
 * In production this is returned by the GDS after hold.
 * For Phase 1 the frontend generates a deterministic stub from the bookingId.
 */
export interface PnrRecord {
  pnr: string;               // 6-char alphanumeric, e.g. "ABC123"
  bookingId: string;
  generatedAt: string;
  gdsReference?: string;     // e.g. "1A/AMADEUS" — populated post-hold
  status: 'STUB' | 'CONFIRMED';
}

/**
 * Generate a deterministic stub PNR from a bookingId
 */
export function generatePnrStub(bookingId: string): PnrRecord {
  // Take first 6 chars of bookingId (UUID), uppercase, replace hyphens
  const raw = bookingId.replace(/-/g, '').toUpperCase().slice(0, 6);
  return {
    pnr: raw,
    bookingId,
    generatedAt: new Date().toISOString(),
    status: 'STUB',
  };
}

// ─── Payment stub ─────────────────────────────────────────────────────────────

/**
 * Payment approval stub (AC-EXP-03-01)
 * In production this is a tokenised card / lodge card reference.
 * For Phase 1 the frontend generates a synthetic payment token.
 */
export interface PaymentApproval {
  paymentReference: string;  // synthetic token, e.g. "PAY-XXXXXX"
  method: 'LODGE_CARD' | 'CORPORATE_CARD' | 'PERSONAL_CARD';
  lastFourDigits?: string;   // masked — never full PAN
  approvedAt: string;
  amount: Money;
  status: 'STUB' | 'AUTHORISED' | 'SETTLED';
}

/**
 * Generate a stub payment approval for the booking
 */
export function generatePaymentApprovalStub(
  bookingId: string,
  amount: Money,
): PaymentApproval {
  const token = `PAY-${bookingId.replace(/-/g, '').toUpperCase().slice(0, 8)}`;
  return {
    paymentReference: token,
    method: 'LODGE_CARD',
    approvedAt: new Date().toISOString(),
    amount,
    status: 'STUB',
  };
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export interface BookingDetailRequest {
  bookingId: string;
  audit?: AuditContext;
}

export interface BookingDetailResponse {
  bookingId: string;
  confirmationNumber: string;
  bookingStatus: BookingStatus;

  flightDetails: {
    airline: string;
    flightNumber: string;
    aircraft?: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    cabinClass: string;
  };

  passengers: PassengerInfo[];

  fareBreakdown: {
    baseFare: Money;
    taxes: Money;
    fees: Money;
    totalFare: Money;
  };

  ticketNumbers?: string[];
  holdExpiresAt?: string;
  approvalId?: string;
  pnr?: string;              // populated after hold

  cancellationPolicy: {
    refundable: boolean;
    cancellationDeadline?: string;
    voidWindowClosesAt?: string;
    penaltyAmount?: Money;
  };

  createdAt: string;
  modifiedAt: string;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export interface ListBookingsRequest {
  userId?: string;
  organizationId?: string;
  status?: BookingStatus;
  pageSize?: number;
  pageNumber?: number;
  audit?: AuditContext;
}

export interface ListBookingsResponse {
  bookings: BookingDetailResponse[];
  meta: PaginationMeta;
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

export interface BookingCancellationRequest {
  bookingId: string;
  reason?: 'TRAVELER_REQUEST' | 'POLICY_BLOCK' | 'APPROVAL_REJECTED' | 'HOLD_EXPIRED' | 'OTHER';
  comments?: string;
  audit: AuditContext;
}

export interface BookingCancellationResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  cancellationId: string;
  cancelledAt: string;
  refundEligible: boolean;
  refundAmount?: Money;
  refundStatus?: 'NOT_APPLICABLE' | 'PENDING' | 'PROCESSING' | 'COMPLETED';
  estimatedRefundDate?: string;
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

export interface BookingConfirmRequest {
  bookingId: string;
  paymentReference: string;
  audit: AuditContext;
}

export interface BookingConfirmResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  confirmationNumber: string;
  pnr?: string;
  ticketNumbers?: string[];
  confirmedAt: string;
  nextSteps?: string[];
}

// ─── Hold ─────────────────────────────────────────────────────────────────────

/**
 * Request to hold a flight booking (AC-EXP-02-01)
 * Reserves the seat for a short window (typically 30 min) pending confirmation
 */
export interface BookingHoldRequest {
  offerId: string;         // FlightOffer.offerId from search results
  organizationId: string;
  travelerId: string;

  flightDetails: {
    origin: string;        // IATA code, e.g. "LHR"
    destination: string;   // IATA code, e.g. "JFK"
    departureDate: string; // ISO 8601 date
    returnDate?: string;   // ISO 8601 date (round-trip)
    cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    passengers: number;
  };

  passengerInfo: PassengerInfo[];

  paymentReference?: string; // pre-auth token if applicable
  audit: AuditContext;
}

/**
 * Passenger details for booking hold
 */
export interface PassengerInfo {
  passengerType: 'ADT' | 'CHD' | 'INF'; // Adult / Child / Infant
  firstName: string;
  lastName: string;
  dateOfBirth?: string;          // ISO 8601
  passportNumber?: string;
  passportExpiry?: string;       // ISO 8601
  nationality?: string;          // ISO 3166-1 alpha-2
  frequentFlyerNumber?: string;
  specialRequests?: string[];
}

/**
 * Response from booking hold (AC-EXP-02-01)
 */
export interface BookingHoldResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  confirmationNumber: string;
  holdExpiresAt: string; // ISO 8601 — hold will lapse after this time

  flightSummary: {
    airline: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    cabinClass: string;
    passengers: number;
  };

  fareBreakdown: {
    baseFare: Money;
    taxes: Money;
    fees: Money;
    totalFare: Money;
  };

  cancellationPolicy: {
    refundable: boolean;
    cancellationDeadline?: string;
    penaltyAmount?: Money;
  };

  createdAt: string;
}

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Request to fetch a single booking (AC-EXP-05-01)
 */
export interface BookingDetailRequest {
  bookingId: string;
  audit?: AuditContext;
}

/**
 * Full booking detail response (AC-EXP-05-01, AC-EXP-05-04)
 */
export interface BookingDetailResponse {
  bookingId: string;
  confirmationNumber: string;
  bookingStatus: BookingStatus;

  flightDetails: {
    airline: string;
    flightNumber: string;
    aircraft?: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;   // ISO 8601 duration, e.g. "PT7H30M"
    stops: number;
    cabinClass: string;
  };

  passengers: PassengerInfo[];

  fareBreakdown: {
    baseFare: Money;
    taxes: Money;
    fees: Money;
    totalFare: Money;
  };

  ticketNumbers?: string[];        // populated after CONFIRMED state
  holdExpiresAt?: string;          // present while HELD
  approvalId?: string;             // present while PENDING_APPROVAL

  cancellationPolicy: {
    refundable: boolean;
    cancellationDeadline?: string;
    voidWindowClosesAt?: string;   // if within void window
    penaltyAmount?: Money;
  };

  createdAt: string;
  modifiedAt: string;
}

// ─── List bookings ────────────────────────────────────────────────────────────

/**
 * List bookings request (AC-EXP-05-01)
 */
export interface ListBookingsRequest {
  userId?: string;
  organizationId?: string;
  status?: BookingStatus;
  pageSize?: number;
  pageNumber?: number;
  audit?: AuditContext;
}

/**
 * List bookings response
 */
export interface ListBookingsResponse {
  bookings: BookingDetailResponse[];
  meta: PaginationMeta;
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

/**
 * Booking cancellation request (AC-EXP-06-01)
 */
export interface BookingCancellationRequest {
  bookingId: string;
  reason?: 'TRAVELER_REQUEST' | 'POLICY_BLOCK' | 'APPROVAL_REJECTED' | 'HOLD_EXPIRED' | 'OTHER';
  comments?: string;
  audit: AuditContext;
}

/**
 * Booking cancellation response (AC-EXP-06-01, AC-EXP-06-03)
 */
export interface BookingCancellationResponse {
  bookingId: string;
  bookingStatus: BookingStatus; // CANCELLED or VOIDED
  cancellationId: string;
  cancelledAt: string;

  refundEligible: boolean;
  refundAmount?: Money;
  refundStatus?: 'NOT_APPLICABLE' | 'PENDING' | 'PROCESSING' | 'COMPLETED';
  estimatedRefundDate?: string;
}

// ─── Confirmation ─────────────────────────────────────────────────────────────

/**
 * Booking confirmation request (AC-EXP-03-01)
 * Triggers ticketing after a HELD booking receives approval (if required)
 */
export interface BookingConfirmRequest {
  bookingId: string;
  paymentReference: string; // payment/card token
  audit: AuditContext;
}

/**
 * Booking confirmation response (AC-EXP-03-01, AC-EXP-03-07)
 */
export interface BookingConfirmResponse {
  bookingId: string;
  bookingStatus: BookingStatus; // CONFIRMED or PENDING_ISSUE
  confirmationNumber: string;
  ticketNumbers?: string[];
  confirmedAt: string;
  nextSteps?: string[];
}
