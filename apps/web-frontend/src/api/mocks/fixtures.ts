/**
 * Mock Data Fixtures
 * Provides realistic mock data for development and testing
 * Flight booking domain (AC-EXP-01-01, AC-EXP-01-02)
 */

import type {
  SearchRequest,
  SearchResponse,
  FlightOffer,
  StopInfo,
  FareRule,
  DestinationSuggestion,
  BookingHoldRequest,
  BookingHoldResponse,
  BookingDetailResponse,
  PolicyEvaluationRequest,
  PolicyEvaluationResponse,
  DisplayPolicy,
} from '../types';
import { BookingStatusValues, PolicyOutcomeValues } from '../types/common';

// Type aliases for usage in fixtures
type BookingStatus = typeof BookingStatusValues[keyof typeof BookingStatusValues];
type PolicyOutcome = typeof PolicyOutcomeValues[keyof typeof PolicyOutcomeValues];

// Mock airport data for autocomplete
export const MOCK_AIRPORTS: DestinationSuggestion[] = [
  {
    id: 'apt-001',
    name: 'London Heathrow (LHR)',
    type: 'AIRPORT',
    location: { city: 'London', country: 'UK' },
    popularHotelCount: 500,
  },
  {
    id: 'apt-002',
    name: 'New York JFK (JFK)',
    type: 'AIRPORT',
    location: { city: 'New York', country: 'USA' },
    popularHotelCount: 450,
  },
  {
    id: 'apt-003',
    name: 'San Francisco (SFO)',
    type: 'AIRPORT',
    location: { city: 'San Francisco', country: 'USA' },
    popularHotelCount: 350,
  },
  {
    id: 'apt-004',
    name: 'Paris Charles de Gaulle (CDG)',
    type: 'AIRPORT',
    location: { city: 'Paris', country: 'France' },
    popularHotelCount: 400,
  },
  {
    id: 'apt-005',
    name: 'Los Angeles (LAX)',
    type: 'AIRPORT',
    location: { city: 'Los Angeles', country: 'USA' },
    popularHotelCount: 380,
  },
];

// Mock flights for search results
export const MOCK_FLIGHTS: FlightOffer[] = [
  {
    offerId: 'flight-001',
    airline: 'British Airways',
    flightNumber: 'BA 112',
    aircraft: 'Boeing 777-200ER',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 7).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    arrivalTime: new Date(Date.now() + 86400000 * 7 + 28800000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    duration: 'PT7H30M',
    stops: 0,
    cabinClass: 'ECONOMY',
    price: { amount: 450, currency: 'USD' },
    availability: 12,
    isSoldOut: false,
    metadata: {
      gdsSupplierId: 'amadeus-001',
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    offerId: 'flight-002',
    airline: 'United Airlines',
    flightNumber: 'UA 908',
    aircraft: 'Boeing 787-10',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 7 + 43200000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    arrivalTime: new Date(Date.now() + 86400000 * 7 + 72000000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    duration: 'PT8H',
    stops: 0,
    cabinClass: 'ECONOMY',
    price: { amount: 380, currency: 'USD' },
    availability: 8,
    isSoldOut: false,
    metadata: {
      gdsSupplierId: 'amadeus-002',
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    offerId: 'flight-003',
    airline: 'Virgin Atlantic',
    flightNumber: 'VS 004',
    aircraft: 'Airbus A330-300',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    arrivalTime: new Date(Date.now() + 86400000 * 7 + 32400000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    duration: 'PT7H45M',
    stops: 1,
    stopDetails: [
      {
        airport: 'BOS',
        duration: 'PT1H30M',
      },
    ],
    cabinClass: 'PREMIUM_ECONOMY',
    price: { amount: 680, currency: 'USD' },
    availability: 5,
    isSoldOut: false,
    metadata: {
      gdsSupplierId: 'amadeus-003',
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    offerId: 'flight-004',
    airline: 'British Airways',
    flightNumber: 'BA 286',
    aircraft: 'Boeing 777-300ER',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 8).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    arrivalTime: new Date(Date.now() + 86400000 * 8 + 28800000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    duration: 'PT7H30M',
    stops: 0,
    cabinClass: 'BUSINESS',
    price: { amount: 1800, currency: 'USD' },
    availability: 3,
    isSoldOut: false,
    metadata: {
      gdsSupplierId: 'amadeus-004',
      lastUpdated: new Date().toISOString(),
    },
  },
  {
    offerId: 'flight-005',
    airline: 'Lufthansa',
    flightNumber: 'LH 401',
    aircraft: 'Airbus A340-600',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 9).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    arrivalTime: new Date(Date.now() + 86400000 * 9 + 30600000).toISOString().replace(/:\d\d\.\d+Z$/, ':00Z'),
    duration: 'PT8H30M',
    stops: 2,
    stopDetails: [
      { airport: 'FRA', duration: 'PT1H30M' },
      { airport: 'IAD', duration: 'PT1H' },
    ],
    cabinClass: 'ECONOMY',
    price: { amount: 320, currency: 'USD' },
    availability: 0,
    isSoldOut: true,
    metadata: {
      gdsSupplierId: 'amadeus-005',
      lastUpdated: new Date().toISOString(),
    },
  },
];

// Mock search response — overrides origin/destination with the user's actual search input
export const createMockSearchResponse = (searchId: string, request?: { origin: string; destination: string }): SearchResponse => {
  const results = MOCK_FLIGHTS.map((flight) => ({
    ...flight,
    origin: request?.origin ?? flight.origin,
    destination: request?.destination ?? flight.destination,
  }));

  return {
    results,
    meta: {
      totalCount: results.length,
      pageSize: 10,
      pageNumber: 1,
      hasMore: false,
    },
    searchId,
    timestamp: new Date().toISOString(),
  };
};

// Mock fare rules
export const createMockFareRules = (): FareRule[] => [
  {
    ruleType: 'CANCELLATION',
    description: 'Free cancellation up to 2 hours before departure',
    terms: 'Cancellations made within 2 hours of departure are non-refundable',
  },
  {
    ruleType: 'CHANGE',
    description: 'Changes allowed with applicable fees',
    terms: 'Flight changes can be made with $50 change fee',
  },
  {
    ruleType: 'BAGGAGE',
    description: '1 carry-on + 1 personal item included',
    terms: 'First checked baggage: $35, Second checked baggage: $50',
  },
  {
    ruleType: 'REFUND',
    description: 'Non-refundable base fare',
    terms: 'Only taxes and fees are refundable',
  },
];

// Mock hotel details (kept for backward compatibility if needed)
export const createMockHotelDetail = (propertyId: string) => {
  // Legacy hotel support - stub implementation
  return {
    propertyId,
    name: 'Legacy Hotel',
    location: { city: 'Unknown', country: 'Unknown' },
    starRating: 3,
    amenities: [],
    checkinTime: '15:00',
    checkoutTime: '11:00',
  };
};

// Mock rates (kept for backward compatibility if needed)
export const createMockRates = () => [
  {
    rateId: 'rate-001',
    roomType: 'Standard Room',
    description: 'One bed, standard amenities',
    occupancy: { minGuests: 1, maxGuests: 2 },
    basePrice: { amount: 200, currency: 'USD' },
    taxes: { amount: 30, currency: 'USD' },
    fees: { amount: 20, currency: 'USD' },
    totalPrice: { amount: 250, currency: 'USD' },
    cancellationPolicy: {
      refundable: true,
      cancellationDeadline: new Date(Date.now() + 86400000).toISOString(),
    },
    isAvailable: true,
  },
];

// Mock hotel details response (legacy - kept for backward compatibility)
export const createMockHotelDetailsResponse = (propertyId: string) => ({
  property: createMockHotelDetail(propertyId),
  availableRates: createMockRates(),
  policies: [
    {
      policyType: 'CANCELLATION',
      description: 'Free cancellation up to 48 hours before check-in',
    },
  ],
  timestamp: new Date().toISOString(),
});

// Mock booking hold response
export const createMockBookingHoldResponse = (
  bookingId: string,
  offerId: string
): BookingHoldResponse => {
  const flight = MOCK_FLIGHTS.find((f) => f.offerId === offerId) || MOCK_FLIGHTS[0];
  return {
    bookingId,
    bookingStatus: 'HELD' as const,
    confirmationNumber: `CONF-${bookingId.toUpperCase()}`,
    holdExpiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    hotelDetails: {
      name: `${flight.airline} ${flight.flightNumber}`,
      location: { city: flight.origin, country: flight.origin },
    },
    rateDetails: {
      basePrice: flight.price,
      taxes: { amount: flight.price.amount * 0.15, currency: flight.price.currency },
      fees: { amount: 25, currency: flight.price.currency },
      totalPrice: {
        amount:
          flight.price.amount +
          flight.price.amount * 0.15 +
          25,
        currency: flight.price.currency,
      },
    },
    guestName: 'John Doe',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    numberOfRooms: 1,
    numberOfNights: 1,
    cancellationPolicy: {
      refundable: true,
      cancellationDeadline: new Date(Date.now() + 172800000).toISOString(), // 48 hours
      penaltyAmount: { amount: 50, currency: flight.price.currency },
    },
    createdAt: new Date().toISOString(),
  };
};

// Mock policy evaluation response - ALLOW
export const createMockPolicyResponseAllow = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-001',
  outcome: 'ALLOW' as const,
  timestamp: new Date().toISOString(),
  policies: [
    {
      policyId: 'pol-001',
      policyName: 'Daily Rate Limit',
      outcome: 'ALLOW' as const,
      details: 'Rate is within daily limit',
      threshold: { amount: 500, currency: 'USD' },
      actualValue: { amount: 312.5, currency: 'USD' },
    },
  ],
  requiresApproval: false,
});

// Mock policy evaluation response - WARN
export const createMockPolicyResponseWarn = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-002',
  outcome: 'WARN' as const,
  timestamp: new Date().toISOString(),
  policies: [
    {
      policyId: 'pol-002',
      policyName: 'Advanced Booking',
      outcome: 'WARN' as const,
      details: 'Booking within 7 days (preferred: 14+ days)',
    },
  ],
  requiresApproval: false,
  warnings: [
    {
      code: 'ADV_BOOKING_SHORT',
      message: 'This booking is less than 7 days in advance',
      severity: 'WARNING',
    },
  ],
});

// Mock policy evaluation response - BLOCK
export const createMockPolicyResponseBlock = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-003',
  outcome: 'BLOCK' as const,
  timestamp: new Date().toISOString(),
  policies: [
    {
      policyId: 'pol-003',
      policyName: 'Destination Restriction',
      outcome: 'BLOCK' as const,
      details: 'Travel to this destination is not permitted',
      isBreached: true,
    },
  ],
  requiresApproval: false,
  warnings: [
    {
      code: 'DESTINATION_BLOCKED',
      message: 'This destination is blocked by organizational policy',
      severity: 'ERROR',
    },
  ],
});

// Mock policy evaluation response - REQUIRE_APPROVAL
export const createMockPolicyResponseRequireApproval = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-004',
  outcome: 'REQUIRE_APPROVAL' as const,
  timestamp: new Date().toISOString(),
  policies: [
    {
      policyId: 'pol-004',
      policyName: 'High-Cost Booking',
      outcome: 'REQUIRE_APPROVAL' as const,
      details: 'Booking exceeds approval threshold',
      threshold: { amount: 300, currency: 'USD' },
      actualValue: { amount: 312.5, currency: 'USD' },
      isBreached: true,
    },
  ],
  requiresApproval: true,
  approvalDetails: {
    approverIds: ['user-001'],
    deadline: new Date(Date.now() + 86400000).toISOString(),
    reason: 'Booking total exceeds daily approval threshold',
  },
});

// Mock display policies
export const createMockDisplayPolicies = (
  outcome: PolicyOutcome
): DisplayPolicy[] => {
  switch (outcome) {
    case 'ALLOW':
      return [
        {
          name: 'Compliance Check',
          description: 'Your booking complies with all organizational policies',
          outcome: 'ALLOW' as const,
          message: 'You are approved to proceed with this booking.',
          actionRequired: 'NONE',
        },
      ];
    case 'WARN':
      return [
        {
          name: 'Advance Booking Warning',
          description: 'Booking within 7 days is discouraged',
          outcome: 'WARN' as const,
          message: 'This booking is less than 7 days in advance. Consider booking earlier for better rates.',
          actionRequired: 'NONE',
        },
      ];
    case 'BLOCK':
      return [
        {
          name: 'Destination Blocked',
          description: 'This destination is restricted',
          outcome: 'BLOCK' as const,
          message: 'Travel to this destination is not permitted. Please contact your manager.',
          actionRequired: 'CONTACT_APPROVER',
          contactInfo: {
            approverName: 'Travel Manager',
            approverEmail: 'travel@company.com',
          },
        },
      ];
    case 'REQUIRE_APPROVAL':
      return [
        {
          name: 'High-Cost Approval Required',
          description: 'This booking exceeds your approval threshold',
          outcome: 'REQUIRE_APPROVAL' as const,
          message: 'Your booking total ($312.50) exceeds your approval limit. Manager approval required.',
          actionRequired: 'CONTACT_APPROVER',
          contactInfo: {
            approverName: 'Your Manager',
            approverEmail: 'manager@company.com',
            deadline: new Date(Date.now() + 86400000).toISOString(),
          },
        },
      ];
    default:
      return [];
  }
};

// Mock booking detail response
export const createMockBookingDetailResponse = (
  bookingId: string
): BookingDetailResponse => ({
  bookingId,
  confirmationNumber: `CONF-${bookingId.toUpperCase()}`,
  bookingStatus: 'HELD' as const,
  hotelDetails: {
    propertyId: 'flight-001',
    name: 'British Airways BA 112',
    location: {
      city: 'London',
      state: 'London',
      country: 'UK',
    },
    phone: '+44-207-123-4567',
    website: 'https://www.britishairways.com',
  },
  guestInfo: {
    primary: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-123-4567',
    },
  },
  stayDetails: {
    checkIn: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
    numberOfRooms: 1,
    numberOfNights: 1,
  },
  rateDetails: {
    basePrice: { amount: 450, currency: 'USD' },
    taxes: { amount: 67.5, currency: 'USD' },
    fees: { amount: 25, currency: 'USD' },
    totalPrice: { amount: 542.5, currency: 'USD' },
  },
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
});
