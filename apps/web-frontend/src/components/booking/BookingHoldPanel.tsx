/**
 * BookingHoldPanel Component
 * Displays selected flight summary, fare breakdown, policy evaluation result,
 * and the "Hold Booking" CTA.
 *
 * AC-EXP-02-01: render booking_id, hold_expires_at, policy decision
 * AC-EXP-02-10: WARN messages shown as non-blocking notices
 * AC-POL-01-05: WARN panel — traveler can acknowledge and continue
 * AC-POL-01-06 / AC-POL-04-03: BLOCK — only "Return to Search" allowed
 */

import React from 'react';
import type { FlightOffer } from '../../api/types/search';
import type { PassengerInfo, BookingHoldResponse, PaymentApproval } from '../../api/types/booking';
import type { PolicyEvaluationResponse } from '../../api/types/policy';
import { CurrencyAmount } from '../common/CurrencyAmount';
import { Button } from '../common/Button';
import { PolicyOutcomePanel } from './PolicyOutcomePanel';
import './BookingHoldPanel.css';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(iso: string) {
  return `${formatDate(iso)} at ${formatTime(iso)}`;
}
function formatDuration(dur: string) {
  const m = dur.match(/PT(\d+H)?(\d+M)?/);
  if (!m) return dur;
  const h = m[1]?.replace('H', '') ?? '0';
  const min = m[2]?.replace('M', '') ?? '0';
  return h === '0' ? `${min}m` : min === '0' ? `${h}h` : `${h}h ${min}m`;
}

// ── component ─────────────────────────────────────────────────────────────────

export interface BookingHoldPanelProps {
  flight: FlightOffer;
  passengers: PassengerInfo[];
  policyEvaluation: PolicyEvaluationResponse;
  /** Set after the hold API call succeeds */
  holdResponse?: BookingHoldResponse;
  paymentApproval?: PaymentApproval;
  isLoading: boolean;
  onHold: () => void;
  onBack: () => void;
  onReturnToSearch: () => void;
}

export const BookingHoldPanel: React.FC<BookingHoldPanelProps> = ({
  flight,
  passengers,
  policyEvaluation,
  holdResponse,
  paymentApproval,
  isLoading,
  onHold,
  onBack,
  onReturnToSearch,
}) => {
  const isBlocked = policyEvaluation.outcome === 'BLOCK';
  const isHeld    = !!holdResponse;

  // fare from hold response (authoritative) or estimated from offer
  const baseFare  = holdResponse?.fareBreakdown.baseFare  ?? flight.price;
  const taxes     = holdResponse?.fareBreakdown.taxes     ?? { amount: flight.price.amount * 0.15, currency: flight.price.currency };
  const fees      = holdResponse?.fareBreakdown.fees      ?? { amount: 25, currency: flight.price.currency };
  const totalFare = holdResponse?.fareBreakdown.totalFare ?? { amount: baseFare.amount + taxes.amount + fees.amount, currency: flight.price.currency };

  return (
    <div className="hold-panel">
      {/* ── Step indicator ─────────────────────────────────── */}
      <h2 className="hold-panel-title">
        <span className="step-badge">3</span>
        {isHeld ? 'Booking Confirmed' : 'Review & Confirm Flight'}
      </h2>

      {/* ── Flight summary card (design 2.2 / 2.3) ────────── */}
      <section className="hold-flight-card" aria-label="Selected flight">
        <div className="hold-flight-header">
          <div>
            <span className="hold-airline">{flight.airline}</span>
            <span className="hold-flight-number">· {flight.flightNumber}</span>
          </div>
          <span className="hold-cabin-badge">{flight.cabinClass.replace('_', ' ')}</span>
        </div>

        <div className="hold-route">
          <div className="hold-segment">
            <div className="hold-time">{formatTime(flight.departureTime)}</div>
            <div className="hold-airport">{flight.origin}</div>
            <div className="hold-date">{formatDate(flight.departureTime)}</div>
          </div>
          <div className="hold-duration-col">
            <div className="hold-duration-line" />
            <div className="hold-duration-label">{formatDuration(flight.duration)}</div>
            {flight.stops > 0 && (
              <div className="hold-stops">{flight.stops} stop{flight.stops > 1 ? 's' : ''}</div>
            )}
          </div>
          <div className="hold-segment hold-segment-right">
            <div className="hold-time">{formatTime(flight.arrivalTime)}</div>
            <div className="hold-airport">{flight.destination}</div>
            <div className="hold-date">{formatDate(flight.arrivalTime)}</div>
          </div>
        </div>

        <div className="hold-aircraft">{flight.aircraft}</div>
      </section>

      {/* ── Passengers summary ─────────────────────────────── */}
      <section className="hold-passengers" aria-label="Passengers">
        <h3 className="hold-section-title">Passengers</h3>
        <ul className="hold-passenger-list">
          {passengers.map((p, i) => (
            <li key={i} className="hold-passenger-item">
              <span className="hold-pax-name">{i + 1}. {p.firstName} {p.lastName}</span>
              <span className="hold-pax-type">{p.passengerType}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Fare breakdown ─────────────────────────────────── */}
      <section className="hold-fare" aria-label="Fare breakdown">
        <h3 className="hold-section-title">Fare Breakdown</h3>
        <table className="hold-fare-table">
          <tbody>
            <tr>
              <td>Base fare</td>
              <td><CurrencyAmount money={baseFare} /></td>
            </tr>
            <tr>
              <td>Taxes</td>
              <td><CurrencyAmount money={taxes} /></td>
            </tr>
            <tr>
              <td>Fees</td>
              <td><CurrencyAmount money={fees} /></td>
            </tr>
            <tr className="hold-fare-total">
              <td><strong>Total</strong></td>
              <td><CurrencyAmount money={totalFare} size="lg" highlight /></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── Policy outcome ─────────────────────────────────── */}
      <PolicyOutcomePanel
        policyEvaluation={policyEvaluation}
        onReturnToSearch={onReturnToSearch}
      />

      {/* ── Hold confirmation details (after successful hold) ─ */}
      {isHeld && holdResponse && (
        <section className="hold-confirmation" aria-label="Hold confirmation">
          <div className="hold-confirmed-badge">✓ Booking Confirmed</div>
          <div className="hold-details-grid">
            <div className="hold-detail">
              <span className="hold-detail-label">Booking Reference</span>
              <span className="hold-detail-value hold-booking-id">{holdResponse.confirmationNumber}</span>
            </div>
            <div className="hold-detail">
              <span className="hold-detail-label">Hold Expires</span>
              <span className="hold-detail-value hold-expiry">
                {formatDateTime(holdResponse.holdExpiresAt)}
              </span>
            </div>
            {holdResponse.approvalDetails && (
              <div className="hold-detail hold-detail-full">
                <span className="hold-detail-label">Approval Required from</span>
                <span className="hold-detail-value">{holdResponse.approvalDetails.approverName}</span>
              </div>
            )}
          </div>
          {paymentApproval && (
            <div className="hold-payment-stub">
              <span className="hold-detail-label">Payment Reference (stub)</span>
              <code className="hold-payment-ref">{paymentApproval.paymentReference}</code>
              <span className="hold-stub-badge">STUB</span>
            </div>
          )}
        </section>
      )}

      {/* ── Cancellation policy ────────────────────────────── */}
      {holdResponse && (
        <section className="hold-cancel-policy" aria-label="Cancellation policy">
          <p className="hold-cancel-text">
            {holdResponse.cancellationPolicy.refundable
              ? `✓ Refundable — free cancellation until ${formatDateTime(holdResponse.cancellationPolicy.cancellationDeadline ?? '')}`
              : '✕ Non-refundable'}
          </p>
        </section>
      )}

      {/* ── Actions ────────────────────────────────────────── */}
      <div className="hold-actions">
        {!isHeld && (
          <Button type="button" variant="secondary" size="lg" onClick={onBack} disabled={isLoading}>
            ← Edit Passengers
          </Button>
        )}

        {!isHeld && !isBlocked && (
          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={isLoading}
            onClick={onHold}
          >
            {isLoading ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        )}

        {isHeld && !holdResponse?.approvalDetails && (
          <Button type="button" variant="secondary" size="lg" onClick={onReturnToSearch}>
            ← Back to Search
          </Button>
        )}
      </div>
    </div>
  );
};

BookingHoldPanel.displayName = 'BookingHoldPanel';
