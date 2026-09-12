/**
 * ApprovalPendingScreen Component
 * Shown when a booking is in PENDING_APPROVAL status.
 * Implements design-document.md section 2.6 and:
 * AC-EXP-02-05: booking awaiting approval — no confirm action presented
 * AC-EXP-07-05: approver name, expiry, "Pending Approval" label, confirm blocked
 */

import React from 'react';
import type { BookingHoldResponse } from '../../api/types/booking';
import type { FlightOffer } from '../../api/types/search';
import { CurrencyAmount } from '../common/CurrencyAmount';
import { Button } from '../common/Button';
import './ApprovalPendingScreen.css';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export interface ApprovalPendingScreenProps {
  holdResponse: BookingHoldResponse;
  flight: FlightOffer;
  onReturnToSearch: () => void;
  onViewTrips?: () => void;
}

export const ApprovalPendingScreen: React.FC<ApprovalPendingScreenProps> = ({
  holdResponse,
  flight,
  onReturnToSearch,
  onViewTrips,
}) => {
  const approval = holdResponse.approvalDetails!;

  return (
    <div className="approval-pending" aria-label="Booking submitted for approval">
      {/* ── Status header ─────────────────────────────────── */}
      <div className="approval-status-header">
        <div className="approval-icon" aria-hidden="true">✉</div>
        <h2 className="approval-title">Booking Submitted for Approval</h2>
        <p className="approval-subtitle">
          Your booking is awaiting manager approval. You will be notified once a decision is made.
        </p>
      </div>

      {/* ── Booking reference card ────────────────────────── */}
      <section className="approval-card" aria-label="Booking reference">
        <div className="approval-detail-row approval-detail-row-highlight">
          <span className="approval-label">Booking Reference</span>
          <span className="approval-value approval-ref">{holdResponse.confirmationNumber}</span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Route</span>
          <span className="approval-value">
            {flight.origin} → {flight.destination} &nbsp;·&nbsp;
            {formatTime(flight.departureTime)} – {formatTime(flight.arrivalTime)}
          </span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Airline</span>
          <span className="approval-value">{flight.airline} · {flight.flightNumber}</span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Total Fare</span>
          <span className="approval-value">
            <CurrencyAmount money={holdResponse.fareBreakdown.totalFare} size="lg" highlight />
          </span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Hold Expires</span>
          <span className="approval-value approval-expiry">
            {formatDateTime(holdResponse.holdExpiresAt)}
          </span>
        </div>
      </section>

      {/* ── Approval details (AC-EXP-07-05) ──────────────── */}
      <section className="approval-info-card" aria-label="Approval request details">
        <h3 className="approval-info-title">Approval Request Details</h3>

        <div className="approval-detail-row">
          <span className="approval-label">Status</span>
          <span className="approval-status-badge">⏳ Pending Approval</span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Approval Requested from</span>
          <span className="approval-value">{approval.approverName}</span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Approver Contact</span>
          <span className="approval-value">
            <a href={`mailto:${approval.approverEmail}`}>{approval.approverEmail}</a>
          </span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Decision Deadline</span>
          <span className="approval-value approval-expiry">
            {formatDateTime(approval.approvalExpiresAt)}
          </span>
        </div>

        <div className="approval-detail-row">
          <span className="approval-label">Reason</span>
          <span className="approval-value">{approval.reason}</span>
        </div>

        {/* AC-EXP-02-05: cannot confirm until approved — no confirm button shown */}
        <div className="approval-blocked-notice" role="status" aria-live="polite">
          <span className="approval-blocked-icon">🔒</span>
          <span>
            Confirmation is blocked until your manager approves this booking.
            You will receive a notification once a decision is made.
          </span>
        </div>
      </section>

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="approval-actions">
        {onViewTrips && (
          <Button type="button" variant="primary" size="lg" onClick={onViewTrips}>
            View Trip Details
          </Button>
        )}
        <Button type="button" variant="secondary" size="lg" onClick={onReturnToSearch}>
          ← Back to Search
        </Button>
      </div>
    </div>
  );
};

ApprovalPendingScreen.displayName = 'ApprovalPendingScreen';
