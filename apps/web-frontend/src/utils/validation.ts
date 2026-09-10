/**
 * Validation Utilities
 * Form validation, input sanitization, and business rule checks
 */

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone number validation (basic)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/.test(phone);
  return phoneRegex && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Name validation
 */
export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

/**
 * Date string validation (ISO format)
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Check if date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Number range validation
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * String length validation
 */
export function isValidLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Validate guest information
 */
export interface GuestValidation {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export function validateGuestInfo(guest: GuestValidation): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isValidName(guest.firstName)) {
    errors.firstName = 'First name must be 2-100 characters';
  }

  if (!isValidName(guest.lastName)) {
    errors.lastName = 'Last name must be 2-100 characters';
  }

  if (!isValidEmail(guest.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (guest.phone && !isValidPhone(guest.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate flight search criteria
 */
export interface FlightSearchValidation {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  cabinClass?: string;
}

export function validateFlightSearchCriteria(
  criteria: FlightSearchValidation
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validate origin
  if (!criteria.origin || criteria.origin.trim() === '') {
    errors.origin = 'Origin airport is required';
  } else if (!isValidIATACode(criteria.origin)) {
    errors.origin = 'Enter a valid origin airport (e.g., LHR)';
  }

  // Validate destination
  if (!criteria.destination || criteria.destination.trim() === '') {
    errors.destination = 'Destination airport is required';
  } else if (!isValidIATACode(criteria.destination)) {
    errors.destination = 'Enter a valid destination airport (e.g., JFK)';
  }

  // Check origin != destination
  if (
    criteria.origin &&
    criteria.destination &&
    criteria.origin.toUpperCase() === criteria.destination.toUpperCase()
  ) {
    errors.destination = 'Origin and destination must be different';
  }

  // Validate departure date
  if (!criteria.departureDate) {
    errors.departureDate = 'Departure date is required';
  } else if (!isValidDate(criteria.departureDate)) {
    errors.departureDate = 'Invalid departure date';
  } else if (isDateInPast(criteria.departureDate)) {
    errors.departureDate = 'Departure date must be today or later';
  }

  // Validate return date if provided
  if (criteria.returnDate) {
    if (!isValidDate(criteria.returnDate)) {
      errors.returnDate = 'Invalid return date';
    } else if (new Date(criteria.returnDate) <= new Date(criteria.departureDate || '')) {
      errors.returnDate = 'Return date must be after departure date';
    }
  }

  // Validate passengers
  if (!criteria.passengers || !isInRange(criteria.passengers, 1, 9)) {
    errors.passengers = 'Number of passengers must be 1-9';
  }

  // Validate cabin class
  const validCabins = ['ECONOMY', 'BUSINESS', 'FIRST', 'PREMIUM_ECONOMY'];
  if (criteria.cabinClass && !validCabins.includes(criteria.cabinClass)) {
    errors.cabinClass = 'Invalid cabin class';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate IATA airport code (3 uppercase letters)
 */
export function isValidIATACode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code.trim().toUpperCase());
}

/**
 * Validate search criteria (hotel - legacy, kept for backward compatibility)
 */

/**
 * Sanitize string input
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 500);
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Check if value is empty
 */
export function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Validate credit card number (Luhn algorithm)
 * Note: Frontend validation only - real validation on backend
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate CVV
 */
export function isValidCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv.trim());
}

/**
 * Validate card expiration
 */
export function isValidCardExpiration(month: string, year: string): boolean {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (m < 1 || m > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (y < currentYear) {
    return false;
  }

  if (y === currentYear && m < currentMonth) {
    return false;
  }

  return true;
}
