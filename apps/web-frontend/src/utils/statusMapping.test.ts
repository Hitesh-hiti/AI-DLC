/**
 * Tests: utils/statusMapping.ts
 * Covers: getBookingStatusDisplay, getPolicyOutcomeDisplay,
 *         canCancelBooking, canModifyBooking, getNextActionsForBooking,
 *         getBookingStatusClass, getPolicyOutcomeClass
 */
import { describe, it, expect } from 'vitest'
import {
  getBookingStatusDisplay,
  getPolicyOutcomeDisplay,
  canCancelBooking,
  canModifyBooking,
  getNextActionsForBooking,
  getBookingStatusClass,
  getPolicyOutcomeClass,
} from './statusMapping'
import { BookingStatusValues, PolicyOutcomeValues } from '../api/types/common'

// ─── getBookingStatusDisplay ─────────────────────────────────────────────────
describe('getBookingStatusDisplay', () => {
  it('HELD → label "On Hold", color info', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.HELD)
    expect(d.label).toBe('On Hold')
    expect(d.color).toBe('info')
  })
  it('CONFIRMED → label "Confirmed", color success', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.CONFIRMED)
    expect(d.label).toBe('Confirmed')
    expect(d.color).toBe('success')
  })
  it('CANCELLED → label "Cancelled", color error', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.CANCELLED)
    expect(d.label).toBe('Cancelled')
    expect(d.color).toBe('error')
  })
  it('PENDING_ISSUE → label contains "Ticketing", color warning', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.PENDING_ISSUE)
    expect(d.label).toMatch(/ticketing/i)
    expect(d.color).toBe('warning')
  })
  it('PENDING_APPROVAL → label "Pending Approval", color warning', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.PENDING_APPROVAL)
    expect(d.label).toBe('Pending Approval')
    expect(d.color).toBe('warning')
  })
  it('CONFIRM_EXCEPTION → label "Action Required", color error', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.CONFIRM_EXCEPTION)
    expect(d.label).toBe('Action Required')
    expect(d.color).toBe('error')
  })
  it('EXPIRED → label "Hold Expired", color error', () => {
    const d = getBookingStatusDisplay(BookingStatusValues.EXPIRED)
    expect(d.label).toBe('Hold Expired')
    expect(d.color).toBe('error')
  })
  it('all statuses return a non-empty description', () => {
    Object.values(BookingStatusValues).forEach((status) => {
      const d = getBookingStatusDisplay(status)
      expect(d.description.length).toBeGreaterThan(0)
    })
  })
})

// ─── getPolicyOutcomeDisplay ──────────────────────────────────────────────────
describe('getPolicyOutcomeDisplay', () => {
  it('ALLOW → color success', () => {
    expect(getPolicyOutcomeDisplay(PolicyOutcomeValues.ALLOW).color).toBe('success')
  })
  it('WARN → color warning', () => {
    expect(getPolicyOutcomeDisplay(PolicyOutcomeValues.WARN).color).toBe('warning')
  })
  it('BLOCK → color error', () => {
    expect(getPolicyOutcomeDisplay(PolicyOutcomeValues.BLOCK).color).toBe('error')
  })
  it('REQUIRE_APPROVAL → color warning', () => {
    expect(getPolicyOutcomeDisplay(PolicyOutcomeValues.REQUIRE_APPROVAL).color).toBe('warning')
  })
  it('all outcomes return a non-empty userFriendlyMessage', () => {
    Object.values(PolicyOutcomeValues).forEach((outcome) => {
      const d = getPolicyOutcomeDisplay(outcome)
      expect(d.userFriendlyMessage.length).toBeGreaterThan(0)
    })
  })
})

// ─── canCancelBooking ────────────────────────────────────────────────────────
describe('canCancelBooking', () => {
  it('HELD can be cancelled', () => expect(canCancelBooking(BookingStatusValues.HELD)).toBe(true))
  it('CONFIRMED can be cancelled', () => expect(canCancelBooking(BookingStatusValues.CONFIRMED)).toBe(true))
  it('PENDING_ISSUE can be cancelled', () => expect(canCancelBooking(BookingStatusValues.PENDING_ISSUE)).toBe(true))
  it('PENDING_APPROVAL can be cancelled', () => expect(canCancelBooking(BookingStatusValues.PENDING_APPROVAL)).toBe(true))
  it('CANCELLED cannot be cancelled again', () => expect(canCancelBooking(BookingStatusValues.CANCELLED)).toBe(false))
  it('COMPLETED cannot be cancelled', () => expect(canCancelBooking(BookingStatusValues.COMPLETED)).toBe(false))
  it('EXPIRED cannot be cancelled', () => expect(canCancelBooking(BookingStatusValues.EXPIRED)).toBe(false))
})

// ─── canModifyBooking ────────────────────────────────────────────────────────
describe('canModifyBooking', () => {
  it('HELD can be modified', () => expect(canModifyBooking(BookingStatusValues.HELD)).toBe(true))
  it('CONFIRMED can be modified', () => expect(canModifyBooking(BookingStatusValues.CONFIRMED)).toBe(true))
  it('CANCELLED cannot be modified', () => expect(canModifyBooking(BookingStatusValues.CANCELLED)).toBe(false))
  it('EXPIRED cannot be modified', () => expect(canModifyBooking(BookingStatusValues.EXPIRED)).toBe(false))
})

// ─── getNextActionsForBooking ─────────────────────────────────────────────────
describe('getNextActionsForBooking', () => {
  it('HELD returns Confirm and Cancel actions', () => {
    const actions = getNextActionsForBooking(BookingStatusValues.HELD)
    expect(actions).toContain('Confirm')
    expect(actions).toContain('Cancel')
  })
  it('CONFIRMED returns Cancel action', () => {
    expect(getNextActionsForBooking(BookingStatusValues.CONFIRMED)).toContain('Cancel')
  })
  it('CANCELLED returns Book Again action', () => {
    expect(getNextActionsForBooking(BookingStatusValues.CANCELLED)).toContain('Book Again')
  })
  it('CONFIRM_EXCEPTION returns Contact Support', () => {
    expect(getNextActionsForBooking(BookingStatusValues.CONFIRM_EXCEPTION)).toContain('Contact Support')
  })
  it('EXPIRED returns Search Again', () => {
    expect(getNextActionsForBooking(BookingStatusValues.EXPIRED)).toContain('Search Again')
  })
})

// ─── getBookingStatusClass ────────────────────────────────────────────────────
describe('getBookingStatusClass', () => {
  it('HELD returns class containing status-info', () => {
    expect(getBookingStatusClass(BookingStatusValues.HELD)).toContain('status-info')
  })
  it('CONFIRMED returns class containing status-success', () => {
    expect(getBookingStatusClass(BookingStatusValues.CONFIRMED)).toContain('status-success')
  })
  it('CANCELLED returns class containing status-error', () => {
    expect(getBookingStatusClass(BookingStatusValues.CANCELLED)).toContain('status-error')
  })
  it('CONFIRM_EXCEPTION returns class containing status-error', () => {
    expect(getBookingStatusClass(BookingStatusValues.CONFIRM_EXCEPTION)).toContain('status-error')
  })
  it('all statuses return a non-empty string', () => {
    Object.values(BookingStatusValues).forEach((status) => {
      expect(getBookingStatusClass(status).length).toBeGreaterThan(0)
    })
  })
})

// ─── getPolicyOutcomeClass ────────────────────────────────────────────────────
describe('getPolicyOutcomeClass', () => {
  it('ALLOW returns class containing outcome-allow', () => {
    expect(getPolicyOutcomeClass(PolicyOutcomeValues.ALLOW)).toContain('outcome-allow')
  })
  it('BLOCK returns class containing outcome-block', () => {
    expect(getPolicyOutcomeClass(PolicyOutcomeValues.BLOCK)).toContain('outcome-block')
  })
  it('WARN returns class containing outcome-warn', () => {
    expect(getPolicyOutcomeClass(PolicyOutcomeValues.WARN)).toContain('outcome-warn')
  })
  it('REQUIRE_APPROVAL returns class containing outcome-approval', () => {
    expect(getPolicyOutcomeClass(PolicyOutcomeValues.REQUIRE_APPROVAL)).toContain('outcome-approval')
  })
})
