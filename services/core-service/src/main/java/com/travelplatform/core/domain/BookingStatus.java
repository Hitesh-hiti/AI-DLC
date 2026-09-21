package com.travelplatform.core.domain;

/**
 * Booking Status Enum - TravelPlatform Core Service
 * 
 * Represents the lifecycle states of a booking.
 * State transitions are managed through the BookingService.
 * 
 * AC-EXP-05-04: Status labels for all states
 */
public enum BookingStatus {
    DRAFT,            // Initial state when booking is being constructed
    HELD,             // Hold acquired at GDS, waiting for confirmation
    PENDING_ISSUE,    // Queued for ticketing, waiting for ticket number
    CONFIRMED,        // Ticket issued, booking complete
    COMPLETED,        // Travel complete (all segments used)
    CANCELLED,        // Booking cancelled (hold released or refund processed)
    EXPIRED,          // Hold expired without confirmation
    CONFIRM_EXCEPTION // Partial failure: ticket issued but ledger write failed
}
