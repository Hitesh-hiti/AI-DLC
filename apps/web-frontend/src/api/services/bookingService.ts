/**
 * Flight Booking Service
 * Interface and mock implementation for all flight booking operations.
 * Swap MockFlightBookingService for a real HTTP client when the backend is ready.
 */

import type {
  SearchRequest,
  SearchResponse,
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
  BookingConfirmRequest,
  BookingConfirmResponse,
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
  createMockBookingHoldResponse,
  createMockBookingDetailResponse,
  createMockPolicyResponseAllow,
  createMockPolicyResponseWarn,
  createMockPolicyResponseBlock,
  createMockPolicyResponseRequireApproval,
} from '../mocks/fixtures';
import { generatePnrStub, generatePaymentApprovalStub } from '../types/booking';
import type { PnrRecord, PaymentApproval } from '../types/booking';
import { v4 as uuidv4 } from 'uuid';

// ─── Service interface ────────────────────────────────────────────────────────

export interface IFlightBookingService {
  /** Airport / city autocomplete */
  searchDestinations(req: DestinationSearchRequest): Promise<DestinationSearchResponse>;

  /** Flight availability search */
  searchFlights(req: SearchRequest): Promise<SearchResponse>;

  /** Hold a selected flight offer (30 min window) */
  holdBooking(req: BookingHoldRequest): Promise<BookingHoldResponse>;

  /** Confirm + ticket a held booking */
  confirmBooking(req: BookingConfirmRequest): Promise<BookingConfirmResponse>;

  /** Retrieve full booking detail */
  getBookingDetail(req: BookingDetailRequest): Promise<BookingDetailResponse>;

  /** List bookings for a traveller / organisation */
  listBookings(req: ListBookingsRequest): Promise<ListBookingsResponse>;

  /** Cancel a booking */
  cancelBooking(req: BookingCancellationRequest): Promise<BookingCancellationResponse>;

  /** Evaluate travel policy for an offer */
  evaluatePolicy(req: PolicyEvaluationRequest): Promise<PolicyEvaluationResponse>;

  /** Submit an approval decision (approver role) */
  decideApproval(req: ApprovalDecisionRequest): Promise<ApprovalDecisionResponse>;

  /** Generate a stub PNR after a successful hold (Phase 1 stub) */
  generatePnr(bookingId: string): Promise<PnrRecord>;

  /** Generate a stub payment approval token (Phase 1 stub) */
  generatePaymentApproval(bookingId: string, amount: import('../types/common').Money): Promise<PaymentApproval>;
}

// ─── Mock implementation ──────────────────────────────────────────────────────

export class MockFlightBookingService implements IFlightBookingService {
  private readonly delayMs = 800;

  // ── Search ──────────────────────────────────────────────────────────────────

  async searchDestinations(req: DestinationSearchRequest): Promise<DestinationSearchResponse> {
    await this.delay();
    const q = req.query.toLowerCase();
    const suggestions = MOCK_AIRPORTS
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, req.limit ?? 5);
    return { suggestions };
  }

  async searchFlights(req: SearchRequest): Promise<SearchResponse> {
    await this.delay();
    if (!req.origin || !req.destination || !req.departureDate) {
      throw new Error('origin, destination and departureDate are required');
    }
    return createMockSearchResponse(uuidv4(), {
      origin:      req.origin.toUpperCase(),
      destination: req.destination.toUpperCase(),
    });
  }

  // ── Hold ────────────────────────────────────────────────────────────────────

  async holdBooking(req: BookingHoldRequest): Promise<BookingHoldResponse> {
    await this.delay();
    if (!req.offerId || !req.travelerId) {
      throw new Error('offerId and travelerId are required to hold a booking');
    }
    // Force approval flow via VITE_MOCK_POLICY=APPROVAL; otherwise no approval needed
    const forceOutcome = (import.meta.env?.VITE_MOCK_POLICY ?? 'ALLOW').toUpperCase();
    const requiresApproval = forceOutcome === 'APPROVAL' || forceOutcome === 'REQUIRE_APPROVAL';
    return createMockBookingHoldResponse(uuidv4(), req.offerId, requiresApproval);
  }

  // ── Confirm ─────────────────────────────────────────────────────────────────

  async confirmBooking(req: BookingConfirmRequest): Promise<BookingConfirmResponse> {
    await this.delay();
    if (!req.bookingId || !req.paymentReference) {
      throw new Error('bookingId and paymentReference are required');
    }
    return {
      bookingId:          req.bookingId,
      bookingStatus:      'CONFIRMED',
      confirmationNumber: `CONF-${req.bookingId.toUpperCase()}`,
      ticketNumbers:      [`TKT-${uuidv4().slice(0, 8).toUpperCase()}`],
      confirmedAt:        new Date().toISOString(),
      nextSteps:          ['E-ticket will be emailed within 5 minutes'],
    };
  }

  // ── Detail / list ────────────────────────────────────────────────────────────

  async getBookingDetail(req: BookingDetailRequest): Promise<BookingDetailResponse> {
    await this.delay();
    if (!req.bookingId) throw new Error('bookingId is required');
    return createMockBookingDetailResponse(req.bookingId);
  }

  async listBookings(req: ListBookingsRequest): Promise<ListBookingsResponse> {
    await this.delay();
    return {
      bookings: [
        createMockBookingDetailResponse(uuidv4()),
        createMockBookingDetailResponse(uuidv4()),
      ],
      meta: {
        totalCount: 2,
        pageSize:   req.pageSize   ?? 10,
        pageNumber: req.pageNumber ?? 1,
        hasMore:    false,
      },
    };
  }

  // ── Cancel ───────────────────────────────────────────────────────────────────

  async cancelBooking(req: BookingCancellationRequest): Promise<BookingCancellationResponse> {
    await this.delay();
    if (!req.bookingId) throw new Error('bookingId is required');
    return {
      bookingId:     req.bookingId,
      bookingStatus: 'CANCELLED',
      cancellationId: uuidv4(),
      cancelledAt:    new Date().toISOString(),
      refundEligible: true,
      refundAmount:   { amount: 450, currency: 'USD' },
      refundStatus:   'PENDING',
      estimatedRefundDate: new Date(Date.now() + 604800000).toISOString(), // +7 days
    };
  }

  // ── Policy ───────────────────────────────────────────────────────────────────

  /**
   * Policy evaluation — deterministic by default (ALLOW).
   *
   * Override via the VITE_MOCK_POLICY environment variable during development:
   *   VITE_MOCK_POLICY=WARN   npm run dev   → always WARN
   *   VITE_MOCK_POLICY=BLOCK  npm run dev   → always BLOCK
   *   VITE_MOCK_POLICY=APPROVAL npm run dev → always REQUIRE_APPROVAL
   *
   * When the variable is absent or set to ALLOW the booking flow
   * proceeds normally without policy interruptions.
   */
  async evaluatePolicy(_req: PolicyEvaluationRequest): Promise<PolicyEvaluationResponse> {
    await this.delay();

    const forceOutcome = (import.meta.env?.VITE_MOCK_POLICY ?? 'ALLOW').toUpperCase();

    switch (forceOutcome) {
      case 'WARN':             return createMockPolicyResponseWarn();
      case 'BLOCK':            return createMockPolicyResponseBlock();
      case 'APPROVAL':
      case 'REQUIRE_APPROVAL': return createMockPolicyResponseRequireApproval();
      default:                 return createMockPolicyResponseAllow();
    }
  }

  async decideApproval(req: ApprovalDecisionRequest): Promise<ApprovalDecisionResponse> {
    await this.delay();
    if (!req.approvalId || !req.decision) {
      throw new Error('approvalId and decision are required');
    }
    return {
      approvalId: req.approvalId,
      decision:   req.decision,
      decidedAt:  new Date().toISOString(),
      decidedBy:  req.approverUserId,
      comments:   req.comments,
      nextSteps:  [
        req.decision === 'APPROVED'
          ? 'Booking will proceed to ticketing'
          : 'Booking has been cancelled',
      ],
    };
  }

  // ── PNR & Payment stubs ───────────────────────────────────────────────────

  async generatePnr(bookingId: string): Promise<PnrRecord> {
    await this.delay();
    if (!bookingId) throw new Error('bookingId is required');
    return generatePnrStub(bookingId);
  }

  async generatePaymentApproval(
    bookingId: string,
    amount: import('../types/common').Money,
  ): Promise<PaymentApproval> {
    await this.delay();
    if (!bookingId) throw new Error('bookingId is required');
    return generatePaymentApprovalStub(bookingId, amount);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private delay(): Promise<void> {
    return new Promise((r) => setTimeout(r, this.delayMs + Math.random() * 200));
  }
}

// ─── Backward-compatible alias (used by App.tsx as bookingService.searchHotels) ─

/**
 * Thin adapter so existing call-sites (`bookingService.searchHotels(req)`) keep
 * working while we gradually rename them to `searchFlights`.
 */
class CompatBookingService extends MockFlightBookingService {
  /** @deprecated use searchFlights */
  searchHotels(req: SearchRequest): Promise<SearchResponse> {
    return this.searchFlights(req);
  }
}

export const bookingService = new CompatBookingService();
