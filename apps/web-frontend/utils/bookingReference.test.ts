import { describe, expect, it } from 'vitest';
import { BOOKING_REFERENCE_PATTERN, generateBookingReference } from './bookingReference';
import { PNR_PATTERN, generatePnr } from './pnr';

describe('booking reference', () => {
  it('generates a six-character customer-facing record locator', () => {
    const reference = generateBookingReference('0A0292C7-9F93-4079-BBD8-4B56614099AF');
    expect(reference).toMatch(BOOKING_REFERENCE_PATTERN);
    expect(reference).toHaveLength(6);
  });

  it('does not expose the internal UUID format', () => {
    const reference = generateBookingReference('0A0292C7-9F93-4079-BBD8-4B56614099AF');
    expect(reference).not.toContain('-');
    expect(reference).not.toContain('CONF-');
    expect(reference).not.toContain('0A0292C7');
  });

  it('is stable for the same booking in mock flows', () => {
    const bookingId = 'booking-001';
    expect(generateBookingReference(bookingId)).toBe(generateBookingReference(bookingId));
  });

  it('generates different references for different booking IDs in normal cases', () => {
    expect(generateBookingReference('booking-001')).not.toBe(generateBookingReference('booking-002'));
  });
});


describe('PNR and booking reference separation', () => {
  it('generates a valid six-character PNR', () => {
    const pnr = generatePnr('0A0292C7-9F93-4079-BBD8-4B56614099AF');
    expect(pnr).toMatch(PNR_PATTERN);
    expect(pnr).toHaveLength(6);
  });

  it('generates a PNR different from the booking reference', () => {
    const bookingId = '0A0292C7-9F93-4079-BBD8-4B56614099AF';
    expect(generatePnr(bookingId)).not.toBe(generateBookingReference(bookingId));
  });

  it('is stable for the same booking in mock flows', () => {
    const bookingId = 'booking-001';
    expect(generatePnr(bookingId)).toBe(generatePnr(bookingId));
  });
});
