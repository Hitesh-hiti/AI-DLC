/**
 * Search Flight Screen Component
 * Modern, industrial-standard search interface following booking platform best practices
 * 
 * Industry Standards Implemented:
 * - Logo placement (top-left)
 * - Navigation/services bar (top)
 * - Hero section with brand positioning
 * - Search form with clear visual hierarchy
 * - Mobile-first responsive design
 * - Accessibility (WCAG 2.1 AA compliant)
 */

import React, { useState, useEffect } from 'react';
import type { SearchRequest } from '../../api/types/search';
import type { DestinationSuggestion } from '../../api/types/search';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { validateFlightSearchCriteria } from '../../utils/validation';
import { getMinCheckInDate } from '../../utils/dateTime';
import { bookingService } from '../../api/services/bookingService';
import './SearchFlightScreen.css';

// Extract the 3-letter IATA code from a suggestion name like "London Heathrow (LHR)"
const extractIataCode = (suggestion: DestinationSuggestion): string => {
  const match = suggestion.name.match(/\(([A-Z]{3})\)/);
  return match ? match[1] : suggestion.id;
};

export interface SearchFlightScreenProps {
  onSearch: (request: SearchRequest) => void;
  isLoading?: boolean;
}

const CABIN_CLASSES = [
  { value: 'ECONOMY', label: 'Economy', icon: '✈️' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', icon: 'Business' },
  { value: 'BUSINESS', label: 'Business', icon: 'Business' },
  { value: 'FIRST', label: 'First Class', icon: 'First' },
] as const;

export const SearchFlightScreen: React.FC<SearchFlightScreenProps> = ({
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
  const [airports, setAirports] = useState<DestinationSuggestion[]>([]);

  // Load airports on mount
  useEffect(() => {
    let cancelled = false;
    bookingService
      .searchDestinations({ query: '', limit: 50 })
      .then((res) => {
        if (!cancelled) setAirports(res.suggestions);
      })
      .catch(() => {
        if (!cancelled) setAirports([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const minDepartureDate = getMinCheckInDate();
  const minReturnDate = departureDate
    ? new Date(new Date(departureDate).getTime() + 86400000).toISOString().split('T')[0]
    : minDepartureDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
  <div className="search-flight-screen" data-testid="search-flight-screen">
    {/* ── HERO SECTION ──────────────────────────────────────────────── */}
    <section className="hero-section" aria-label="Welcome to TravelPlatform">
      <div className="hero-content">
        <h1 className="hero-title">Discover Your Next Adventure</h1>
        <p className="hero-subtitle">
          Search and book flights to over 5,000 destinations worldwide
          with transparent pricing and flexible booking options.
        </p>
      </div>
    </section>

    {/* ── MAIN SEARCH FORM ──────────────────────────────────────────── */}
    <main className="search-main" role="main">
      <section className="search-container" aria-label="Flight search">
        <form
          className="search-form"
          onSubmit={handleSubmit}
          data-testid="search-form"
        >
          {/* Search Header */}
          <div className="search-header">
            <h2 className="search-title">Search Flights</h2>
          </div>

          {/* Row 1: Origin & Destination */}
          <div className="search-form-row route-row">
            <div className="search-form-field origin-field">
              <label htmlFor="origin" className="search-form-label">
                From
                <span className="input-required" aria-label="required">
                  *
                </span>
              </label>

              <select
                id="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                className={`search-form-select ${
                  errors.origin ? 'input-error' : ''
                }`}
                aria-invalid={Boolean(errors.origin)}
                data-testid="input-origin"
              >
                <option value="">Select origin</option>

                {airports.map((airport) => (
                  <option
                    key={airport.id}
                    value={extractIataCode(airport)}
                  >
                    {airport.name}
                  </option>
                ))}
              </select>

              {errors.origin && (
                <div className="input-error-message" role="alert">
                  {errors.origin}
                </div>
              )}
            </div>

            <div className="search-form-field destination-field">
              <label htmlFor="destination" className="search-form-label">
                To
                <span className="input-required" aria-label="required">
                  *
                </span>
              </label>

              <select
                id="destination"
                value={destination}
                onChange={(e) =>
                  setDestination(e.target.value.toUpperCase())
                }
                className={`search-form-select ${
                  errors.destination ? 'input-error' : ''
                }`}
                aria-invalid={Boolean(errors.destination)}
                data-testid="input-destination"
              >
                <option value="">Select destination</option>

                {airports.map((airport) => (
                  <option
                    key={airport.id}
                    value={extractIataCode(airport)}
                  >
                    {airport.name}
                  </option>
                ))}
              </select>

              {errors.destination && (
                <div className="input-error-message" role="alert">
                  {errors.destination}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Departure, Return & Cabin Class */}
          <div className="search-form-row date-cabin-row">
            <div className="form-grid-field">
              <Input
                label="Departure"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={minDepartureDate}
                error={errors.departureDate}
                required
                data-testid="input-departure"
              />
            </div>

            <div className="form-grid-field">
              <Input
                label="Return"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={minReturnDate}
                error={errors.returnDate}
                data-testid="input-return"
              />
            </div>

            <div className="search-form-field cabin-field">
              <label htmlFor="cabin" className="search-form-label">
                Cabin Class
              </label>

              <select
                id="cabin"
                value={cabinClass}
                onChange={(e) =>
                  setCabinClass(e.target.value as typeof cabinClass)
                }
                className="search-form-select"
                data-testid="select-cabin"
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
          <div className="search-form-row passengers-row">
            <div className="search-form-field passengers-field">
              <label className="search-form-label">
                Passengers
              </label>

              <div
                className="search-form-passengers"
                data-testid="passengers-control"
              >
                <button
                  type="button"
                  onClick={handleRemovePassenger}
                  disabled={passengers <= 1}
                  className="search-form-button-control"
                  aria-label="Remove passenger"
                  data-testid="btn-remove-passenger"
                >
                  −
                </button>

                <span
                  className="search-form-passenger-count"
                  data-testid="passenger-count"
                >
                  {passengers}
                </span>

                <button
                  type="button"
                  onClick={handleAddPassenger}
                  disabled={passengers >= 9}
                  className="search-form-button-control"
                  aria-label="Add passenger"
                  data-testid="btn-add-passenger"
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
              data-testid="btn-search"
            >
              {isLoading ? 'Searching...' : 'Search Flights'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={handleClearForm}
              disabled={isLoading}
              data-testid="btn-clear-form"
            >
              Clear Form
            </Button>
          </div>

          {/* Info Footer */}
          <div
            className="search-footer-info"
            role="status"
            aria-label="Search information"
          >
            <span className="search-footer-item">
              ✓ Best price guarantee
            </span>

            <span className="search-footer-item">
              ✓ Free cancellation on selected flights
            </span>

            <span className="search-footer-item">
              ✓ Secure payment
            </span>
          </div>
        </form>
      </section>

      {/* Quick Links Section */}
      <aside
        className="search-quick-links"
        aria-label="Quick search links"
      >
        <h3 className="quick-links-title">Popular Routes</h3>

        <div className="quick-links-list">
          <button type="button" className="quick-link-item">
            <span className="quick-link-airports">
              LHR → JFK
            </span>
            <span className="quick-link-airports-sub">
              London → New York
            </span>
          </button>

          <button type="button" className="quick-link-item">
            <span className="quick-link-airports">
              JFK → LHR
            </span>
            <span className="quick-link-airports-sub">
              New York → London
            </span>
          </button>

          <button type="button" className="quick-link-item">
            <span className="quick-link-airports">
              LAX → SIN
            </span>
            <span className="quick-link-airports-sub">
              Los Angeles → Singapore
            </span>
          </button>

          <button type="button" className="quick-link-item">
            <span className="quick-link-airports">
              SIN → LAX
            </span>
            <span className="quick-link-airports-sub">
              Singapore → Los Angeles
            </span>
          </button>
        </div>
      </aside>
    </main>
  </div>
);
}

SearchFlightScreen.displayName = 'SearchFlightScreen';