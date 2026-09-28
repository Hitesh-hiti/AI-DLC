/**
 * CancelledScreen Component
 * Shown after a booking is cancelled.
 * AC-EXP-04-01: update status to CANCELLED, show message, no refund calc (pre-ticket)
 * AC-EXP-04-02/03/05: refund breakdown when applicable
 */

import React from 'react';
import type { BookingHoldResponse } from '../../api/types/booking';
import type { CurrencyCode } from '../../api/types/common';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { CurrencyAmount } from '../common/CurrencyAmount';
import './CancelledScreen.css';

interface CancelledScreenProps {
  booking?: BookingHoldResponse;
  onReturnToSearch?: () => void;
  bookingReference?: string;
  flight?: {
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  };
  status?: 'CANCELLED' | 'REFUNDED';
  refundEligible?: boolean;
  withinVoidWindow?: boolean;
  refundDetails?: {
    grossAmount: number;
    currency: CurrencyCode;
    penaltyAmount: number;
    nonRefundableTaxBreakdown: Array<{ code: string; amount: number; currency: CurrencyCode }>;
    netRefundableAmount: number;
  };
  onCancelAnother?: () => void;
  onViewTrips?: () => void;
}

export const CancelledScreen: React.FC<CancelledScreenProps> = ({
  bookingReference,
  flight,
  status,
  refundEligible,
  withinVoidWindow,
  refundDetails,
  onCancelAnother,
  onViewTrips,
  booking,
  onReturnToSearch,
}) => {
  const resolvedBookingReference = bookingReference ?? booking?.confirmationNumber ?? booking?.bookingId ?? '—';
  const resolvedFlight = flight ?? (booking ? {
    origin: booking.flightSummary.origin,
    destination: booking.flightSummary.destination,
    departureTime: booking.flightSummary.departureTime,
    arrivalTime: booking.flightSummary.arrivalTime,
  } : { origin: '—', destination: '—', departureTime: new Date().toISOString(), arrivalTime: new Date().toISOString() });
  const resolvedStatus = status ?? 'CANCELLED';

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="cancelled-screen" aria-label="Booking cancelled" data-testid="cancelled-screen">
      {/* ── Status Header ───────────────────────────────────── */}
      <div className="cancelled-header">
        <div className={`cancelled-icon cancelled-${resolvedStatus.toLowerCase()}`} aria-hidden="true">
          {resolvedStatus === 'CANCELLED' ? '✕' : '✓'}
        </div>
        <h2 className="cancelled-title">
          {resolvedStatus === 'CANCELLED' ? 'Booking Cancelled' : 'Booking Refunded'}
        </h2>
        <p className="cancelled-subtitle">
          {resolvedStatus === 'CANCELLED'
            ? 'Your booking has been cancelled. No refund is applicable as no ticket was issued.'
            : 'Your refund has been processed. The amount will appear on your statement shortly.'}
        </p>
      </div>

      {/* ── Booking Reference ────────────────────────────────── */}
      <section className="cancelled-ref-card" aria-label="Booking reference">
        <div className="cancelled-ref-row">
          <span className="cancelled-label">Booking Reference</span>
          <span className="cancelled-value" data-testid="cancelled-booking-ref">
            {resolvedBookingReference}
          </span>
        </div>

        <div className="cancelled-ref-row">
          <span className="cancelled-label">Cancelled At</span>
          <span className="cancelled-value">{formatDateTime(new Date().toISOString())}</span>
        </div>

        <div className="cancelled-ref-row">
          <span className="cancelled-label">Route</span>
          <span className="cancelled-value">
            {resolvedFlight.origin} → {resolvedFlight.destination} ({formatDate(resolvedFlight.departureTime)})
          </span>
        </div>
      </section>

      {/* ── Refund Breakdown (AC-EXP-04-02/03/05) ────────────── */}
      {refundEligible && refundDetails && (
        <section className="cancelled-refund" aria-label="Refund breakdown">
          <h3 className="cancelled-section-title">Refund Summary</h3>

          {/* Void Window Indicator (AC-EXP-04-02) */}
          {withinVoidWindow && (
            <div className="cancelled-void-notice" role="status">
              <span className="cancelled-void-badge">Void Window</span>
              <span className="cancelled-void-text">
                Full refund available - within void window
              </span>
            </div>
          )}

          {/* Refund Amount Table */}
          <table className="cancelled-refund-table">
            <tbody>
              <tr>
                <td className="cancelled-refund-label">Gross Amount</td>
                <td className="cancelled-refund-value">
                  <CurrencyAmount money={{ amount: refundDetails.grossAmount, currency: refundDetails.currency }} />
                </td>
              </tr>

              {withinVoidWindow ? (
                <tr>
                  <td className="cancelled-refund-label">Penalty</td>
                  <td className="cancelled-refund-value">-</td>
                </tr>
              ) : (
                <tr>
                  <td className="cancelled-refund-label">Penalty</td>
                  <td className="cancelled-refund-value">
                    <CurrencyAmount money={{ amount: refundDetails.penaltyAmount, currency: refundDetails.currency }} negative />
                  </td>
                </tr>
              )}

              {/* Non-refundable Taxes (AC-EXP-04-05) */}
              {refundDetails.nonRefundableTaxBreakdown.map((tax, i) => (
                <tr key={i} className="cancelled-tax-row">
                  <td className="cancelled-refund-label">
                    <span className="cancelled-tax-code">{tax.code}</span>
                    <span className="cancelled-tax-note">Non-refundable tax</span>
                  </td>
                  <td className="cancelled-refund-value">
                    <CurrencyAmount money={{ amount: tax.amount, currency: tax.currency }} negative />
                  </td>
                </tr>
              ))}

              <tr className="cancelled-refund-total">
                <td className="cancelled-refund-label">
                  <strong>Net Refundable Amount</strong>
                </td>
                <td className="cancelled-refund-value">
                  <CurrencyAmount
                    money={{ amount: refundDetails.netRefundableAmount, currency: refundDetails.currency }}
                    size="lg"
                    highlight
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* ── Next Steps ────────────────────────────────���─────── */}
      <div className="cancelled-next-steps" aria-label="Next steps">
        <Alert variant="info" className="cancelled-alert">
          {resolvedStatus === 'CANCELLED'
            ? 'If you need to book a new flight, you can search for available options below.'
            : 'A confirmation email with your refund details has been sent to your registered email address.'}
        </Alert>
      </div>

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="cancelled-actions">
        {(onCancelAnother || onReturnToSearch) && (
          <Button type="button" variant="primary" size="lg" onClick={onCancelAnother ?? onReturnToSearch}>
            Book Another Flight
          </Button>
        )}
        {onViewTrips && (
          <Button type="button" variant="secondary" size="lg" onClick={onViewTrips}>
            View My Trips
          </Button>
        )}
      </div>
    </div>
  );
};

CancelledScreen.displayName = 'CancelledScreen';
