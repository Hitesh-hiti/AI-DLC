package com.travelplatform.core.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Booking Entity - TravelPlatform Core Service
 * 
 * Represents a reservation in the system. Multiple booking states are tracked
 * through the status enum. bookings are append-only - status changes create
 * new records linked via booking_id.
 * 
 * AC-EXP-02: Create Booking (Hold)
 * AC-EXP-03: Confirm Booking (Issue Ticket)
 * AC-EXP-04: Cancel Booking
 */
@Entity
@Table(
    name = "booking",
    indexes = {
        @Index(name = "idx_booking_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_booking_trip_id", columnList = "tenant_id, trip_id"),
        @Index(name = "idx_booking_status", columnList = "tenant_id, status"),
        @Index(name = "idx_booking_supplier_ref", columnList = "tenant_id, supplier_code, supplier_reference"),
        @Index(name = "idx_booking_hold_expiry", columnList = "tenant_id, status, hold_expires_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "booking_id", nullable = false, updatable = false)
    private UUID bookingId;

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "trip_id")
    private UUID tripId;

    @NotNull
    @Column(name = "supplier_code", nullable = false, length = 10)
    private String supplierCode;

    @NotNull
    @Column(name = "supplier_reference", nullable = false, length = 255)
    private String supplierReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BookingStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @Column(name = "hold_expires_at")
    private OffsetDateTime holdExpiresAt;

    @Column(name = "void_window_expires_at")
    private OffsetDateTime voidWindowExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false, length = 20)
    private ApprovalStatus approvalStatus = ApprovalStatus.NOT_REQUIRED;

    @Column(name = "approval_requester_id")
    private UUID approvalRequestId;

    @Column(name = "approval_approver_id")
    private UUID approvalApproverId;

    @Column(name = "approval_requested_at")
    private OffsetDateTime approvalRequestedAt;

    @Column(name = "approval_expires_at")
    private OffsetDateTime approvalExpiresAt;

    @Column(name = "payment_reference", length = 255)
    private String paymentReference;

    @Column(name = "policy_decision_snapshot_id")
    private UUID policyDecisionSnapshotId;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount = 0L;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "USD";

    @Column(name = "metadata", columnDefinition = "JSONB")
    private String metadata;

    @Column(name = "confirm_exception_count", nullable = false)
    private Integer confirmExceptionCount = 0;

    @NotNull
    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
