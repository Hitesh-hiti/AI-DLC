/**
 * Search Results Component
 * Displays flight search results (AC-EXP-01-02)
 * Implements design-document.md section 2.2
 */

import React from 'react';
import type { FlightOffer } from '../../api/types/search';
import { CurrencyAmount } from '../common/CurrencyAmount';
import { Button } from '../common/Button';
import './SearchResults.css';

export interface SearchResultsProps {
  results: FlightOffer[];
  onSelectFlight: (flight: FlightOffer) => void;
  isLoading?: boolean;
}

/**
 * Format ISO 8601 duration to readable format (e.g., PT12H30M -> 12h 30m)
 */
function formatDuration(iso8601Duration: string): string {
  const match = iso8601Duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return iso8601Duration;

  const hours = match[1]?.replace('H', '') || '0';
  const minutes = match[2]?.replace('M', '') || '0';

  if (hours === '0') return `${minutes}m`;
  if (minutes === '0') return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format time from ISO 8601 to HH:MM
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format date from ISO 8601 to MMM DD
 */
function formatDateShort(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onSelectFlight,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="search-results-loading">
        <div className="loading-spinner" />
        <p>Searching for flights...</p>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="search-results-empty">
        <p>No flights found. Please try different search criteria.</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <h2 className="search-results-title">
        {results.length} Flight{results.length !== 1 ? 's' : ''} Found
      </h2>

      <div className="search-results-list">
        {results.map((flight) => (
          <div key={flight.offerId} className="flight-card">
            <div className="flight-card-header">
              <div className="flight-info">
                <h3 className="flight-airline">{flight.airline}</h3>
                <p className="flight-number">Flight {flight.flightNumber}</p>
              </div>
              <div className="flight-cabin-class">
                <span className="cabin-badge">{flight.cabinClass.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flight-card-body">
              <div className="flight-route">
                <div className="flight-segment">
                  <div className="time">{formatTime(flight.departureTime)}</div>
                  <div className="airport">{flight.origin}</div>
                </div>

                <div className="flight-duration">
                  <div className="duration-line" />
                  <div className="duration-text">
                    <span>{formatDuration(flight.duration)}</span>
                    {flight.stops > 0 && (
                      <span className="stops">
                        {flight.stops} stop{flight.stops > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flight-segment">
                  <div className="time">{formatTime(flight.arrivalTime)}</div>
                  <div className="airport">{flight.destination}</div>
                </div>
              </div>

              <div className="flight-aircraft">
                <span className="aircraft-type">{flight.aircraft}</span>
              </div>
            </div>

            <div className="flight-card-footer">
              <div className="flight-price">
                <CurrencyAmount
                  money={flight.price}
                  size="lg"
                  highlight
                />
              </div>

              <div className="flight-availability">
                {flight.isSoldOut ? (
                  <span className="availability-badge sold-out">
                    ✕ Sold Out
                  </span>
                ) : (
                  <>
                    <span className="availability-badge available">
                      ✓ Available
                    </span>
                    <span className="seats-count">
                      {flight.availability} seats available
                    </span>
                  </>
                )}
              </div>

              <Button
                onClick={() => onSelectFlight(flight)}
                variant="primary"
                size="md"
                disabled={flight.isSoldOut}
              >
                Select
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

SearchResults.displayName = 'SearchResults';
