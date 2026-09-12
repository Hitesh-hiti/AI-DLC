/**
 * Mock Data Fixtures
 * Provides realistic mock data for development and testing
 * Flight booking domain (AC-EXP-01-01 – AC-EXP-06-03)
 */

import type {
  SearchResponse,
  FlightOffer,
  FareRule,
  DestinationSuggestion,
  BookingHoldResponse,
  BookingDetailResponse,
  PolicyEvaluationResponse,
  DisplayPolicy,
} from '../types';

// ─── Airports ─────────────────────────────────────────────────────────────────

export const MOCK_AIRPORTS: DestinationSuggestion[] = [
  { id: 'apt-001', name: 'London Heathrow (LHR)', type: 'AIRPORT', location: { city: 'London', country: 'UK' } },
  { id: 'apt-002', name: 'New York JFK (JFK)',    type: 'AIRPORT', location: { city: 'New York', country: 'USA' } },
  { id: 'apt-003', name: 'San Francisco (SFO)',   type: 'AIRPORT', location: { city: 'San Francisco', country: 'USA' } },
  { id: 'apt-004', name: 'Paris CDG (CDG)',        type: 'AIRPORT', location: { city: 'Paris', country: 'France' } },
  { id: 'apt-005', name: 'Los Angeles (LAX)',      type: 'AIRPORT', location: { city: 'Los Angeles', country: 'USA' } },
];

// ─── Flights ──────────────────────────────────────────────────────────────────

export const MOCK_FLIGHTS: FlightOffer[] = [
  {
    offerId: 'flight-001',
    airline: 'British Airways',
    flightNumber: 'BA 112',
    aircraft: 'Boeing 777-200ER',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    arrivalTime:   new Date(Date.now() + 86400000 * 7 + 27000000).toISOString(),
    duration: 'PT7H30M',
    stops: 0,
    cabinClass: 'ECONOMY',
    price: { amount: 450, currency: 'USD' },
    availability: 12,
    isSoldOut: false,
    metadata: { gdsSupplierId: 'amadeus-001', lastUpdated: new Date().toISOString() },
  },
  {
    offerId: 'flight-002',
    airline: 'United Airlines',
    flightNumber: 'UA 908',
    aircraft: 'Boeing 787-10',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 7 + 43200000).toISOString(),
    arrivalTime:   new Date(Date.now() + 86400000 * 7 + 72000000).toISOString(),
    duration: 'PT8H',
    stops: 0,
    cabinClass: 'ECONOMY',
    price: { amount: 380, currency: 'USD' },
    availability: 8,
    isSoldOut: false,
    metadata: { gdsSupplierId: 'amadeus-002', lastUpdated: new Date().toISOString() },
  },
  {
    offerId: 'flight-003',
    airline: 'Virgin Atlantic',
    flightNumber: 'VS 004',
    aircraft: 'Airbus A330-300',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString(),
    arrivalTime:   new Date(Date.now() + 86400000 * 7 + 31500000).toISOString(),
    duration: 'PT7H45M',
    stops: 1,
    stopDetails: [{ airport: 'BOS', duration: 'PT1H30M' }],
    cabinClass: 'PREMIUM_ECONOMY',
    price: { amount: 680, currency: 'USD' },
    availability: 5,
    isSoldOut: false,
    metadata: { gdsSupplierId: 'amadeus-003', lastUpdated: new Date().toISOString() },
  },
  {
    offerId: 'flight-004',
    airline: 'British Airways',
    flightNumber: 'BA 286',
    aircraft: 'Boeing 777-300ER',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 8).toISOString(),
    arrivalTime:   new Date(Date.now() + 86400000 * 8 + 27000000).toISOString(),
    duration: 'PT7H30M',
    stops: 0,
    cabinClass: 'BUSINESS',
    price: { amount: 1800, currency: 'USD' },
    availability: 3,
    isSoldOut: false,
    metadata: { gdsSupplierId: 'amadeus-004', lastUpdated: new Date().toISOString() },
  },
  {
    offerId: 'flight-005',
    airline: 'Lufthansa',
    flightNumber: 'LH 401',
    aircraft: 'Airbus A340-600',
    origin: 'LHR',
    destination: 'JFK',
    departureTime: new Date(Date.now() + 86400000 * 9).toISOString(),
    arrivalTime:   new Date(Date.now() + 86400000 * 9 + 30600000).toISOString(),
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
    metadata: { gdsSupplierId: 'amadeus-005', lastUpdated: new Date().toISOString() },
  },
];

// ─── Search response ──────────────────────────────────────────────────────────

/**
 * Build a mock SearchResponse.
 * When `request` is supplied every result's origin/destination is overridden
 * with the codes the user actually typed — so the cards reflect the real search.
 */
export const createMockSearchResponse = (
  searchId: string,
  request?: { origin: string; destination: string },
): SearchResponse => {
  const results = MOCK_FLIGHTS.map((flight) => ({
    ...flight,
    origin:      request?.origin      ?? flight.origin,
    destination: request?.destination ?? flight.destination,
  }));

  return {
    results,
    meta: { totalCount: results.length, pageSize: 10, pageNumber: 1, hasMore: false },
    searchId,
    timestamp: new Date().toISOString(),
  };
};

// ─── Fare rules ───────────────────────────────────────────────────────────────

export const createMockFareRules = (): FareRule[] => [
  { ruleType: 'CANCELLATION', description: 'Free cancellation up to 2 hours before departure',  terms: 'Cancellations within 2 hours of departure are non-refundable' },
  { ruleType: 'CHANGE',       description: 'Changes allowed with applicable fees',               terms: 'Flight changes carry a $50 change fee' },
  { ruleType: 'BAGGAGE',      description: '1 carry-on + 1 personal item included',              terms: 'First checked bag: $35 · Second: $50' },
  { ruleType: 'REFUND',       description: 'Non-refundable base fare',                           terms: 'Only taxes and fees are refundable' },
];

// ─── Booking hold response ────────────────────────────────────────────────────

export const createMockBookingHoldResponse = (
  bookingId: string,
  offerId: string,
  withApproval = false,
): BookingHoldResponse => {
  const flight = MOCK_FLIGHTS.find((f) => f.offerId === offerId) ?? MOCK_FLIGHTS[0];
  const taxes  = flight.price.amount * 0.15;
  const fees   = 25;

  return {
    bookingId,
    bookingStatus: withApproval ? 'PENDING_APPROVAL' : 'HELD',
    confirmationNumber: `CONF-${bookingId.replace(/-/g,'').toUpperCase().slice(0,8)}`,
    holdExpiresAt: new Date(Date.now() + 1800000).toISOString(), // 30 min

    flightSummary: {
      airline:       flight.airline,
      flightNumber:  flight.flightNumber,
      origin:        flight.origin,
      destination:   flight.destination,
      departureTime: flight.departureTime,
      arrivalTime:   flight.arrivalTime,
      cabinClass:    flight.cabinClass,
      passengers:    1,
    },

    fareBreakdown: {
      baseFare:  flight.price,
      taxes:     { amount: taxes,          currency: flight.price.currency },
      fees:      { amount: fees,           currency: flight.price.currency },
      totalFare: { amount: flight.price.amount + taxes + fees, currency: flight.price.currency },
    },

    cancellationPolicy: {
      refundable:           true,
      cancellationDeadline: new Date(Date.now() + 172800000).toISOString(),
      penaltyAmount:        { amount: 50, currency: flight.price.currency },
    },

    ...(withApproval && {
      approvalDetails: {
        approvalId:        `APPR-${bookingId.slice(0, 8).toUpperCase()}`,
        approverName:      'Sarah Johnson (Manager)',
        approverEmail:     'sarah.johnson@company.com',
        approvalExpiresAt: new Date(Date.now() + 1800000).toISOString(),
        reason:            'Fare exceeds the USD 1,000 approval threshold',
      },
    }),

    createdAt: new Date().toISOString(),
  };
};

// ─── Booking detail response ──────────────────────────────────────────────────

export const createMockBookingDetailResponse = (bookingId: string): BookingDetailResponse => {
  const flight = MOCK_FLIGHTS[0];

  return {
    bookingId,
    confirmationNumber: `CONF-${bookingId.toUpperCase()}`,
    bookingStatus: 'HELD',

    flightDetails: {
      airline:       flight.airline,
      flightNumber:  flight.flightNumber,
      aircraft:      flight.aircraft,
      origin:        flight.origin,
      destination:   flight.destination,
      departureTime: flight.departureTime,
      arrivalTime:   flight.arrivalTime,
      duration:      flight.duration,
      stops:         flight.stops,
      cabinClass:    flight.cabinClass,
    },

    passengers: [
      {
        passengerType: 'ADT',
        firstName: 'John',
        lastName:  'Doe',
      },
    ],

    fareBreakdown: {
      baseFare:  { amount: 450,   currency: 'USD' },
      taxes:     { amount: 67.5,  currency: 'USD' },
      fees:      { amount: 25,    currency: 'USD' },
      totalFare: { amount: 542.5, currency: 'USD' },
    },

    cancellationPolicy: {
      refundable:           true,
      cancellationDeadline: new Date(Date.now() + 172800000).toISOString(),
    },

    createdAt:  new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };
};

// ─── Policy response factories ────────────────────────────────────────────────

export const createMockPolicyResponseAllow = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-001',
  outcome: 'ALLOW',
  timestamp: new Date().toISOString(),
  policies: [{
    policyId: 'pol-001',
    policyName: 'Fare Limit',
    outcome: 'ALLOW',
    details: 'Fare is within the approved limit',
    threshold:   { amount: 1000, currency: 'USD' },
    actualValue: { amount: 450,  currency: 'USD' },
  }],
  requiresApproval: false,
});

export const createMockPolicyResponseWarn = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-002',
  outcome: 'WARN',
  timestamp: new Date().toISOString(),
  policies: [{
    policyId: 'pol-002',
    policyName: 'Advance Booking',
    outcome: 'WARN',
    details: 'Booking made less than 7 days before departure (recommended: 14+ days)',
  }],
  requiresApproval: false,
  warnings: [{
    code: 'ADV_BOOKING_SHORT',
    message: 'This booking is less than 7 days in advance',
    severity: 'WARNING',
  }],
});

export const createMockPolicyResponseBlock = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-003',
  outcome: 'BLOCK',
  timestamp: new Date().toISOString(),
  policies: [{
    policyId: 'pol-003',
    policyName: 'Destination Restriction',
    outcome: 'BLOCK',
    details: 'Travel to this destination is not permitted by organisational policy',
    isBreached: true,
  }],
  requiresApproval: false,
  warnings: [{
    code: 'DESTINATION_BLOCKED',
    message: 'This destination is blocked by organisational policy',
    severity: 'ERROR',
  }],
});

export const createMockPolicyResponseRequireApproval = (): PolicyEvaluationResponse => ({
  evaluationId: 'eval-004',
  outcome: 'REQUIRE_APPROVAL',
  timestamp: new Date().toISOString(),
  policies: [{
    policyId: 'pol-004',
    policyName: 'High-Fare Approval',
    outcome: 'REQUIRE_APPROVAL',
    details: 'Fare exceeds the approval threshold',
    threshold:   { amount: 1000, currency: 'USD' },
    actualValue: { amount: 1800, currency: 'USD' },
    isBreached: true,
  }],
  requiresApproval: true,
  approvalDetails: {
    approverIds: ['manager-001'],
    deadline: new Date(Date.now() + 86400000).toISOString(),
    reason: 'Fare exceeds the manager approval threshold of USD 1,000',
  },
});

// ─── Display policies (UI helper) ────────────────────────────────────────────

export const createMockDisplayPolicies = (
  outcome: PolicyEvaluationResponse['outcome'],
): DisplayPolicy[] => {
  switch (outcome) {
    case 'ALLOW':
      return [{
        name: 'Policy Check',
        description: 'Booking complies with all organisational travel policies',
        outcome: 'ALLOW',
        message: 'You may proceed with this booking.',
        actionRequired: 'NONE',
      }];
    case 'WARN':
      return [{
        name: 'Advance Booking Warning',
        description: 'Booking within 7 days is discouraged',
        outcome: 'WARN',
        message: 'This flight is booked less than 7 days before departure. Earlier bookings typically offer better fares.',
        actionRequired: 'NONE',
      }];
    case 'BLOCK':
      return [{
        name: 'Destination Blocked',
        description: 'This destination is restricted',
        outcome: 'BLOCK',
        message: 'Travel to this destination is not permitted. Please contact your Travel Manager.',
        actionRequired: 'CONTACT_APPROVER',
        contactInfo: { approverName: 'Travel Manager', approverEmail: 'travel@company.com' },
      }];
    case 'REQUIRE_APPROVAL':
      return [{
        name: 'Manager Approval Required',
        description: 'Fare exceeds your approval threshold',
        outcome: 'REQUIRE_APPROVAL',
        message: 'This fare (USD 1,800) exceeds your approval limit. Your manager must approve before ticketing.',
        actionRequired: 'CONTACT_APPROVER',
        contactInfo: {
          approverName: 'Your Manager',
          approverEmail: 'manager@company.com',
          deadline: new Date(Date.now() + 86400000).toISOString(),
        },
      }];
    default:
      return [];
  }
};
