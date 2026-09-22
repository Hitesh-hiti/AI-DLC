/**
 * Currency Utilities
 * Formatting, conversion, and validation
 */

import type { CurrencyCode, Money } from '../api/types/common';

/**
 * Currency symbols map
 */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
};

/**
 * Decimal places for each currency
 */
const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0, // No decimal
  CAD: 2,
  AUD: 2,
  CHF: 2,
  CNY: 2,
};

/**
 * Format money value with currency symbol
 */
export function formatMoney(money: Money): string {
  const symbol = CURRENCY_SYMBOLS[money.currency] || money.currency;
  const decimals = CURRENCY_DECIMALS[money.currency] ?? 2;
  const formatted = money.amount.toFixed(decimals);
  return `${symbol}${formatted}`;
}

/**
 * Format money for display without currency symbol (just amount)
 */
export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return amount.toFixed(decimals);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Convert money between currencies (mock implementation)
 * In real app, would call exchange rate service
 */
export function convertCurrency(
  money: Money,
  targetCurrency: CurrencyCode
): Money {
  // Mock exchange rates
  const rates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, AUD: 1.52, CHF: 0.88, CNY: 7.24 },
    EUR: { USD: 1.09, GBP: 0.86, JPY: 162.5, CAD: 1.48, AUD: 1.65, CHF: 0.96, CNY: 7.87 },
    GBP: { USD: 1.27, EUR: 1.16, JPY: 189, CAD: 1.72, AUD: 1.92, CHF: 1.11, CNY: 9.17 },
  };

  if (money.currency === targetCurrency) {
    return money;
  }

  const rate = rates[money.currency]?.[targetCurrency];
  if (!rate) {
    throw new Error(`No exchange rate available for ${money.currency} to ${targetCurrency}`);
  }

  return {
    amount: Math.round(money.amount * rate * 100) / 100,
    currency: targetCurrency,
  };
}

/**
 * Calculate total from multiple money values (must be same currency)
 */
export function sumMoney(monies: Money[]): Money {
  if (!monies.length) {
    return { amount: 0, currency: 'USD' };
  }

  const currency = monies[0].currency;
  if (!monies.every((m) => m.currency === currency)) {
    throw new Error('Cannot sum money with different currencies');
  }

  const total = monies.reduce((sum, m) => sum + m.amount, 0);
  return { amount: Math.round(total * 100) / 100, currency };
}

/**
 * Parse currency string (e.g., "$250.00" -> 250)
 */
export function parseCurrencyString(str: string): number {
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Compare two money values
 */
export function compareMoney(a: Money, b: Money): number {
  if (a.currency !== b.currency) {
    throw new Error('Cannot compare money with different currencies');
  }
  return a.amount - b.amount;
}

/**
 * Check if money value is zero
 */
export function isZeroMoney(money: Money): boolean {
  return money.amount === 0;
}

/**
 * Check if money value is positive
 */
export function isPositiveMoney(money: Money): boolean {
  return money.amount > 0;
}

/**
 * Check if money value is negative
 */
export function isNegativeMoney(money: Money): boolean {
  return money.amount < 0;
}
