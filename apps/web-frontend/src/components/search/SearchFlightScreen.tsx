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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState<'ECONOMY' | 'BUSINESS' | 'FIRST' | 'PREMIUM_ECONOMY'>('ECONOMY');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [airports, setAirports] = useState<DestinationSuggestion[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="search-flight-screen" data-testid="search-flight-screen">
      {/* ── TOP NAVIGATION BAR ────────────────────────────────────────── */}
      <header className="top-nav" role="banner">
        <div className="top-nav-container">
          {/* Logo - Top Left (Industry Standard) */}
          <div className="top-nav-logo" onClick={handleLogoClick} role="link" tabIndex={0} aria-label="TravelPlatform - Home">
            <div className="logo-icon" aria-hidden="true">✈️</div>
            <span className="logo-text">TravelPlatform</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="top-nav-links" role="navigation" aria-label="Main navigation">
            <button type="button" onClick={() => handleNavClick('/')} className={location.pathname === '/' ? 'active' : ''}>
              Search Flights
            </button>
            <button type="button" onClick={() => handleNavClick('/my-trips')} aria-label="View my trips">
              My Trips
            </button>
            <button type="button" onClick={() => handleNavClick('/refunds')} aria-label="Manage refunds">
              Refunds
            </button>
            <button type="button" onClick={() => handleNavClick('/support')} aria-label="Customer support">
              Support
            </button>
          </nav>

          {/* User Actions */}
          <div className="top-nav-actions" role="navigation" aria-label="User actions">
            <button type="button" className="nav-btn" aria-label="Sign in">
              Sign In
            </button>
            <button type="button" className="nav-btn nav-btn-primary" aria-label="Create account">
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-icon" aria-hidden="true"></span>
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ────────────────────────────────────────────────── */}
      {isMenuOpen && (
        <div className="mobile-menu" role="dialog" aria-label="Mobile navigation menu">
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
          <nav className="mobile-menu-nav" role="navigation" aria-label="Mobile navigation">
            <button type="button" onClick={() => handleNavClick('/')}>
              Search Flights
            </button>
            <button type="button" onClick={() => handleNavClick('/my-trips')}>
              My Trips
            </button>
            <button type="button" onClick={() => handleNavClick('/refunds')}>
              Refunds
            </button>
            <button type="button" onClick={() => handleNavClick('/support')}>
              Support
            </button>
          </nav>
          <div className="mobile-menu-actions">
            <button type="button">Sign In</button>
            <button type="button">Sign Up</button>
          </div>
        </div>
      )}

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
          <form className="search-form" onSubmit={handleSubmit} data-testid="search-form">
            {/* Search Header */}
            <div className="search-header">
              <h2 className="search-title">Search Flights</h2>
              <div className="search-type-selector">
                <label className="search-type-label">
                  <input type="radio" name="tripType" value="round-trip" defaultChecked />
                  Round Trip
                </label>
                <label className="search-type-label">
                  <input type="radio" name="tripType" value="one-way" />
                  One Way
                </label>
              </div>
            </div>

            {/* Row 1: Origin & Destination */}
            <div className="search-form-row">
              <div className="search-form-field origin-field">
                <label htmlFor="origin" className="search-form-label">
                  From
                  <span className="input-required" aria-label="required">*</span>
                </label>
                <select
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                  className={`search-form-select ${errors.origin ? 'input-error' : ''}`}
                  aria-invalid={Boolean(errors.origin)}
                  data-testid="input-origin"
                >
                  <option value="">Select origin</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={extractIataCode(airport)}>
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
                  <span className="input-required" aria-label="required">*</span>
                </label>
                <select
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  className={`search-form-select ${errors.destination ? 'input-error' : ''}`}
                  aria-invalid={Boolean(errors.destination)}
                  data-testid="input-destination"
                >
                  <option value="">Select destination</option>
                  {airports.map((airport) => (
                    <option key={airport.id} value={extractIataCode(airport)}>
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

            {/* Row 2: Dates */}
            <div className="search-form-row">
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

              <Input
                label="Return"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={minReturnDate}
                error={errors.returnDate}
                data-testid="input-return"
              />

              <div className="search-form-field cabin-field">
                <label htmlFor="cabin" className="search-form-label">
                  Cabin Class
                </label>
                <select
                  id="cabin"
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value as typeof cabinClass)}
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
                <label className="search-form-label">Passengers</label>
                <div className="search-form-passengers" data-testid="passengers-control">
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
                  <span className="search-form-passenger-count" data-testid="passenger-count">{passengers}</span>
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
            <div className="search-footer-info" role="status" aria-label="Search information">
              <span className="search-footer-item">✓ Best price guarantee</span>
              <span className="search-footer-item">✓ Free cancellation on selected flights</span>
              <span className="search-footer-item">✓ Secure payment</span>
            </div>
          </form>
        </section>

        {/* Quick Links Section */}
        <aside className="search-quick-links" aria-label="Quick search links">
          <h3 className="quick-links-title">Popular Routes</h3>
          <div className="quick-links-list">
            <button type="button" className="quick-link-item">
              <span className="quick-link-airports">LHR → JFK</span>
              <span className="quick-link-airports-sub">London → New York</span>
            </button>
            <button type="button" className="quick-link-item">
              <span className="quick-link-airports">JFK → LHR</span>
              <span className="quick-link-airports-sub">New York → London</span>
            </button>
            <button type="button" className="quick-link-item">
              <span className="quick-link-airports">LAX → SIN</span>
              <span className="quick-link-airports-sub">Los Angeles → Singapore</span>
            </button>
            <button type="button" className="quick-link-item">
              <span className="quick-link-airports">SIN → LAX</span>
              <span className="quick-link-airports-sub">Singapore → Los Angeles</span>
            </button>
          </div>
        </aside>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="main-footer" role="contentinfo">
        <div className="footer-container">
          <div className="footer-section">
            <h4 className="footer-section-title">TravelPlatform</h4>
            <p className="footer-section-text">
              Your trusted partner for flight bookings worldwide.
              Transparent pricing, flexible options, and 24/7 support.
            </p>
          </div>
          <div className="footer-section">
            <h4 className="footer-section-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#press">Press</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-section-title">Support</h4>
            <ul className="footer-links">
              <li><a href="#help">Help Center</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#refunds">Refunds</a></li>
              <li><a href="#support">Contact Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-section-title">Legal</h4>
            <ul className="footer-links">
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#cookies">Cookie Policy</a></li>
              <li><a href="#accessibility">Accessibility</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-bottom-text">&copy; 2026 TravelPlatform. All rights reserved.</p>
          <div className="footer-bottom-actions">
            <button type="button" className="footer-language-btn" aria-label="Change language">
              🌐 English
            </button>
            <button type="button" className="footer-currency-btn" aria-label="Change currency">
              💵 USD
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

SearchFlightScreen.displayName = 'SearchFlightScreen';
