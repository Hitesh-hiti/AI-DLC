/**
 * Customer-facing booking reference / record locator.
 *
 * Keep this separate from the internal booking UUID. In production, the
 * reference should be supplied by the reservation/GDS provider; this helper
 * is only for local/mock flows.
 */
const BOOKING_REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BOOKING_REFERENCE_LENGTH = 6;

export const BOOKING_REFERENCE_PATTERN = /^[A-Z0-9]{6}$/;

export function generateBookingReference(bookingId: string): string {
  if (!bookingId) throw new Error('bookingId is required');

  // Stable non-cryptographic hash so hold/detail/confirm return the same
  // customer-facing reference for the same mock booking.
  let hash = 2166136261;
  for (let i = 0; i < bookingId.length; i += 1) {
    hash ^= bookingId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;

  let reference = '';
  for (let i = 0; i < BOOKING_REFERENCE_LENGTH; i += 1) {
    hash = Math.imul(hash ^ (hash >>> 13), 0x5bd1e995) >>> 0;
    reference += BOOKING_REFERENCE_ALPHABET[hash % BOOKING_REFERENCE_ALPHABET.length];
  }

  return reference;
}
