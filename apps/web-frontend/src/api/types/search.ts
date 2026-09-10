/**
 * Search API Types
 * Covers hotel search, availability, rate lookups (AC-EXP-01)
 */

import type { DateRange as _DateRange, Location, Money, PaginationMeta } from './common';

/**
 * Flight search request (AC-EXP-01-01)
 * Supports round-trip and one-way bookings
 */
export interface SearchRequest {
  origin: string; // IATA airport code (e.g., "LHR", "JFK")
  destination: string; // IATA airport code
  departureDate: string; // ISO 8601 (YYYY-MM-DD)
  returnDate?: string; // ISO 8601 (optional for one-way)
  passengers: number; // Total number of passengers
  cabinClass: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'PREMIUM_ECONOMY';
  sortBy?: 'PRICE_ASC' | 'PRICE_DESC' | 'DEPARTURE_TIME' | 'ARRIVAL_TIME' | 'DURATION';
  filters?: {
    priceRange?: {
      min: number;
      max: number;
    };
    airlines?: string[];
    stops?: 0 | 1 | 2; // 0 = nonstop, 1 = 1 stop, 2 = 2+ stops
    departureTimeRange?: {
      start: string; // HH:mm
      end: string;
    };
  };
  pageSize?: number;
  pageNumber?: number;
}

/**
 * Flight search response (AC-EXP-01-02)
 */
export interface SearchResponse {
  results: FlightOffer[];
  meta: PaginationMeta;
  searchId: string;
  timestamp: string;
}

/**
 * Individual flight offer/result
 */
export interface FlightOffer {
  offerId: string;
  airline: string;
  flightNumber: string;
  aircraft: string;
  origin: string; // IATA code
  destination: string; // IATA code
  departureTime: string; // ISO 8601
  arrivalTime: string; // ISO 8601
  duration: string; // ISO 8601 duration (PT12H30M)
  stops: number; // 0 = nonstop, 1+ = connecting
  stopDetails?: StopInfo[];
  cabinClass: 'ECONOMY' | 'BUSINESS' | 'FIRST' | 'PREMIUM_ECONOMY';
  price: Money;
  availability: number; // Seats available
  isSoldOut: boolean;
  fareRules?: FareRule[];
  metadata?: {
    gdsSupplierId?: string;
    lastUpdated: string;
  };
}

/**
 * Connection/stop information
 */
export interface StopInfo {
  airport: string; // IATA code
  duration: string; // ISO 8601 (layover time)
}

/**
 * Fare rule information
 */
export interface FareRule {
  ruleType: 'CANCELLATION' | 'CHANGE' | 'REFUND' | 'BAGGAGE';
  description: string;
  terms?: string;
}

/**
 * Hotel details request (AC-EXP-01-03)
 */
export interface HotelDetailsRequest {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfRooms: number;
}

/**
 * Hotel details response
 */
export interface HotelDetailsResponse {
  property: HotelDetail;
  availableRates: RateInfo[];
  policies: HotelPolicy[];
  timestamp: string;
}

/**
 * Full hotel detail information
 */
export interface HotelDetail {
  propertyId: string;
  name: string;
  location: Location;
  description: string;
  starRating: number;
  images: string[];
  amenities: string[];
  checkinTime: string; // HH:mm format
  checkoutTime: string; // HH:mm format
  phoneNumber?: string;
  website?: string;
  metadata?: {
    gdsSupplierId?: string;
  };
}

/**
 * Hotel rate information
 */
export interface RateInfo {
  rateId: string;
  roomType: string;
  description: string;
  occupancy: {
    minGuests: number;
    maxGuests: number;
  };
  basePrice: Money;
  taxes: Money;
  fees: Money;
  totalPrice: Money;
  cancellationPolicy: {
    refundable: boolean;
    cancellationDeadline?: string; // ISO 8601
    penaltyAmount?: Money;
  };
  bookingConditions?: string[];
  isAvailable: boolean;
}

/**
 * Hotel policy information
 */
export interface HotelPolicy {
  policyType: 'CANCELLATION' | 'CHECK_IN' | 'AMENITY' | 'OTHER';
  description: string;
  terms?: string;
}

/**
 * Auto-complete suggestion for destination search
 */
export interface DestinationSuggestion {
  id: string;
  name: string;
  type: 'CITY' | 'COUNTRY' | 'REGION' | 'AIRPORT';
  location: Location;
  popularHotelCount?: number;
}

/**
 * Destination auto-complete request
 */
export interface DestinationSearchRequest {
  query: string;
  limit?: number;
}

/**
 * Destination auto-complete response
 */
export interface DestinationSearchResponse {
  suggestions: DestinationSuggestion[];
}
