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
import { Button } from './components/common/Button';
import { bookingService } from './api/services/bookingService';
import { mapApiError } from './api/services/errorMapper';
import type { SearchRequest, FlightOffer } from './api/types/search';
import type { PassengerInfo } from './api/types/booking';
import './App.css';

// ─── Inner page — consumes context ────────────────────────────────────────────

const BookingPage: React.FC = () => {
  const ctx = useBookingContext();
  const [error, setError] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const clearError = () => setError(null);
  const clearNotification = () => setNotificationMessage(null);

  // ── Step: search ────────────────────────────────────────────────────────────
  const handleSearch = async (request: SearchRequest) => {
    try {
      clearError();
      clearNotification();
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

  // ── Step: select flight → go to passenger form ──────────────────────────────
  const handleSelectFlight = (flight: FlightOffer) => {
    ctx.selectFlight(flight); // sets currentStep → 'details'
  };

  // ── Step: passenger form submitted → evaluate policy + prepare hold ─────────
  const handlePassengersSubmit = async (passengers: PassengerInfo[]) => {
    if (!ctx.selectedFlight) return;
    try {
      clearError();
      clearNotification();
      ctx.setIsLoading(true);
      ctx.setPassengers(passengers);

      // Evaluate policy before presenting the hold panel (AC-POL-01-05/06)
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
              (new Date(ctx.selectedFlight.departureTime).getTime() - Date.now()) / 86400000
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
      clearNotification();
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

      // Generate PNR + payment stubs in parallel
      const [pnr, payment] = await Promise.all([
        bookingService.generatePnr(holdResp.bookingId),
        bookingService.generatePaymentApproval(
          holdResp.bookingId,
          holdResp.fareBreakdown.totalFare
        ),
      ]);
      ctx.setPnrRecord(pnr);
      ctx.setPaymentApproval(payment);

      // If approval required: go to approval-pending screen
      if (holdResp.approvalDetails || holdResp.bookingStatus === 'PENDING_APPROVAL') {
        setNotificationMessage('Booking requires approval. Please wait for approval confirmation.');
        ctx.setCurrentStep('policy'); // reuse 'policy' step for approval-pending
        return;
      }

      // ALLOW/WARN: advance to confirmation (auto-confirm for the mock)
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
      setNotificationMessage(`Booking confirmed successfully! PNR: ${pnr.pnr}`);
      ctx.setCurrentStep('confirmation');
    } catch (err) {
      setError(mapApiError(err).displayMessage);
    } finally {
      ctx.setIsLoading(false);
    }
  };

  // ── Step: cancel booking ────────────────────────────────────────────────────
  const handleCancelBooking = async (bookingId: string) => {
    try {
      clearError();
      clearNotification();
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

      setNotificationMessage('Booking cancelled successfully');
      ctx.reset();
      return cancelResp;
    } catch (err) {
      setError(mapApiError(err).displayMessage);
      return null;
    } finally {
      ctx.setIsLoading(false);
    }
  };

  // ── Navigation handlers ─────────────────────────────────────────────────────
  const handleReturnToSearch = () => {
    ctx.reset();
    clearError();
    clearNotification();
  };

  const handleBackToResults = () => ctx.setCurrentStep('results');
  const handleBackToPassengers = () => ctx.setCurrentStep('details');

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Navigation Bar (Fixed Top) ──────────────────────────────────────── */}
      <nav className="app-nav" role="navigation" aria-label="Main navigation">
        <div className="app-nav-container">
          <div className="app-nav-logo" onClick={handleReturnToSearch} role="link" tabIndex={0}>
            <div className="nav-logo-icon" aria-hidden="true">✈</div>
            <span className="nav-logo-text">TravelPlatform</span>
          </div>
          <div className="app-nav-links">
            <button type="button" onClick={handleReturnToSearch} className="nav-link active">
              Search
            </button>
            <button type="button" className="nav-link">
              My Trips
            </button>
            <button type="button" className="nav-link">
              Refunds
            </button>
            <button type="button" className="nav-link">
              Support
            </button>
          </div>
          <div className="app-nav-actions">
            <button type="button" className="nav-btn">Sign In</button>
            <button type="button" className="nav-btn nav-btn-primary">Sign Up</button>
          </div>
        </div>
      </nav>

      {/* Decorative travel pins */}
      <div className="travel-pin" /><div className="travel-pin" />
      <div className="travel-pin" /><div className="travel-pin" />
      <div className="travel-pin" />

      <div className="app-container">
        {/* ── Global error ──────────────────────────────────────────────────── */}
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

        {/* ── Notification message ──────────────────────────────────────────── */}
        {notificationMessage && (
          <Alert
            variant="success"
            title="Success"
            message={notificationMessage}
            dismissible
            onDismiss={clearNotification}
            data-testid="app-notification-alert"
          />
        )}

        {/* ── Step: search + results ────────────────────────────────────────── */}
        {(ctx.currentStep === 'search' || ctx.currentStep === 'results') && (
          <>
            <SearchFlightScreen onSearch={handleSearch} isLoading={ctx.isLoading} />
            {ctx.searchResults && (
              <SearchResults
                results={ctx.searchResults}
                onSelectFlight={handleSelectFlight}
                isLoading={ctx.isLoading}
              />
            )}
          </>
        )}

        {/* ── Step: details — passenger form ────────────────────────────────── */}
        {ctx.currentStep === 'details' && ctx.selectedFlight && (
          <PassengerForm
            passengerCount={ctx.searchRequest?.passengers ?? 1}
            onSubmit={handlePassengersSubmit}
            onBack={handleBackToResults}
            isLoading={ctx.isLoading}
          />
        )}

        {/* ── Step: booking — hold panel + policy ────────────────────────────── */}
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

        {/* ── Step: policy — approval pending ────────────────────────────────── */}
        {ctx.currentStep === 'policy' &&
          ctx.currentBooking &&
          ctx.selectedFlight && (
          <ApprovalPendingScreen
            holdResponse={ctx.currentBooking}
            flight={ctx.selectedFlight}
            onReturnToSearch={handleReturnToSearch}
          />
        )}

        {/* ── Step: confirmation ────────────────────────────────────────────── */}
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

        {/* ── Step: cancelled ───────────────────────────────────────────────── */}
        {ctx.currentStep === 'cancelled' && ctx.currentBooking && (
          <CancelledScreen
            booking={ctx.currentBooking}
            onReturnToSearch={handleReturnToSearch}
          />
        )}

        {/* ── Step: expired ─────────────────────────────────────────────────── */}
        {ctx.currentStep === 'expired' && ctx.currentBooking && (
          <ExpiredBookingScreen
            booking={ctx.currentBooking}
            onReturnToSearch={handleReturnToSearch}
          />
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="app-footer" role="contentinfo">
          <div className="footer-container">
            <div className="footer-section">
              <h4 className="footer-section-title">TravelPlatform</h4>
              <p className="footer-section-text">
                Your trusted partner for flight bookings worldwide.
                Transparent pricing, flexible options, and 24/7 support.
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-section-title">Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#press">Press</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-section-title">Support</h4>
              <ul className="footer-links">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#refunds">Refunds</a></li>
                <li><a href="#support">Contact Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-section-title">Legal</h4>
              <ul className="footer-links">
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#cookies">Cookie Policy</a></li>
                <li><a href="#accessibility">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-bottom-text">&copy; 2026 TravelPlatform. All rights reserved.</p>
            <div className="footer-bottom-actions">
              <button type="button" className="footer-language-btn" aria-label="Change language">
                🌐 English
              </button>
              <button type="button" className="footer-currency-btn" aria-label="Change currency">
                💵 USD
              </button>
            </div>
          </div>
        </footer>

        {/* ── Notification Centre (Hidden by default, can be opened) ──────────── */}
        <NotificationCentre onClose={clearNotification} />
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
