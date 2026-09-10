/**
 * Booking API Types
 * Covers booking holds, confirmations, and modifications (AC-EXP-02)
 */

import type { Money, TravelerRef, BookingStatus, AuditContext } from './common';

/**
 * Booking hold request (AC-EXP-02-01, AC-EXP-02-02)
 */
export interface BookingHoldRequest {
  searchId: string;
  rateId: string;
  propertyId: string;
  checkIn: string; // ISO 8601
  checkOut: string; // ISO 8601
  guestInfo: {
    primary: GuestInfo;
    additional?: GuestInfo[];
  };
  numberOfRooms: number;
  specialRequests?: string;
  audit: AuditContext;
}

/**
 * Guest information
 */
export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: 'Mr' | 'Ms' | 'Mrs' | 'Dr' | 'Prof';
  dateOfBirth?: string; // ISO 8601
}

/**
 * Booking hold response (AC-EXP-02-03)
 */
export interface BookingHoldResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  confirmationNumber: string;
  holdExpiresAt: string; // ISO 8601
  hotelDetails: {
    name: string;
    location: {
      city: string;
      country: string;
    };
  };
  rateDetails: {
    basePrice: Money;
    taxes: Money;
    fees: Money;
    totalPrice: Money;
  };
  guestName: string;
  checkIn: string;
  checkOut: string;
  numberOfRooms: number;
  numberOfNights: number;
  cancellationPolicy?: {
    refundable: boolean;
    cancellationDeadline?: string;
    penaltyAmount?: Money;
  };
  createdAt: string;
}

/**
 * Booking confirmation request (AC-EXP-02-04)
 */
export interface BookingConfirmationRequest {
  bookingId: string;
  paymentMethodId?: string;
  billingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  audit: AuditContext;
}

/**
 * Booking confirmation response
 */
export interface BookingConfirmationResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  confirmationNumber: string;
  itineraryUrl?: string;
  receiptUrl?: string;
  supportContact?: {
    phone: string;
    email: string;
  };
  nextSteps?: string[];
  createdAt: string;
}

/**
 * Booking detail request
 */
export interface BookingDetailRequest {
  bookingId: string;
  audit: AuditContext;
}

/**
 * Full booking detail response
 */
export interface BookingDetailResponse {
  bookingId: string;
  confirmationNumber: string;
  bookingStatus: BookingStatus;
  hotelDetails: {
    propertyId: string;
    name: string;
    location: {
      city: string;
      state?: string;
      country: string;
    };
    phone?: string;
    website?: string;
  };
  guestInfo: {
    primary: GuestInfo;
    additional?: GuestInfo[];
  };
  stayDetails: {
    checkIn: string;
    checkOut: string;
    numberOfRooms: number;
    numberOfNights: number;
  };
  rateDetails: {
    basePrice: Money;
    taxes: Money;
    fees: Money;
    totalPrice: Money;
  };
  cancellationPolicy?: {
    refundable: boolean;
    cancellationDeadline?: string;
    penaltyAmount?: Money;
  };
  specialRequests?: string;
  createdAt: string;
  modifiedAt: string;
}

/**
 * Booking modification request (for future enhancements)
 */
export interface BookingModificationRequest {
  bookingId: string;
  modificationType: 'DATE_CHANGE' | 'GUEST_CHANGE' | 'ROOM_CHANGE';
  modifications: Record<string, unknown>;
  audit: AuditContext;
}

/**
 * Booking cancellation request
 */
export interface BookingCancellationRequest {
  bookingId: string;
  reason?: string;
  audit: AuditContext;
}

/**
 * Booking cancellation response
 */
export interface BookingCancellationResponse {
  bookingId: string;
  bookingStatus: BookingStatus;
  cancellationId: string;
  refundAmount?: Money;
  refundStatus?: 'PENDING' | 'PROCESSED' | 'FAILED';
  cancellationDeadlineExceeded?: boolean;
  estimatedRefundDate?: string;
  createdAt: string;
}

/**
 * List bookings request (for trip management)
 */
export interface ListBookingsRequest {
  userId: string;
  status?: BookingStatus;
  dateRange?: {
    fromDate: string;
    toDate: string;
  };
  pageSize?: number;
  pageNumber?: number;
  audit: AuditContext;
}

/**
 * List bookings response
 */
export interface ListBookingsResponse {
  bookings: BookingDetailResponse[];
  meta: {
    totalCount: number;
    pageSize: number;
    pageNumber: number;
    hasMore: boolean;
  };
}
