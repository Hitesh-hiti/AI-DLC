/**
 * Toast — lightweight, auto-dismissing notification
 * Supports: success | error | info | warning
 * Auto-dismisses after `duration` ms (default 4 s).
 * Stacks from the top-right corner, fixed-positioned above all content.
 */

import React, { useEffect, useState } from 'react';
import './Toast.css';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  variant?: ToastVariant;
  message: string;
  /** Auto-dismiss delay in ms. Set to 0 to disable. Default: 4000 */
  duration?: number;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

export const Toast: React.FC<ToastProps> = ({
  id,
  variant = 'success',
  message,
  duration = 4000,
  onClose,
}) => {
  const [visible, setVisible] = useState(false);

  /* Trigger enter animation on mount */
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Auto-dismiss */
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={`toast toast--${variant} ${visible ? 'toast--visible' : ''}`}
      role="alert"
      aria-live="polite"
      data-testid={`toast-${id}`}
    >
      <span className="toast__icon" aria-hidden="true">
        {ICONS[variant]}
      </span>
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        aria-label="Dismiss notification"
        onClick={() => onClose(id)}
      >
        ×
      </button>
    </div>
  );
};

/* ─── ToastContainer ──────────────────────────────────────────────────────── */

export interface ToastItem {
  id: string;
  variant?: ToastVariant;
  message: string;
  duration?: number;
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container" aria-label="Notifications" data-testid="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onClose={onClose} />
      ))}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';
Toast.displayName = 'Toast';
