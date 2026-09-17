/**
 * Search Test Fixtures
 * 
 * Provides test data for search scenarios.
 * All amounts in integer minor units (USD cents).
 */

import { IATA_CODES, CURRENCIES } from '../../shared/constants/TestData';

export class SearchFixtures {
  /**
   * Valid search request for YVR to JFK economy roundtrip
   */
  static validSearch() {
    return {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.JFK,
      departure_date: '2026-10-15',
      return_date: '2026-10-22',
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Valid search with multiple passengers
   */
  static validSearch_MultiplePassengers() {
    return {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.JFK,
      departure_date: '2026-10-15',
      return_date: '2026-10-22',
      passengers: [
        { type: 'ADULT' },
        { type: 'ADULT' },
        { type: 'CHILD' },
        { type: 'INFANT' }
      ],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Search for business class
   */
  static validSearch_BusinessClass() {
    return {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.CDG,
      departure_date: '2026-11-01',
      return_date: '2026-11-08',
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'BUSINESS'
    };
  }

  /**
   * Search with past departure date (should return empty)
   */
  static pastDateSearch() {
    return {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.JFK,
      departure_date: '2020-01-01', // Past date
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Search with non-existent destination
   */
  static noMatchSearch() {
    return {
      origin: IATA_CODES.YLW,
      destination: IATA_CODES.ZZZ, // Non-existent
      departure_date: '2026-12-25',
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Invalid search - missing origin
   */
  static invalidSearch_NoOrigin() {
    return {
      // missing: origin
      destination: IATA_CODES.JFK,
      departure_date: '2026-10-15',
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Invalid search - missing destination
   */
  static invalidSearch_NoDestination() {
    return {
      origin: IATA_CODES.YVR,
      // missing: destination
      departure_date: '2026-10-15',
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Invalid search - missing departure_date
   */
  static invalidSearch_NoDepartureDate() {
    return {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.JFK,
      // missing: departure_date
      passengers: [{ type: 'ADULT' }],
      cabin_class: 'ECONOMY'
    };
  }

  /**
   * Invalid search - missing passengers
   */
  static invalidSearch_NoPassengers() {
    return {
      origin: IATA_CODES.YVR,
      destination: IATA_CODES.JFK,
      departure_date: '2026-10-15',
      // missing: passengers
      cabin_class: 'ECONOMY'
    };
  }
}

/**
 * Search Response Fixtures (Wiremock-like)
 */
export class SearchResponseFixtures {
  /**
   * Sample offer for YVR-JFK economy
   * Base fare: $450.00 (45000 minor units)
   * Taxes: YQ (fuel surcharge) $25.00 + US (tax) $10.00
   * Fees: Booking fee $5.00
   * Total: $490.00 (49000 minor units)
   */
  static offer_YVR_JFK_Economy() {
    return {
      offer_id: '_TEST_OFFER_YVR_JFK_001',
      base_fare_amount: 45000,
      currency_code: CURRENCIES.USD,
      taxes: [
        { code: 'YQ', amount: 2500 }, // Fuel surcharge $25.00
        { code: 'US', amount: 1000 }   // Tax $10.00
      ],
      fees: [
        { type: 'BOOKING_FEE', amount: 500 } // Booking fee $5.00
      ],
      total_amount: 49000,
      segments: [
        {
          segment_id: 'SEG_001_OUTBOUND',
          product_type: 'AIR',
          departure_airport: IATA_CODES.YVR,
          arrival_airport: IATA_CODES.JFK,
          departure_time: '2026-10-15T10:00:00Z',
          arrival_time: '2026-10-15T18:30:00Z',
          airline_code: 'AC',
          flight_number: 'AC001'
        },
        {
          segment_id: 'SEG_002_RETURN',
          product_type: 'AIR',
          departure_airport: IATA_CODES.JFK,
          arrival_airport: IATA_CODES.YVR,
          departure_time: '2026-10-22T14:00:00Z',
          arrival_time: '2026-10-22T22:30:00Z',
          airline_code: 'AC',
          flight_number: 'AC002'
        }
      ]
    };
  }

  /**
   * Sample offer for YVR-CDG business
   */
  static offer_YVR_CDG_Business() {
    return {
      offer_id: '_TEST_OFFER_YVR_CDG_BUS_001',
      base_fare_amount: 180000, // $1800
      currency_code: CURRENCIES.USD,
      taxes: [
        { code: 'YQ', amount: 4000 },
        { code: 'EU', amount: 2500 }
      ],
      fees: [
        { type: 'BOOKING_FEE', amount: 500 }
      ],
      total_amount: 187000,
      segments: [
        {
          segment_id: 'SEG_003',
          product_type: 'AIR',
          departure_airport: IATA_CODES.YVR,
          arrival_airport: IATA_CODES.CDG,
          airline_code: 'AC',
          flight_number: 'AC101'
        }
      ]
    };
  }

  /**
   * Multiple offers response
   */
  static multipleOffers() {
    return {
      offers: [
        this.offer_YVR_JFK_Economy(),
        {
          offer_id: '_TEST_OFFER_YVR_JFK_002',
          base_fare_amount: 52000, // Higher fare
          currency_code: CURRENCIES.USD,
          taxes: [
            { code: 'YQ', amount: 2500 },
            { code: 'US', amount: 1000 }
          ],
          fees: [
            { type: 'BOOKING_FEE', amount: 500 }
          ],
          total_amount: 56000,
          segments: []
        }
      ]
    };
  }

  /**
   * Empty response (no offers)
   */
  static emptyOffers() {
    return {
      offers: [],
      message: 'No offers available for the requested route and dates'
    };
  }
}

/**
 * Booking Request Fixtures
 */
export class BookingFixtures {
  /**
   * Valid booking request for offer from search
   */
  static validBookingRequest() {
    return {
      offer_id: '_TEST_OFFER_YVR_JFK_001',
      passengers: [
        {
          type: 'ADULT',
          passenger_id: '_TEST_TRAVELER_P001'
        }
      ],
      payment_reference: 'LODGE_CARD_TOKEN_123'
    };
  }

  /**
   * Booking for high-value fare requiring approval
   */
  static highFareBookingRequest() {
    return {
      offer_id: '_TEST_OFFER_HIGH_FARE_5000',
      passengers: [
        {
          type: 'ADULT',
          passenger_id: '_TEST_TRAVELER_P002'
        }
      ],
      payment_reference: 'LODGE_CARD_TOKEN_456'
    };
  }

  /**
   * Booking with multiple passengers
   */
  static multiPassengerBookingRequest() {
    return {
      offer_id: '_TEST_OFFER_YVR_JFK_001',
      passengers: [
        {
          type: 'ADULT',
          passenger_id: '_TEST_TRAVELER_P001'
        },
        {
          type: 'ADULT',
          passenger_id: '_TEST_TRAVELER_P003'
        },
        {
          type: 'CHILD',
          passenger_id: '_TEST_TRAVELER_P004'
        }
      ],
      payment_reference: 'LODGE_CARD_TOKEN_789'
    };
  }

  /**
   * Valid confirm request with cost allocations
   */
  static validConfirmRequest() {
    return {
      payment_reference: 'LODGE_CARD_TOKEN_123',
      cost_allocations: [
        {
          passenger_id: '_TEST_TRAVELER_P001',
          allocations: [
            {
              cost_center_id: 'CC_001',
              percentage: 100.0
            }
          ]
        }
      ]
    };
  }

  /**
   * Confirm request with multi-split allocations
   */
  static confirmRequestMultipleSplits() {
    return {
      payment_reference: 'LODGE_CARD_TOKEN_123',
      cost_allocations: [
        {
          passenger_id: '_TEST_TRAVELER_P001',
          allocations: [
            {
              cost_center_id: 'CC_001',
              percentage: 50.0
            },
            {
              cost_center_id: 'CC_002',
              percentage: 50.0
            }
          ]
        }
      ]
    };
  }

  /**
   * Invalid confirm request - splits don't sum to 100%
   */
  static confirmRequestInvalidSplits() {
    return {
      payment_reference: 'LODGE_CARD_TOKEN_123',
      cost_allocations: [
        {
          passenger_id: '_TEST_TRAVELER_P001',
          allocations: [
            {
              cost_center_id: 'CC_001',
              percentage: 50.0
            },
            {
              cost_center_id: 'CC_002',
              percentage: 40.0
            }
            // Missing 10%
          ]
        }
      ]
    };
  }
}
