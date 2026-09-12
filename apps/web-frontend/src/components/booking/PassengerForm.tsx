/**
 * PassengerForm Component
 * Collects at least one adult passenger before a booking hold can be submitted.
 * AC-EXP-02-01: traveler provides at least one passenger
 */

import React, { useState } from 'react';
import type { PassengerInfo } from '../../api/types/booking';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import './PassengerForm.css';

export interface PassengerFormProps {
  /** How many passenger slots to pre-fill (from SearchRequest.passengers) */
  passengerCount?: number;
  onSubmit: (passengers: PassengerInfo[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const EMPTY_PASSENGER = (): PassengerInfo => ({
  passengerType: 'ADT',
  firstName: '',
  lastName: '',
});

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengerCount = 1,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [passengers, setPassengers] = useState<PassengerInfo[]>(
    Array.from({ length: Math.max(1, passengerCount) }, EMPTY_PASSENGER),
  );
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  // ── Field helpers ─────────────────────────────────────────────────────────

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // Clear error on edit
    if (errors[index]?.[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        if (next[index]) {
          next[index] = { ...next[index] };
          delete next[index][field];
        }
        return next;
      });
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: Record<number, Record<string, string>> = {};
    passengers.forEach((p, i) => {
      const pErrors: Record<string, string> = {};
      if (!p.firstName.trim()) pErrors.firstName = 'First name is required';
      else if (p.firstName.trim().length < 2) pErrors.firstName = 'Must be at least 2 characters';
      if (!p.lastName.trim()) pErrors.lastName = 'Last name is required';
      else if (p.lastName.trim().length < 2) pErrors.lastName = 'Must be at least 2 characters';
      if (Object.keys(pErrors).length) newErrors[i] = pErrors;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(
        passengers.map((p) => ({
          ...p,
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
        })),
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form
      className="passenger-form"
      onSubmit={handleSubmit}
      aria-label="Passenger details form"
      noValidate
    >
      <h2 className="passenger-form-title">
        <span className="step-badge">2</span>
        Passenger Details
      </h2>
      <p className="passenger-form-subtitle">
        Enter details exactly as they appear on the travel document.
      </p>

      {passengers.map((pax, i) => (
        <fieldset key={i} className="passenger-fieldset">
          <legend className="passenger-legend">
            Passenger {i + 1}
            <span className="passenger-type-badge">{pax.passengerType === 'ADT' ? 'Adult' : pax.passengerType === 'CHD' ? 'Child' : 'Infant'}</span>
          </legend>

          <div className="passenger-row">
            {/* Type selector */}
            <div className="passenger-field">
              <label htmlFor={`pax-type-${i}`} className="passenger-label">Type</label>
              <select
                id={`pax-type-${i}`}
                className="passenger-select"
                value={pax.passengerType}
                onChange={(e) => updatePassenger(i, 'passengerType', e.target.value)}
              >
                <option value="ADT">Adult (ADT)</option>
                <option value="CHD">Child (CHD)</option>
                <option value="INF">Infant (INF)</option>
              </select>
            </div>
          </div>

          <div className="passenger-row">
            <Input
              label="First Name"
              id={`pax-first-${i}`}
              placeholder="As on passport"
              value={pax.firstName}
              onChange={(e) => updatePassenger(i, 'firstName', e.target.value.toUpperCase())}
              error={errors[i]?.firstName}
              required
              autoComplete="given-name"
            />
            <Input
              label="Last Name"
              id={`pax-last-${i}`}
              placeholder="As on passport"
              value={pax.lastName}
              onChange={(e) => updatePassenger(i, 'lastName', e.target.value.toUpperCase())}
              error={errors[i]?.lastName}
              required
              autoComplete="family-name"
            />
          </div>

          <div className="passenger-row passenger-row-optional">
            <Input
              label="Frequent Flyer Number (optional)"
              id={`pax-ffn-${i}`}
              placeholder="e.g. BA123456"
              value={pax.frequentFlyerNumber ?? ''}
              onChange={(e) => updatePassenger(i, 'frequentFlyerNumber', e.target.value)}
            />
            <Input
              label="Passport Number (optional)"
              id={`pax-passport-${i}`}
              placeholder="e.g. A12345678"
              value={pax.passportNumber ?? ''}
              onChange={(e) => updatePassenger(i, 'passportNumber', e.target.value.toUpperCase())}
            />
          </div>
        </fieldset>
      ))}

      <div className="passenger-form-actions">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} disabled={isLoading}>
          ← Back to Results
        </Button>
        <Button type="submit" variant="primary" size="lg" loading={isLoading} disabled={isLoading}>
          Review Booking
        </Button>
      </div>
    </form>
  );
};

PassengerForm.displayName = 'PassengerForm';
