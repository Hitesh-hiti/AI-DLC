/**
 * TicketingInProgressScreen Component
 * Shown when booking is in PENDING_ISSUE status (ticketing queue).
 * AC-EXP-03-07: show "Ticketing in progress", suppress confirm/cancel buttons
 */

import React from 'react';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import './TicketingInProgressScreen.css';

interface TicketingInProgressScreenProps {
  bookingReference: string;
  estimatedWaitMinutes?: number;
  onCheckStatus?: () => void;
  onViewTrips?: () => void;
}

export const TicketingInProgressScreen: React.FC<TicketingInProgressScreenProps> = ({
  bookingReference,
  estimatedWaitMinutes = 5,
  onCheckStatus,
  onViewTrips,
}) => {
  return (
    <div className="ticketing-screen" aria-label="Ticketing in progress" data-testid="ticketing-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="ticketing-header">
        <div className="ticketing-icon" aria-hidden="true">⏳</div>
        <h2 className="ticketing-title">Ticketing in Progress</h2>
        <p className="ticketing-subtitle">
          Your booking has been queued for ticketing. Please wait while we process your e-ticket.
        </p>
      </div>

      {/* ── Booking Reference ──────────────────────────────── */}
      <section className="ticketing-ref-card" aria-label="Booking reference">
        <div className="ticketing-ref-row">
          <span className="ticketing-label">Booking Reference</span>
          <span className="ticketing-value" data-testid="ticketing-booking-ref">
            {bookingReference}
          </span>
        </div>

        <div className="ticketing-ref-row">
          <span className="ticketing-label">Estimated Wait Time</span>
          <span className="ticketing-value" data-testid="ticketing-estimated-wait">
            ~{estimatedWaitMinutes} minutes
          </span>
        </div>
      </section>

      {/* ── Status Alert ────────────────────────────────────── */}
      <Alert variant="info" className="ticketing-status-alert">
        Your ticket is being processed. Do not attempt to confirm this booking again.
        A confirmation email will be sent once your ticket number is available.
      </Alert>

      {/* ── What to Expect ──────────────────────────────────── */}
      <section className="ticketing-expect" aria-label="What to expect">
        <h3 className="ticketing-section-title">What to Expect</h3>
        <ul className="ticketing-expect-list">
          <li>⏱ You will receive an email with your ticket number and itinerary</li>
          <li>📧 The email will be sent to the address used during booking</li>
          <li>⏳ Please wait at least {estimatedWaitMinutes} minutes before checking your email</li>
        </ul>
      </section>

      {/* ── Actions ─────────────────────────────────────────── */}
      <div className="ticketing-actions">
        {onCheckStatus && (
          <Button type="button" variant="secondary" size="lg" onClick={onCheckStatus}>
            Check Status
          </Button>
        )}
        {onViewTrips && (
          <Button type="button" variant="primary" size="lg" onClick={onViewTrips}>
            View My Trips
          </Button>
        )}
      </div>
    </div>
  );
};

TicketingInProgressScreen.displayName = 'TicketingInProgressScreen';
