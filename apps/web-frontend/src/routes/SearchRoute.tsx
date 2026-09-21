/**
 * Search Route Component
 * Integrates the new SearchFlightScreen with existing booking flow
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFlightScreen } from '../components/search/SearchFlightScreen';
import { SearchResults } from '../components/search/SearchResults';
import { PassengerForm } from '../components/booking/PassengerForm';
import { BookingHoldPanel } from '../components/booking/BookingHoldPanel';
import { ApprovalPendingScreen } from '../components/booking/ApprovalPendingScreen';
import { BookingConfirmedScreen } from '../components/booking/BookingConfirmedScreen';
import { Alert } from '../components/common/Alert';
import { bookingService } from '../api/services/bookingService';
import { mapApiError } from '../api/services/errorMapper';
import type { SearchRequest, FlightOffer } from '../api/types/search';
import type { PassengerInfo } from '../api/types/booking';

export const SearchRoute: React.FC = () => {
  const navigate = useNavigate();
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([]);
  const [policyEvaluation, setPolicyEvaluation] = useState<any>(null);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [confirmResponse, setConfirmResponse] = useState<any>(null);
  const [pnrRecord, setPnrRecord] = useState<any>(null);
  const [paymentApproval, setPaymentApproval] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const handleSearch = async (request: SearchRequest) => {
    try {
      clearError();
      setIsLoading(true);
      setSearchRequest(request);
      
      const response = await bookingService.searchFlights(request);
      setSearchResults(response.results);
      setIsLoading(false);
    } catch (err) {
      console.error('SEARCH ERROR:', err);
      setError(mapApiError(err).displayMessage);
      setIsLoading(false);
    }
  };

  const handleSelectFlight = (flight: FlightOffer) => {
    setSelectedFlight(flight);
  };

  const handlePassengersSubmit = async (passengersData: PassengerInfo[]) => {
    if (!selectedFlight) return;
    
    try {
      clearError();
      setIsLoading(true);
      setPassengers(passengersData);

      const policyResp = await bookingService.evaluatePolicy({
        organizationId: 'org-001',
        travelerId: 'traveler-001',
        offerId: selectedFlight.offerId,
        flight: {
          origin: selectedFlight.origin,
          destination: selectedFlight.destination,
          departureDate: selectedFlight.departureTime.split('T')[0],
          cabinClass: selectedFlight.cabinClass,
          airline: selectedFlight.airline,
          nonStop: selectedFlight.stops === 0,
          advanceBookingDays: Math.max(0, Math.ceil((new Date(selectedFlight.departureTime).getTime() - Date.now()) / 86400000)),
        },
        totalFare: selectedFlight.price,
        purpose: 'BUSINESS',
        audit: {
          userId: 'traveler-001',
          organizationId: 'org-001',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      setPolicyEvaluation(policyResp);
      setIsLoading(false);
    } catch (err) {
      setError(mapApiError(err).displayMessage);
      setIsLoading(false);
    }
  };

  const handleHold = async () => {
    if (!selectedFlight || !policyEvaluation) return;

    try {
      clearError();
      setIsLoading(true);

      const holdResp = await bookingService.holdBooking({
        offerId: selectedFlight.offerId,
        organizationId: 'org-001',
        travelerId: 'traveler-001',
        flightDetails: {
          origin: selectedFlight.origin,
          destination: selectedFlight.destination,
          departureDate: selectedFlight.departureTime.split('T')[0],
          cabinClass: selectedFlight.cabinClass,
          passengers: passengers.length,
        },
        passengerInfo: passengers,
        audit: {
          userId: 'traveler-001',
          organizationId: 'org-001',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      setCurrentBooking(holdResp);

      const [pnr, payment] = await Promise.all([
        bookingService.generatePnr(holdResp.bookingId),
        bookingService.generatePaymentApproval(holdResp.bookingId, holdResp.fareBreakdown.totalFare),
      ]);
      setPnrRecord(pnr);
      setPaymentApproval(payment);

      if (holdResp.approvalDetails || holdResp.bookingStatus === 'PENDING_APPROVAL') {
        setIsLoading(false);
        return;
      }

      const confirmResp = await bookingService.confirmBooking({
        bookingId: holdResp.bookingId,
        paymentReference: payment.paymentReference,
        audit: {
          userId: 'traveler-001',
          organizationId: 'org-001',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      setConfirmResponse(confirmResp);
      setIsLoading(false);
    } catch (err) {
      setError(mapApiError(err).displayMessage);
      setIsLoading(false);
    }
  };

  const handleReturnToSearch = () => {
    setSearchRequest(null);
    setSearchResults([]);
    setSelectedFlight(null);
    setPassengers([]);
    setPolicyEvaluation(null);
    setCurrentBooking(null);
    setConfirmResponse(null);
    setPnrRecord(null);
    setPaymentApproval(null);
    setError(null);
  };

  const handleBackToResults = () => {
    setSelectedFlight(null);
  };

  const handleBackToPassengers = () => {
    setSelectedFlight(null);
  };

  // Determine which screen to show
  if (confirmResponse && currentBooking && selectedFlight) {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <BookingConfirmedScreen
          confirmResponse={confirmResponse}
          holdResponse={currentBooking}
          flight={selectedFlight}
          pnrRecord={pnrRecord}
          paymentApproval={paymentApproval}
          onReturnToSearch={handleReturnToSearch}
        />
      </>
    );
  }

  if (policyEvaluation && currentBooking && !confirmResponse) {
    // Approval pending or booking screen
    if (policyEvaluation.outcome === 'REQUIRE_APPROVAL') {
      return (
        <>
          <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
          <ApprovalPendingScreen
            holdResponse={currentBooking}
            flight={selectedFlight || {} as FlightOffer}
            onReturnToSearch={handleReturnToSearch}
          />
        </>
      );
    }
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <BookingHoldPanel
          flight={selectedFlight!}
          passengers={passengers}
          policyEvaluation={policyEvaluation}
          holdResponse={currentBooking}
          paymentApproval={paymentApproval}
          isLoading={isLoading}
          onHold={handleHold}
          onBack={handleBackToPassengers}
          onReturnToSearch={handleReturnToSearch}
        />
      </>
    );
  }

  if (selectedFlight && !policyEvaluation) {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <PassengerForm
          passengerCount={searchRequest?.passengers ?? 1}
          onSubmit={handlePassengersSubmit}
          onBack={handleBackToResults}
          isLoading={isLoading}
        />
      </>
    );
  }

  if (searchResults.length > 0) {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <SearchResults
          results={searchResults}
          onSelectFlight={handleSelectFlight}
          isLoading={isLoading}
        />
      </>
    );
  }

  return <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />;
};
