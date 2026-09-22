/**
 * Input Component
 * Reusable text input with validation states and labels
 */

import React from 'react';
import './Input.css';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      required = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
    const hasError = Boolean(error);

    return (
      <div className={`input-wrapper ${fullWidth ? 'input-full-width' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {required && <span className="input-required" aria-label="required">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-field ${hasError ? 'input-error' : ''} ${className}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <div id={`${inputId}-error`} className="input-error-message" role="alert">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${inputId}-helper`} className="input-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
