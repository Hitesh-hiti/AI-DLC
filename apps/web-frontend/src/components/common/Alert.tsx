/**
 * Alert Component
 * Displays informational, warning, error, or success messages
 */

import React from 'react';
import './Alert.css';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string | React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [visible, setVisible] = React.useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) {
    return null;
  }

  const iconMap: Record<string, string> = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠',
    error: '✕',
  };

  return (
    <div className={`alert alert-${variant} ${className}`} role="alert">
      <div className="alert-content">
        <span className="alert-icon" aria-hidden="true">
          {iconMap[variant]}
        </span>
        <div className="alert-body">
          {title && <div className="alert-title">{title}</div>}
          <div className={title ? 'alert-message' : 'alert-message alert-message-only'}>
            {message}
          </div>
        </div>
      </div>
      {dismissible && (
        <button
          className="alert-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';
