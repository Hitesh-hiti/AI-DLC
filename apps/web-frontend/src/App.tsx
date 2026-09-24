/**
 * App — Flight booking platform entry point
 *
 * Implements REQ-EXP-01 (Search) + REQ-EXP-02 (Hold) flow:
 *   search → results → details (passengers) → booking (hold+policy) → confirmation
 *
 * AC-EXP-02-01 · AC-EXP-02-05 · AC-EXP-02-10
 * AC-EXP-03-01 · AC-EXP-03-08
 * AC-POL-01-05 · AC-POL-01-06 · AC-POL-04-03
 */

import React, { useState, useCallback } from 'react';

import { AppProvider } from './state/AppContext';
import { BookingProvider, useBookingContext } from './state/BookingContext';

import { SearchFlightScreen } from './components/search/SearchFlightScreen';
import { SearchResults } from './components/search/SearchResults';

import { PassengerForm } from './components/booking/PassengerForm';
import { BookingHoldPanel } from './components/booking/BookingHoldPanel';
import { ApprovalPendingScreen } from './components/booking/ApprovalPendingScreen';
import { BookingConfirmedScreen } from './components/booking/BookingConfirmedScreen';
import { CancelledScreen } from './components/booking/CancelledScreen';
import { ExpiredBookingScreen } from './components/booking/ExpiredBookingScreen';

import { NotificationCentre } from './components/notifications/NotificationCentre';
import { Alert } from './components/common/Alert';
import { ToastContainer, type ToastItem, type ToastVariant } from './components/common/Toast';

import { bookingService } from './api/services/bookingService';
import { mapApiError } from './api/services/errorMapper';

import type { SearchRequest, FlightOffer } from './api/types/search';
import type { PassengerInfo } from './api/types/booking';

import { Header, type AppPage } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ComingSoonPage } from './components/layout/ComingSoonPage';

import './App.css';

/* ─────────────────────────────────────────────────────────────────────────────
 * Inner page — consumes context
 * ──────────────────────────────────────────────────────────────────────────── */

const BookingPage: React.FC = () => {
  const ctx = useBookingContext();

  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [activePage, setActivePage] = useState<AppPage>('search');

  const clearError = () => setError(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, variant, duration: 4000 }]);
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Step: search ─────────────────────────────────────────────────────── */

  const handleSearch = async (request: SearchRequest) => {
    try {
      clearError();

      ctx.setIsLoading(true);
      ctx.setCurrentStep('search');

      const response = await bookingService.searchFlights(request);

      ctx.setSearchRequest(request);
      ctx.setSearchResults(response.results);
      ctx.setCurrentStep('results');
    } catch (err) {
      console.error('SEARCH ERROR:', err);
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  /* ── Step: select flight → go to passenger form ──────────────────────── */

  const handleSelectFlight = (flight: FlightOffer) => {
    ctx.selectFlight(flight);
  };

  /* ── Step: passenger form submitted → evaluate policy + prepare hold ── */

  const handlePassengersSubmit = async (passengers: PassengerInfo[]) => {
    if (!ctx.selectedFlight) return;

    try {
      clearError();

      ctx.setIsLoading(true);
      ctx.setPassengers(passengers);

      const policyResp = await bookingService.evaluatePolicy({
        organizationId: 'org-001',
        travelerId: 'traveler-001',
        offerId: ctx.selectedFlight.offerId,

        flight: {
          origin: ctx.selectedFlight.origin,
          destination: ctx.selectedFlight.destination,
          departureDate: ctx.selectedFlight.departureTime.split('T')[0],
          cabinClass: ctx.selectedFlight.cabinClass,
          airline: ctx.selectedFlight.airline,
          nonStop: ctx.selectedFlight.stops === 0,

          advanceBookingDays: Math.max(
            0,
            Math.ceil(
              (new Date(ctx.selectedFlight.departureTime).getTime() -
                Date.now()) /
                86400000
            )
          ),
        },

        totalFare: ctx.selectedFlight.price,
        purpose: 'BUSINESS',

        audit: {
          userId: 'traveler-001',
          organizationId: 'org-001',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      ctx.setPolicyEvaluation(policyResp);
      ctx.setCurrentStep('booking');
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  /* ── Step: hold ──────────────────────────────────────────────────────── */

  const handleHold = async () => {
    if (!ctx.selectedFlight || !ctx.policyEvaluation) return;

    try {
      clearError();

      ctx.setIsLoading(true);

      const holdResp = await bookingService.holdBooking({
        offerId: ctx.selectedFlight.offerId,
        organizationId: 'org-001',
        travelerId: 'traveler-001',

        flightDetails: {
          origin: ctx.selectedFlight.origin,
          destination: ctx.selectedFlight.destination,
          departureDate: ctx.selectedFlight.departureTime.split('T')[0],
          cabinClass: ctx.selectedFlight.cabinClass,
          passengers: ctx.passengers.length,
        },

        passengerInfo: ctx.passengers,

        audit: {
          userId: 'traveler-001',
          organizationId: 'org-001',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      ctx.setCurrentBooking(holdResp);
      ctx.setBookingId(holdResp.bookingId);

      /* Generate PNR + payment stubs in parallel */
      const [pnr, payment] = await Promise.all([
        bookingService.generatePnr(holdResp.bookingId),

        bookingService.generatePaymentApproval(
          holdResp.bookingId,
          holdResp.fareBreakdown.totalFare
        ),
      ]);

      ctx.setPnrRecord(pnr);
      ctx.setPaymentApproval(payment);

      /* If approval required: go to approval-pending screen */
      if (
        holdResp.approvalDetails ||
        holdResp.bookingStatus === 'PENDING_APPROVAL'
      ) {
        showToast('Booking requires approval. Waiting for approval confirmation.', 'info');

        ctx.setCurrentStep('policy');

        return;
      }

      /* ALLOW/WARN: advance to confirmation */
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

      ctx.setConfirmResponse(confirmResp);

      showToast('Booking confirmed!');

      ctx.setCurrentStep('confirmation');
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  /* ── Step: cancel booking ────────────────────────────────────────────── */

  const handleCancelBooking = async (bookingId: string) => {
    try {
      clearError();

      ctx.setIsLoading(true);

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

      showToast('Booking cancelled successfully');

      ctx.reset();

      return cancelResp;
    } catch (err) {
      setError(mapApiError(err).displayMessage);
      return null;
    } finally {
      ctx.setIsLoading(false);
    }
  };

  /* ── Navigation handlers ────────────────────────────────────────────── */

  const handleReturnToSearch = () => {
    ctx.reset();
    clearError();
    setActivePage('search');
  };

  const handlePageNavigation = (page: AppPage) => {
    clearError();

    if (page === 'search') {
      ctx.reset();
    }

    setActivePage(page);
  };

  const handleBackToResults = () => {
    ctx.setCurrentStep('results');
  };

  const handleBackToPassengers = () => {
    ctx.setCurrentStep('details');
  };

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="app-shell">
      <Header
        activePage={activePage}
        onNavigate={handlePageNavigation}
      />

      <main className="app-content">
        {error && (
          <Alert
            variant="error"
            title="Error"
            message={error}
            dismissible
            onDismiss={clearError}
            data-testid="app-error-alert"
          />
        )}

        {activePage === 'my-trips' && (
          <ComingSoonPage title="My Trips" />
        )}

        {activePage === 'support' && (
          <ComingSoonPage title="Support" />
        )}

        {activePage === 'search' && (
          <>
            {(ctx.currentStep === 'search' ||
              ctx.currentStep === 'results') && (
              <>
                <SearchFlightScreen
                  onSearch={handleSearch}
                  isLoading={ctx.isLoading}
                />

                {ctx.searchResults && (
                  <SearchResults
                    results={ctx.searchResults}
                    onSelectFlight={handleSelectFlight}
                    isLoading={ctx.isLoading}
                  />
                )}
              </>
            )}

            {ctx.currentStep === 'details' &&
              ctx.selectedFlight && (
                <PassengerForm
                  passengerCount={ctx.searchRequest?.passengers ?? 1}
                  onSubmit={handlePassengersSubmit}
                  onBack={handleBackToResults}
                  isLoading={ctx.isLoading}
                />
              )}

            {ctx.currentStep === 'booking' &&
              ctx.selectedFlight &&
              ctx.policyEvaluation && (
                <BookingHoldPanel
                  flight={ctx.selectedFlight}
                  passengers={ctx.passengers}
                  policyEvaluation={ctx.policyEvaluation}
                  holdResponse={
                    ctx.currentBooking ?? undefined
                  }
                  paymentApproval={
                    ctx.paymentApproval ?? undefined
                  }
                  isLoading={ctx.isLoading}
                  onHold={handleHold}
                  onBack={handleBackToPassengers}
                  onReturnToSearch={handleReturnToSearch}
                />
              )}

            {ctx.currentStep === 'policy' &&
              ctx.currentBooking &&
              ctx.selectedFlight && (
                <ApprovalPendingScreen
                  holdResponse={ctx.currentBooking}
                  flight={ctx.selectedFlight}
                  onReturnToSearch={handleReturnToSearch}
                />
              )}

            {ctx.currentStep === 'confirmation' &&
              ctx.confirmResponse &&
              ctx.currentBooking &&
              ctx.selectedFlight && (
                <BookingConfirmedScreen
                  confirmResponse={ctx.confirmResponse}
                  holdResponse={ctx.currentBooking}
                  flight={ctx.selectedFlight}
                  pnrRecord={ctx.pnrRecord ?? undefined}
                  paymentApproval={
                    ctx.paymentApproval ?? undefined
                  }
                  onReturnToSearch={handleReturnToSearch}
                />
              )}

            {ctx.currentStep === 'cancelled' &&
              ctx.currentBooking && (
                <CancelledScreen
                  booking={ctx.currentBooking}
                  onReturnToSearch={handleReturnToSearch}
                />
              )}

            {ctx.currentStep === 'expired' &&
              ctx.currentBooking && (
                <ExpiredBookingScreen
                  booking={ctx.currentBooking}
                  onReturnToSearch={handleReturnToSearch}
                />
              )}
          </>
        )}
      </main>

      <NotificationCentre />

      <ToastContainer toasts={toasts} onClose={closeToast} />

      <Footer />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Root
 * ──────────────────────────────────────────────────────────────────────────── */

function App() {
  return (
    <AppProvider>
      <BookingProvider>
        <BookingPage />
      </BookingProvider>
    </AppProvider>
  );
}

export default App;