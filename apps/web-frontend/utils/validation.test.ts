/**
 * Tests: utils/validation.ts
 * Covers: isValidEmail, isValidPhone, isValidName, isValidDate, isDateInPast,
 *         isInRange, isValidLength, isValidIATACode, isEmpty, sanitizeString,
 *         isValidCVV, isValidCardNumber, isValidCardExpiration,
 *         validateGuestInfo, validateFlightSearchCriteria
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidDate,
  isDateInPast,
  isInRange,
  isValidLength,
  isValidIATACode,
  isEmpty,
  sanitizeString,
  sanitizeEmail,
  isValidCVV,
  isValidCardNumber,
  isValidCardExpiration,
  validateGuestInfo,
  validateFlightSearchCriteria,
} from './validation'

// ─── isValidEmail ────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('accepts a standard email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })
  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true)
  })
  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })
  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

// ─── isValidPhone ─────────────────────────────────────────────────────────────
describe('isValidPhone', () => {
  it('accepts standard US number', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true)
  })
  it('accepts 10-digit number', () => {
    expect(isValidPhone('5551234567')).toBe(true)
  })
  it('rejects fewer than 10 digits', () => {
    expect(isValidPhone('12345')).toBe(false)
  })
  it('rejects letters', () => {
    expect(isValidPhone('abcdefghij')).toBe(false)
  })
})

// ─── isValidName ─────────────────────────────────────────────────────────────
describe('isValidName', () => {
  it('accepts a normal name', () => {
    expect(isValidName('Alice')).toBe(true)
  })
  it('rejects single character', () => {
    expect(isValidName('A')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isValidName('')).toBe(false)
  })
  it('rejects name over 100 chars', () => {
    expect(isValidName('A'.repeat(101))).toBe(false)
  })
  it('accepts name exactly 2 chars', () => {
    expect(isValidName('Jo')).toBe(true)
  })
  it('accepts name exactly 100 chars', () => {
    expect(isValidName('A'.repeat(100))).toBe(true)
  })
})

// ─── isValidDate ─────────────────────────────────────────────────────────────
describe('isValidDate', () => {
  it('accepts an ISO date string', () => {
    expect(isValidDate('2026-10-01')).toBe(true)
  })
  it('accepts a full ISO datetime', () => {
    expect(isValidDate('2026-10-01T12:00:00Z')).toBe(true)
  })
  it('rejects garbage string', () => {
    expect(isValidDate('not-a-date')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isValidDate('')).toBe(false)
  })
})

// ─── isDateInPast ────────────────────────────────────────────────────────────
describe('isDateInPast', () => {
  it('returns true for a past date', () => {
    expect(isDateInPast('2020-01-01')).toBe(true)
  })
  it('returns false for a future date', () => {
    expect(isDateInPast('2099-12-31')).toBe(false)
  })
  it('returns false for today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isDateInPast(today)).toBe(false)
  })
})

// ─── isInRange ───────────────────────────────────────────────────────────────
describe('isInRange', () => {
  it('accepts value at min boundary', () => expect(isInRange(1, 1, 9)).toBe(true))
  it('accepts value at max boundary', () => expect(isInRange(9, 1, 9)).toBe(true))
  it('accepts value in middle', () => expect(isInRange(5, 1, 9)).toBe(true))
  it('rejects value below min', () => expect(isInRange(0, 1, 9)).toBe(false))
  it('rejects value above max', () => expect(isInRange(10, 1, 9)).toBe(false))
})

// ─── isValidLength ───────────────────────────────────────────────────────────
describe('isValidLength', () => {
  it('accepts string within range', () => expect(isValidLength('hello', 2, 10)).toBe(true))
  it('rejects too short', () => expect(isValidLength('a', 2, 10)).toBe(false))
  it('rejects too long', () => expect(isValidLength('hello world!', 2, 10)).toBe(false))
})

// ─── isValidIATACode ─────────────────────────────────────────────────────────
describe('isValidIATACode', () => {
  it('accepts uppercase 3-letter code', () => expect(isValidIATACode('LHR')).toBe(true))
  it('accepts lowercase — auto-uppercased internally', () => expect(isValidIATACode('lhr')).toBe(true))
  it('accepts mixed case', () => expect(isValidIATACode('Jfk')).toBe(true))
  it('rejects 2-letter code', () => expect(isValidIATACode('LH')).toBe(false))
  it('rejects 4-letter code', () => expect(isValidIATACode('LHRX')).toBe(false))
  it('rejects digits', () => expect(isValidIATACode('L1R')).toBe(false))
  it('rejects empty string', () => expect(isValidIATACode('')).toBe(false))
})

// ─── isEmpty ─────────────────────────────────────────────────────────────────
describe('isEmpty', () => {
  it('returns true for undefined', () => expect(isEmpty(undefined)).toBe(true))
  it('returns true for null', () => expect(isEmpty(null)).toBe(true))
  it('returns true for empty string', () => expect(isEmpty('')).toBe(true))
  it('returns true for whitespace string', () => expect(isEmpty('   ')).toBe(true))
  it('returns true for empty array', () => expect(isEmpty([])).toBe(true))
  it('returns false for non-empty string', () => expect(isEmpty('hello')).toBe(false))
  it('returns false for non-empty array', () => expect(isEmpty([1])).toBe(false))
  it('returns false for number 0', () => expect(isEmpty(0)).toBe(false))
})

// ─── sanitizeString ──────────────────────────────────────────────────────────
describe('sanitizeString', () => {
  it('strips leading/trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })
  it('removes < > " \' characters', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script')
  })
  it('truncates to 500 chars', () => {
    expect(sanitizeString('a'.repeat(600))).toHaveLength(500)
  })
})

// ─── sanitizeEmail ───────────────────────────────────────────────────────────
describe('sanitizeEmail', () => {
  it('lowercases and trims', () => {
    expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com')
  })
})

// ─── isValidCVV ──────────────────────────────────────────────────────────────
describe('isValidCVV', () => {
  it('accepts 3-digit CVV', () => expect(isValidCVV('123')).toBe(true))
  it('accepts 4-digit CVV (Amex)', () => expect(isValidCVV('1234')).toBe(true))
  it('rejects 2-digit', () => expect(isValidCVV('12')).toBe(false))
  it('rejects letters', () => expect(isValidCVV('abc')).toBe(false))
  it('rejects empty', () => expect(isValidCVV('')).toBe(false))
})

// ─── isValidCardNumber (Luhn) ─────────────────────────────────────────────────
describe('isValidCardNumber', () => {
  it('accepts a valid Luhn number (Visa test)', () => {
    expect(isValidCardNumber('4111111111111111')).toBe(true)
  })
  it('accepts a valid Mastercard test number', () => {
    expect(isValidCardNumber('5500005555555559')).toBe(true)
  })
  it('rejects an invalid number', () => {
    expect(isValidCardNumber('1234567890123456')).toBe(false)
  })
  it('rejects too short', () => {
    expect(isValidCardNumber('411111')).toBe(false)
  })
  it('strips spaces before validating', () => {
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true)
  })
})

// ─── isValidCardExpiration ────────────────────────────────────────────────────
describe('isValidCardExpiration', () => {
  const futureYear = (new Date().getFullYear() + 2).toString()
  const currentYear = new Date().getFullYear().toString()
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0')

  it('accepts a future expiry', () => {
    expect(isValidCardExpiration('12', futureYear)).toBe(true)
  })
  it('accepts current month and year', () => {
    expect(isValidCardExpiration(currentMonth, currentYear)).toBe(true)
  })
  it('rejects past year', () => {
    expect(isValidCardExpiration('01', '2020')).toBe(false)
  })
  it('rejects invalid month 0', () => {
    expect(isValidCardExpiration('00', futureYear)).toBe(false)
  })
  it('rejects invalid month 13', () => {
    expect(isValidCardExpiration('13', futureYear)).toBe(false)
  })
})

// ─── validateGuestInfo ───────────────────────────────────────────────────────
describe('validateGuestInfo', () => {
  it('passes with valid data', () => {
    const result = validateGuestInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('fails with invalid first name', () => {
    const result = validateGuestInfo({ firstName: 'J', lastName: 'Doe', email: 'john@example.com' })
    expect(result.isValid).toBe(false)
    expect(result.errors.firstName).toBeDefined()
  })

  it('fails with invalid email', () => {
    const result = validateGuestInfo({ firstName: 'John', lastName: 'Doe', email: 'not-an-email' })
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBeDefined()
  })

  it('fails with invalid phone when provided', () => {
    const result = validateGuestInfo({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '123',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.phone).toBeDefined()
  })

  it('passes without optional phone', () => {
    const result = validateGuestInfo({ firstName: 'John', lastName: 'Doe', email: 'john@example.com' })
    expect(result.isValid).toBe(true)
  })
})

// ─── validateFlightSearchCriteria ────────────────────────────────────────────
describe('validateFlightSearchCriteria', () => {
  const futureDate = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]
  const furtherDate = new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0]

  it('passes with all valid fields', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR',
      destination: 'JFK',
      departureDate: futureDate,
      passengers: 1,
      cabinClass: 'ECONOMY',
    })
    expect(result.isValid).toBe(true)
  })

  it('fails when origin is missing', () => {
    const result = validateFlightSearchCriteria({
      destination: 'JFK', departureDate: futureDate, passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.origin).toBeDefined()
  })

  it('fails when destination is missing', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', departureDate: futureDate, passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.destination).toBeDefined()
  })

  it('fails when origin equals destination', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'LHR', departureDate: futureDate, passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.destination).toMatch(/different/)
  })

  it('fails when IATA code is invalid (numeric)', () => {
    const result = validateFlightSearchCriteria({
      origin: '123', destination: 'JFK', departureDate: futureDate, passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.origin).toBeDefined()
  })

  it('fails when departure date is in the past', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK', departureDate: '2020-01-01', passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.departureDate).toBeDefined()
  })

  it('fails when departure date is missing', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK', passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.departureDate).toBeDefined()
  })

  it('fails when return date is before departure', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK',
      departureDate: furtherDate, returnDate: futureDate,
      passengers: 1,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.returnDate).toBeDefined()
  })

  it('passes when valid return date is after departure', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK',
      departureDate: futureDate, returnDate: furtherDate,
      passengers: 1,
    })
    expect(result.isValid).toBe(true)
  })

  it('fails when passengers is 0', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK', departureDate: futureDate, passengers: 0,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.passengers).toBeDefined()
  })

  it('fails when passengers exceeds 9', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK', departureDate: futureDate, passengers: 10,
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.passengers).toBeDefined()
  })

  it('fails with invalid cabin class', () => {
    const result = validateFlightSearchCriteria({
      origin: 'LHR', destination: 'JFK', departureDate: futureDate,
      passengers: 1, cabinClass: 'DELUXE',
    })
    expect(result.isValid).toBe(false)
    expect(result.errors.cabinClass).toBeDefined()
  })
})
