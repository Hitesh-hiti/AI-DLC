/**
 * Tests: utils/currency.ts
 * Covers: formatMoney, formatCurrencyAmount, getCurrencySymbol,
 *         convertCurrency, sumMoney, parseCurrencyString,
 *         compareMoney, isZeroMoney, isPositiveMoney, isNegativeMoney
 */
import { describe, it, expect } from 'vitest'
import {
  formatMoney,
  formatCurrencyAmount,
  getCurrencySymbol,
  convertCurrency,
  sumMoney,
  parseCurrencyString,
  compareMoney,
  isZeroMoney,
  isPositiveMoney,
  isNegativeMoney,
} from './currency'

// ─── formatMoney ─────────────────────────────────────────────────────────────
describe('formatMoney', () => {
  it('formats USD with $ symbol and 2 decimals', () => {
    expect(formatMoney({ amount: 278.1, currency: 'USD' })).toBe('$278.10')
  })
  it('formats EUR with € symbol', () => {
    expect(formatMoney({ amount: 100, currency: 'EUR' })).toBe('€100.00')
  })
  it('formats GBP with £ symbol', () => {
    expect(formatMoney({ amount: 50.5, currency: 'GBP' })).toBe('£50.50')
  })
  it('formats JPY with no decimals', () => {
    expect(formatMoney({ amount: 5000, currency: 'JPY' })).toBe('¥5000')
  })
  it('formats zero amount', () => {
    expect(formatMoney({ amount: 0, currency: 'USD' })).toBe('$0.00')
  })
})

// ─── formatCurrencyAmount ─────────────────────────────────────────────────────
describe('formatCurrencyAmount', () => {
  it('returns 2 decimal places for USD', () => {
    expect(formatCurrencyAmount(99.9, 'USD')).toBe('99.90')
  })
  it('returns 0 decimal places for JPY', () => {
    expect(formatCurrencyAmount(1000, 'JPY')).toBe('1000')
  })
})

// ─── getCurrencySymbol ────────────────────────────────────────────────────────
describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => expect(getCurrencySymbol('USD')).toBe('$'))
  it('returns € for EUR', () => expect(getCurrencySymbol('EUR')).toBe('€'))
  it('returns £ for GBP', () => expect(getCurrencySymbol('GBP')).toBe('£'))
  it('returns code itself for unknown currency', () => {
    // TypeScript cast to test fallback path
    expect(getCurrencySymbol('XYZ' as any)).toBe('XYZ')
  })
})

// ─── convertCurrency ─────────────────────────────────────────────────────────
describe('convertCurrency', () => {
  it('returns same object when currencies match', () => {
    const money = { amount: 100, currency: 'USD' as const }
    expect(convertCurrency(money, 'USD')).toEqual(money)
  })
  it('converts USD to EUR', () => {
    const result = convertCurrency({ amount: 100, currency: 'USD' }, 'EUR')
    expect(result.currency).toBe('EUR')
    expect(result.amount).toBeGreaterThan(0)
  })
  it('converts GBP to USD', () => {
    const result = convertCurrency({ amount: 100, currency: 'GBP' }, 'USD')
    expect(result.currency).toBe('USD')
    expect(result.amount).toBeGreaterThan(100) // GBP stronger than USD
  })
  it('throws for unsupported conversion', () => {
    expect(() =>
      convertCurrency({ amount: 100, currency: 'JPY' }, 'USD')
    ).toThrow()
  })
})

// ─── sumMoney ─────────────────────────────────────────────────────────────────
describe('sumMoney', () => {
  it('sums multiple USD amounts', () => {
    const result = sumMoney([
      { amount: 100, currency: 'USD' },
      { amount: 50.5, currency: 'USD' },
      { amount: 25.25, currency: 'USD' },
    ])
    expect(result.amount).toBe(175.75)
    expect(result.currency).toBe('USD')
  })
  it('returns zero USD for empty array', () => {
    expect(sumMoney([])).toEqual({ amount: 0, currency: 'USD' })
  })
  it('throws when currencies are mixed', () => {
    expect(() =>
      sumMoney([
        { amount: 100, currency: 'USD' },
        { amount: 50, currency: 'EUR' },
      ])
    ).toThrow()
  })
  it('sums single item correctly', () => {
    expect(sumMoney([{ amount: 42, currency: 'GBP' }])).toEqual({ amount: 42, currency: 'GBP' })
  })
})

// ─── parseCurrencyString ──────────────────────────────────────────────────────
describe('parseCurrencyString', () => {
  it('parses "$250.00" to 250', () => {
    expect(parseCurrencyString('$250.00')).toBe(250)
  })
  it('parses "1,234.56" stripping comma', () => {
    expect(parseCurrencyString('1,234.56')).toBe(1234.56)
  })
  it('returns 0 for non-numeric string', () => {
    expect(parseCurrencyString('abc')).toBe(0)
  })
  it('parses negative amount', () => {
    expect(parseCurrencyString('-50.00')).toBe(-50)
  })
})

// ─── compareMoney ────────────────────────────────────────────────────────────
describe('compareMoney', () => {
  it('returns negative when a < b', () => {
    expect(compareMoney({ amount: 10, currency: 'USD' }, { amount: 20, currency: 'USD' })).toBeLessThan(0)
  })
  it('returns 0 when equal', () => {
    expect(compareMoney({ amount: 10, currency: 'USD' }, { amount: 10, currency: 'USD' })).toBe(0)
  })
  it('returns positive when a > b', () => {
    expect(compareMoney({ amount: 30, currency: 'USD' }, { amount: 20, currency: 'USD' })).toBeGreaterThan(0)
  })
  it('throws on currency mismatch', () => {
    expect(() =>
      compareMoney({ amount: 10, currency: 'USD' }, { amount: 10, currency: 'EUR' })
    ).toThrow()
  })
})

// ─── isZeroMoney / isPositiveMoney / isNegativeMoney ─────────────────────────
describe('isZeroMoney', () => {
  it('returns true for zero', () => expect(isZeroMoney({ amount: 0, currency: 'USD' })).toBe(true))
  it('returns false for positive', () => expect(isZeroMoney({ amount: 1, currency: 'USD' })).toBe(false))
})

describe('isPositiveMoney', () => {
  it('returns true for positive', () => expect(isPositiveMoney({ amount: 5, currency: 'USD' })).toBe(true))
  it('returns false for zero', () => expect(isPositiveMoney({ amount: 0, currency: 'USD' })).toBe(false))
  it('returns false for negative', () => expect(isPositiveMoney({ amount: -1, currency: 'USD' })).toBe(false))
})

describe('isNegativeMoney', () => {
  it('returns true for negative', () => expect(isNegativeMoney({ amount: -5, currency: 'USD' })).toBe(true))
  it('returns false for positive', () => expect(isNegativeMoney({ amount: 5, currency: 'USD' })).toBe(false))
  it('returns false for zero', () => expect(isNegativeMoney({ amount: 0, currency: 'USD' })).toBe(false))
})
