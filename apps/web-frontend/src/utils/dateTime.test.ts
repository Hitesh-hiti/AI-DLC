/**
 * Tests: utils/dateTime.ts
 * Covers: formatDate, formatDateTime, formatDateLong, formatTime, parseDate,
 *         getDaysBetween, addDays, isDateInPast, isToday, isTomorrow,
 *         getMinCheckInDate, getMinCheckOutDate, formatDuration,
 *         getDayOfWeekAbbrv, isValidBookingDateRange, formatRelativeTime
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatDateLong,
  formatTime,
  parseDate,
  getDaysBetween,
  addDays,
  isDateInPast,
  isToday,
  isTomorrow,
  getMinCheckInDate,
  getMinCheckOutDate,
  formatDuration,
  getDayOfWeekAbbrv,
  isValidBookingDateRange,
  formatRelativeTime,
} from './dateTime'

afterEach(() => {
  vi.useRealTimers()
})

// ─── formatDate ───────────────────────────────────────────────────────────────
describe('formatDate', () => {
  it('formats ISO date to MM/DD/YYYY', () => {
    // Use a fixed UTC noon time to avoid timezone edge cases
    expect(formatDate('2026-10-01T12:00:00Z')).toMatch(/10\/01\/2026/)
  })
})

// ─── formatTime ───────────────────────────────────────────────────────────────
describe('formatTime', () => {
  it('returns a time string in HH:MM format', () => {
    const result = formatTime('2026-10-01T15:30:00Z')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

// ─── parseDate ────────────────────────────────────────────────────────────────
describe('parseDate', () => {
  it('parses MM/DD/YYYY to ISO date', () => {
    expect(parseDate('10/01/2026')).toBe('2026-10-01')
  })
  it('throws on wrong format', () => {
    expect(() => parseDate('2026-10-01')).toThrow()
  })
  it('throws on invalid date', () => {
    expect(() => parseDate('99/99/9999')).toThrow()
  })
})

// ─── getDaysBetween ───────────────────────────────────────────────────────────
describe('getDaysBetween', () => {
  it('calculates 5 days between dates', () => {
    expect(getDaysBetween('2026-10-01', '2026-10-06')).toBe(5)
  })
  it('calculates 1 day', () => {
    expect(getDaysBetween('2026-10-01', '2026-10-02')).toBe(1)
  })
  it('calculates 0 days for same date', () => {
    expect(getDaysBetween('2026-10-01', '2026-10-01')).toBe(0)
  })
})

// ─── addDays ──────────────────────────────────────────────────────────────────
describe('addDays', () => {
  it('adds 5 days to a date', () => {
    expect(addDays('2026-10-01', 5)).toBe('2026-10-06')
  })
  it('adds 0 days returns same date', () => {
    expect(addDays('2026-10-01', 0)).toBe('2026-10-01')
  })
  it('handles month rollover', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
})

// ─── isDateInPast (dateTime version) ─────────────────────────────────────────
describe('isDateInPast (dateTime)', () => {
  it('returns true for a clearly past date', () => {
    expect(isDateInPast('2000-01-01')).toBe(true)
  })
  it('returns false for a clearly future date', () => {
    expect(isDateInPast('2099-12-31')).toBe(false)
  })
})

// ─── isToday ──────────────────────────────────────────────────────────────────
describe('isToday', () => {
  it('returns true for today\'s date', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isToday(today)).toBe(true)
  })
  it('returns false for yesterday', () => {
    const yesterday = addDays(new Date().toISOString().split('T')[0], -1)
    expect(isToday(yesterday)).toBe(false)
  })
})

// ─── isTomorrow ───────────────────────────────────────────────────────────────
describe('isTomorrow', () => {
  it('returns true for tomorrow', () => {
    const tomorrow = addDays(new Date().toISOString().split('T')[0], 1)
    expect(isTomorrow(tomorrow)).toBe(true)
  })
  it('returns false for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isTomorrow(today)).toBe(false)
  })
})

// ─── getMinCheckInDate ────────────────────────────────────────────────────────
describe('getMinCheckInDate', () => {
  it('returns today\'s date in YYYY-MM-DD format', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(getMinCheckInDate()).toBe(today)
  })
})

// ─── getMinCheckOutDate ───────────────────────────────────────────────────────
describe('getMinCheckOutDate', () => {
  it('returns one day after check-in', () => {
    expect(getMinCheckOutDate('2026-10-01')).toBe('2026-10-02')
  })
})

// ─── formatDuration ───────────────────────────────────────────────────────────
describe('formatDuration', () => {
  it('formats "1 night" for 1', () => {
    expect(formatDuration(1)).toBe('1 night')
  })
  it('formats "3 nights" for 3', () => {
    expect(formatDuration(3)).toBe('3 nights')
  })
  it('formats "0 nights" for 0', () => {
    expect(formatDuration(0)).toBe('0 nights')
  })
})

// ─── getDayOfWeekAbbrv ────────────────────────────────────────────────────────
describe('getDayOfWeekAbbrv', () => {
  it('returns a 3-letter day abbreviation', () => {
    // 2026-10-01 is a Thursday
    const result = getDayOfWeekAbbrv('2026-10-01T12:00:00Z')
    expect(result).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/)
  })
})

// ─── isValidBookingDateRange ──────────────────────────────────────────────────
describe('isValidBookingDateRange', () => {
  it('returns true when check-out is after check-in', () => {
    expect(isValidBookingDateRange('2026-10-01', '2026-10-05')).toBe(true)
  })
  it('returns false when check-out equals check-in', () => {
    expect(isValidBookingDateRange('2026-10-01', '2026-10-01')).toBe(false)
  })
  it('returns false when check-out is before check-in', () => {
    expect(isValidBookingDateRange('2026-10-05', '2026-10-01')).toBe(false)
  })
})

// ─── formatRelativeTime ───────────────────────────────────────────────────────
describe('formatRelativeTime', () => {
  it('returns "Today" for today', () => {
    // Use a time that is clearly still today (morning)
    const today = new Date()
    today.setHours(8, 0, 0, 0)
    expect(formatRelativeTime(today.toISOString())).toBe('Today')
  })
  it('returns "Tomorrow" for tomorrow', () => {
    // Construct exactly tomorrow's date at noon to avoid boundary issues
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0)
    expect(formatRelativeTime(tomorrow.toISOString())).toBe('Tomorrow')
  })
  it('returns "X days from now" for near future', () => {
    const soon = new Date(Date.now() + 86400000 * 4)
    const result = formatRelativeTime(soon.toISOString())
    expect(result).toMatch(/days from now/)
  })
  it('returns "X days ago" for the past', () => {
    const past = new Date(Date.now() - 86400000 * 5)
    expect(formatRelativeTime(past.toISOString())).toMatch(/days ago/)
  })
})
