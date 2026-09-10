/**
 * Application Constants
 * Centralized configuration values
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
};

/**
 * Booking Configuration
 */
export const BOOKING_CONFIG = {
  HOLD_DURATION_MINUTES: 60,
  MINIMUM_ADVANCE_DAYS: 0, // Can book for today
  MAXIMUM_ADVANCE_DAYS: 365,
  MINIMUM_STAY_NIGHTS: 1,
  MAXIMUM_STAY_NIGHTS: 365,
};

/**
 * Search Configuration
 */
export const SEARCH_CONFIG = {
  MAX_GUESTS: 10,
  MAX_ROOMS: 10,
  DEFAULT_PAGE_SIZE: 10,
  DESTINATION_SEARCH_LIMIT: 5,
};

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_EMAIL_LENGTH: 3,
  MAX_EMAIL_LENGTH: 254,
  MIN_PHONE_LENGTH: 10,
  MAX_SPECIAL_REQUESTS_LENGTH: 500,
};

/**
 * Pagination Defaults
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_NUMBER: 1,
};

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  TOAST_DURATION_MS: 5000,
  MODAL_ANIMATION_MS: 300,
  DEBOUNCE_DELAY_MS: 300,
  AUTOCOMPLETE_MIN_CHARS: 2,
  AUTOCOMPLETE_DELAY_MS: 200,
};

/**
 * Status Check Polling
 */
export const POLLING_CONFIG = {
  APPROVAL_STATUS_INTERVAL_MS: 5000,
  BOOKING_STATUS_INTERVAL_MS: 3000,
};

/**
 * Currency Defaults
 */
export const CURRENCY_CONFIG = {
  DEFAULT_CURRENCY: 'USD' as const,
};

/**
 * Feature Flags
 */
export const FEATURE_FLAGS = {
  ENABLE_PAYMENT_INTEGRATION: false, // Phase 1: Mock only
  ENABLE_REAL_TIME_UPDATES: false,   // Phase 1: Mock only
  ENABLE_CORPORATE_POLICIES: true,   // Core Phase 1 feature
  ENABLE_APPROVAL_WORKFLOW: true,    // Core Phase 1 feature
};

/**
 * Error Retry Configuration
 */
export const RETRY_CONFIG = {
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  EXPONENTIAL_BACKOFF_BASE: 2,
  MAX_RETRY_DELAY_MS: 30000,
};

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  AUTH_TOKEN_STORAGE_KEY: 'auth_token',
  REFRESH_TOKEN_STORAGE_KEY: 'refresh_token',
  TOKEN_REFRESH_BUFFER_MS: 60000, // Refresh 1 minute before expiry
};

/**
 * Date Format Strings
 */
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'MM/DD/YYYY',
  DISPLAY_SHORT: 'MMM DD',
  DISPLAY_FULL: 'MMMM DD, YYYY',
  TIME_SHORT: 'HH:MM',
  TIME_FULL: 'HH:MM AM/PM',
};

/**
 * Common Amenities (for filtering/display)
 */
export const COMMON_AMENITIES = [
  'WiFi',
  'Gym',
  'Pool',
  'Restaurant',
  'Bar',
  'Spa',
  'Parking',
  'Concierge',
  'Room Service',
  'Business Center',
];

/**
 * Star Rating Options
 */
export const STAR_RATINGS = [1, 2, 3, 4, 5];

/**
 * Room Types
 */
export const ROOM_TYPES = [
  'Standard Room',
  'Deluxe Room',
  'Suite',
  'Presidential Suite',
];

/**
 * Travel Purposes
 */
export const TRAVEL_PURPOSES = [
  { value: 'BUSINESS', label: 'Business' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'BLENDED', label: 'Business & Personal' },
];

/**
 * Titles/Salutations
 */
export const TITLES = [
  { value: 'Mr', label: 'Mr.' },
  { value: 'Ms', label: 'Ms.' },
  { value: 'Mrs', label: 'Mrs.' },
  { value: 'Dr', label: 'Dr.' },
  { value: 'Prof', label: 'Prof.' },
];

/**
 * Countries (subset for Phase 1)
 */
export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
];

/**
 * CSS Breakpoints (Tailwind-compatible)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

/**
 * Z-Index Levels
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKGROUND: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
  NOTIFICATION: 80,
};
