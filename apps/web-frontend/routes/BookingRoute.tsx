/**
 * Booking Route - Main application routing with SearchFlightScreen integration
 * Combines the new SearchFlightScreen with the existing booking flow context
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFlightScreen } from '../components/search/SearchFlightScreen';
import { SearchResults } from '../components/search/SearchResults';
import { PassengerForm } from '../components/booking/PassengerForm';
import { BookingHoldPanel } from '../components/booking/BookingHoldPanel';
import { ApprovalPendingScreen } from '../components/booking/ApprovalPendingScreen';
import { BookingConfirmedScreen } from '../components/booking/BookingConfirmedScreen';
import { CancelledScreen } from '../components/booking/CancelledScreen';
import { ExpiredBookingScreen } from '../components/booking/ExpiredBookingScreen';
import { NotificationCentre } from '../components/notifications/NotificationCentre';
import { Alert } from '../components/common/Alert';
import { bookingService } from '../api/services/bookingService';
import { mapApiError } from '../api/services/errorMapper';
import type { SearchRequest, FlightOffer } from '../api/types/search';
import type { PassengerInfo } from '../api/types/booking';

/**
 * Route state for managing the booking journey
 */
interface BookingRouteState {
  // Search state
  searchRequest: SearchRequest | null;
  searchResults: any[];
  selectedFlight: FlightOffer | null;
  
  // Passenger state
  passengers: PassengerInfo[];
  
  // Policy state
  policyEvaluation: any;
  
  // Booking state
  currentBooking: any;
  confirmResponse: any;
  pnrRecord: any;
  paymentApproval: any;
  notificationMessage: string | null;
}

/**
 * BookingRoute - Main routing component integrating SearchFlightScreen
 * 
 * AC-EXP-02-01 · AC-EXP-02-05 · AC-EXP-02-10 (Search)
 * AC-EXP-03-01 · AC-EXP-03-08 (Booking flow)
 * AC-EXP-03-07 (TicketingInProgress)
 * AC-EXP-04-01/02/03/05 (Cancel, Expired, Trip management)
 * AC-EXP-08-01/02/03/04 (NotificationCentre)
 */
export const BookingRoute: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<BookingRouteState>({
    searchRequest: null,
    searchResults: [],
    selectedFlight: null,
    passengers: [],
    policyEvaluation: null,
    currentBooking: null,
    confirmResponse: null,
    pnrRecord: null,
    paymentApproval: null,
    notificationMessage: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    searchRequest, searchResults, selectedFlight, passengers, 
    policyEvaluation, currentBooking, confirmResponse, 
    pnrRecord, paymentApproval, notificationMessage 
  } = state;

  // Clear error handler
  const clearError = () => setError(null);

  // Clear notification handler
  const clearNotification = () => 
    setState(prev => ({ ...prev, notificationMessage: null }));

  // ── Search handler ────────────────────────────────────────────────────
  const handleSearch = async (request: SearchRequest) => {
    try {
      clearError();
      setIsLoading(true);
      
      const response = await bookingService.searchFlights(request);
      
      setState(prev => ({
        ...prev,
        searchRequest: request,
        searchResults: response.results,
        selectedFlight: null,
      }));
    } catch (err) {
      console.error('SEARCH ERROR:', err);
      setError(mapApiError(err).displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Select flight handler ─────────────────────────────────────────────
  const handleSelectFlight = (flight: FlightOffer) => {
    setState(prev => ({ ...prev, selectedFlight: flight }));
  };

  // ── Passenger form submit handler ─────────────────────────────────────
  const handlePassengersSubmit = async (passengersData: PassengerInfo[]) => {
    if (!selectedFlight) return;
    
    try {
      clearError();
      setIsLoading(true);
      
      setState(prev => ({ ...prev, passengers: passengersData }));

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
          advanceBookingDays: Math.max(
            0,
            Math.ceil(
              (new Date(selectedFlight.departureTime).getTime() - Date.now()) / 86400000
            )
          ),
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

      setState(prev => ({ ...prev, policyEvaluation: policyResp }));
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Hold booking handler ──────────────────────────────────────────────
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

      // Generate PNR + payment stubs in parallel
      const [pnr, payment] = await Promise.all([
        bookingService.generatePnr(holdResp.bookingId),
        bookingService.generatePaymentApproval(
          holdResp.bookingId,
          holdResp.fareBreakdown.totalFare
        ),
      ]);

      setState(prev => ({
        ...prev,
        currentBooking: holdResp,
        pnrRecord: pnr,
        paymentApproval: payment,
      }));

      // Check if approval required
      if (holdResp.approvalDetails || holdResp.bookingStatus === 'PENDING_APPROVAL') {
        setState(prev => ({
          ...prev,
          notificationMessage: 'Booking requires approval. Please wait for approval confirmation.'
        }));
        return;
      }

      // Auto-confirm for demo/mock
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

      setState(prev => ({
        ...prev,
        confirmResponse: confirmResp,
        notificationMessage: 'Booking confirmed successfully! PNR: ' + pnr.pnr,
      }));
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Cancel booking handler ────────────────────────────────────────────
  const handleCancelBooking = async (bookingId: string) => {
    try {
      clearError();
      setIsLoading(true);

      const cancelResp = await bookingService.cancelBooking({
        bookingId,
        audit: {
          userId: 'traveler-001',
          organizationId: 'org-001',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      setState(prev => ({
        ...prev,
        currentBooking: { ...prev.currentBooking, status: 'CANCELLED' },
        notificationMessage: 'Booking cancelled successfully',
      }));

      return cancelResp;
    } catch (err) {
      setError(mapApiError(err).displayMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Handle trip detail navigation ─────────────────────────────────────
  const handleTripDetail = async (tripId: string) => {
    try {
      clearError();
      setIsLoading(true);

      const tripResp = await bookingService.getTripDetails(tripId);
      
      setState(prev => ({
        ...prev,
        currentBooking: tripResp.bookings?.[0] || null,
        notificationMessage: 'Trip details loaded',
      }));
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset/clear state handler ─────────────────────────────────────────
  const handleReset = () => {
    setState({
      searchRequest: null,
      searchResults: [],
      selectedFlight: null,
      passengers: [],
      policyEvaluation: null,
      currentBooking: null,
      confirmResponse: null,
      pnrRecord: null,
      paymentApproval: null,
      notificationMessage: null,
    });
    setError(null);
  };

  // ── Render conditional screens ────────────────────────────────────────
  
  // Show confirmation screen
  if (confirmResponse && currentBooking && selectedFlight) {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        {notificationMessage && (
          <Alert
            variant="success"
            title="Success"
            message={notificationMessage}
            dismissible
            onDismiss={clearNotification}
          />
        )}
        <BookingConfirmedScreen
          confirmResponse={confirmResponse}
          holdResponse={currentBooking}
          flight={selectedFlight}
          pnrRecord={pnrRecord}
          paymentApproval={paymentApproval}
          onReturnToSearch={handleReset}
        />
        <NotificationCentre onClose={clearNotification} />
      </>
    );
  }

  // Show approval pending screen
  if (policyEvaluation && currentBooking && !confirmResponse) {
    if (policyEvaluation.outcome === 'REQUIRE_APPROVAL') {
      return (
        <>
          <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
          {notificationMessage && (
            <Alert
              variant="info"
              title="Approval Required"
              message={notificationMessage}
              dismissible
              onDismiss={clearNotification}
            />
          )}
          <ApprovalPendingScreen
            holdResponse={currentBooking}
            flight={selectedFlight || ({} as FlightOffer)}
            onReturnToSearch={handleReset}
          />
          <NotificationCentre onClose={clearNotification} />
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
          onBack={() => setState(prev => ({ ...prev, selectedFlight: null }))}
          onReturnToSearch={handleReset}
        />
        <NotificationCentre onClose={clearNotification} />
      </>
    );
  }

  // Show cancelled screen (for AC-EXP-04)
  if (currentBooking?.status === 'CANCELLED') {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <CancelledScreen
          booking={currentBooking}
          onReturnToSearch={handleReset}
        />
        <NotificationCentre onClose={clearNotification} />
      </>
    );
  }

  // Show expired booking screen (for AC-EXP-06)
  if (currentBooking?.status === 'EXPIRED') {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <ExpiredBookingScreen
          booking={currentBooking}
          onReturnToSearch={handleReset}
        />
        <NotificationCentre onClose={clearNotification} />
      </>
    );
  }

  // Show passenger form
  if (selectedFlight && !policyEvaluation) {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <PassengerForm
          passengerCount={searchRequest?.passengers ?? 1}
          onSubmit={handlePassengersSubmit}
          onBack={() => setState(prev => ({ ...prev, selectedFlight: null }))}
          isLoading={isLoading}
        />
        <NotificationCentre onClose={clearNotification} />
      </>
    );
  }

  // Show search results
  if (searchResults.length > 0) {
    return (
      <>
        <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
        <SearchResults
          results={searchResults}
          onSelectFlight={handleSelectFlight}
          isLoading={isLoading}
        />
        <NotificationCentre onClose={clearNotification} />
      </>
    );
  }

  // Default: Search flight screen
  return (
    <>
      <SearchFlightScreen onSearch={handleSearch} isLoading={isLoading} />
      {error && (
        <Alert
          variant="error"
          title="Error"
          message={error}
          dismissible
          onDismiss={clearError}
        />
      )}
      <NotificationCentre onClose={clearNotification} />
    </>
  );
};

BookingRoute.displayName = 'BookingRoute';
