/**
 * Booking Context
 * Flight booking flow state:
 *   search → results → details (passenger) → booking (hold+policy) → confirmation
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { SearchRequest, FlightOffer } from '../api/types/search';
import type {
  PassengerInfo,
  BookingHoldResponse,
  BookingConfirmResponse,
  PnrRecord,
  PaymentApproval,
} from '../api/types/booking';
import type { PolicyEvaluationResponse } from '../api/types/policy';
import type { PolicyOutcome } from '../api/types/common';

// ─── Context shape ────────────────────────────────────────────────────────────

export interface BookingContextType {
  // ── Search ────────────────────────────────────────────────────────────────
  searchRequest:  SearchRequest  | null;
  searchResults:  FlightOffer[]  | null;

  // ── Selected offer ────────────────────────────────────────────────────────
  selectedFlight: FlightOffer | null;

  // ── Passenger collection ──────────────────────────────────────────────────
  passengers: PassengerInfo[];

  // ── Policy ────────────────────────────────────────────────────────────────
  policyEvaluation: PolicyEvaluationResponse | null;
  policyOutcome:    PolicyOutcome | null;

  // ── Active hold ───────────────────────────────────────────────────────────
  currentBooking: BookingHoldResponse | null;
  bookingId:      string | null;

  // ── Stubs ─────────────────────────────────────────────────────────────────
  pnrRecord:       PnrRecord       | null;
  paymentApproval: PaymentApproval | null;

  // ── Confirm ───────────────────────────────────────────────────────────────
  confirmResponse: BookingConfirmResponse | null;

  // ── UI ────────────────────────────────────────────────────────────────────
  isLoading:   boolean;
  currentStep: 'search' | 'results' | 'details' | 'booking' | 'policy' | 'confirmation';

  // ── Actions ───────────────────────────────────────────────────────────────
  setSearchRequest:    (req: SearchRequest) => void;
  setSearchResults:    (results: FlightOffer[]) => void;
  selectFlight:        (flight: FlightOffer) => void;
  setPassengers:       (passengers: PassengerInfo[]) => void;
  setPolicyEvaluation: (evaluation: PolicyEvaluationResponse) => void;
  setCurrentBooking:   (booking: BookingHoldResponse) => void;
  setBookingId:        (id: string) => void;
  setPnrRecord:        (pnr: PnrRecord) => void;
  setPaymentApproval:  (payment: PaymentApproval) => void;
  setConfirmResponse:  (resp: BookingConfirmResponse) => void;
  setIsLoading:        (loading: boolean) => void;
  setCurrentStep:      (step: BookingContextType['currentStep']) => void;
  reset:               () => void;

  /** @deprecated use selectFlight */
  selectHotel: (flight: FlightOffer) => void;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export interface BookingProviderProps { children: ReactNode; }

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [searchRequest,    setSearchRequest]    = useState<SearchRequest | null>(null);
  const [searchResults,    setSearchResults]    = useState<FlightOffer[] | null>(null);
  const [selectedFlight,   setSelectedFlight]   = useState<FlightOffer | null>(null);
  const [passengers,       setPassengers]       = useState<PassengerInfo[]>([]);
  const [policyEvaluation, setPolicyEvaluation] = useState<PolicyEvaluationResponse | null>(null);
  const [currentBooking,   setCurrentBooking]   = useState<BookingHoldResponse | null>(null);
  const [bookingId,        setBookingId]        = useState<string | null>(null);
  const [pnrRecord,        setPnrRecord]        = useState<PnrRecord | null>(null);
  const [paymentApproval,  setPaymentApproval]  = useState<PaymentApproval | null>(null);
  const [confirmResponse,  setConfirmResponse]  = useState<BookingConfirmResponse | null>(null);
  const [isLoading,        setIsLoading]        = useState(false);
  const [currentStep,      setCurrentStep]      = useState<BookingContextType['currentStep']>('search');

  const policyOutcome = policyEvaluation?.outcome ?? null;

  const selectFlight = (flight: FlightOffer) => {
    setSelectedFlight(flight);
    setCurrentStep('details');
  };

  const reset = () => {
    setSearchRequest(null);
    setSearchResults(null);
    setSelectedFlight(null);
    setPassengers([]);
    setPolicyEvaluation(null);
    setCurrentBooking(null);
    setBookingId(null);
    setPnrRecord(null);
    setPaymentApproval(null);
    setConfirmResponse(null);
    setCurrentStep('search');
  };

  const value: BookingContextType = {
    searchRequest,  searchResults,  selectedFlight,
    passengers,
    policyEvaluation, policyOutcome,
    currentBooking, bookingId,
    pnrRecord, paymentApproval,
    confirmResponse,
    isLoading, currentStep,
    setSearchRequest, setSearchResults, selectFlight,
    setPassengers,
    setPolicyEvaluation,
    setCurrentBooking, setBookingId,
    setPnrRecord, setPaymentApproval,
    setConfirmResponse,
    setIsLoading, setCurrentStep,
    reset,
    selectHotel: selectFlight,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useBookingContext = (): BookingContextType => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookingContext must be used within BookingProvider');
  return ctx;
};

export default BookingContext;
