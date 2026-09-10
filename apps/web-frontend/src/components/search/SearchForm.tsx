/**
 * Search Form Component
 * Flight search form with validation (AC-EXP-01-01)
 * Implements design-document.md section 2.1
 */

import React, { useState } from 'react';
import type { SearchRequest } from '../../api/types/search';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { validateFlightSearchCriteria } from '../../utils/validation';
import { getMinCheckInDate } from '../../utils/dateTime';
import './SearchForm.css';

export interface SearchFormProps {
  onSearch: (request: SearchRequest) => void;
  isLoading?: boolean;
}

const CABIN_CLASSES = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First' },
] as const;

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading = false,
}) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<'ECONOMY' | 'BUSINESS' | 'FIRST' | 'PREMIUM_ECONOMY'>('ECONOMY');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minDepartureDate = getMinCheckInDate();
  const minReturnDate = departureDate
    ? new Date(new Date(departureDate).getTime() + 86400000).toISOString().split('T')[0]
    : minDepartureDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateFlightSearchCriteria({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    // Create search request
    const request: SearchRequest = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: returnDate || undefined,
      passengers,
      cabinClass,
    };

    onSearch(request);
  };

  const handleClearForm = () => {
    setOrigin('');
    setDestination('');
    setDepartureDate('');
    setReturnDate('');
    setPassengers(1);
    setCabinClass('ECONOMY');
    setErrors({});
  };

  const handleAddPassenger = () => {
    if (passengers < 9) {
      setPassengers(passengers + 1);
    }
  };

  const handleRemovePassenger = () => {
    if (passengers > 1) {
      setPassengers(passengers - 1);
    }
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <h1 className="search-form-title">Search Flights</h1>

      {/* Row 1: Origin & Destination */}
      <div className="search-form-row">
        <Input
          label="Origin"
          placeholder="e.g., LHR"
          value={origin}
          onChange={(e) => setOrigin(e.target.value.toUpperCase())}
          error={errors.origin}
          required
          maxLength={3}
        />

        <Input
          label="Destination"
          placeholder="e.g., JFK"
          value={destination}
          onChange={(e) => setDestination(e.target.value.toUpperCase())}
          error={errors.destination}
          required
          maxLength={3}
        />
      </div>

      {/* Row 2: Departure & Return Dates + Cabin Class */}
      <div className="search-form-row">
        <Input
          label="Departure"
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          min={minDepartureDate}
          error={errors.departureDate}
          required
        />

        <Input
          label="Return"
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          min={minReturnDate}
          error={errors.returnDate}
        />

        <div className="search-form-field">
          <label htmlFor="cabin" className="search-form-label">
            Cabin Class
          </label>
          <select
            id="cabin"
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as typeof cabinClass)}
            className="search-form-select"
          >
            {CABIN_CLASSES.map((cabin) => (
              <option key={cabin.value} value={cabin.value}>
                {cabin.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Passengers */}
      <div className="search-form-row">
        <div className="search-form-field">
          <label className="search-form-label">Passengers</label>
          <div className="search-form-passengers">
            <button
              type="button"
              onClick={handleRemovePassenger}
              disabled={passengers <= 1}
              className="search-form-button-control"
              aria-label="Remove passenger"
            >
              −
            </button>
            <span className="search-form-passenger-count">{passengers}</span>
            <button
              type="button"
              onClick={handleAddPassenger}
              disabled={passengers >= 9}
              className="search-form-button-control"
              aria-label="Add passenger"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Errors */}
      {Object.keys(errors).length > 0 && (
        <Alert
          variant="error"
          message="Please correct the errors above and try again."
          dismissible
        />
      )}

      {/* Action Buttons */}
      <div className="search-form-actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search Flights'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleClearForm}
          disabled={isLoading}
        >
          Clear Form
        </Button>
      </div>
    </form>
  );
};

SearchForm.displayName = 'SearchForm';
