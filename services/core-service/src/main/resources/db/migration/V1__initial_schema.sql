-- =============================================================================
-- TravelPlatform Core Service - Initial Database Schema
-- Version: 1.0
-- Database: PostgreSQL 16
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- COMMON PATTERNS
-- =============================================================================

-- ULID generation function ( sortable UUID-like identifier)
CREATE OR REPLACE FUNCTION gen_ulid() RETURNS uuid AS $$
BEGIN
    RETURN uuid_generate_v7();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MULTI-TENANCY BASE TABLE
-- =============================================================================

CREATE TABLE tenant (
    tenant_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    external_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenant_external_id ON tenant(external_id);

-- =============================================================================
-- TRIP (Business grouping)
-- =============================================================================

CREATE TABLE trip (
    trip_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    traveler_id UUID NOT NULL,  -- PII pointer (actual PII stored separately)
    purpose VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, external_trip_id)
);

CREATE INDEX idx_trip_tenant_id ON trip(tenant_id);
CREATE INDEX idx_trip_traveler_id ON trip(tenant_id, traveler_id);
CREATE INDEX idx_trip_date_range ON trip(tenant_id, start_date, end_date);

-- =============================================================================
-- BOOKING (Reservation)
-- =============================================================================

CREATE TYPE booking_status AS ENUM (
    'DRAFT',
    'HELD',
    'PENDING_ISSUE',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED',
    'CONFIRM_EXCEPTION'
);

CREATE TYPE approval_status AS ENUM (
    'NOT_REQUIRED',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'EXPIRED'
);

CREATE TABLE booking (
    booking_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    trip_id UUID REFERENCES trip(trip_id),
    
    -- Supplier reference
    supplier_code VARCHAR(10) NOT NULL,
    supplier_reference VARCHAR(255) NOT NULL,  -- GDS locator
    
    -- Status
    status booking_status NOT NULL DEFAULT 'DRAFT',
    
    -- Dates
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    hold_expires_at TIMESTAMP WITH TIME ZONE,
    void_window_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Approval
    approval_status approval_status NOT NULL DEFAULT 'NOT_REQUIRED',
    approval_requester_id UUID,
    approval_approver_id UUID,
    approval_requested_at TIMESTAMP WITH TIME ZONE,
    approval_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Financial
    payment_reference VARCHAR(255),
    
    -- Policy
    policy_decision_snapshot_id UUID,  -- References policy_decision_snapshot table
    
    -- Metadata
    total_amount BIGINT NOT NULL DEFAULT 0,  -- integer minor units
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    metadata JSONB,
    
    -- Exception tracking
    confirm_exception_count INTEGER NOT NULL DEFAULT 0,
    
    -- Idempotency
    idempotency_key VARCHAR(255) UNIQUE NOT NULL
);

CREATE INDEX idx_booking_tenant_id ON booking(tenant_id);
CREATE INDEX idx_booking_trip_id ON booking(tenant_id, trip_id);
CREATE INDEX idx_booking_status ON booking(tenant_id, status);
CREATE INDEX idx_booking_supplier_ref ON booking(tenant_id, supplier_code, supplier_reference);
CREATE INDEX idx_booking_hold_expiry ON booking(tenant_id, status, hold_expires_at)
    WHERE status = 'HELD' OR status = 'PENDING_ISSUE';

-- =============================================================================
-- PASSENGER (PII pointer model)
-- =============================================================================

CREATE TABLE passenger (
    passenger_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    traveler_id UUID NOT NULL,  -- PII pointer
    passenger_type VARCHAR(10) NOT NULL,  -- ADT, CHD, INF
    index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, booking_id, index)
);

CREATE INDEX idx_passenger_tenant_id ON passenger(tenant_id);
CREATE INDEX idx_passenger_booking_id ON passenger(tenant_id, booking_id);

-- =============================================================================
-- SEGMENT (Flight segment with typed payload)
-- =============================================================================

CREATE TABLE segment (
    segment_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    passenger_id UUID REFERENCES passenger(passenger_id),
    
    -- Common envelope
    product_type VARCHAR(50) NOT NULL DEFAULT 'AIR',
    supplier_code VARCHAR(10) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,  -- flight, hotel, car
    reference_value VARCHAR(255) NOT NULL,
    
    -- Dates/times
    departure_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    operating_carrier VARCHAR(10),
    partner_code VARCHAR(10),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    
    -- Typed payload (JSONB)
    payload JSONB NOT NULL,
    payload_version INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_segment_tenant_id ON segment(tenant_id);
CREATE INDEX idx_segment_booking_id ON segment(tenant_id, booking_id);
CREATE INDEX idx_segment_passenger_id ON segment(tenant_id, passenger_id);

-- =============================================================================
-- SUPPLIER MAPPING (Append-only)
-- =============================================================================

CREATE TABLE supplier_mapping (
    supplier_mapping_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    supplier_code VARCHAR(10) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,  -- GDS_LOCATOR, SUPPLIER_TICKET, etc.
    reference_value VARCHAR(255) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_mapping_tenant_id ON supplier_mapping(tenant_id);
CREATE INDEX idx_supplier_mapping_supplier ON supplier_mapping(tenant_id, supplier_code, reference_type, reference_value);
CREATE INDEX idx_supplier_mapping_valid ON supplier_mapping(tenant_id, supplier_code, reference_type, valid_from, valid_to);

-- =============================================================================
-- TICKET & COUPON (New schema per ADR-010)
-- =============================================================================

CREATE TYPE ticket_status AS ENUM (
    'PENDING_ISSUE',
    'ISSUED',
    'VOIDED',
    'REFUND_REQUESTED',
    'REFUNDED',
    'REFUND_REJECTED'
);

CREATE TABLE ticket (
    ticket_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    supplier_code VARCHAR(10) NOT NULL,
    supplier_ticket_number VARCHAR(100) NOT NULL,
    
    status ticket_status NOT NULL DEFAULT 'PENDING_ISSUE',
    
    -- Financial
    total_amount BIGINT NOT NULL,
    currency_code CHAR(3) NOT NULL,
    base_fare_amount BIGINT NOT NULL,
    tax_amounts JSONB NOT NULL,  -- { "YQ": 5000, "YR": 3000 } (minor units)
    fee_amounts JSONB NOT NULL,
    
    -- Policy
    refund_penalty_amount BIGINT NOT NULL DEFAULT 0,
    change_penalty_amount BIGINT NOT NULL DEFAULT 0,
    refundable_amount BIGINT NOT NULL DEFAULT 0,
    is_refundable BOOLEAN NOT NULL DEFAULT false,
    
    -- Timing
    issued_at TIMESTAMP WITH TIME ZONE,
    void_window_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_tenant_id ON ticket(tenant_id);
CREATE INDEX idx_ticket_booking_id ON ticket(tenant_id, booking_id);
CREATE INDEX idx_ticket_status ON ticket(tenant_id, status);

-- Coupon (Links ticket to segment, drives usage/refundability)
CREATE TABLE coupon (
    coupon_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    ticket_id UUID NOT NULL REFERENCES ticket(ticket_id),
    segment_id UUID REFERENCES segment(segment_id),
    
    coupon_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    
    -- Flight details (for reference)
    segment_reference VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, ticket_id, coupon_number)
);

CREATE INDEX idx_coupon_tenant_id ON coupon(tenant_id);
CREATE INDEX idx_coupon_ticket_id ON coupon(tenant_id, ticket_id);
CREATE INDEX idx_coupon_status ON coupon(tenant_id, status);
CREATE INDEX idx_coupon_segment_id ON coupon(tenant_id, segment_id);

-- =============================================================================
-- FINANCIAL LEG (Charge breakdown per ticket)
-- =============================================================================

CREATE TABLE financial_leg (
    financial_leg_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    ticket_id UUID NOT NULL REFERENCES ticket(ticket_id),
    passenger_id UUID REFERENCES passenger(passenger_id),
    
    leg_type VARCHAR(50) NOT NULL,  -- BASE_FARE, TAX, FEE, ANCILLARY, REFUND
    leg_amount BIGINT NOT NULL,  -- integer minor units
    currency_code CHAR(3) NOT NULL,
    
    -- Tax breakdown
    tax_code VARCHAR(10),  -- IATA tax code (YQ, YR, etc.)
    tax_amount BIGINT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, SUPERSEDED
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_leg_tenant_id ON financial_leg(tenant_id);
CREATE INDEX idx_financial_leg_ticket_id ON financial_leg(tenant_id, ticket_id);
CREATE INDEX idx_financial_leg_passenger_id ON financial_leg(tenant_id, passenger_id);

-- =============================================================================
-- COST ALLOCATION (Per passenger, per ticket, per leg)
-- =============================================================================

CREATE TABLE cost_allocation (
    allocation_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    financial_leg_id UUID NOT NULL REFERENCES financial_leg(financial_leg_id),
    passenger_id UUID NOT NULL REFERENCES passenger(passenger_id),
    
    cost_object_id VARCHAR(255) NOT NULL,
    cost_object_type VARCHAR(50) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    allocated_amount BIGINT NOT NULL,  -- integer minor units
    currency_code CHAR(3) NOT NULL,
    
    priority INTEGER NOT NULL DEFAULT 999,  -- For largest-remainder algorithm
    
    -- Reversal tracking
    reverses_allocation_id UUID REFERENCES cost_allocation(allocation_id),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cost_allocation_tenant_id ON cost_allocation(tenant_id);
CREATE INDEX idx_cost_allocation_leg_id ON cost_allocation(tenant_id, financial_leg_id);
CREATE INDEX idx_cost_allocation_passenger_id ON cost_allocation(tenant_id, passenger_id);

-- =============================================================================
-- REFUND (Two-phase lifecycle)
-- =============================================================================

CREATE TYPE refund_status AS ENUM (
    'REQUESTED',
    'CONFIRMED',
    'REJECTED',
    'FAILED'
);

CREATE TABLE refund (
    refund_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    ticket_id UUID REFERENCES ticket(ticket_id),
    
    status refund_status NOT NULL DEFAULT 'REQUESTED',
    
    -- Financial
    gross_amount BIGINT NOT NULL,
    penalty_amount BIGINT NOT NULL DEFAULT 0,
    non_refundable_amount BIGINT NOT NULL DEFAULT 0,
    refundable_amount BIGINT NOT NULL,
    currency_code CHAR(3) NOT NULL,
    
    -- Payment
    payment_reference VARCHAR(255) NOT NULL,
    return_to_original BOOLEAN NOT NULL DEFAULT true,
    
    -- Supplier
    supplier_refund_ref VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refund_tenant_id ON refund(tenant_id);
CREATE INDEX idx_refund_booking_id ON refund(tenant_id, booking_id);
CREATE INDEX idx_refund_status ON refund(tenant_id, status);

-- =============================================================================
-- POLICY
-- =============================================================================

CREATE TABLE policy_decision_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    
    outcome VARCHAR(50) NOT NULL,  -- ALLOW, WARN, BLOCK, REQUIRE_APPROVAL
    rule_set_version VARCHAR(50) NOT NULL,
    matched_rules JSONB NOT NULL,  -- Array of {rule_id, rule_version, scope_level, specificity, enforcement_level, rationale}
    evaluation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_snapshot_tenant_id ON policy_decision_snapshot(tenant_id);
CREATE INDEX idx_policy_snapshot_booking_id ON policy_decision_snapshot(tenant_id, booking_id);

CREATE TABLE policy_override (
    override_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    snapshot_id UUID NOT NULL REFERENCES policy_decision_snapshot(snapshot_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    
    reason_code VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL,  -- PII pointer
    actor_role VARCHAR(50) NOT NULL,  -- TRAVELER, APPROVER
    free_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_override_tenant_id ON policy_override(tenant_id);
CREATE INDEX idx_policy_override_snapshot_id ON policy_override(tenant_id, snapshot_id);

-- =============================================================================
-- IDEMPOTENCY STORE (PostgreSQL - Durable)
-- =============================================================================

CREATE TABLE idempotency_record (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    request_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, COMPLETE, FAILED
    http_status INTEGER,
    response_body JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, request_hash)
);

CREATE INDEX idx_idempotency_tenant_key ON idempotency_record(tenant_id, idempotency_key);
CREATE INDEX idx_idempotency_pending ON idempotency_record(status) WHERE status = 'PENDING';

-- =============================================================================
-- TRANSACTIONAL OUTBOX (Event-driven integration)
-- =============================================================================

CREATE TYPE event_type AS ENUM (
    -- Booking events
    'BookingHeld',
    'BookingConfirmed',
    'BookingCancelled',
    'BookingExpired',
    'BookingQueuedForTicketing',
    
    -- Ticket events
    'TicketIssued',
    
    -- Refund events
    'RefundRequested',
    'RefundConfirmed',
    'RefundRejected',
    
    -- Policy events
    'PolicyOverrideRecorded',
    'ApprovalRequested',
    
    -- Supplier events
    'SupplierWebhookReceived',
    'ReconciliationExceptionRaised',
    'ConfirmExceptionRaised'
);

CREATE TABLE outbox_event (
    event_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL,
    event_type event_type NOT NULL,
    event_version INTEGER NOT NULL DEFAULT 1,
    aggregate_id UUID NOT NULL,
    aggregate_version INTEGER NOT NULL DEFAULT 1,
    payload JSONB NOT NULL,
    correlation_id UUID NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMP WITH TIME ZONE,
    dispatch_attempts INTEGER NOT NULL DEFAULT 0,
    last_dispatch_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Dead letter queue
    is_dlq BOOLEAN NOT NULL DEFAULT false,
    dlq_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outbox_tenant ON outbox_event(tenant_id);
CREATE INDEX idx_outbox_type ON outbox_event(event_type);
CREATE INDEX idx_outbox_correlation ON outbox_event(correlation_id);
CREATE INDEX idx_outbox_dispatch ON outbox_event(dispatched_at, event_type) WHERE dispatched_at IS NULL AND is_dlq = false;
CREATE INDEX idx_outbox_dlq ON outbox_event(is_dlq) WHERE is_dlq = true;

-- =============================================================================
-- RECONCILIATION EXCEPTION (Supplier drift detection)
-- =============================================================================

CREATE TYPE reconciliation_exception_type AS ENUM (
    'MISSING_AT_SUPPLIER',
    'ORPHAN_TICKET',
    'STATUS_DRIFT',
    'AMOUNT_DRIFT'
);

CREATE TABLE reconciliation_exception (
    exception_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    exception_type reconciliation_exception_type NOT NULL,
    booking_id UUID REFERENCES booking(booking_id),
    supplier_code VARCHAR(10) NOT NULL,
    supplier_reference VARCHAR(255) NOT NULL,
    
    expected_state JSONB,
    actual_state JSONB,
    drift_description TEXT NOT NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',  -- OPEN, INVESTIGATING, RESOLVED
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recon_exception_tenant ON reconciliation_exception(tenant_id);
CREATE INDEX idx_recon_exception_status ON reconciliation_exception(tenant_id, status);

-- =============================================================================
-- APPROVAL (Single-level Phase 1)
-- =============================================================================

CREATE TABLE approval (
    approval_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    booking_id UUID NOT NULL REFERENCES booking(booking_id),
    
    status approval_status NOT NULL DEFAULT 'NOT_REQUIRED',
    
    approver_id UUID NOT NULL,  -- PII pointer
    approver_name VARCHAR(255),  -- Snapshot at request time
    requester_id UUID NOT NULL,
    
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    decision_at TIMESTAMP WITH TIME ZONE,
    
    decision VARCHAR(20),
    decision_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, booking_id)
);

CREATE INDEX idx_approval_tenant_id ON approval(tenant_id);
CREATE INDEX idx_approval_status ON approval(tenant_id, status);
CREATE INDEX idx_approval_expiry ON approval(tenant_id, status, expires_at) WHERE status = 'PENDING';

-- =============================================================================
-- FINANCIAL EVENT (21 dimensions for reporting)
-- =============================================================================

CREATE TABLE financial_event (
    event_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    correlation_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    
    -- Monetary amounts (per currency)
    amount_sale BIGINT NOT NULL,
    currency_sale CHAR(3) NOT NULL,
    amount_settlement BIGINT NOT NULL,
    currency_settlement CHAR(3) NOT NULL,
    amount_reporting BIGINT NOT NULL,
    currency_reporting CHAR(3) NOT NULL,
    
    -- FX rates
    fx_rate_sale_to_settlement DECIMAL(15,8),
    fx_rate_sale_to_reporting DECIMAL(15,8),
    fx_rate_settlement_to_reporting DECIMAL(15,8),
    
    -- 21 Dimensions (D1-D22; D9 nullable only when no override)
    -- D1: tenant_id (implicit)
    dimension_traveler_id UUID,
    -- D2: traveler_tier
    dimension_traveler_tier VARCHAR(50),
    -- D3: traveler_department
    dimension_traveler_department VARCHAR(255),
    -- D4: traveler_cost_center
    dimension_traveler_cost_center VARCHAR(255),
    -- D5: traveler_project
    dimension_traveler_project VARCHAR(255),
    -- D6: trip_purpose
    dimension_trip_purpose VARCHAR(255),
    -- D7: booking_source
    dimension_booking_source VARCHAR(50),
    -- D8: cabin_class
    dimension_cabin_class VARCHAR(50),
    -- D9: override_reason_code (nullable - intentionally)
    dimension_override_reason_code VARCHAR(50),
    -- D10: route
    dimension_route VARCHAR(255),
    -- D11: carrier
    dimension_carrier VARCHAR(10),
    -- D12: fare_basis
    dimension_fare_basis VARCHAR(50),
    -- D13: booking_window_days
    dimension_booking_window_days INTEGER,
    -- D14: travel_season
    dimension_travel_season VARCHAR(20),
    -- D15: payment_method
    dimension_payment_method VARCHAR(50),
    -- D16: discount_type
    dimension_discount_type VARCHAR(50),
    -- D17: tax_type
    dimension_tax_type VARCHAR(50),
    -- D18: fee_type
    dimension_fee_type VARCHAR(50),
    -- D19: revenue_category
    dimension_revenue_category VARCHAR(50),
    -- D20: cost_center
    dimension_cost_center VARCHAR(255),
    -- D21: project_code
    dimension_project_code VARCHAR(255),
    
    -- Provenance
    dimension_source VARCHAR(20) NOT NULL,  -- LIVE, CACHED
    dimension_snapshot_age_seconds INTEGER NOT NULL DEFAULT 0,
    
    related_event_id UUID,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_event_tenant ON financial_event(tenant_id);
CREATE INDEX idx_financial_event_correlation ON financial_event(tenant_id, correlation_id);
CREATE INDEX idx_financial_event_type ON financial_event(tenant_id, event_type);
CREATE INDEX idx_financial_event_date ON financial_event(tenant_id, created_at);

-- =============================================================================
-- PII STORE (Separate - GDPR erasure safe)
-- =============================================================================

CREATE TABLE pii_store (
    pii_id UUID PRIMARY KEY DEFAULT gen_ulid(),
    tenant_id UUID NOT NULL REFERENCES tenant(tenant_id),
    pii_type VARCHAR(50) NOT NULL,  -- TRAVELER, PASSENGER
    pii_data JSONB NOT NULL,  -- Encrypted at rest
    encrypted BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,  -- GDPR erasure
    UNIQUE(tenant_id, pii_type, original_id)
);

CREATE INDEX idx_pii_tenant_id ON pii_store(tenant_id);
CREATE INDEX idx_pii_deleted ON pii_store(tenant_id, deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Booking status counts for operational monitoring
CREATE INDEX idx_booking_status_count ON booking(tenant_id, status, created_at);

-- Outbox dispatch priority
CREATE INDEX idx_outbox_dispatch_priority ON outbox_event(occurred_at, event_id) 
    WHERE dispatched_at IS NULL AND is_dlq = false;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- View: Active bookings with approval details
CREATE VIEW v_active_bookings AS
SELECT 
    b.booking_id,
    b.tenant_id,
    b.trip_id,
    b.status,
    b.hold_expires_at,
    b.void_window_expires_at,
    a.status AS approval_status,
    a.approver_name,
    a.expires_at AS approval_expires_at
FROM booking b
LEFT JOIN approval a ON b.tenant_id = a.tenant_id AND b.booking_id = a.booking_id
WHERE b.status IN ('HELD', 'PENDING_ISSUE', 'PENDING', 'APPROVED');

-- View: Refund eligibility
CREATE VIEW v_refund_eligibility AS
SELECT 
    t.ticket_id,
    t.booking_id,
    t.status AS ticket_status,
    t.refundable_amount,
    t.refund_penalty_amount,
    t.is_refundable,
    CASE 
        WHEN t.status = 'ISSUED' AND NOW() < t.void_window_expires_at THEN true
        ELSE false
    END AS within_void_window
FROM ticket t
WHERE t.status IN ('ISSUED', 'REFUND_REQUESTED', 'REFUNDED');
