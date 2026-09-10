/**
 * Booking Context
 * State management for active booking flow
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type {
  SearchRequest,
  FlightOffer,
  RateInfo,
  HotelDetailsResponse,
} from '../api/types/search';
import type { BookingHoldResponse } from '../api/types/booking';
import type { PolicyEvaluationResponse } from '../api/types/policy';
import type { PolicyOutcome } from '../api/types/common';

export interface BookingContextType {
  // Search state
  searchRequest: SearchRequest | null;
  searchResults: FlightOffer[] | null;
  selectedHotel: FlightOffer | null; // Flight acts as booking item
  hotelDetails: HotelDetailsResponse | null;
  selectedRate: RateInfo | null;

  // Booking state
  currentBooking: BookingHoldResponse | null;
  bookingId: string | null;

  // Policy state
  policyEvaluation: PolicyEvaluationResponse | null;
  policyOutcome: PolicyOutcome | null;

  // UI state
  isLoading: boolean;
  currentStep: 'search' | 'results' | 'details' | 'booking' | 'policy' | 'confirmation';

  // Actions
  setSearchRequest: (req: SearchRequest) => void;
  setSearchResults: (results: FlightOffer[]) => void;
  selectHotel: (hotel: FlightOffer) => void;
  setHotelDetails: (details: HotelDetailsResponse) => void;
  selectRate: (rate: RateInfo) => void;
  setCurrentBooking: (booking: BookingHoldResponse) => void;
  setBookingId: (id: string) => void;
  setPolicyEvaluation: (policyEvaluation: PolicyEvaluationResponse) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentStep: (step: BookingContextType['currentStep']) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [searchResults, setSearchResults] = useState<FlightOffer[] | null>(
    null
  );
  const [selectedHotel, setSelectedHotel] = useState<FlightOffer | null>(
    null
  );
  const [hotelDetails, setHotelDetails] =
    useState<HotelDetailsResponse | null>(null);
  const [selectedRate, setSelectedRate] = useState<RateInfo | null>(null);
  const [currentBooking, setCurrentBooking] =
    useState<BookingHoldResponse | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [policyResults, setPolicyResults] =
    useState<PolicyEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    BookingContextType['currentStep']
  >('search');

  const policyOutcome = policyResults?.outcome || null;

  const handleSelectHotel = (hotel: FlightOffer) => {
    setSelectedHotel(hotel);
    setCurrentStep('details');
  };

  const handleReset = () => {
    setSearchRequest(null);
    setSearchResults(null);
    setSelectedHotel(null);
    setHotelDetails(null);
    setSelectedRate(null);
    setCurrentBooking(null);
    setBookingId(null);
    setPolicyResults(null);
    setCurrentStep('search');
  };

  const value: BookingContextType = {
    searchRequest,
    searchResults,
    selectedHotel,
    hotelDetails,
    selectedRate,
    currentBooking,
    bookingId,
    policyEvaluation: policyResults,
    policyOutcome,
    isLoading,
    currentStep,
    setSearchRequest,
    setSearchResults,
    selectHotel: handleSelectHotel,
    setHotelDetails,
    selectRate: setSelectedRate,
    setCurrentBooking,
    setBookingId,
    setPolicyEvaluation: setPolicyResults,
    setIsLoading,
    setCurrentStep,
    reset: handleReset,
  };

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
};

/**
 * Hook to use Booking Context
 */
export const useBookingContext = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingContext must be used within BookingProvider');
  }
  return context;
};

export default BookingContext;
