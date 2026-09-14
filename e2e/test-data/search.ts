/**
 * Test Data — Flight Search
 * Traceability: TC-001, TC-002, TC-003, TC-004, TC-005, TC-006
 *
 * Dates are computed at runtime so they are always in the future.
 */

/** Return an ISO date string N days from today */
function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

/** Standard happy-path search — LHR → JFK */
export const STANDARD_SEARCH = {
  origin: 'LHR',
  destination: 'JFK',
  departureDate: futureDate(14),
  returnDate: futureDate(21),
  cabin: 'ECONOMY',
} as const;

/** Alternative route to verify user-entered IATA codes propagate to cards (TC-002) */
export const ALTERNATIVE_ROUTE_SEARCH = {
  origin: 'SYD',
  destination: 'DXB',
  departureDate: futureDate(10),
  cabin: 'ECONOMY',
} as const;

/** Valid passenger for PassengerForm */
export const PASSENGER_JOHN = {
  firstName: 'JOHN',
  lastName: 'SMITH',
} as const;

/** Valid passenger pair for multi-passenger tests */
export const TWO_PASSENGERS = [
  { firstName: 'ALICE', lastName: 'JONES' },
  { firstName: 'BOB',   lastName: 'JONES' },
] as const;
