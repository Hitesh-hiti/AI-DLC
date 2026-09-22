/**
 * Status Badge Component
 * Displays status with color coding
 */

import React from 'react';
import type { BookingStatus, PolicyOutcome } from '../../api/types/common';
import {
  getBookingStatusDisplay,
  getPolicyOutcomeDisplay,
} from '../../utils/statusMapping';
import './StatusBadge.css';

export interface StatusBadgeProps {
  status: BookingStatus | PolicyOutcome;
  type: 'booking' | 'policy';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  className = '',
}) => {
  let display;

  if (type === 'booking') {
    display = getBookingStatusDisplay(status as BookingStatus);
  } else {
    display = getPolicyOutcomeDisplay(status as PolicyOutcome);
  }

  return (
    <span
      className={`status-badge status-badge-${display.color} ${className}`}
      title={type === 'booking' ? (display as typeof display & { description: string }).description : ''}
    >
      <span className="status-icon" aria-hidden="true">
        {getIconForStatus(display.icon)}
      </span>
      <span className="status-label">{display.label}</span>
    </span>
  );
};

/**
 * Map icon names to emoji for simple display
 */
function getIconForStatus(icon: string): string {
  const iconMap: Record<string, string> = {
    'check-circle': '✓',
    'alert-circle': '⚠',
    'x-circle': '✕',
    'user-check': '👤',
    'check': '✓',
    'alert': '⚠',
    'x': '✕',
    'clock': '⏱',
    'undo': '↶',
    'help': '?',
  };
  return iconMap[icon] || '●';
}

StatusBadge.displayName = 'StatusBadge';
