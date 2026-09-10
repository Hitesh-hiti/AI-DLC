/**
 * App Component
 * Main application entry point
 * Flight booking domain (AC-EXP-01-01, AC-EXP-01-02)
 */

import React, { useState } from 'react';
import { AppProvider } from './state/AppContext';
import { BookingProvider } from './state/BookingContext';
import { SearchForm } from './components/search/SearchForm';
import { SearchResults } from './components/search/SearchResults';
import { PolicyBanner } from './components/booking/PolicyBanner';
import { bookingService } from './api/services/bookingService';
import { mapApiError } from './api/services/errorMapper';
import { useBookingContext } from './state/BookingContext';
import type { SearchRequest, FlightOffer } from './api/types/search';
import { Alert } from './components/common/Alert';
import './App.css';

/**
 * SearchPage - Inner component using BookingContext
 */
const SearchPage: React.FC = () => {
  const bookingCtx = useBookingContext();
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (request: SearchRequest) => {
    try {
      setError(null);
      bookingCtx.setIsLoading(true);
      bookingCtx.setCurrentStep('search');

      const response = await bookingService.searchHotels(request);
      bookingCtx.setSearchRequest(request);
      bookingCtx.setSearchResults(response.results);
      bookingCtx.setCurrentStep('results');
    } catch (err) {
      const appError = mapApiError(err);
      setError(appError.displayMessage);
      bookingCtx.setCurrentStep('search');
    } finally {
      bookingCtx.setIsLoading(false);
    }
  };

  const handleSelectFlight = async (flight: FlightOffer) => {
    try {
      setError(null);
      bookingCtx.setIsLoading(true);

      bookingCtx.selectHotel(flight as any); // Type bridge - flight acts as booking item
    } catch (err) {
      const appError = mapApiError(err);
      setError(appError.displayMessage);
    } finally {
      bookingCtx.setIsLoading(false);
    }
  };

  return (
    <>
      {/* Decorative travel pins */}
      <div className="travel-pin" />
      <div className="travel-pin" />
      <div className="travel-pin" />
      <div className="travel-pin" />
      <div className="travel-pin" />

      <div className="app-container">
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-header-icon">✈</div>
            <h1>TravelPlatform</h1>
            <p>Find and book flights with policy compliance</p>
          </div>
        </header>

        {error && (
          <Alert
            variant="error"
            title="Error"
            message={error}
            dismissible
            onDismiss={() => setError(null)}
          />
        )}

        {(bookingCtx.currentStep === 'search' || bookingCtx.currentStep === 'results') && (
          <>
            <SearchForm onSearch={handleSearch} isLoading={bookingCtx.isLoading} />
            {bookingCtx.searchResults && (
              <SearchResults
                results={bookingCtx.searchResults}
                onSelectFlight={handleSelectFlight}
                isLoading={bookingCtx.isLoading}
              />
            )}
          </>
        )}

        {bookingCtx.currentStep === 'details' && bookingCtx.selectedHotel && (
          <div className="flight-details-section">
            <h2>Flight Selected</h2>
            <p>Flight booking details coming in next phase...</p>
          </div>
        )}

        {bookingCtx.policyEvaluation && (
          <PolicyBanner
            policies={bookingCtx.policyEvaluation.policies.map((p) => ({
              name: p.policyName,
              description: p.details,
              outcome: p.outcome,
              message: `Policy: ${p.details}`,
              actionRequired: 'NONE',
            }))}
          />
        )}
      </div>
    </>
  );
};

/**
 * App - Root component with providers
 */
function App() {
  return (
    <AppProvider>
      <BookingProvider>
        <SearchPage />
      </BookingProvider>
    </AppProvider>
  );
}

export default App;
