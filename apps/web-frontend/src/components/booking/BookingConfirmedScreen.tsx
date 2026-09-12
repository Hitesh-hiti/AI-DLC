/**
 * BookingConfirmedScreen Component
 * Shown after a booking moves to CONFIRMED (ticket issued).
 * AC-EXP-03-08: display ticket number, coupon list, void window, fare total
 * Also shows PNR and payment reference stubs.
 */

import React from 'react';
import type { BookingConfirmResponse } from '../../api/types/booking';
import type { PnrRecord, PaymentApproval } from '../../api/types/booking';
import type { BookingHoldResponse } from '../../api/types/booking';
import type { FlightOffer } from '../../api/types/search';
import { CurrencyAmount } from '../common/CurrencyAmount';
import { Button } from '../common/Button';
import './BookingConfirmedScreen.css';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDuration(dur: string) {
  const m = dur.match(/PT(\d+H)?(\d+M)?/);
  if (!m) return dur;
  const h = m[1]?.replace('H', '') ?? '0';
  const min = m[2]?.replace('M', '') ?? '0';
  return h === '0' ? `${min}m` : min === '0' ? `${h}h` : `${h}h ${min}m`;
}

export interface BookingConfirmedScreenProps {
  confirmResponse: BookingConfirmResponse;
  holdResponse: BookingHoldResponse;
  flight: FlightOffer;
  pnrRecord?: PnrRecord;
  paymentApproval?: PaymentApproval;
  onReturnToSearch: () => void;
  onViewTrips?: () => void;
}

export const BookingConfirmedScreen: React.FC<BookingConfirmedScreenProps> = ({
  confirmResponse,
  holdResponse,
  flight,
  pnrRecord,
  paymentApproval,
  onReturnToSearch,
  onViewTrips,
}) => {
  // Void window: 24 hours after confirmation (stub — real value from backend)
  const voidWindowExpiry = new Date(
    new Date(confirmResponse.confirmedAt).getTime() + 86400000,
  ).toISOString();

  return (
    <div className="confirmed-screen" aria-label="Booking confirmed">
      {/* ── Success header ──────────────────────────────── */}
      <div className="confirmed-header">
        <div className="confirmed-icon" aria-hidden="true">✓</div>
        <h2 className="confirmed-title">Flight Confirmed!</h2>
        <p className="confirmed-subtitle">
          Your e-ticket has been issued. Check your email for the itinerary.
        </p>
      </div>

      {/* ── Ticket & PNR block ──────────────────────────── */}
      <section className="confirmed-ref-card" aria-label="Ticket reference">
        <div className="confirmed-ref-row">
          <span className="confirmed-label">Booking Reference</span>
          <span className="confirmed-value confirmed-booking-ref">
            {confirmResponse.confirmationNumber}
          </span>
        </div>

        {pnrRecord && (
          <div className="confirmed-ref-row">
            <span className="confirmed-label">PNR</span>
            <span className="confirmed-value confirmed-pnr">{pnrRecord.pnr}</span>
          </div>
        )}

        {confirmResponse.ticketNumbers?.map((tn, i) => (
          <div key={i} className="confirmed-ref-row">
            <span className="confirmed-label">Ticket Number {i + 1}</span>
            <span className="confirmed-value confirmed-ticket">{tn}</span>
          </div>
        ))}

        <div className="confirmed-ref-row">
          <span className="confirmed-label">Confirmed At</span>
          <span className="confirmed-value">{formatDateTime(confirmResponse.confirmedAt)}</span>
        </div>
      </section>

      {/* ── Itinerary ───────────────────────────────────── */}
      <section className="confirmed-itinerary" aria-label="Flight itinerary">
        <h3 className="confirmed-section-title">Itinerary</h3>
        <div className="confirmed-route">
          <div className="confirmed-segment">
            <div className="confirmed-time">{formatTime(flight.departureTime)}</div>
            <div className="confirmed-airport">{flight.origin}</div>
            <div className="confirmed-date">{formatDate(flight.departureTime)}</div>
          </div>
          <div className="confirmed-duration-col">
            <div className="confirmed-duration-line" aria-hidden="true" />
            <div className="confirmed-duration-label">{formatDuration(flight.duration)}</div>
            {flight.stops > 0 && (
              <div className="confirmed-stops">{flight.stops} stop{flight.stops > 1 ? 's' : ''}</div>
            )}
          </div>
          <div className="confirmed-segment confirmed-segment-right">
            <div className="confirmed-time">{formatTime(flight.arrivalTime)}</div>
            <div className="confirmed-airport">{flight.destination}</div>
            <div className="confirmed-date">{formatDate(flight.arrivalTime)}</div>
          </div>
        </div>
        <p className="confirmed-aircraft">
          {flight.airline} · {flight.flightNumber} · {flight.aircraft} · {flight.cabinClass.replace('_', ' ')}
        </p>
      </section>

      {/* ── Coupon list (AC-EXP-03-08) ──────────────────── */}
      <section className="confirmed-coupons" aria-label="Ticket coupons">
        <h3 className="confirmed-section-title">Coupon Status</h3>
        <table className="confirmed-coupon-table">
          <thead>
            <tr>
              <th>Coupon</th>
              <th>Segment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>{flight.origin} → {flight.destination}</td>
              <td><span className="coupon-badge coupon-open">OPEN</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Void window (AC-EXP-03-08) ──────────────────── */}
      <section className="confirmed-void-window" aria-label="Void window">
        <h3 className="confirmed-section-title">Void Window</h3>
        <p className="confirmed-void-text">
          Free cancellation (void) available until:{' '}
          <strong className="confirmed-void-expiry">{formatDateTime(voidWindowExpiry)}</strong>
        </p>
      </section>

      {/* ── Fare total (AC-EXP-03-08) ───────────────────── */}
      <section className="confirmed-fare" aria-label="Total fare">
        <h3 className="confirmed-section-title">Total Charged</h3>
        <table className="confirmed-fare-table">
          <tbody>
            <tr>
              <td>Base fare</td>
              <td><CurrencyAmount money={holdResponse.fareBreakdown.baseFare} /></td>
            </tr>
            <tr>
              <td>Taxes</td>
              <td><CurrencyAmount money={holdResponse.fareBreakdown.taxes} /></td>
            </tr>
            <tr>
              <td>Fees</td>
              <td><CurrencyAmount money={holdResponse.fareBreakdown.fees} /></td>
            </tr>
            <tr className="confirmed-fare-total">
              <td><strong>Total</strong></td>
              <td><CurrencyAmount money={holdResponse.fareBreakdown.totalFare} size="lg" highlight /></td>
            </tr>
          </tbody>
        </table>

        {paymentApproval && (
          <div className="confirmed-payment">
            <span className="confirmed-label">Payment Reference</span>
            <code className="confirmed-payment-ref">{paymentApproval.paymentReference}</code>
          </div>
        )}
      </section>

      {/* ── Next steps ──────────────────────────────────── */}
      {confirmResponse.nextSteps && (
        <div className="confirmed-next-steps" aria-label="Next steps">
          {confirmResponse.nextSteps.map((s, i) => (
            <p key={i} className="confirmed-next-step">ℹ {s}</p>
          ))}
        </div>
      )}

      {/* ── Actions ─────────────────────────────────────── */}
      <div className="confirmed-actions">
        {onViewTrips && (
          <Button type="button" variant="primary" size="lg" onClick={onViewTrips}>
            View My Trips
          </Button>
        )}
        <Button type="button" variant="secondary" size="lg" onClick={onReturnToSearch}>
          Search Another Flight
        </Button>
      </div>
    </div>
  );
};

BookingConfirmedScreen.displayName = 'BookingConfirmedScreen';
