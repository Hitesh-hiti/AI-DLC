/**
 * ExpiredBookingScreen Component
 * Shown when a booking in HELD status has expired.
 * AC-EXP-06-03: show expiry message, "Search again" CTA
 */

import React from 'react';
import type { BookingHoldResponse } from '../../api/types/booking';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import './ExpiredBookingScreen.css';

interface ExpiredBookingScreenProps {
  booking?: BookingHoldResponse;
  onReturnToSearch?: () => void;
  bookingReference?: string;
  route?: {
    origin: string;
    destination: string;
  };
  expiredAt?: string;
  onSearchAgain?: () => void;
  onViewTrips?: () => void;
}

export const ExpiredBookingScreen: React.FC<ExpiredBookingScreenProps> = ({
  bookingReference,
  route,
  expiredAt,
  onSearchAgain,
  onViewTrips,
  booking,
  onReturnToSearch,
}) => {
  const resolvedBookingReference = bookingReference ?? booking?.confirmationNumber ?? booking?.bookingId ?? '—';
  const resolvedRoute = route ?? (booking ? { origin: booking.flightSummary.origin, destination: booking.flightSummary.destination } : { origin: '—', destination: '—' });
  const resolvedExpiredAt = expiredAt ?? booking?.holdExpiresAt ?? new Date().toISOString();

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
  };

  return (
    <div className="expired-screen" aria-label="Booking expired" data-testid="expired-screen">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="expired-header">
        <div className="expired-icon" aria-hidden="true">⏰</div>
        <h2 className="expired-title">Booking Expired</h2>
        <p className="expired-subtitle">
          Your hold for this flight has expired. The reservation is no longer available.
        </p>
      </div>

      {/* ── Booking Reference ────────────────────────────────── */}
      <section className="expired-ref-card" aria-label="Booking reference">
        <div className="expired-ref-row">
          <span className="expired-label">Booking Reference</span>
          <span className="expired-value" data-testid="expired-booking-ref">
            {resolvedBookingReference}
          </span>
        </div>

        <div className="expired-ref-row">
          <span className="expired-label">Expired At</span>
          <span className="expired-value">{formatDateTime(resolvedExpiredAt)}</span>
        </div>

        <div className="expired-ref-row">
          <span className="expired-label">Route</span>
          <span className="expired-value">
            {resolvedRoute.origin} → {resolvedRoute.destination}
          </span>
        </div>
      </section>

      {/* ── Status Alert ──────────────────────────────────────── */}
      <Alert variant="warning" className="expired-status-alert">
        <strong>Hold Released</strong>
        <p>The hold on this flight has been released. If you want to book this flight again, please search for available options.</p>
      </Alert>

      {/* ── Next Steps ────────────────────────────────────────── */}
      <div className="expired-next-steps" aria-label="Next steps">
        <Alert variant="info" className="expired-info">
          <ul className="expired-info-list">
            <li>You can search for available flights from {resolvedRoute.origin} to {resolvedRoute.destination}</li>
            <li>Prices may have changed since your original search</li>
            <li>Seat availability is no longer guaranteed</li>
          </ul>
        </Alert>
      </div>

      {/* ── Actions ──────────────────────────────────────────── */}
      <div className="expired-actions">
        {(onSearchAgain || onReturnToSearch) && (
          <Button type="button" variant="primary" size="lg" onClick={onSearchAgain ?? onReturnToSearch}>
            Search Again
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

ExpiredBookingScreen.displayName = 'ExpiredBookingScreen';
