/**
 * TripDetailPage Component
 * Displays trip details with all associated bookings.
 * AC-EXP-05-01: trip purpose, date window, all bookings with status and segments
 * AC-EXP-05-04: human-readable status labels for all states
 * AC-EXP-05-05: CONFIRM_EXCEPTION alert with correlation ID
 */

import React from 'react';
import type { Booking } from '../api/types/booking';
import { getBookingStatusDisplay } from '../utils/statusMapping';
import { Alert } from '../components/common/Alert';
import { Button } from '../components/common/Button';
import './TripDetailPage.css';

interface TripDetailPageProps {
  tripId: string;
  tripPurpose: string;
  startDate: string;
  endDate: string;
  bookings: Booking[];
  onBookAnother?: () => void;
  onBookingClick?: (bookingId: string) => void;
}

export const TripDetailPage: React.FC<TripDetailPageProps> = ({
  tripId,
  tripPurpose,
  startDate,
  endDate,
  bookings,
  onBookAnother,
  onBookingClick,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="trip-page" aria-label="Trip Details" data-testid="trip-page">
      {/* ── Trip Header ────────────────────────────────────────── */}
      <div className="trip-header">
        <div className="trip-info">
          <h1 className="trip-title">{tripPurpose}</h1>
          <p className="trip-dates">
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        </div>
        {onBookAnother && (
          <Button type="button" variant="primary" onClick={onBookAnother}>
            Book Another Flight
          </Button>
        )}
      </div>

      {/* ── Bookings List ──────────────────────────────────────── */}
      <div className="bookings-list" role="list" aria-label="Bookings">
        {bookings.length === 0 ? (
          <div className="empty-state" role="status">
            <div className="empty-state-icon" aria-hidden="true">✈️</div>
            <p className="empty-state-text">No bookings for this trip</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusDisplay = getBookingStatusDisplay(booking.status);
            const isException = booking.status === 'CONFIRM_EXCEPTION';

            return (
              <div
                key={booking.bookingId}
                className={`booking-card ${isException ? 'booking-card-exception' : ''}`}
                role="listitem"
                data-testid={`booking-card-${booking.bookingId}`}
                onClick={() => onBookingClick?.(booking.bookingId)}
              >
                {/* ── Status Badge ────────────────────────────────── */}
                <div className="booking-status">
                  <span className={`status-badge ${statusDisplay.class}`}>
                    {statusDisplay.label}
                  </span>
                </div>

                {/* ── Flight Details ──────────────────────────────── */}
                <div className="booking-flight">
                  <div className="booking-route">
                    <span className="booking-airport">{booking.origin}</span>
                    <span className="booking-arrow">→</span>
                    <span className="booking-airport">{booking.destination}</span>
                  </div>
                  <div className="booking-time">
                    <span className="booking-time-departure">
                      {formatTime(booking.departureTime)}
                    </span>
                    <span className="booking-time-arrival">
                      {formatTime(booking.arrivalTime)}
                    </span>
                  </div>
                  <div className="booking-airline">
                    {booking.airline} · {booking.flightNumber}
                  </div>
                </div>

                {/* ── Segment List ────────────────────────────────── */}
                {booking.segments && booking.segments.length > 0 && (
                  <div className="booking-segments" aria-label="Segments">
                    {booking.segments.map((segment, i) => (
                      <div key={i} className="booking-segment">
                        <span className="booking-segment-route">
                          {segment.origin} → {segment.destination}
                        </span>
                        <span className="booking-segment-time">
                          {formatDate(segment.departureTime)} {formatTime(segment.departureTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Actions ─────────────────────────────────────── */}
                <div className="booking-actions">
                  {statusDisplay.hasView && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookingClick?.(booking.bookingId);
                      }}
                    >
                      View Details
                    </Button>
                  )}
                  {statusDisplay.hasCancel && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Cancel booking action
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {/* ── CONFIRM_EXCEPTION Alert ─────────────────────── */}
                {isException && (
                  <div className="booking-alert">
                    <Alert variant="error" className="booking-alert-content">
                      <span className="booking-alert-icon" aria-hidden="true">✴️</span>
                      <div className="booking-alert-text">
                        <strong>Action Required - Manual Support Needed</strong>
                        <p>
                          This booking requires our support team to reconcile. Please contact support
                          with the reference below.
                        </p>
                      </div>
                    </Alert>
                    <div className="booking-correlation-id">
                      <span className="correlation-id-label">Support Reference:</span>
                      <code className="correlation-id-value" data-testid="correlation-id">
                        {booking.correlationId}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

TripDetailPage.displayName = 'TripDetailPage';
