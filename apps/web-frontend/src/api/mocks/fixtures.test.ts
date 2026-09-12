/**
 * Tests: api/mocks/fixtures.ts
 * Covers: MOCK_AIRPORTS, MOCK_FLIGHTS, createMockSearchResponse (origin/dest override),
 *         createMockFareRules, createMockBookingHoldResponse,
 *         createMockPolicyResponseAllow/Warn/Block/RequireApproval,
 *         createMockBookingDetailResponse
 */
import { describe, it, expect } from 'vitest'
import {
  MOCK_AIRPORTS,
  MOCK_FLIGHTS,
  createMockSearchResponse,
  createMockFareRules,
  createMockBookingHoldResponse,
  createMockPolicyResponseAllow,
  createMockPolicyResponseWarn,
  createMockPolicyResponseBlock,
  createMockPolicyResponseRequireApproval,
  createMockBookingDetailResponse,
} from './fixtures'

// ─── MOCK_AIRPORTS ────────────────────────────────────────────────────────────
describe('MOCK_AIRPORTS', () => {
  it('contains at least 3 airports', () => {
    expect(MOCK_AIRPORTS.length).toBeGreaterThanOrEqual(3)
  })
  it('each airport has id, name, type AIRPORT, location', () => {
    MOCK_AIRPORTS.forEach((a) => {
      expect(a.id).toBeTruthy()
      expect(a.name).toBeTruthy()
      expect(a.type).toBe('AIRPORT')
      expect(a.location.city).toBeTruthy()
      expect(a.location.country).toBeTruthy()
    })
  })
})

// ─── MOCK_FLIGHTS ─────────────────────────────────────────────────────────────
describe('MOCK_FLIGHTS', () => {
  it('contains at least 3 flight offers', () => {
    expect(MOCK_FLIGHTS.length).toBeGreaterThanOrEqual(3)
  })
  it('each flight has required fields', () => {
    MOCK_FLIGHTS.forEach((f) => {
      expect(f.offerId).toBeTruthy()
      expect(f.airline).toBeTruthy()
      expect(f.flightNumber).toBeTruthy()
      expect(f.origin).toBeTruthy()
      expect(f.destination).toBeTruthy()
      expect(f.price.amount).toBeGreaterThan(0)
      expect(f.price.currency).toBe('USD')
    })
  })
  it('at least one flight is available (not sold out)', () => {
    expect(MOCK_FLIGHTS.some((f) => !f.isSoldOut)).toBe(true)
  })
  it('at least one flight is sold out', () => {
    expect(MOCK_FLIGHTS.some((f) => f.isSoldOut)).toBe(true)
  })
})

// ─── createMockSearchResponse — default (no override) ────────────────────────
describe('createMockSearchResponse — default', () => {
  it('returns a SearchResponse with results and meta', () => {
    const resp = createMockSearchResponse('search-001')
    expect(resp.searchId).toBe('search-001')
    expect(resp.results.length).toBe(MOCK_FLIGHTS.length)
    expect(resp.meta.totalCount).toBe(MOCK_FLIGHTS.length)
    expect(resp.meta.pageNumber).toBe(1)
    expect(resp.timestamp).toBeTruthy()
  })
  it('uses hardcoded origin/destination when no override given', () => {
    const resp = createMockSearchResponse('search-002')
    // Should match whatever the first MOCK_FLIGHT has
    expect(resp.results[0].origin).toBe(MOCK_FLIGHTS[0].origin)
    expect(resp.results[0].destination).toBe(MOCK_FLIGHTS[0].destination)
  })
})

// ─── createMockSearchResponse — with origin/destination override ──────────────
describe('createMockSearchResponse — with route override', () => {
  it('overrides origin on every result', () => {
    const resp = createMockSearchResponse('search-003', { origin: 'SYD', destination: 'DXB' })
    resp.results.forEach((r) => {
      expect(r.origin).toBe('SYD')
    })
  })
  it('overrides destination on every result', () => {
    const resp = createMockSearchResponse('search-003', { origin: 'SYD', destination: 'DXB' })
    resp.results.forEach((r) => {
      expect(r.destination).toBe('DXB')
    })
  })
  it('preserves all other flight fields (airline, price, etc.)', () => {
    const resp = createMockSearchResponse('search-004', { origin: 'BOM', destination: 'SIN' })
    resp.results.forEach((r, i) => {
      expect(r.airline).toBe(MOCK_FLIGHTS[i].airline)
      expect(r.price.amount).toBe(MOCK_FLIGHTS[i].price.amount)
      expect(r.offerId).toBe(MOCK_FLIGHTS[i].offerId)
    })
  })
  it('result count matches original MOCK_FLIGHTS', () => {
    const resp = createMockSearchResponse('search-005', { origin: 'LAX', destination: 'ORD' })
    expect(resp.results.length).toBe(MOCK_FLIGHTS.length)
  })
  it('meta.totalCount reflects result length', () => {
    const resp = createMockSearchResponse('search-006', { origin: 'LAX', destination: 'ORD' })
    expect(resp.meta.totalCount).toBe(resp.results.length)
  })
})

// ─── createMockFareRules ──────────────────────────────────────────────────────
describe('createMockFareRules', () => {
  it('returns at least 2 fare rules', () => {
    expect(createMockFareRules().length).toBeGreaterThanOrEqual(2)
  })
  it('each rule has ruleType, description, terms', () => {
    createMockFareRules().forEach((r) => {
      expect(r.ruleType).toBeTruthy()
      expect(r.description).toBeTruthy()
      expect(r.terms).toBeTruthy()
    })
  })
})

// ─── createMockBookingHoldResponse ───────────────────────────────────────────
describe('createMockBookingHoldResponse', () => {
  it('creates a hold response with HELD status', () => {
    const resp = createMockBookingHoldResponse('booking-001', 'flight-001')
    expect(resp.bookingStatus).toBe('HELD')
    expect(resp.bookingId).toBe('booking-001')
    expect(resp.confirmationNumber).toContain('CONF')
    expect(resp.holdExpiresAt).toBeTruthy()
  })
  it('totalFare is higher than baseFare (includes taxes + fees)', () => {
    const resp = createMockBookingHoldResponse('booking-002', 'flight-001')
    expect(resp.fareBreakdown.totalFare.amount).toBeGreaterThan(resp.fareBreakdown.baseFare.amount)
  })
  it('flightSummary carries origin and destination', () => {
    const resp = createMockBookingHoldResponse('booking-002', 'flight-001')
    expect(resp.flightSummary.origin).toBeTruthy()
    expect(resp.flightSummary.destination).toBeTruthy()
  })
  it('falls back to first mock flight when offerId not found', () => {
    const resp = createMockBookingHoldResponse('booking-003', 'nonexistent-id')
    expect(resp.bookingStatus).toBe('HELD')
    expect(resp.fareBreakdown.baseFare.amount).toBeGreaterThan(0)
  })
})

// ─── Policy response factories ────────────────────────────────────────────────
describe('createMockPolicyResponseAllow', () => {
  it('returns outcome ALLOW and requiresApproval false', () => {
    const r = createMockPolicyResponseAllow()
    expect(r.outcome).toBe('ALLOW')
    expect(r.requiresApproval).toBe(false)
    expect(r.policies.length).toBeGreaterThan(0)
  })
})

describe('createMockPolicyResponseWarn', () => {
  it('returns outcome WARN with warnings array', () => {
    const r = createMockPolicyResponseWarn()
    expect(r.outcome).toBe('WARN')
    expect(r.warnings).toBeDefined()
    expect(r.warnings!.length).toBeGreaterThan(0)
  })
})

describe('createMockPolicyResponseBlock', () => {
  it('returns outcome BLOCK with at least one breached policy', () => {
    const r = createMockPolicyResponseBlock()
    expect(r.outcome).toBe('BLOCK')
    expect(r.policies.some((p) => p.isBreached)).toBe(true)
  })
})

describe('createMockPolicyResponseRequireApproval', () => {
  it('returns outcome REQUIRE_APPROVAL and requiresApproval true', () => {
    const r = createMockPolicyResponseRequireApproval()
    expect(r.outcome).toBe('REQUIRE_APPROVAL')
    expect(r.requiresApproval).toBe(true)
    expect(r.approvalDetails).toBeDefined()
    expect(r.approvalDetails!.approverIds.length).toBeGreaterThan(0)
  })
})

// ─── createMockBookingDetailResponse ─────────────────────────────────────────
describe('createMockBookingDetailResponse', () => {
  it('returns a booking detail with correct bookingId', () => {
    const r = createMockBookingDetailResponse('detail-001')
    expect(r.bookingId).toBe('detail-001')
    expect(r.confirmationNumber).toContain('CONF')
    expect(r.bookingStatus).toBe('HELD')
  })
  it('has a non-zero total fare', () => {
    const r = createMockBookingDetailResponse('detail-002')
    expect(r.fareBreakdown.totalFare.amount).toBeGreaterThan(0)
  })
  it('has at least one passenger', () => {
    const r = createMockBookingDetailResponse('detail-003')
    expect(r.passengers.length).toBeGreaterThan(0)
    expect(r.passengers[0].firstName).toBeTruthy()
  })
  it('has flight details with origin and destination', () => {
    const r = createMockBookingDetailResponse('detail-004')
    expect(r.flightDetails.origin).toBeTruthy()
    expect(r.flightDetails.destination).toBeTruthy()
    expect(r.flightDetails.airline).toBeTruthy()
  })
})
