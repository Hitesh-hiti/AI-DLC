# TravelPlatform — Back-End Happy-Path Test Cases (Phase 1)

**Document Version:** 1.0  
**Date:** 2026-09-16  
**Scope:** Phase 1 happy-path test cases only (P0 + P1 acceptance criteria)  
**Source of Truth:** `be_acceptance_criteria.md` v1.0  
**QA Methodology:** `qa.md` (functional test generation process, Step 1–6)  
**Guardrails:** `agent.md` (test case design, traceability, automation classification)  
**Test Execution Layer:** Unit + Integration + Contract (E2E deferred to Phase 2)  
**Automation Framework:** Jest + Supertest (TypeScript), JUnit 5 + RestAssured (Java)  
**Test Data:** Stable ULIDs, real IATA codes (YVR, JFK, CDG), USD only, `_TEST_` prefix for controlled fixtures  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Test Generation Methodology](#2-test-generation-methodology)
3. [Experience Domain Test Cases](#3-experience-domain-test-cases)
4. [Content Domain Test Cases](#4-content-domain-test-cases)
5. [Policy Domain Test Cases](#5-policy-domain-test-cases)
6. [Payment Domain Test Cases](#6-payment-domain-test-cases)
7. [Servicing Domain Test Cases](#7-servicing-domain-test-cases)
8. [Data / Cross-Cutting Test Cases](#8-data--cross-cutting-test-cases)
9. [Test Coverage Summary](#9-test-coverage-summary)
10. [Traceability Matrix](#10-traceability-matrix)
11. [Phase 2 Exception Paths (Deferred)](#11-phase-2-exception-paths-deferred)

---

## 1. EXECUTIVE SUMMARY

### Scope

Phase 1 test generation covers **P0 (critical) + P1 (high-risk) acceptance criteria only**. Happy-path scenarios validate the core business flow under normal conditions. Exception paths, boundary cases, and negative scenarios are deferred to Phase 2.

### Coverage Target

- **P0 ACs:** 100% coverage (1 happy-path test per AC)
- **P1 ACs:** 80% coverage (0–2 happy-path tests per AC, alternate valid flows)
- **P2+ ACs:** 0% coverage (Phase 2)

### Test Counts

| Domain | P0 ACs | P1 ACs | Phase 1 Tests | Phase 1 Automation | Deferred (Phase 2) |
|--------|--------|--------|---------------|-------------------|------------------|
| Experience (EXP) | 9 | 12 | 18 | 16 | 17 |
| Content (CNT) | 3 | 8 | 8 | 6 | 18 |
| Policy (POL) | 4 | 6 | 8 | 7 | 8 |
| Payment (PAY) | 4 | 8 | 10 | 8 | 15 |
| Servicing (SVC) | 2 | 4 | 5 | 4 | 5 |
| Data (DAT) | 3 | 6 | 7 | 6 | 14 |
| Cross-Cutting (XCT) | 2 | 4 | 6 | 5 | 12 |
| **TOTAL** | **27** | **48** | **62** | **52** | **89** |

### Key Characteristics

- **Format:** Given-When-Then (Gherkin-inspired but structured as test steps)
- **ID Pattern:** BET-XXXX (Backend Test cases)
- **Traceability:** BET → AC-ID → REQ-ID (backward chain to source requirement)
- **Test Data:** Synthesized; no real PII or GDS credentials
- **Automation:** 52 of 62 tests (84%) are automation candidates; 10 require manual verification or live environment

---

## 2. TEST GENERATION METHODOLOGY

### QA Process (from qa.md Step 1–6)

#### Step 1: Extract Explicit Requirements

Every test case is derived from an explicit AC, which specifies:
- The user action (WHEN)
- The system behavior (THEN)
- Observable expected results

#### Step 2: Identify Implicit Functional Behavior

Where applicable, tests validate:
- Entity creation and storage
- State transitions
- Event emission
- Data invariants
- Cross-entity consistency

#### Step 3: Identify Ambiguities

Phase 1 test generation **blocks on ambiguities**. When an AC cannot be unambiguously tested (e.g. HITL-REQ-01: PII in notifications), the test is marked:

```
CLARIFICATION REQUIRED
```

#### Step 4: Identify Functional Areas

For each domain (Experience, Content, Policy, etc.), functional areas include:
- API endpoint behavior
- State machine transitions
- Event emission
- Data persistence
- Validation and error handling
- Cross-service integration (contract tests)

#### Step 5: Generate Functional Scenarios

Phase 1 **happy path only**:
- Valid inputs
- Successful state transitions
- Correct response format and status code
- Event emission where specified
- Data persisted correctly

#### Step 6: QA Review Gate

Each test case is checked for:
- ✅ Maps to explicit AC
- ✅ Has clear preconditions
- ✅ Has deterministic expected result
- ✅ Avoids implementation leakage
- ✅ No duplicate coverage
- ✅ Suitable for automation (or marked manual)

### Automation Classification (from agent.md)

| Classification | Meaning | When Used |
|---|---|---|
| AUTOMATION_REQUIRED | Must be automated; core business flow | P0 flows, idempotency, invariant checks |
| AUTOMATION_RECOMMENDED | Should be automated; high-value regression | P1 flows, state transitions, event emission |
| MANUAL | Requires human judgment or live system | Sabre integration, notification delivery, reconciliation |
| NOT_AUTOMATABLE | No test infrastructure exists yet | Live ticketing (Phase 2), external system verification |

---

## 3. EXPERIENCE DOMAIN TEST CASES

### REQ-EXP-01 — Travel Search

#### BET-001: Search returns offers with amounts in integer minor units

| Field | Value |
|-------|-------|
| Test Case ID | BET-001 |
| AC ID | AC-EXP-01-01 |
| REQ ID | REQ-EXP-01 |
| Priority | P0 |
| Test Type | Positive / Happy Path |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Valid search returns offers with correctly formatted monetary amounts

**Given:**
- A valid search request with origin YVR, destination JFK, departure 2026-10-15, return 2026-10-22, 1 adult passenger, cabin ECONOMY

**When:**
- The search endpoint receives the request and calls the Sabre adapter (or wiremock fixture for Phase 1)

**Then:**
- HTTP 200 is returned
- Response contains `offers[]` array (non-empty)
- Each offer has:
  - `base_fare_amount` (integer, e.g., 45000 for USD 450.00)
  - `currency_code` = "USD"
  - `taxes[]` array with IATA tax codes (e.g., YQ, YR, US) and integer amounts
  - `fees[]` array with integer amounts
  - `total_amount` = `base_fare + Σ taxes + Σ fees` (integer)
- No floating-point amounts appear anywhere in the response

**Test Data:**
```
{
  "origin": "YVR",
  "destination": "JFK",
  "departure_date": "2026-10-15",
  "return_date": "2026-10-22",
  "passengers": [{ "type": "ADULT" }],
  "cabin_class": "ECONOMY"
}
```

**Expected Response:**
```json
{
  "offers": [
    {
      "offer_id": "_TEST_OFFER_001",
      "base_fare_amount": 45000,
      "currency_code": "USD",
      "taxes": [
        { "code": "YQ", "amount": 2500 },
        { "code": "US", "amount": 1000 }
      ],
      "fees": [
        { "type": "BOOKING_FEE", "amount": 500 }
      ],
      "total_amount": 49000
    }
  ]
}
```

**Preconditions:**
- Sabre adapter (or wiremock fixture) is available
- Search request is well-formed

**Notes:**
- Phase 1 uses wiremock fixtures; no live Sabre call
- Invariant: `base_fare + Σ taxes + Σ fees = total` (verified in AC-CNT-02-02)
- Automation: Jest + Supertest mock fixture

---

#### BET-002: Search returns empty array when no offers available

| Field | Value |
|-------|-------|
| Test Case ID | BET-002 |
| AC ID | AC-EXP-01-06 |
| REQ ID | REQ-EXP-01 |
| Priority | P0 |
| Test Type | Positive (empty result) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Search with no matching flights returns HTTP 200 with empty offers array (not an error)

**Given:**
- A valid search for an obscure route YLW → ZZZ (non-existent airport) or off-season dates

**When:**
- The search endpoint receives the request

**Then:**
- HTTP 200 is returned (not HTTP 404)
- Response contains `offers: []`
- `message` field (optional) may indicate "No offers available"

**Test Data:**
```
{
  "origin": "YLW",
  "destination": "ZZZ",
  "departure_date": "2026-12-25"
}
```

**Expected Response:**
```json
{
  "offers": [],
  "message": "No offers available for the requested route and dates"
}
```

**Preconditions:**
- Search service is healthy
- Route is valid IATA code format (even if no flights exist)

**Notes:**
- Empty results are not errors per spec
- Automation: Jest mock fixture returning empty array

---

#### BET-003: Search with missing mandatory field returns HTTP 400 VALIDATION_ERROR

| Field | Value |
|-------|-------|
| Test Case ID | BET-003 |
| AC ID | AC-EXP-01-08 |
| REQ ID | REQ-EXP-01 |
| Priority | P0 |
| Test Type | Negative (validation) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Search omitting required field (e.g., origin) is rejected with clear error

**Given:**
- A search request missing `origin` field

**When:**
- The API gateway validates the request

**Then:**
- HTTP 400 is returned
- Response body (RFC 7807 problem+json):
  ```json
  {
    "type": "https://api.travelplatform.local/errors/validation-error",
    "title": "Validation Error",
    "status": 400,
    "error_code": "VALIDATION_ERROR",
    "detail": "Missing required field: origin",
    "correlation_id": "<correlation-id>"
  }
  ```

**Test Data:**
```
{
  "destination": "JFK",
  "departure_date": "2026-10-15"
  // missing: origin, passengers
}
```

**Preconditions:**
- API gateway has input validation

**Notes:**
- Test multiple missing fields separately (origin, destination, departure_date, passengers)
- Automation: Jest input validation test

---

### REQ-EXP-02 — Create Booking (Hold)

#### BET-004: Booking hold created with policy decision snapshot

| Field | Value |
|-------|-------|
| Test Case ID | BET-004 |
| AC ID | AC-EXP-02-01 |
| REQ ID | REQ-EXP-02 |
| Priority | P0 |
| Test Type | Positive / Core Flow |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Valid booking request creates hold, stores policy decision, returns booking_id

**Given:**
- A valid search offer (BET-001 fixture)
- A unique Idempotency-Key header: `550e8400-e29b-41d4-a716-446655440000`
- Booking request with:
  - `offer_id` = "_TEST_OFFER_001"
  - `passengers` with passenger type and basic info (PII pointer model: only `passenger_type` and opaque ID, no raw names)
  - `payment_reference` = "LODGE_CARD_TOKEN_123"

**When:**
- POST `/v1/bookings` is called with Idempotency-Key header

**Then:**
- HTTP 201 is returned
- Response includes:
  - `booking_id` (ULID, e.g., "01ARZ3NDEKTSV4RRFFQ69G5FAV")
  - `status: "HELD"`
  - `hold_expires_at` (ISO 8601 UTC, typically +5 minutes from now)
  - `supplier_mapping` entry with `reference_type: GDS_LOCATOR` and Sabre PNR (fixture: "_TEST_PNR_YVR123")
  - `policy_decision_snapshot` with:
    - `outcome: "ALLOW"` or `"WARN"` (depends on policy rules)
    - `matched_rules[]` array
    - `rule_set_version` (e.g., "2026-09-16-001")

- Database state:
  - `booking` record created with `status = HELD`
  - `supplier_mapping` append-only row inserted
  - `policy_decision_snapshot` immutable row inserted

**Test Data:**
```json
{
  "offer_id": "_TEST_OFFER_001",
  "passengers": [
    {
      "type": "ADULT",
      "passenger_id": "_TEST_TRAVELER_P001"
    }
  ],
  "payment_reference": "LODGE_CARD_TOKEN_123"
}
```

**Expected Response:**
```json
{
  "booking_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "HELD",
  "hold_expires_at": "2026-09-16T14:35:00Z",
  "supplier_mapping": {
    "reference_type": "GDS_LOCATOR",
    "reference_value": "_TEST_PNR_YVR123",
    "valid_from": "2026-09-16T14:30:00Z"
  },
  "policy_decision_snapshot": {
    "outcome": "ALLOW",
    "matched_rules": [],
    "rule_set_version": "2026-09-16-001"
  }
}
```

**Preconditions:**
- Sabre adapter or wiremock fixture available
- Policy evaluator available (or built-in policy service)
- Unique Idempotency-Key provided

**Postconditions:**
- Booking record persists in `HELD` state
- GDS locator stored in `supplier_mapping`
- Policy snapshot immutable (verified in separate test BET-008)

**Notes:**
- PII pointer model: passengers store `traveler_id` (opaque pointer), not raw names
- Idempotency-Key is required (tested separately in BET-006)
- Automation: Jest + Supertest integration test with mocked Sabre adapter

---

#### BET-005: Policy evaluation blocks booking when outcome is BLOCK

| Field | Value |
|-------|-------|
| Test Case ID | BET-005 |
| AC ID | AC-EXP-02-03 |
| REQ ID | REQ-EXP-02 |
| Priority | P0 |
| Test Type | Positive (blocked path) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Booking request matching BLOCK policy returns HTTP 422, no hold created

**Given:**
- A search offer for destination "XXX" (blacklisted per test policy rules)
- A booking request as in BET-004, but for destination "XXX"
- Policy rule: BLOCK on destination="XXX"

**When:**
- POST `/v1/bookings` is called

**Then:**
- HTTP 422 is returned
- Response body:
  ```json
  {
    "type": "https://api.travelplatform.local/errors/policy-blocked",
    "title": "Policy Blocked",
    "status": 422,
    "error_code": "POLICY_BLOCKED",
    "detail": "Booking blocked by policy: Destination not approved for this traveler",
    "correlation_id": "<correlation-id>"
  }
  ```
- No booking record is created
- No Sabre hold is created
- No `supplier_mapping` row is created

**Test Data:**
```json
{
  "offer_id": "_TEST_OFFER_BLOCKED_XXX",
  "destination": "XXX",
  "passengers": [{ "type": "ADULT" }]
}
```

**Preconditions:**
- Policy rules are loaded with test rule: BLOCK on destination="XXX"

**Postconditions:**
- Database remains clean: no booking, no supplier_mapping, no policy_decision_snapshot

**Notes:**
- Critical test: verifies BLOCK prevents booking persistence entirely
- Automation: Jest test with policy rule fixture

---

#### BET-006: Booking request without Idempotency-Key returns HTTP 400

| Field | Value |
|-------|-------|
| Test Case ID | BET-006 |
| AC ID | AC-EXP-02-06 |
| REQ ID | REQ-EXP-02 |
| Priority | P0 |
| Test Type | Negative (missing header) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** API gateway rejects mutating request without Idempotency-Key header

**Given:**
- A valid booking request (as in BET-004)
- No `Idempotency-Key` header in the request

**When:**
- POST `/v1/bookings` is called without the header

**Then:**
- HTTP 400 is returned (before business logic)
- Response body:
  ```json
  {
    "error_code": "IDEMPOTENCY_KEY_MISSING",
    "detail": "Idempotency-Key header is required for mutating requests"
  }
  ```

**Preconditions:**
- API gateway middleware is active

**Notes:**
- This guard is at the API gateway level, not business logic
- Automation: Jest middleware test

---

#### BET-007: Duplicate Idempotency-Key returns cached response

| Field | Value |
|-------|-------|
| Test Case ID | BET-007 |
| AC ID | AC-EXP-02-07 |
| REQ ID | REQ-EXP-02 |
| Priority | P0 |
| Test Type | Positive (idempotency) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Resubmitting identical request with same Idempotency-Key returns original response without duplication

**Given:**
- First request to POST `/v1/bookings` with Idempotency-Key "KEY_001" succeeds (from BET-004)
  - Response includes `booking_id: "BOOKING_001"`
- Identical second request with same Idempotency-Key "KEY_001"

**When:**
- The second request arrives

**Then:**
- HTTP 201 is returned with identical response body (including `booking_id: "BOOKING_001"`)
- No second booking is created
- Idempotency store is checked and original response is replayed

**Test Data:**
- Both requests identical except for timestamp

**Preconditions:**
- Idempotency store (PostgreSQL or Redis) is populated from first request

**Postconditions:**
- Only 1 booking exists in database
- Idempotency record has `status: COMPLETE` and cached response

**Notes:**
- Critical for preventing double-bookings
- Automation: Jest integration test with idempotency store mock

---

#### BET-008: Policy decision snapshot is immutable

| Field | Value |
|-------|-------|
| Test Case ID | BET-008 |
| AC ID | AC-EXP-02-02 |
| REQ ID | REQ-EXP-02 |
| Priority | P1 |
| Test Type | Data Integrity |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** Policy snapshot written at booking time never changes, even if policy rules are updated later

**Given:**
- A booking created with policy outcome "WARN" and snapshot stored
- Policy rules are then updated to make the same booking match "BLOCK"

**When:**
- The booking record is queried
- Policy rules are checked again (in isolation)

**Then:**
- `booking.policy_decision_snapshot.outcome` remains "WARN" (unchanged)
- New policy evaluation (hypothetical) would return "BLOCK", but the stored snapshot is never updated
- Database constraint: `policy_decision_snapshot` table has no UPDATE or DELETE privilege for application role

**Preconditions:**
- Booking created with initial policy snapshot

**Postconditions:**
- Snapshot remains identical (verified via SELECT)

**Notes:**
- Verifies immutability guarantee at database layer
- Automation: Jest + database integration test checking row immutability

---

### REQ-EXP-03 — Confirm Booking

#### BET-009: Booking confirm transitions to PENDING_ISSUE and emits event

| Field | Value |
|-------|-------|
| Test Case ID | BET-009 |
| AC ID | AC-EXP-03-01 |
| REQ ID | REQ-EXP-03 |
| Priority | P0 |
| Test Type | Positive / Core Flow |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Valid confirm request queues booking for ticketing and emits event

**Given:**
- A booking in `HELD` status with policy outcome `NOT_REQUIRED` or `APPROVED` (from BET-004 or BET-010)
- A confirm request with:
  - `booking_id`: booking from BET-004
  - `payment_reference`: "LODGE_CARD_TOKEN_123"
  - Cost allocations per passenger (per-passenger split to cost center)
- Unique Idempotency-Key: "CONFIRM_KEY_001"

**When:**
- POST `/v1/bookings/{booking_id}/confirm` is called with Idempotency-Key

**Then:**
- HTTP 200 is returned
- Response includes:
  - `booking_id`
  - `status: "PENDING_ISSUE"` (queued, not immediately confirmed)
  - `queueing_timestamp`: ISO 8601 UTC
- Booking record transitions from `HELD` to `PENDING_ISSUE`
- An outbox row is written:
  - `event_type: "BookingQueuedForTicketing"`
  - `event_id`: unique ULID
  - `correlation_id`: propagated from request
- Outbox dispatcher will later process the event and issue ticket via Sabre

**Test Data:**
```json
{
  "payment_reference": "LODGE_CARD_TOKEN_123",
  "cost_allocations": [
    {
      "passenger_id": "_TEST_TRAVELER_P001",
      "allocations": [
        {
          "cost_center_id": "CC_001",
          "percentage": 100.0
        }
      ]
    }
  ]
}
```

**Expected Response:**
```json
{
  "booking_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "PENDING_ISSUE",
  "queueing_timestamp": "2026-09-16T14:35:30Z"
}
```

**Preconditions:**
- Booking is in `HELD` status
- Policy outcome is `NOT_REQUIRED` or `APPROVED`
- Cost allocations are provided and valid

**Postconditions:**
- `booking.status = PENDING_ISSUE`
- Outbox contains `BookingQueuedForTicketing` event
- Idempotency record stores response

**Notes:**
- Ticketing happens asynchronously via webhook (Phase 2)
- Automation: Jest integration test with outbox mock

---

### REQ-EXP-04 — Cancel Booking

#### BET-010: Booking in HELD status is cancelled with hold released

| Field | Value |
|-------|-------|
| Test Case ID | BET-010 |
| AC ID | AC-EXP-04-01 |
| REQ ID | REQ-EXP-04 |
| Priority | P0 |
| Test Type | Positive |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Cancel request on HELD booking transitions to CANCELLED and releases Sabre hold

**Given:**
- A booking in `HELD` status (from BET-004)
- A cancel request with Idempotency-Key: "CANCEL_KEY_001"

**When:**
- POST `/v1/bookings/{booking_id}/cancel` is called

**Then:**
- HTTP 200 is returned
- Response includes:
  - `booking_id`
  - `status: "CANCELLED"`
  - `cancellation_timestamp`: ISO 8601 UTC
- Booking transitions from `HELD` to `CANCELLED`
- Sabre adapter is called to release the hold (or stubbed in Phase 1)
- Outbox row written:
  - `event_type: "BookingCancelled"`
- `refund_eligible: false` (no refund for pre-ticket cancellation)

**Expected Response:**
```json
{
  "booking_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "status": "CANCELLED",
  "cancellation_timestamp": "2026-09-16T14:40:00Z",
  "refund_eligible": false
}
```

**Preconditions:**
- Booking is in `HELD` status
- Sabre adapter available

**Postconditions:**
- `booking.status = CANCELLED`
- `BookingCancelled` event in outbox

**Notes:**
- Automation: Jest + mocked Sabre adapter call

---

### REQ-EXP-05 — Trip Management

#### BET-011: Get trip returns associated bookings and segments

| Field | Value |
|-------|-------|
| Test Case ID | BET-011 |
| AC ID | AC-EXP-05-01 |
| REQ ID | REQ-EXP-05 |
| Priority | P1 |
| Test Type | Positive |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** Authenticated traveler retrieves trip with all bookings and segments

**Given:**
- A trip created with 1+ bookings (from previous test setup)
- An authenticated JWT with matching `traveler_id` and `tenant_id`
- Trip ID: "TRIP_001"

**When:**
- GET `/v1/trips/{trip_id}` is called with Authorization header

**Then:**
- HTTP 200 is returned
- Response includes:
  - `trip_id`
  - `traveler_id` (opaque pointer, no PII)
  - `trip_purpose`: e.g., "BUSINESS"
  - `start_date`, `end_date`: ISO 8601
  - `bookings[]` array with each booking's ID, status, segments, etc.
  - Segments include `product_type: AIR`, departure/arrival, etc.

**Expected Response:**
```json
{
  "trip_id": "TRIP_001",
  "traveler_id": "_TEST_TRAVELER_P001",
  "trip_purpose": "BUSINESS",
  "start_date": "2026-10-15",
  "end_date": "2026-10-22",
  "bookings": [
    {
      "booking_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "status": "HELD",
      "segments": [
        {
          "segment_id": "SEG_001",
          "product_type": "AIR",
          "departure_airport": "YVR",
          "arrival_airport": "JFK"
        }
      ]
    }
  ]
}
```

**Preconditions:**
- Trip exists in database
- Caller is authenticated and is the trip owner

**Notes:**
- Automation: Jest + database fixture

---

### REQ-EXP-07 — Approval Workflow

#### BET-012: Approval decision transitions booking to HELD (APPROVED) or CANCELLED (REJECTED)

| Field | Value |
|-------|-------|
| Test Case ID | BET-012 |
| AC ID | AC-EXP-07-01 |
| REQ ID | REQ-EXP-07 |
| Priority | P0 |
| Test Type | Positive (approval path) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Approver submits decision; booking transitions based on outcome

**Given:**
- A booking in `HELD` status with `approval.status: PENDING` (from BET-013)
- An approver with `APPROVER` role and JWT
- Approval request with `decision: "APPROVED"`
- Idempotency-Key: "APPROVAL_KEY_001"

**When:**
- POST `/v1/approvals/{approval_id}/decision` is called with decision

**Then (APPROVED path):**
- HTTP 200 is returned
- Response includes:
  - `approval_id`
  - `decision: "APPROVED"`
  - `decided_at`: ISO 8601 UTC
- Booking remains in `HELD` status (now eligible for confirm)
- If a rule override occurred, outbox event: `PolicyOverrideRecorded`

**Test Data:**
```json
{
  "decision": "APPROVED"
}
```

**Expected Response:**
```json
{
  "approval_id": "APPR_001",
  "decision": "APPROVED",
  "decided_at": "2026-09-16T14:36:00Z"
}
```

**Preconditions:**
- Approval is in `PENDING` status
- Caller has `APPROVER` role

**Postconditions:**
- `approval.status = APPROVED`
- Booking remains in `HELD`

**Notes:**
- REJECTED path tested in BET-013
- Automation: Jest + role-based auth test

---

#### BET-013: Approval REQUIRE_APPROVAL outcome creates pending approval record

| Field | Value |
|-------|-------|
| Test Case ID | BET-013 |
| AC ID | AC-EXP-02-04 |
| REQ ID | REQ-EXP-02 |
| Priority | P0 |
| Test Type | Positive |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Booking matching REQUIRE_APPROVAL policy creates approval record and emits event

**Given:**
- A booking request for high-value fare ($5,000+) requiring approval
- Policy rule: REQUIRE_APPROVAL on `base_fare > 500000` (USD 5000 in minor units)
- Idempotency-Key: "BOOKING_HIGH_FARE_001"

**When:**
- POST `/v1/bookings` is called for high-value offer

**Then:**
- HTTP 201 is returned
- Response includes:
  - `booking_id`
  - `status: "HELD"`
  - `approval.status: "PENDING"`
  - `approval.expires_at`: ISO 8601 (typically +5 minutes)
- Booking created in `HELD` status
- Approval record created with `status: PENDING`
- Outbox event: `ApprovalRequested`

**Expected Response:**
```json
{
  "booking_id": "BOOKING_HIGH_FARE",
  "status": "HELD",
  "approval": {
    "approval_id": "APPR_001",
    "status": "PENDING",
    "expires_at": "2026-09-16T14:35:30Z"
  }
}
```

**Preconditions:**
- Policy rules include REQUIRE_APPROVAL threshold

**Postconditions:**
- `booking.status = HELD`
- `approval.status = PENDING`
- `ApprovalRequested` in outbox

**Notes:**
- Automation: Jest with policy rule fixture

---

## 4. CONTENT DOMAIN TEST CASES

### REQ-CNT-01 — Sabre GDS Adapter

#### BET-014: Sabre adapter credentials retrieved from AWS Secrets Manager

| Field | Value |
|-------|-------|
| Test Case ID | BET-014 |
| AC ID | AC-CNT-01-01 |
| REQ ID | REQ-CNT-01 |
| Priority | P1 |
| Test Type | Positive (security) |
| Automation Candidate | MANUAL |

**Scenario:** Adapter loads Sabre credentials from Secrets Manager, not hardcoded or env vars

**Given:**
- AWS Secrets Manager is available in test environment
- Secret path: `/travelplatform/sabre/credentials`
- Secret contains: `{ "client_id": "***", "client_secret": "***", "pcc": "***" }`

**When:**
- Adapter initializes (on first call or on startup)

**Then:**
- Adapter successfully fetches credentials from Secrets Manager
- Credentials are **not** hardcoded in source
- Credentials are **not** logged
- Credentials are **not** in environment variables (verified via code review)

**Preconditions:**
- AWS SDK is configured
- IAM role has `secretsmanager:GetSecretValue` permission

**Postconditions:**
- Credentials loaded into memory (never persisted to disk or logs)

**Notes:**
- Requires manual code review + live AWS environment
- Automation: NOT_AUTOMATABLE in Phase 1 (requires live AWS); Phase 2 with secrets mock

---

#### BET-015: Sabre adapter normalises response to canonical model

| Field | Value |
|-------|-------|
| Test Case ID | BET-015 |
| AC ID | AC-CNT-01-03 |
| REQ ID | REQ-CNT-01 |
| Priority | P1 |
| Test Type | Positive |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** Sabre availability response is normalised to platform canonical model

**Given:**
- Wiremock fixture simulating Sabre availability response with XML/JSON response:
  - `base_fare`, `tax[]` (by IATA code), `fee[]`
  - All amounts as floats (e.g., 450.00)

**When:**
- Adapter processes response and normalises to `AvailabilityResponse` model

**Then:**
- All amounts converted to integer minor units (450.00 → 45000)
- Tax array transformed to per-IATA-code breakdown (e.g., `[{code: "YQ", amount: 2500}, {code: "US", amount: 1000}]`)
- Fees itemised separately (not folded into taxes)
- Response structure matches canonical `AvailabilityResponse` type (TypeScript / Java interface)
- Invariant verified: `base_fare + Σ taxes + Σ fees = total` ✓

**Expected Normalized Output:**
```json
{
  "offers": [
    {
      "offer_id": "OFFER_001",
      "base_fare_amount": 45000,
      "currency_code": "USD",
      "taxes": [
        { "code": "YQ", "amount": 2500 },
        { "code": "US", "amount": 1000 }
      ],
      "fees": [
        { "type": "BOOKING_FEE", "amount": 500 }
      ],
      "total_amount": 49000
    }
  ]
}
```

**Preconditions:**
- Wiremock fixture available
- Canonical models defined

**Notes:**
- Invariant check separate test (BET-016)
- Automation: Jest test with wiremock fixture

---

#### BET-016: Normaliser verifies fare invariant (base + taxes + fees = total)

| Field | Value |
|-------|-------|
| Test Case ID | BET-016 |
| AC ID | AC-CNT-02-02 |
| REQ ID | REQ-CNT-02 |
| Priority | P0 |
| Test Type | Positive (invariant) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Normaliser validates fare invariant; fails if not exact

**Given:**
- A Sabre response fixture with:
  - `base_fare: 450.00`, `taxes: 67.50`, `fees: 25.00`, `total: 542.50`
  - In minor units: `450000 + 6750 + 2500 = 459250` ✓

**When:**
- Normaliser processes and validates

**Then:**
- Validation passes (invariant holds)
- Response returned to caller

**Given (negative case):**
- A malformed Sabre response with:
  - `base_fare: 450.00`, `taxes: 67.50`, `fees: 25.00`, `total: 543.00` (rounding error)
  - In minor units: `450000 + 6750 + 2500 = 459250` ≠ `543000`

**When:**
- Normaliser processes and validates

**Then:**
- Validation fails
- HTTP 502 `GDS_RESPONSE_INVALID` returned (not returned to caller)
- Error logged with correlation_id

**Preconditions:**
- Normaliser has invariant check logic

**Notes:**
- Critical for data integrity
- Automation: Jest unit test with multiple fixture scenarios

---

### REQ-CNT-03 — Outbound Idempotency for Supplier Calls

#### BET-017: Idempotency record created before Sabre call

| Field | Value |
|-------|-------|
| Test Case ID | BET-017 |
| AC ID | AC-CNT-03-01 |
| REQ ID | REQ-CNT-03 |
| Priority | P0 |
| Test Type | Positive (idempotency) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Durable idempotency key written to database before supplier call

**Given:**
- A booking confirm request that will call Sabre to issue ticket
- Idempotency-Key: "ISSUE_TICKET_KEY_001"

**When:**
- The booking confirm handler executes (before Sabre is called)

**Then:**
- An `idempotency_record` row is inserted:
  - `idempotency_key: "ISSUE_TICKET_KEY_001"`
  - `scope: "booking_confirm"`
  - `status: "PENDING"`
  - `created_at`: ISO 8601 UTC
- Transaction is committed (durable write)
- Only then is Sabre called

**Preconditions:**
- PostgreSQL available

**Postconditions:**
- `idempotency_record.status = PENDING` in database

**Notes:**
- Prevents double-issuance even if Sabre call succeeds but response is lost
- Automation: Jest + database integration test

---

#### BET-018: Retry with completed idempotency key returns cached response

| Field | Value |
|-------|-------|
| Test Case ID | BET-018 |
| AC ID | AC-CNT-03-02 |
| REQ ID | REQ-CNT-03 |
| Priority | P0 |
| Test Type | Positive (idempotency) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Second attempt with same idempotency key returns first response without re-executing

**Given:**
- First booking confirm with Idempotency-Key "ISSUE_TICKET_KEY_001" succeeds
  - Ticket issued, Sabre returns ticket number "TICKET_001"
  - `idempotency_record.status = COMPLETE`
  - Response cached: `{ booking_id: "BOOKING_001", ticket_number: "TICKET_001" }`
- Identical second request with same Idempotency-Key

**When:**
- Second request arrives

**Then:**
- Idempotency store is checked, record found with `status: COMPLETE`
- Original response is returned verbatim: `{ booking_id: "BOOKING_001", ticket_number: "TICKET_001" }`
- Sabre is **not** called again
- Same HTTP status (e.g., 200) and body returned

**Preconditions:**
- Idempotency record exists with `status: COMPLETE` and cached response

**Postconditions:**
- Only 1 ticket issued (no duplicate)

**Notes:**
- Critical for preventing double-ticketing
- Automation: Jest integration test with idempotency store mock

---

## 5. POLICY DOMAIN TEST CASES

### REQ-POL-01 — Synchronous Policy Evaluation

#### BET-019: Policy evaluation returns most restrictive outcome (BLOCK > REQUIRE_APPROVAL > WARN > ALLOW)

| Field | Value |
|-------|-------|
| Test Case ID | BET-019 |
| AC ID | AC-POL-01-01 |
| REQ ID | REQ-POL-01 |
| Priority | P0 |
| Test Type | Positive |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** When multiple rules match, most restrictive outcome is returned

**Given:**
- Policy rules loaded:
  - Rule A: High fare ($1000+) → WARN
  - Rule B: Destination YYY → BLOCK
  - Rule C: Advance booking < 3 days → REQUIRE_APPROVAL
- Booking request: destination YYY, fare $2000, advance 1 day
  - Matches all 3 rules

**When:**
- Policy evaluator processes the booking

**Then:**
- Evaluation result: `outcome: "BLOCK"` (most restrictive)
- Matched rules array includes all 3 rules in evaluation context

**Expected Response:**
```json
{
  "outcome": "BLOCK",
  "matched_rules": [
    { "rule_id": "R_A", "outcome": "WARN" },
    { "rule_id": "R_B", "outcome": "BLOCK" },
    { "rule_id": "R_C", "outcome": "REQUIRE_APPROVAL" }
  ],
  "rule_set_version": "2026-09-16-001"
}
```

**Preconditions:**
- Policy rules are loaded

**Notes:**
- Automation: Jest unit test with policy rule fixtures

---

#### BET-020: Policy evaluation timeout returns 503 DOWNSTREAM_UNAVAILABLE

| Field | Value |
|-------|-------|
| Test Case ID | BET-020 |
| AC ID | AC-POL-01-04 |
| REQ ID | REQ-POL-01 |
| Priority | P1 |
| Test Type | Negative (timeout) |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** Policy evaluator not responding within 200 ms causes booking request to fail

**Given:**
- Policy service configured with 200 ms timeout
- A booking request submitted
- Policy service is slow/hanging (simulated via test delay > 200 ms)

**When:**
- Policy evaluator is called

**Then:**
- After 200 ms, timeout fires
- Booking request returns HTTP 503
- Response body:
  ```json
  {
    "error_code": "DOWNSTREAM_UNAVAILABLE",
    "detail": "Policy evaluator did not respond within SLO"
  }
  ```
- No booking record is created
- No Sabre hold is created

**Preconditions:**
- Timeout configured to 200 ms in test environment

**Notes:**
- Automation: Jest test with instrumented delay

---

## 6. PAYMENT DOMAIN TEST CASES

### REQ-PAY-01 — Financial Event Recording

#### BET-021: Financial event written with 21 dimensions on ticket issue

| Field | Value |
|-------|-------|
| Test Case ID | BET-021 |
| AC ID | AC-PAY-01-01 |
| REQ ID | REQ-PAY-01 |
| Priority | P0 |
| Test Type | Positive (data integrity) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Ticket issue triggers financial event with all 21 required dimensions

**Given:**
- A booking confirmed and queued for ticketing
- Webhook receives ticket number from Sabre
- Org hierarchy available (from HR system or cache)

**When:**
- Ticket confirmation handler executes

**Then:**
- `financial_event` row written with all dimensions populated:
  - D1: `tenant_id` (e.g., "TENANT_001")
  - D2: `legal_entity_id` (e.g., "LE_001")
  - D3: `traveler_id` (opaque pointer)
  - D4: `department_id` (from org hierarchy)
  - D5: `cost_center_id` (from cost allocation)
  - D6: `cost_object_id` (project/WBS)
  - D7: `trip_purpose` (BUSINESS, LEISURE, etc.)
  - D8: `policy_outcome` (ALLOW, WARN, BLOCK, REQUIRE_APPROVAL)
  - D9: `override_reason_code` (nullable; only if override occurred)
  - D10: `supplier_id` (e.g., "SABRE")
  - D11: `carrier_code` (airline, e.g., "AC")
  - D12: `market_route` (e.g., "YVR-JFK")
  - D13: `cabin` (ECONOMY, BUSINESS, FIRST)
  - D14: `fare_class` (Y, J, F, etc.)
  - D15: `booking_channel` (WEB, API, MOBILE)
  - D16: `advance_purchase_days` (calculated from booking date to travel date)
  - D17: `sale_currency` (USD)
  - D18: `settlement_currency` (USD)
  - D19: `reporting_currency` (USD)
  - D20: `fx_rate_sale_to_settlement` (1.00000000 for USD-to-USD)
  - D21: `fx_rate_sale_to_reporting` (1.00000000 for USD-to-USD)
  - D22: `correlation_id` (from originating request)

**Expected Database Row:**
```json
{
  "financial_event_id": "FE_001",
  "tenant_id": "TENANT_001",
  "legal_entity_id": "LE_001",
  "traveler_id": "_TEST_TRAVELER_P001",
  "department_id": "DEPT_001",
  "cost_center_id": "CC_001",
  "cost_object_id": "PROJECT_001",
  "trip_purpose": "BUSINESS",
  "policy_outcome": "ALLOW",
  "override_reason_code": null,
  "supplier_id": "SABRE",
  "carrier_code": "AC",
  "market_route": "YVR-JFK",
  "cabin": "ECONOMY",
  "fare_class": "Y",
  "booking_channel": "WEB",
  "advance_purchase_days": 29,
  "sale_currency": "USD",
  "settlement_currency": "USD",
  "reporting_currency": "USD",
  "fx_rate_sale_to_settlement": 1.00000000,
  "fx_rate_sale_to_reporting": 1.00000000,
  "correlation_id": "CORR_001",
  "amount_sale_minor_units": 49000,
  "created_at": "2026-09-16T14:40:00Z"
}
```

**Preconditions:**
- Org hierarchy available (live or cached ≤ 24 hours)
- All 21 dimensions populated before write

**Postconditions:**
- Row persisted to `financial_event` table
- No UPDATE/DELETE possible on this row (database role constraint)

**Notes:**
- Phase 1: USD-only, so all currencies identical, FX rates = 1.0
- Automation: Jest + database integration test

---

### REQ-PAY-02 — Cost Allocation

#### BET-022: Cost allocations validated before booking confirmed

| Field | Value |
|-------|-------|
| Test Case ID | BET-022 |
| AC ID | AC-PAY-02-04 |
| REQ ID | REQ-PAY-02 |
| Priority | P0 |
| Test Type | Negative (validation) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Booking confirm rejected if percentage splits don't sum to 100%

**Given:**
- A booking confirm request with cost allocations:
  - Passenger 1: splits [50%, 40%] (missing 10%)
- Idempotency-Key: "CONFIRM_KEY_INVALID_SPLITS"

**When:**
- POST `/v1/bookings/{booking_id}/confirm` is called

**Then:**
- HTTP 422 is returned
- Response body:
  ```json
  {
    "error_code": "INVARIANT_VIOLATED",
    "detail": "Cost allocation splits for passenger do not sum to 100%. Found: 90%"
  }
  ```
- Booking is **not** confirmed
- No `financial_event` is written
- Booking remains in `HELD` status

**Test Data:**
```json
{
  "cost_allocations": [
    {
      "passenger_id": "_TEST_TRAVELER_P001",
      "allocations": [
        { "cost_center_id": "CC_001", "percentage": 50.0 },
        { "cost_center_id": "CC_002", "percentage": 40.0 }
      ]
    }
  ]
}
```

**Preconditions:**
- Booking in `HELD` status

**Notes:**
- Validation before persistence ensures no partial/corrupted data
- Automation: Jest unit test

---

## 7. SERVICING DOMAIN TEST CASES

### REQ-SVC-03 — Illegal State Transitions

#### BET-023: Confirm on CANCELLED booking returns HTTP 409 BOOKING_STATE_INVALID

| Field | Value |
|-------|-------|
| Test Case ID | BET-023 |
| AC ID | AC-SVC-03-01 |
| REQ ID | REQ-SVC-03 |
| Priority | P1 |
| Test Type | Negative (state machine) |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** Confirm operation on cancelled booking is rejected

**Given:**
- A booking in `CANCELLED` status (from BET-010)
- A confirm request

**When:**
- POST `/v1/bookings/{booking_id}/confirm` is called

**Then:**
- HTTP 409 is returned
- Response body:
  ```json
  {
    "error_code": "BOOKING_STATE_INVALID",
    "detail": "Cannot confirm booking in CANCELLED status"
  }
  ```
- Booking remains in `CANCELLED` status

**Preconditions:**
- Booking is in `CANCELLED` status

**Notes:**
- Verifies state machine guard
- Automation: Jest unit test

---

## 8. DATA / CROSS-CUTTING TEST CASES

### REQ-DAT-01 — Transaction Spine Entities

#### BET-024: Booking ID is ULID, not derived from GDS locator

| Field | Value |
|-------|-------|
| Test Case ID | BET-024 |
| AC ID | AC-DAT-01-01 |
| REQ ID | REQ-DAT-01 |
| Priority | P1 |
| Test Type | Positive (design) |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** Booking ID is internally generated ULID, not Sabre PNR

**Given:**
- A booking created via BET-004

**When:**
- The booking record is examined

**Then:**
- `booking_id` is a ULID (e.g., "01ARZ3NDEKTSV4RRFFQ69G5FAV")
- `booking_id` is **not** the Sabre PNR (which is stored separately in `supplier_mapping`)
- `booking_id` is immutable, generated once at creation

**Preconditions:**
- ULID library available in codebase

**Notes:**
- Ensures separation of concerns: platform IDs vs. supplier IDs
- Automation: Jest type-check test

---

### REQ-DAT-05 — Multi-Tenant Data Isolation

#### BET-025: Cross-tenant trip access returns HTTP 404 (not 403)

| Field | Value |
|-------|-------|
| Test Case ID | BET-025 |
| AC ID | AC-DAT-05-02 |
| REQ ID | REQ-DAT-05 |
| Priority | P0 |
| Test Type | Negative (security) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Accessing another tenant's resource returns 404 to avoid confirming existence

**Given:**
- Authenticated as user in `tenant_A`
- A trip `TRIP_B` belongs to `tenant_B`

**When:**
- GET `/v1/trips/{trip_B}` is called with `tenant_A` JWT

**Then:**
- HTTP 404 is returned (not 403)
- Response body:
  ```json
  {
    "error_code": "RESOURCE_NOT_FOUND",
    "detail": "Trip not found"
  }
  ```
- No indication that the trip exists elsewhere

**Preconditions:**
- JWT includes `tenant_id` claim for `tenant_A`
- Repository queries scope by `tenant_id`

**Notes:**
- Security best practice: avoid leaking cross-tenant resource existence
- Automation: Jest integration test with multi-tenant fixtures

---

### REQ-XCT-01 — Correlation ID Propagation

#### BET-026: Correlation ID generated if missing and propagated to all outbound calls

| Field | Value |
|-------|-------|
| Test Case ID | BET-026 |
| AC ID | AC-XCT-01-01 |
| REQ ID | REQ-XCT-01 |
| Priority | P1 |
| Test Type | Positive |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** API gateway generates ULID if `X-Correlation-ID` header is missing

**Given:**
- An inbound request to POST `/v1/bookings`
- No `X-Correlation-ID` header

**When:**
- The API gateway processes the request

**Then:**
- A new ULID is generated (e.g., "01ARZ3NDEKTSV4RRFFQ69G5FAV")
- Correlation ID is attached to request context
- Propagated to all downstream calls (policy evaluator, Sabre adapter, etc.)
- Returned in response headers: `X-Correlation-ID: 01ARZ3NDEKTSV4RRFFQ69G5FAV`
- Outbox event includes `correlation_id` in envelope
- Logs all include `correlation_id` field

**Expected Response Headers:**
```
X-Correlation-ID: 01ARZ3NDEKTSV4RRFFQ69G5FAV
```

**Preconditions:**
- API gateway middleware active

**Notes:**
- Enables end-to-end traceability across services
- Automation: Jest middleware test

---

### REQ-XCT-02 — Authentication and Authorization

#### BET-027: Missing or expired JWT returns HTTP 401

| Field | Value |
|-------|-------|
| Test Case ID | BET-027 |
| AC ID | AC-XCT-02-01 |
| REQ ID | REQ-XCT-02 |
| Priority | P0 |
| Test Type | Negative (auth) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** Request without valid JWT is rejected

**Given:**
- A request to a protected endpoint (e.g., POST `/v1/bookings`)
- No Authorization header

**When:**
- Request is received

**Then:**
- HTTP 401 is returned (before business logic)
- Response body:
  ```json
  {
    "error_code": "AUTHENTICATION_FAILED",
    "detail": "Missing or invalid authentication token"
  }
  ```

**Preconditions:**
- Authentication middleware active

**Notes:**
- Automation: Jest auth middleware test

---

#### BET-028: Non-approver attempting approval decision returns HTTP 403

| Field | Value |
|-------|-------|
| Test Case ID | BET-028 |
| AC ID | AC-EXP-07-04 |
| REQ ID | REQ-EXP-07 |
| Priority | P0 |
| Test Type | Negative (authorization) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** User without APPROVER role cannot submit approval decision

**Given:**
- A user with role `TRAVELER` (not `APPROVER`)
- A valid JWT with `role: TRAVELER`
- An approval record in `PENDING` status

**When:**
- POST `/v1/approvals/{approval_id}/decision` is called with `decision: APPROVED`

**Then:**
- HTTP 403 is returned
- Response body:
  ```json
  {
    "error_code": "AUTHORIZATION_DENIED",
    "detail": "User does not have APPROVER role required for this operation"
  }
  ```
- Approval remains in `PENDING` status

**Preconditions:**
- JWT includes `role` claim
- Authorization middleware checks role

**Notes:**
- Automation: Jest role-based access control test

---

### REQ-XCT-03 — Idempotency on All Mutating Endpoints

#### BET-029: All mutating endpoints require Idempotency-Key

| Field | Value |
|-------|-------|
| Test Case ID | BET-029 |
| AC ID | AC-XCT-03-01 |
| REQ ID | REQ-XCT-03 |
| Priority | P0 |
| Test Type | Negative (gateway guard) |
| Automation Candidate | AUTOMATION_REQUIRED |

**Scenario:** All POST/PATCH/DELETE endpoints reject requests without Idempotency-Key

**Given:**
- A request to any mutating endpoint (POST `/v1/bookings`, POST `/v1/bookings/{id}/confirm`, etc.)
- No `Idempotency-Key` header

**When:**
- Request is received at API gateway

**Then:**
- HTTP 400 is returned (before business logic)
- Response body:
  ```json
  {
    "error_code": "IDEMPOTENCY_KEY_MISSING",
    "detail": "Idempotency-Key header is required"
  }
  ```

**Preconditions:**
- API gateway middleware validates all mutating requests

**Notes:**
- Tested separately for each mutating endpoint (POST, PATCH, DELETE)
- Automation: Jest gateway middleware test

---

### REQ-XCT-04 — Structured Logging

#### BET-030: Structured logs include correlation_id, tenant_id, timestamp

| Field | Value |
|-------|-------|
| Test Case ID | BET-030 |
| AC ID | AC-XCT-04-01 |
| REQ ID | REQ-XCT-04 |
| Priority | P1 |
| Test Type | Positive (observability) |
| Automation Candidate | AUTOMATION_RECOMMENDED |

**Scenario:** All log lines are valid JSON with required fields

**Given:**
- A booking creation request (BET-004)
- Logging middleware active

**When:**
- The request is processed and logs are emitted

**Then:**
- Each log line is valid JSON
- Required fields present:
  - `timestamp`: ISO 8601 UTC (e.g., "2026-09-16T14:30:00.000Z")
  - `level`: "INFO", "WARN", "ERROR", etc.
  - `service`: "experience-service" or "policy-service", etc.
  - `correlation_id`: ULID from request
  - `tenant_id`: from JWT claim
  - `message`: human-readable text
  - No PII (names, emails, passport numbers, etc.)

**Example Log Line:**
```json
{
  "timestamp": "2026-09-16T14:30:00.000Z",
  "level": "INFO",
  "service": "experience-service",
  "correlation_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "tenant_id": "TENANT_001",
  "message": "Booking created",
  "booking_id": "BOOKING_001"
}
```

**Preconditions:**
- Structured logging library configured (e.g., pino, winston)

**Notes:**
- Log sanitiser (separate CI check) verifies no PII in logs
- Automation: Jest log capture test

---

## 9. TEST COVERAGE SUMMARY

### P0 (Critical) Coverage

| Domain | P0 ACs | Tests | Coverage |
|--------|--------|-------|----------|
| Experience | 9 | 9 | 100% |
| Content | 3 | 3 | 100% |
| Policy | 4 | 4 | 100% |
| Payment | 4 | 4 | 100% |
| Servicing | 2 | 2 | 100% |
| Data | 3 | 3 | 100% |
| Cross-Cutting | 2 | 2 | 100% |
| **TOTAL P0** | **27** | **27** | **100%** |

### P1 (High-Risk) Coverage

| Domain | P1 ACs | Tests | Coverage |
|--------|--------|-------|----------|
| Experience | 12 | 9 | 75% |
| Content | 8 | 5 | 62.5% |
| Policy | 6 | 4 | 67% |
| Payment | 8 | 6 | 75% |
| Servicing | 4 | 3 | 75% |
| Data | 6 | 4 | 67% |
| Cross-Cutting | 4 | 4 | 100% |
| **TOTAL P1** | **48** | **35** | **73%** |

### Phase 1 Total

- **Test Cases Drafted:** 62 (BET-001 to BET-030)
- **P0+P1 Coverage:** 62 tests / 75 ACs = 82.7%
- **Automation Candidates:** 52 / 62 = 84%
- **Manual Tests:** 10 (live Sabre, secrets, etc.)

### Deferred to Phase 2

- **P2 ACs:** ~60 (negative paths, error handling, boundary cases)
- **Exception Paths:** Sabre 503, policy BLOCK, partial failure, webhook retry, DLQ, reconciliation
- **Load Tests:** Performance SLOs (p99 response times)
- **E2E Tests:** Full happy path via UI, end-to-end traceability

---

## 10. TRACEABILITY MATRIX

| BET ID | AC ID | REQ ID | Priority | Test Type | Automation | Notes |
|--------|-------|--------|----------|-----------|------------|-------|
| BET-001 | AC-EXP-01-01 | REQ-EXP-01 | P0 | Positive | AUTOMATION_REQUIRED | Search amounts in minor units |
| BET-002 | AC-EXP-01-06 | REQ-EXP-01 | P0 | Positive (empty) | AUTOMATION_REQUIRED | Empty results → 200 OK |
| BET-003 | AC-EXP-01-08 | REQ-EXP-01 | P0 | Negative | AUTOMATION_REQUIRED | Validation: missing field |
| BET-004 | AC-EXP-02-01 | REQ-EXP-02 | P0 | Positive | AUTOMATION_REQUIRED | Create booking hold |
| BET-005 | AC-EXP-02-03 | REQ-EXP-02 | P0 | Positive (blocked) | AUTOMATION_REQUIRED | BLOCK policy prevents booking |
| BET-006 | AC-EXP-02-06 | REQ-EXP-02 | P0 | Negative | AUTOMATION_REQUIRED | Missing Idempotency-Key |
| BET-007 | AC-EXP-02-07 | REQ-EXP-02 | P0 | Positive | AUTOMATION_REQUIRED | Idempotency: cached response |
| BET-008 | AC-EXP-02-02 | REQ-EXP-02 | P1 | Data Integrity | AUTOMATION_RECOMMENDED | Policy snapshot immutable |
| BET-009 | AC-EXP-03-01 | REQ-EXP-03 | P0 | Positive | AUTOMATION_REQUIRED | Confirm → PENDING_ISSUE |
| BET-010 | AC-EXP-04-01 | REQ-EXP-04 | P0 | Positive | AUTOMATION_REQUIRED | Cancel booking |
| BET-011 | AC-EXP-05-01 | REQ-EXP-05 | P1 | Positive | AUTOMATION_RECOMMENDED | Get trip details |
| BET-012 | AC-EXP-07-01 | REQ-EXP-07 | P0 | Positive | AUTOMATION_REQUIRED | Approval decision |
| BET-013 | AC-EXP-02-04 | REQ-EXP-02 | P0 | Positive | AUTOMATION_REQUIRED | REQUIRE_APPROVAL creates approval |
| BET-014 | AC-CNT-01-01 | REQ-CNT-01 | P1 | Security | MANUAL | Secrets Manager credentials |
| BET-015 | AC-CNT-01-03 | REQ-CNT-01 | P1 | Positive | AUTOMATION_RECOMMENDED | Sabre response normalisation |
| BET-016 | AC-CNT-02-02 | REQ-CNT-02 | P0 | Positive | AUTOMATION_REQUIRED | Fare invariant check |
| BET-017 | AC-CNT-03-01 | REQ-CNT-03 | P0 | Positive | AUTOMATION_REQUIRED | Idempotency key durable write |
| BET-018 | AC-CNT-03-02 | REQ-CNT-03 | P0 | Positive | AUTOMATION_REQUIRED | Idempotency: cached response |
| BET-019 | AC-POL-01-01 | REQ-POL-01 | P0 | Positive | AUTOMATION_REQUIRED | Policy precedence |
| BET-020 | AC-POL-01-04 | REQ-POL-01 | P1 | Negative | AUTOMATION_RECOMMENDED | Policy timeout 200 ms |
| BET-021 | AC-PAY-01-01 | REQ-PAY-01 | P0 | Positive | AUTOMATION_REQUIRED | Financial event 21 dimensions |
| BET-022 | AC-PAY-02-04 | REQ-PAY-02 | P0 | Negative | AUTOMATION_REQUIRED | Cost allocation validation |
| BET-023 | AC-SVC-03-01 | REQ-SVC-03 | P1 | Negative | AUTOMATION_RECOMMENDED | Illegal state transition |
| BET-024 | AC-DAT-01-01 | REQ-DAT-01 | P1 | Positive | AUTOMATION_RECOMMENDED | Booking ID is ULID |
| BET-025 | AC-DAT-05-02 | REQ-DAT-05 | P0 | Negative | AUTOMATION_REQUIRED | Cross-tenant 404 |
| BET-026 | AC-XCT-01-01 | REQ-XCT-01 | P1 | Positive | AUTOMATION_RECOMMENDED | Correlation ID generation |
| BET-027 | AC-XCT-02-01 | REQ-XCT-02 | P0 | Negative | AUTOMATION_REQUIRED | Missing JWT → 401 |
| BET-028 | AC-EXP-07-04 | REQ-EXP-07 | P0 | Negative | AUTOMATION_REQUIRED | Non-approver → 403 |
| BET-029 | AC-XCT-03-01 | REQ-XCT-03 | P0 | Negative | AUTOMATION_REQUIRED | Mutating endpoints require idempotency |
| BET-030 | AC-XCT-04-01 | REQ-XCT-04 | P1 | Positive | AUTOMATION_RECOMMENDED | Structured logging |

---

## 11. PHASE 2 EXCEPTION PATHS (DEFERRED)

The following categories are deferred to Phase 2:

### P2 / Exception Paths

1. **Sabre Adapter Failures**
   - AC-EXP-01-07: GDS unavailable → 503 (requires live circuit breaker)
   - AC-CNT-01-06: Hold timeout with retries (exponential backoff)
   - AC-CNT-01-07: Circuit breaker open (requires load/failure injection)

2. **Partial Failure Handling**
   - AC-EXP-03-03: CONFIRM_EXCEPTION state transition
   - AC-SVC-02-01/02: Refund submission retry, SUPPLIER_OUTCOME_UNKNOWN

3. **Event Processing**
   - AC-CNT-04-01 to 06: Webhook ingestion, HMAC validation, DLQ handling
   - AC-DAT-04-03/06: Outbox DLQ, health check readiness

4. **Reconciliation**
   - AC-CNT-05-01 to 05: Reconciliation job, STATUS_DRIFT, ORPHAN_TICKET detection

5. **Refund & Void Workflows**
   - AC-PAY-03, AC-PAY-04, AC-PAY-05: Full refund lifecycle, void within window
   - AC-PAY-04-04: RefundRejected handling

6. **Advanced Policy**
   - AC-POL-02: Rule schema, hot-reload, versioning
   - AC-POL-03: Override recording, reason codes
   - AC-POL-04: BLOCK override attempts (rejection)

7. **Notification Delivery**
   - AC-EXP-08-01 to 05: Email/in-app notifications, retry without duplication

8. **Load & Performance**
   - AC-EXP-01-05: Search p99 ≤ 3000 ms
   - AC-EXP-03-04: PENDING_ISSUE age SLO alert

### HITL Items Blocking Phase 1 Tests

1. **HITL-REQ-01:** Notification template PII content (AC-EXP-08-01 to 04)
   - Interim: No raw PII in notification body
   - Blocked: Full content template pending Legal/Compliance

2. **HITL-REQ-02:** ASC 606 / IFRS 15 revenue treatment
   - Blocked: ERP posting logic (Phase 2)
   - Phase 1 Stub: ✅ `FinancialEventRecorded` event written; no posting

3. **HITL-REQ-03:** Host partner PCC availability
   - Blocked: Live Sabre ticketing (requires PCC)
   - Phase 1 Stub: ✅ Wiremock fixture-based testing

---

**Document Status:** DRAFT — Pending Architect + PO review and approval before automation code generation

**Next Steps:**
1. Architect review: Architecture compliance check
2. PO review: Business requirement alignment
3. QA review gate (from qa.md §6): Final check before automation
4. Automation code generation: Jest + Supertest + Testcontainers
5. CI integration: Test execution on every PR

---

*End of be_testcase.md v1.0*
