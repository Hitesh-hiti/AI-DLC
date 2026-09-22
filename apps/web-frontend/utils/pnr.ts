/**
 * Local/mock PNR (Passenger Name Record) generator.
 *
 * PNR and booking reference are intentionally separate identifiers.
 * In production, the PNR should be returned by the reservation/GDS provider.
 */
import { BOOKING_REFERENCE_PATTERN, generateBookingReference } from './bookingReference';

const PNR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PNR_LENGTH = 6;

export const PNR_PATTERN = BOOKING_REFERENCE_PATTERN;

export function generatePnr(bookingId: string): string {
  if (!bookingId) throw new Error('bookingId is required');

  for (let attempt = 0; attempt < 100; attempt += 1) {
    let hash = 2166136261;
    const seed = `PNR:${bookingId}:${attempt}`;
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash >>>= 0;

    let pnr = '';
    for (let i = 0; i < PNR_LENGTH; i += 1) {
      hash = Math.imul(hash ^ (hash >>> 13), 0x5bd1e995) >>> 0;
      pnr += PNR_ALPHABET[hash % PNR_ALPHABET.length];
    }

    // A PNR must never be the same as the booking reference.
    if (pnr !== generateBookingReference(bookingId)) return pnr;
  }

  throw new Error('Unable to generate a PNR different from the booking reference');
}
