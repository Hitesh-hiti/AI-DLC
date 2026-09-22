/**
 * Date/Time Utilities
 * Formatting, parsing, and calculations
 */

/**
 * Format ISO date string to display format (MM/DD/YYYY)
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format ISO datetime to readable format
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format ISO date to long format (e.g., "January 15, 2024")
 */
export function formatDateLong(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format ISO time to display format (HH:MM AM/PM)
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Parse date from string (MM/DD/YYYY) to ISO string
 */
export function parseDate(dateString: string): string {
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    throw new Error('Invalid date format. Use MM/DD/YYYY');
  }
  const [month, day, year] = parts;
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date.toISOString().split('T')[0];
}

/**
 * Get number of days between two ISO date strings
 */
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end - start) / msPerDay);
}

/**
 * Add days to ISO date string
 */
export function addDays(isoString: string, days: number): string {
  const date = new Date(isoString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Check if date is in the past
 */
export function isDateInPast(isoString: string): boolean {
  return new Date(isoString) < new Date();
}

/**
 * Check if date is today
 */
export function isToday(isoString: string): boolean {
  const today = new Date();
  const date = new Date(isoString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(isoString: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(isoString);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Get minimum check-in date (today)
 */
export function getMinCheckInDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get minimum check-out date (tomorrow or later)
 */
export function getMinCheckOutDate(checkInDate: string): string {
  return addDays(checkInDate, 1);
}

/**
 * Format duration (e.g., "2 nights")
 */
export function formatDuration(nights: number): string {
  return nights === 1 ? '1 night' : `${nights} nights`;
}

/**
 * Get day of week abbreviation (e.g., "Mon")
 */
export function getDayOfWeekAbbrv(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Check if dates are valid for a booking (check-out > check-in)
 */
export function isValidBookingDateRange(checkIn: string, checkOut: string): boolean {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return checkOutDate > checkInDate;
}

/**
 * Format relative time (e.g., "2 days from now")
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays} days from now`;
  } else {
    return formatDate(isoString);
  }
}
