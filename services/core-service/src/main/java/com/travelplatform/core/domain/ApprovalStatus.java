package com.travelplatform.core.domain;

/**
 * Approval Status Enum - TravelPlatform Core Service
 * 
 * Represents the approval workflow states for a booking.
 * 
 * AC-EXP-07: Approval Workflow (Phase 1 - Single Level)
 */
public enum ApprovalStatus {
    NOT_REQUIRED,     // Policy evaluation returned ALLOW
    PENDING,          // Policy evaluation returned REQUIRE_APPROVAL
    APPROVED,         // Approver submitted APPROVED decision
    REJECTED,         // Approver submitted REJECTED decision
    EXPIRED           // Approval deadline passed without decision
}
