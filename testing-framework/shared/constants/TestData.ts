/**
 * Test Data Constants
 * 
 * Stable test data used across all test suites.
 * All amounts in integer minor units (cents for USD).
 */

export const IATA_CODES = {
  YVR: 'YVR', // Vancouver
  JFK: 'JFK', // New York
  CDG: 'CDG', // Paris
  LHR: 'LHR', // London
  YLW: 'YLW', // Kelowna (small airport)
  ZZZ: 'ZZZ'  // Non-existent (for testing)
};

export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD'
};

export const AIRLINE_CODES = {
  AC: 'AC',   // Air Canada
  AA: 'AA',   // American Airlines
  UA: 'UA',   // United Airlines
  BA: 'BA'    // British Airways
};

export const CABIN_CLASSES = {
  ECONOMY: 'ECONOMY',
  BUSINESS: 'BUSINESS',
  FIRST: 'FIRST'
};

export const PASSENGER_TYPES = {
  ADULT: 'ADULT',
  CHILD: 'CHILD',
  INFANT: 'INFANT'
};

/**
 * Typical fare amounts (in USD cents)
 * Used for consistency in test fixtures
 */
export const TYPICAL_FARES = {
  ECONOMY_SHORT: 25000,      // $250
  ECONOMY_MEDIUM: 45000,     // $450
  ECONOMY_LONG: 85000,       // $850
  BUSINESS_SHORT: 120000,    // $1200
  BUSINESS_MEDIUM: 180000,   // $1800
  BUSINESS_LONG: 280000,     // $2800
  FIRST_SHORT: 250000,       // $2500
  FIRST_MEDIUM: 380000,      // $3800
  FIRST_LONG: 580000         // $5800
};

/**
 * Typical tax amounts (in USD cents)
 */
export const TYPICAL_TAXES = {
  YQ: 2500,    // Fuel surcharge $25
  YR: 2000,    // Energy surcharge $20
  US: 1000,    // US tax $10
  EU: 2500,    // EU tax $25
  CA: 1500     // Canadian tax $15
};

/**
 * Typical fees (in USD cents)
 */
export const TYPICAL_FEES = {
  BOOKING_FEE: 500,          // $5
  SERVICE_FEE: 1000,         // $10
  PAYMENT_FEE: 200,          // $2
  CREDIT_CARD_FEE: 150       // $1.50
};

/**
 * Test traveler IDs (opaque pointers)
 */
export const TEST_TRAVELERS = {
  TRAVELER_001: '_TEST_TRAVELER_P001',
  TRAVELER_002: '_TEST_TRAVELER_P002',
  TRAVELER_003: '_TEST_TRAVELER_P003',
  TRAVELER_004: '_TEST_TRAVELER_P004'
};

/**
 * Test cost centers
 */
export const TEST_COST_CENTERS = {
  CC_001: 'CC_001',
  CC_002: 'CC_002',
  CC_003: 'CC_003'
};

/**
 * Test tenant IDs
 */
export const TEST_TENANTS = {
  TENANT_001: '_TEST_TENANT_001',
  TENANT_002: '_TEST_TENANT_002'
};

/**
 * Test trip purposes
 */
export const TRIP_PURPOSES = {
  BUSINESS: 'BUSINESS',
  LEISURE: 'LEISURE',
  FAMILY: 'FAMILY',
  MEDICAL: 'MEDICAL'
};

/**
 * Policy outcomes
 */
export const POLICY_OUTCOMES = {
  ALLOW: 'ALLOW',
  WARN: 'WARN',
  REQUIRE_APPROVAL: 'REQUIRE_APPROVAL',
  BLOCK: 'BLOCK'
};

/**
 * Booking statuses
 */
export const BOOKING_STATUSES = {
  HELD: 'HELD',
  PENDING_ISSUE: 'PENDING_ISSUE',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  CONFIRM_EXCEPTION: 'CONFIRM_EXCEPTION'
};

/**
 * Approval statuses
 */
export const APPROVAL_STATUSES = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

/**
 * Reference types for supplier_mapping table
 */
export const SUPPLIER_REFERENCE_TYPES = {
  GDS_LOCATOR: 'GDS_LOCATOR',
  AIRLINE_LOCATOR: 'AIRLINE_LOCATOR',
  TICKET_NUMBER: 'TICKET_NUMBER',
  NDC_ORDER_ID: 'NDC_ORDER_ID'
};

/**
 * Test offer IDs (fixture-based)
 */
export const TEST_OFFERS = {
  YVR_JFK_ECONOMY: '_TEST_OFFER_YVR_JFK_001',
  YVR_JFK_ECONOMY_ALT: '_TEST_OFFER_YVR_JFK_002',
  YVR_CDG_BUSINESS: '_TEST_OFFER_YVR_CDG_BUS_001',
  HIGH_FARE_5000: '_TEST_OFFER_HIGH_FARE_5000',
  BLOCKED_DESTINATION: '_TEST_OFFER_BLOCKED_XXX'
};

/**
 * Test PNRs (Sabre record locators)
 */
export const TEST_PNRS = {
  YVR_JFK: '_TEST_PNR_YVR123',
  YVR_CDG: '_TEST_PNR_CDG456',
  BLOCKED: '_TEST_PNR_BLOCKED'
};

/**
 * Test ticket numbers
 */
export const TEST_TICKETS = {
  AC_001: '_TEST_TICKET_AC_001',
  AC_002: '_TEST_TICKET_AC_002',
  BA_001: '_TEST_TICKET_BA_001'
};

/**
 * User roles
 */
export const USER_ROLES = {
  TRAVELER: 'TRAVELER',
  APPROVER: 'APPROVER',
  ADMIN: 'ADMIN',
  FINANCE: 'FINANCE'
};

/**
 * Helper: Calculate total fare (base + taxes + fees)
 */
export function calculateTotal(
  baseFare: number,
  taxes: number[] = [],
  fees: number[] = []
): number {
  const sumTaxes = taxes.reduce((acc, tax) => acc + tax, 0);
  const sumFees = fees.reduce((acc, fee) => acc + fee, 0);
  return baseFare + sumTaxes + sumFees;
}

/**
 * Helper: Build standard test JWT payload
 */
export function buildTestJWT(overrides: Partial<any> = {}) {
  return {
    tenant_id: TEST_TENANTS.TENANT_001,
    traveler_id: TEST_TRAVELERS.TRAVELER_001,
    role: USER_ROLES.TRAVELER,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides
  };
}

/**
 * Helper: Format amount as currency string for display/logging
 */
export function formatCurrency(minorUnits: number, currency: string = 'USD'): string {
  const major = minorUnits / 100;
  return `${currency} ${major.toFixed(2)}`;
}
