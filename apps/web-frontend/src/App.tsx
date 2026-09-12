/**
 * App — Flight booking platform entry point
 * Implements REQ-EXP-01 (Search) + REQ-EXP-02 (Hold) flow:
 *   search → results → details (passengers) → booking (hold+policy) → confirmation
 *
 * AC-EXP-02-01 · AC-EXP-02-05 · AC-EXP-02-10
 * AC-EXP-03-01 · AC-EXP-03-08
 * AC-POL-01-05 · AC-POL-01-06 · AC-POL-04-03
 */

import React, { useState } from 'react';
import { AppProvider } from './state/AppContext';
import { BookingProvider, useBookingContext } from './state/BookingContext';
import { SearchForm } from './components/search/SearchForm';
import { SearchResults } from './components/search/SearchResults';
import { PassengerForm } from './components/booking/PassengerForm';
import { BookingHoldPanel } from './components/booking/BookingHoldPanel';
import { ApprovalPendingScreen } from './components/booking/ApprovalPendingScreen';
import { BookingConfirmedScreen } from './components/booking/BookingConfirmedScreen';
import { Alert } from './components/common/Alert';
import { bookingService } from './api/services/bookingService';
import { mapApiError } from './api/services/errorMapper';
import type { SearchRequest, FlightOffer } from './api/types/search';
import type { PassengerInfo } from './api/types/booking';
import './App.css';

// ─── Inner page — consumes context ────────────────────────────────────────────

const BookingPage: React.FC = () => {
  const ctx = useBookingContext();
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // ── Step: search ────────────────────────────────────────────────────────────
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
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  // ── Step: select flight → go to passenger form ──────────────────────────────
  const handleSelectFlight = (flight: FlightOffer) => {
    ctx.selectFlight(flight); // sets currentStep → 'details'
  };

  // ── Step: passenger form submitted → evaluate policy + prepare hold ─────────
  const handlePassengersSubmit = async (passengers: PassengerInfo[]) => {
    if (!ctx.selectedFlight) return;
    try {
      clearError();
      ctx.setIsLoading(true);
      ctx.setPassengers(passengers);

      // Evaluate policy before presenting the hold panel (AC-POL-01-05/06)
      const policyResp = await bookingService.evaluatePolicy({
        organizationId: 'org-001',
        travelerId:     'traveler-001',
        offerId:        ctx.selectedFlight.offerId,
        flight: {
          origin:             ctx.selectedFlight.origin,
          destination:        ctx.selectedFlight.destination,
          departureDate:      ctx.selectedFlight.departureTime.split('T')[0],
          cabinClass:         ctx.selectedFlight.cabinClass,
          airline:            ctx.selectedFlight.airline,
          nonStop:            ctx.selectedFlight.stops === 0,
          advanceBookingDays: Math.max(
            0,
            Math.ceil(
              (new Date(ctx.selectedFlight.departureTime).getTime() - Date.now()) / 86400000,
            ),
          ),
        },
        totalFare: ctx.selectedFlight.price,
        purpose:   'BUSINESS',
        audit: {
          userId: 'traveler-001', organizationId: 'org-001',
          timestamp: new Date().toISOString(), requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      ctx.setPolicyEvaluation(policyResp);
      ctx.setCurrentStep('booking'); // show BookingHoldPanel
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  // ── Step: hold ──────────────────────────────────────────────────────────────
  const handleHold = async () => {
    if (!ctx.selectedFlight || !ctx.policyEvaluation) return;

    try {
      clearError();
      ctx.setIsLoading(true);

      const holdResp = await bookingService.holdBooking({
        offerId:        ctx.selectedFlight.offerId,
        organizationId: 'org-001',
        travelerId:     'traveler-001',
        flightDetails: {
          origin:        ctx.selectedFlight.origin,
          destination:   ctx.selectedFlight.destination,
          departureDate: ctx.selectedFlight.departureTime.split('T')[0],
          cabinClass:    ctx.selectedFlight.cabinClass,
          passengers:    ctx.passengers.length,
        },
        passengerInfo: ctx.passengers,
        audit: {
          userId: 'traveler-001', organizationId: 'org-001',
          timestamp: new Date().toISOString(), requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      ctx.setCurrentBooking(holdResp);
      ctx.setBookingId(holdResp.bookingId);

      // Generate PNR + payment stubs in parallel
      const [pnr, payment] = await Promise.all([
        bookingService.generatePnr(holdResp.bookingId),
        bookingService.generatePaymentApproval(
          holdResp.bookingId,
          holdResp.fareBreakdown.totalFare,
        ),
      ]);
      ctx.setPnrRecord(pnr);
      ctx.setPaymentApproval(payment);

      // If approval required: go to approval-pending screen
      if (holdResp.approvalDetails || holdResp.bookingStatus === 'PENDING_APPROVAL') {
        ctx.setCurrentStep('policy'); // reuse 'policy' step for approval-pending
        return;
      }

      // ALLOW/WARN: advance to confirmation (auto-confirm for the mock)
      const confirmResp = await bookingService.confirmBooking({
        bookingId:        holdResp.bookingId,
        paymentReference: payment.paymentReference,
        audit: {
          userId: 'traveler-001', organizationId: 'org-001',
          timestamp: new Date().toISOString(), requestId: crypto.randomUUID(),
          source: 'WEB',
        },
      });

      ctx.setConfirmResponse(confirmResp);
      ctx.setCurrentStep('confirmation');
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  const handleReturnToSearch = () => ctx.reset();
  const handleBackToResults  = () => ctx.setCurrentStep('results');
  const handleBackToPassengers = () => ctx.setCurrentStep('details');

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Decorative travel pins */}
      <div className="travel-pin" /><div className="travel-pin" />
      <div className="travel-pin" /><div className="travel-pin" />
      <div className="travel-pin" />

      <div className="app-container">
        {/* ── Header ─────────────────────────────────────── */}
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-header-icon">✈</div>
            <h1>TravelPlatform</h1>
            <p>Find and book flights with policy compliance</p>
          </div>
        </header>

        {/* ── Global error ───────────────────────────────── */}
        {error && (
          <Alert variant="error" title="Error" message={error}
            dismissible onDismiss={clearError} />
        )}

        {/* ── Step: search + results ──────────────────────── */}
        {(ctx.currentStep === 'search' || ctx.currentStep === 'results') && (
          <>
            <SearchForm onSearch={handleSearch} isLoading={ctx.isLoading} />
            {ctx.searchResults && (
              <SearchResults
                results={ctx.searchResults}
                onSelectFlight={handleSelectFlight}
                isLoading={ctx.isLoading}
              />
            )}
          </>
        )}

        {/* ── Step: details — passenger form ─────────────── */}
        {ctx.currentStep === 'details' && ctx.selectedFlight && (
          <PassengerForm
            passengerCount={ctx.searchRequest?.passengers ?? 1}
            onSubmit={handlePassengersSubmit}
            onBack={handleBackToResults}
            isLoading={ctx.isLoading}
          />
        )}

        {/* ── Step: booking — hold panel + policy ────────── */}
        {ctx.currentStep === 'booking' &&
          ctx.selectedFlight &&
          ctx.policyEvaluation && (
          <BookingHoldPanel
            flight={ctx.selectedFlight}
            passengers={ctx.passengers}
            policyEvaluation={ctx.policyEvaluation}
            holdResponse={ctx.currentBooking ?? undefined}
            paymentApproval={ctx.paymentApproval ?? undefined}
            isLoading={ctx.isLoading}
            onHold={handleHold}
            onBack={handleBackToPassengers}
            onReturnToSearch={handleReturnToSearch}
          />
        )}

        {/* ── Step: policy — approval pending ────────────── */}
        {ctx.currentStep === 'policy' &&
          ctx.currentBooking &&
          ctx.selectedFlight && (
          <ApprovalPendingScreen
            holdResponse={ctx.currentBooking}
            flight={ctx.selectedFlight}
            onReturnToSearch={handleReturnToSearch}
          />
        )}

        {/* ── Step: confirmation ──────────────────────────── */}
        {ctx.currentStep === 'confirmation' &&
          ctx.confirmResponse &&
          ctx.currentBooking &&
          ctx.selectedFlight && (
          <BookingConfirmedScreen
            confirmResponse={ctx.confirmResponse}
            holdResponse={ctx.currentBooking}
            flight={ctx.selectedFlight}
            pnrRecord={ctx.pnrRecord ?? undefined}
            paymentApproval={ctx.paymentApproval ?? undefined}
            onReturnToSearch={handleReturnToSearch}
          />
        )}
      </div>
    </>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

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
