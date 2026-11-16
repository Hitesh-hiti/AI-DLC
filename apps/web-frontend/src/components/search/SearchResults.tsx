/**
 * SearchResults Component — Tabbed Comparison View
 * Displays flight search results with sortable tabs: By Price, By Departure, By Duration, By Airline
 * AC-EXP-01-01: render base fare, taxes, fees, total with currency code.
 * Tabbed Comparison View (FE Alt #1): Tabs organize sorting options, always-visible fares, inline cabin selector
 */

import React, { useState, useMemo } from 'react';
import type { FlightOffer } from '../../api/types/search';
import { CurrencyAmount } from '../common/CurrencyAmount';
import { Button } from '../common/Button';
import './SearchResults.css';

export interface SearchResultsProps {
  results: FlightOffer[];
  onSelectFlight: (flight: FlightOffer) => void;
  isLoading?: boolean;
}

// ── Sort type ─────────────────────────────────────────────────────────────────
export type SortTab = 'price' | 'departure' | 'duration' | 'airline';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDuration(iso: string): string {
  const m = iso.match(/PT(\d+H)?(\d+M)?/);
  if (!m) return iso;
  const h = m[1]?.replace('H', '') ?? '0';
  const min = m[2]?.replace('M', '') ?? '0';
  return h === '0' ? `${min}m` : min === '0' ? `${h}h` : `${h}h ${min}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Estimated taxes (15%) and fees ($25) from the offer price for display */
function estimateFare(price: FlightOffer['price']) {
  const taxes = Math.round(price.amount * 0.15 * 100) / 100;
  const fees  = 25;
  const total = Math.round((price.amount + taxes + fees) * 100) / 100;
  return {
    baseFare: price,
    taxes:    { amount: taxes, currency: price.currency },
    fees:     { amount: fees,  currency: price.currency },
    total:    { amount: total, currency: price.currency },
  };
}

/**
 * Sort flights by the active tab.
 * AC-EXP-01-01: always display all relevant information, sorted by user preference.
 */
function sortFlights(flights: FlightOffer[], sortBy: SortTab): FlightOffer[] {
  const sorted = [...flights];
  
  switch (sortBy) {
    case 'price': {
      return sorted.sort((a, b) => a.price.amount - b.price.amount);
    }
    case 'departure': {
      return sorted.sort((a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
      );
    }
    case 'duration': {
      // Parse PT duration strings to milliseconds
      const durationMs = (iso: string) => {
        const match = iso.match(/PT(\d+H)?(\d+M)?/);
        if (!match) return 0;
        const h = parseInt(match[1] ?? '0', 10);
        const m = parseInt(match[2] ?? '0', 10);
        return h * 3600000 + m * 60000;
      };
      return sorted.sort((a, b) => durationMs(a.duration) - durationMs(b.duration));
    }
    case 'airline': {
      return sorted.sort((a, b) => a.airline.localeCompare(b.airline));
    }
    default:
      return sorted;
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSelectFlight,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<SortTab>('price');
  const [expandedFare, setExpandedFare] = useState<string | null>(null);

  // Memoize sorted results to avoid unnecessary re-sorts
  const sortedResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    return sortFlights(results, activeTab);
  }, [results, activeTab]);

  if (isLoading) {
    return (
      <div className="search-results-loading" role="status" aria-live="polite">
        <div className="loading-spinner" aria-hidden="true" />
        <p>Searching for flights…</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="search-results-empty" role="status">
        <p>No flights found. Please try different search criteria.</p>
      </div>
    );
  }

  return (
    <div className="search-results" data-testid="search-results">
      <h2 className="search-results-title">
        {results.length} Flight{results.length !== 1 ? 's' : ''} Found
      </h2>

      {/* ── TABBED COMPARISON VIEW — Sorting tabs ──────────────────────── */}
      <div className="search-results-tabs" role="tablist" aria-label="Sort flight results">
        <button
          role="tab"
          aria-selected={activeTab === 'price'}
          aria-controls="search-results-list"
          className={`search-tab ${activeTab === 'price' ? 'active' : ''}`}
          onClick={() => setActiveTab('price')}
          data-testid="tab-price"
        >
          💰 By Price
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'departure'}
          aria-controls="search-results-list"
          className={`search-tab ${activeTab === 'departure' ? 'active' : ''}`}
          onClick={() => setActiveTab('departure')}
          data-testid="tab-departure"
        >
          ⏰ By Departure
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'duration'}
          aria-controls="search-results-list"
          className={`search-tab ${activeTab === 'duration' ? 'active' : ''}`}
          onClick={() => setActiveTab('duration')}
          data-testid="tab-duration"
        >
          ✈️ By Duration
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'airline'}
          aria-controls="search-results-list"
          className={`search-tab ${activeTab === 'airline' ? 'active' : ''}`}
          onClick={() => setActiveTab('airline')}
          data-testid="tab-airline"
        >
          ✓ By Airline
        </button>
      </div>

      <div
        id="search-results-list"
        className="search-results-list"
        data-testid="flight-list"
        role="tabpanel"
      >
        {sortedResults.map((flight) => {
          const fare = estimateFare(flight.price);
          const fareOpen = expandedFare === flight.offerId;

          return (
            <div key={flight.offerId} className="flight-card" data-testid="flight-card">

              {/* ── Header: airline + cabin (inline) ───────────────────– */}
              <div className="flight-card-header">
                <div className="flight-info">
                  <h3 className="flight-airline">{flight.airline}</h3>
                  <p className="flight-number">Flight {flight.flightNumber}</p>
                </div>
                <span className="cabin-badge">{flight.cabinClass.replace('_', ' ')}</span>
              </div>

              {/* ── Body: route (always visible, high contrast) ────────– */}
              <div className="flight-card-body">
                <div className="flight-route">
                  {/* Departure */}
                  <div className="flight-segment">
                    <div className="time">{formatTime(flight.departureTime)}</div>
                    <div className="airport">{flight.origin}</div>
                    <div className="date">{formatDateShort(flight.departureTime)}</div>
                  </div>

                  {/* Duration + stops */}
                  <div className="flight-duration">
                    <div className="duration-line" aria-hidden="true" />
                    <div className="duration-text">
                      <span>{formatDuration(flight.duration)}</span>
                      {flight.stops === 0
                        ? <span className="stops stops-direct">Non-stop</span>
                        : <span className="stops">{flight.stops} stop{flight.stops > 1 ? 's' : ''}</span>
                      }
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="flight-segment flight-segment-right">
                    <div className="time">{formatTime(flight.arrivalTime)}</div>
                    <div className="airport">{flight.destination}</div>
                    <div className="date">{formatDateShort(flight.arrivalTime)}</div>
                  </div>
                </div>

                <div className="flight-aircraft">
                  <span className="aircraft-type">{flight.aircraft}</span>
                </div>
              </div>

              {/* ── Footer: fare (always visible) + availability + CTA ── */}
              <div className="flight-card-footer">

                {/* Price block with expandable breakdown — design 2.2 */}
                <div className="flight-price-block">
                  <button
                    type="button"
                    className="price-toggle"
                    onClick={() => setExpandedFare(fareOpen ? null : flight.offerId)}
                    aria-expanded={fareOpen}
                    aria-controls={`fare-breakdown-${flight.offerId}`}
                  >
                    <CurrencyAmount money={fare.total} size="lg" highlight />
                    <span className="price-total-label">total per person</span>
                    <span className="price-toggle-chevron" aria-hidden="true">
                      {fareOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {fareOpen && (
                    <div
                      id={`fare-breakdown-${flight.offerId}`}
                      className="fare-breakdown"
                      role="region"
                      aria-label="Fare breakdown"
                    >
                      <div className="fare-row">
                        <span>Base fare</span>
                        <CurrencyAmount money={fare.baseFare} />
                      </div>
                      <div className="fare-row">
                        <span>Taxes</span>
                        <CurrencyAmount money={fare.taxes} />
                      </div>
                      <div className="fare-row">
                        <span>Fees</span>
                        <CurrencyAmount money={fare.fees} />
                      </div>
                      <div className="fare-row fare-row-total">
                        <strong>Total</strong>
                        <CurrencyAmount money={fare.total} highlight />
                      </div>
                      <p className="fare-note">Includes all taxes and fees. Currency: {fare.total.currency}</p>
                    </div>
                  )}
                </div>

                {/* Availability */}
                <div className="flight-availability">
                  {flight.isSoldOut ? (
                    <span className="availability-badge sold-out">✕ Sold Out</span>
                  ) : (
                    <>
                      <span className="availability-badge available">✓ Available</span>
                      {flight.availability <= 5 && (
                        <span className="seats-count seats-low">
                          Only {flight.availability} left!
                        </span>
                      )}
                      {flight.availability > 5 && (
                        <span className="seats-count">{flight.availability} seats</span>
                      )}
                    </>
                  )}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => onSelectFlight(flight)}
                  variant="primary"
                  size="md"
                  disabled={flight.isSoldOut}
                  aria-label={`Select ${flight.airline} ${flight.flightNumber} from ${flight.origin} to ${flight.destination}`}
                  data-testid={`btn-select-flight-${flight.offerId}`}
                >
                  Select
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

SearchResults.displayName = 'SearchResults';
