/**
 * NotificationCentre Component
 * Displays in-app notifications for booking lifecycle events.
 * AC-EXP-08-01: BookingHeld — booking reference, hold expiry, link to trip
 * AC-EXP-08-02: ApprovalRequested — reference, action link
 * AC-EXP-08-03: BookingExpired — expiry message, "Search again" link
 * AC-EXP-08-04: RefundConfirmed — amount, payment reference, booking reference
 */

import React, { useState } from 'react';
import type { Notification } from '../../api/types/booking';
import { Button } from '../common/Button';
import './NotificationCentre.css';

export interface NotificationCentreProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
  onNotificationClick?: (notificationId: string) => void;
}

export const NotificationCentre: React.FC<NotificationCentreProps> = ({
  notifications,
  onMarkAllRead,
  onNotificationClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BookingHeld':
        return '✈️';
      case 'ApprovalRequested':
        return '📝';
      case 'BookingExpired':
        return '⏰';
      case 'RefundConfirmed':
        return '💰';
      default:
        return '📌';
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'BookingHeld':
        return 'Booking Confirmed';
      case 'ApprovalRequested':
        return 'Approval Required';
      case 'BookingExpired':
        return 'Booking Expired';
      case 'RefundConfirmed':
        return 'Refund Processed';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="notification-centre" aria-label="Notifications" data-testid="notification-centre">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="notification-header">
        <h2 className="notification-title">Notifications</h2>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount}
          </span>
        )}
      </div>

      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="notification-filters">
        <button
          type="button"
          className={`notification-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          data-testid="filter-all"
        >
          All
        </button>
        <button
          type="button"
          className={`notification-filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
          data-testid="filter-unread"
        >
          Unread
        </button>
        {onMarkAllRead && (
          <button
            type="button"
            className="notification-mark-read-btn"
            onClick={onMarkAllRead}
            data-testid="btn-mark-all-read"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Notification List ─────────────────────────────────── */}
      <div className="notification-list" role="list" aria-label="Notification list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state" role="status">
            <div className="empty-state-icon" aria-hidden="true">📬</div>
            <p className="empty-state-text">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
              role="listitem"
              data-testid={`notification-${notification.id}`}
              onClick={() => onNotificationClick?.(notification.id)}
            >
              {/* ── Icon ──────────────────────────────────────── */}
              <div className="notification-icon">
                <span className="notification-icon-emoji" aria-hidden="true">
                  {getNotificationIcon(notification.type)}
                </span>
                {!notification.isRead && <span className="notification-dot" aria-hidden="true" />}
              </div>

              {/* ── Content ───────────────────────────────────── */}
              <div className="notification-content">
                <div className="notification-header">
                  <h3 className="notification-title">
                    {getNotificationTitle(notification.type)}
                  </h3>
                  <span className="notification-time">{formatDateTime(notification.createdAt)}</span>
                </div>

                {/* ── Body ──────────────────────────────────────── */}
                <div className="notification-body">
                  {/* AC-EXP-08-01: BookingHeld */}
                  {notification.type === 'BookingHeld' && (
                    <>
                      <p>
                        Your booking for {notification.route} has been confirmed.
                        Hold expires at {new Date(notification.payload?.holdExpiresAt).toLocaleString()}.
                      </p>
                      {notification.payload?.bookingReference && (
                        <div className="notification-ref">
                          <strong>Reference:</strong> {notification.payload.bookingReference}
                        </div>
                      )}
                    </>
                  )}

                  {/* AC-EXP-08-02: ApprovalRequested */}
                  {notification.type === 'ApprovalRequested' && (
                    <>
                      <p>
                        Approval requested for booking {notification.payload?.bookingReference}.
                      </p>
                      <div className="notification-actions">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to approval action
                          }}
                          data-testid={`btn-approve-${notification.id}`}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to rejection action
                          }}
                          data-testid={`btn-reject-${notification.id}`}
                        >
                          Reject
                        </Button>
                      </div>
                    </>
                  )}

                  {/* AC-EXP-08-03: BookingExpired */}
                  {notification.type === 'BookingExpired' && (
                    <p>
                      Your booking {notification.payload?.bookingReference} for {notification.route}
                      has expired. The hold has been released.
                    </p>
                  )}

                  {/* AC-EXP-08-04: RefundConfirmed */}
                  {notification.type === 'RefundConfirmed' && (
                    <>
                      <p>
                        Refund of {notification.payload?.refundAmount} {notification.payload?.currency}
                        has been processed.
                      </p>
                      <div className="notification-ref">
                        <strong>Booking:</strong> {notification.payload?.bookingReference}
                        {notification.payload?.paymentReference && (
                          <>
                            {' '}
                            • <strong>Payment:</strong> {notification.payload.paymentReference}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

NotificationCentre.displayName = 'NotificationCentre';
