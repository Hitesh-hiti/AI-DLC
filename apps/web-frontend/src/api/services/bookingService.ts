/**
 * Booking Service
 * Service interface and mock implementation for booking operations
 */

import type {
  SearchRequest,
  SearchResponse,
  HotelDetailsRequest,
  HotelDetailsResponse,
  DestinationSearchRequest,
  DestinationSearchResponse,
} from '../types/search';
import type {
  BookingHoldRequest,
  BookingHoldResponse,
  BookingDetailRequest,
  BookingDetailResponse,
  ListBookingsRequest,
  ListBookingsResponse,
  BookingCancellationRequest,
  BookingCancellationResponse,
} from '../types/booking';
import type {
  PolicyEvaluationRequest,
  PolicyEvaluationResponse,
  ApprovalDecisionRequest,
  ApprovalDecisionResponse,
} from '../types/policy';
import {
  MOCK_AIRPORTS,
  createMockSearchResponse,
  createMockHotelDetailsResponse,
  createMockBookingHoldResponse,
  createMockPolicyResponseAllow,
  createMockPolicyResponseWarn,
  createMockPolicyResponseBlock,
  createMockPolicyResponseRequireApproval,
  createMockBookingDetailResponse,
} from '../mocks/fixtures';
import { v4 as uuidv4 } from 'uuid';

/**
 * Booking Service Interface
 * Defines contract for booking operations - enables easy API swap
 */
export interface IBookingService {
  // Search operations
  searchDestinations(
    req: DestinationSearchRequest
  ): Promise<DestinationSearchResponse>;

  searchHotels(req: SearchRequest): Promise<SearchResponse>;

  getHotelDetails(req: HotelDetailsRequest): Promise<HotelDetailsResponse>;

  // Booking operations
  holdBooking(req: BookingHoldRequest): Promise<BookingHoldResponse>;

  getBookingDetail(req: BookingDetailRequest): Promise<BookingDetailResponse>;

  listBookings(req: ListBookingsRequest): Promise<ListBookingsResponse>;

  cancelBooking(
    req: BookingCancellationRequest
  ): Promise<BookingCancellationResponse>;

  // Policy operations
  evaluatePolicy(
    req: PolicyEvaluationRequest
  ): Promise<PolicyEvaluationResponse>;

  decideApproval(
    req: ApprovalDecisionRequest
  ): Promise<ApprovalDecisionResponse>;
}

/**
 * Mock Booking Service Implementation
 * Uses fixtures and simulated delays for realistic development/testing
 */
export class MockBookingService implements IBookingService {
  private readonly delayMs = 800; // Simulate network latency

  async searchDestinations(
    req: DestinationSearchRequest
  ): Promise<DestinationSearchResponse> {
    await this.simulateDelay();

    const query = req.query.toLowerCase();
    const suggestions = MOCK_AIRPORTS.filter((dest) =>
      dest.name.toLowerCase().includes(query)
    );

    return { suggestions: suggestions.slice(0, req.limit || 5) };
  }

  async searchHotels(req: SearchRequest): Promise<SearchResponse> {
    await this.simulateDelay();

    // Validate flight search request
    if (!req.origin || !req.destination || !req.departureDate) {
      throw new Error('Invalid flight search request');
    }

    const searchId = uuidv4();
    return createMockSearchResponse(searchId, {
      origin: req.origin.toUpperCase(),
      destination: req.destination.toUpperCase(),
    });
  }

  async getHotelDetails(req: HotelDetailsRequest): Promise<HotelDetailsResponse> {
    await this.simulateDelay();

    if (!req.propertyId) {
      throw new Error('Property ID is required');
    }

    // Return a minimal response for now - in real implementation would fetch flight details
    return {
      property: {
        propertyId: req.propertyId,
        name: 'Flight Details',
        location: { city: 'Unknown', country: 'Unknown' },
        description: 'Flight booking',
        starRating: 5,
        images: [],
        amenities: [],
        checkinTime: '',
        checkoutTime: '',
        phoneNumber: '',
        website: '',
        metadata: {},
      },
      availableRates: [],
      policies: [],
      timestamp: new Date().toISOString(),
    };
  }

  async holdBooking(req: BookingHoldRequest): Promise<BookingHoldResponse> {
    await this.simulateDelay();

    // Validate request
    if (!req.rateId || !req.propertyId || !req.guestInfo) {
      throw new Error('Invalid booking hold request');
    }

    const bookingId = uuidv4();
    return createMockBookingHoldResponse(bookingId, req.rateId);
  }

  async getBookingDetail(req: BookingDetailRequest): Promise<BookingDetailResponse> {
    await this.simulateDelay();

    if (!req.bookingId) {
      throw new Error('Booking ID is required');
    }

    return createMockBookingDetailResponse(req.bookingId);
  }

  async listBookings(req: ListBookingsRequest): Promise<ListBookingsResponse> {
    await this.simulateDelay();

    if (!req.userId) {
      throw new Error('User ID is required');
    }

    return {
      bookings: [
        createMockBookingDetailResponse(uuidv4()),
        createMockBookingDetailResponse(uuidv4()),
      ],
      meta: {
        totalCount: 2,
        pageSize: req.pageSize || 10,
        pageNumber: req.pageNumber || 1,
        hasMore: false,
      },
    };
  }

  async cancelBooking(
    req: BookingCancellationRequest
  ): Promise<BookingCancellationResponse> {
    await this.simulateDelay();

    if (!req.bookingId) {
      throw new Error('Booking ID is required');
    }

    return {
      bookingId: req.bookingId,
      bookingStatus: 'CANCELLED',
      cancellationId: uuidv4(),
      refundAmount: { amount: 250, currency: 'USD' },
      refundStatus: 'PENDING',
      estimatedRefundDate: new Date(Date.now() + 604800000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
    };
  }

  async evaluatePolicy(
    req: PolicyEvaluationRequest
  ): Promise<PolicyEvaluationResponse> {
    await this.simulateDelay();

    // Mock policy evaluation logic
    // In real world, this would call backend policy engine
    const rand = Math.random();

    if (rand < 0.4) {
      return createMockPolicyResponseAllow();
    } else if (rand < 0.6) {
      return createMockPolicyResponseWarn();
    } else if (rand < 0.8) {
      return createMockPolicyResponseBlock();
    } else {
      return createMockPolicyResponseRequireApproval();
    }
  }

  async decideApproval(
    req: ApprovalDecisionRequest
  ): Promise<ApprovalDecisionResponse> {
    await this.simulateDelay();

    if (!req.approvalId || !req.decision) {
      throw new Error('Invalid approval decision request');
    }

    return {
      approvalId: req.approvalId,
      decision: req.decision,
      decidedAt: new Date().toISOString(),
      decidedBy: req.approverUserId,
      comments: req.comments,
      nextSteps: ['Booking will be confirmed', 'Payment will be processed'],
    };
  }

  /**
   * Simulate network latency
   */
  private async simulateDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, this.delayMs + Math.random() * 200)
    );
  }
}

/**
 * Global service instance
 */
export const bookingService = new MockBookingService();
