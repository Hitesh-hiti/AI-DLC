import type { Money } from '../types/common';
import type { PnrRecord, PaymentApproval, BookingHoldRequest, BookingHoldResponse, BookingDetailRequest, BookingDetailResponse, ListBookingsRequest, ListBookingsResponse, BookingCancellationRequest, BookingCancellationResponse, BookingConfirmRequest, BookingConfirmResponse } from '../types/booking';
import type { SearchRequest, SearchResponse, DestinationSearchRequest, DestinationSearchResponse } from '../types/search';
import type { PolicyEvaluationRequest, PolicyEvaluationResponse, ApprovalDecisionRequest, ApprovalDecisionResponse } from '../types/policy';
import { httpClient, type HttpClient } from './httpClient';
import type { IFlightBookingService } from './bookingService';

/** REST implementation of the existing booking-service contract. */
export class HttpFlightBookingService implements IFlightBookingService {
  constructor(private readonly client: HttpClient = httpClient) {}

  searchDestinations(req: DestinationSearchRequest) { return this.client.get<DestinationSearchResponse>('/destinations/search', req); }
  searchFlights(req: SearchRequest) { return this.client.post<SearchResponse>('/flights/search', req); }
  holdBooking(req: BookingHoldRequest) { return this.client.post<BookingHoldResponse>('/bookings/holds', req); }
  confirmBooking(req: BookingConfirmRequest) { return this.client.post<BookingConfirmResponse>(`/bookings/${encodeURIComponent(req.bookingId)}/confirm`, req); }
  getBookingDetail(req: BookingDetailRequest) { return this.client.get<BookingDetailResponse>(`/bookings/${encodeURIComponent(req.bookingId)}`, req.audit ? { audit: JSON.stringify(req.audit) } : undefined); }
  listBookings(req: ListBookingsRequest) { return this.client.get<ListBookingsResponse>('/bookings', req as Record<string, unknown>); }
  cancelBooking(req: BookingCancellationRequest) { return this.client.post<BookingCancellationResponse>(`/bookings/${encodeURIComponent(req.bookingId)}/cancel`, req); }
  evaluatePolicy(req: PolicyEvaluationRequest) { return this.client.post<PolicyEvaluationResponse>('/policies/evaluate', req); }
  decideApproval(req: ApprovalDecisionRequest) { return this.client.post<ApprovalDecisionResponse>(`/approvals/${encodeURIComponent(req.approvalId)}/decision`, req); }
  generatePnr(bookingId: string) { return this.client.post<PnrRecord>(`/bookings/${encodeURIComponent(bookingId)}/pnr`); }
  generatePaymentApproval(bookingId: string, amount: Money) { return this.client.post<PaymentApproval>(`/bookings/${encodeURIComponent(bookingId)}/payment-approval`, { bookingId, amount }); }
}
