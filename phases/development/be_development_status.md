# TravelPlatform — Back-End Development Status

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Source of Truth:** `phases/04-user-stories-and-acceptance-criteria/be_acceptance_criteria.md` v1.0  
**Codebase Analysed:** `apps/web-frontend/` (entire tree)  
**Analyst:** AI — verified against source files, no assumptions

---

## IMPORTANT CONTEXT: WHAT EXISTS IN THE REPOSITORY

The repository contains **one backend artefact**:

| Artefact | Path | Technology | Purpose |
|----------|------|-----------|---------|
| Mock API server | `apps/web-frontend/backend/server.mjs` | Node.js (single file, flat JSON store) | Local development stub for the frontend |
| TypeScript API types | `apps/web-frontend/src/api/types/` | TypeScript | FE-side type contracts |
| TypeScript HTTP client | `apps/web-frontend/src/api/services/httpClient.ts` | TypeScript | FE HTTP layer |
| TypeScript booking service | `apps/web-frontend/src/api/services/bookingService.ts` | TypeScript | FE service / mock toggle |
| Mock fixtures | `apps/web-frontend/src/api/mocks/fixtures.ts` | TypeScript | In-memory mock data for FE tests |

**There is no production backend.** No Java services, no TypeScript Fastify services, no PostgreSQL schema, no Kafka/outbox, no Redis, no infrastructure code, and no Terraform exist anywhere in the repository. The `apps/web-frontend/backend/server.mjs` is a development convenience stub — not a production system.

All status assessments below are made against this reality.

---

## STATUS LEGEND

| Symbol | Status | Meaning |
|--------|--------|---------|
| ✅ | IMPLEMENTED (STUB) | The mock server covers this scenario at a surface level — correct HTTP verb, route, approximate response shape. Does **not** satisfy the AC's production requirements (no real GDS, no DB, no invariants). |
| ⚠️ | PARTIAL | The mock server touches this behaviour but is missing a critical part of the AC (e.g. wrong error code, missing field, logic not implemented). |
| ❌ | NOT IMPLEMENTED | No code in the repository addresses this AC. The capability does not exist at any level. |
| 🚫 | BLOCKED | Cannot be implemented until a prerequisite exists (e.g. Sabre PCC, host partner, real DB). |

---

## OVERALL SUMMARY

| Domain | Total ACs | Implemented (Stub) | Partial | Not Implemented | Blocked |
|--------|-----------|--------------------|---------|-----------------|---------|
| Experience (EXP) | 38 | 14 | 8 | 16 | 0 |
| Content / GDS (CNT) | 29 | 0 | 0 | 24 | 5 |
| Policy (POL) | 16 | 5 | 3 | 8 | 0 |
| Payment & Expense (PAY) | 27 | 0 | 2 | 25 | 0 |
| Servicing (SVC) | 10 | 1 | 2 | 7 | 0 |
| Data / Spine (DAT) | 21 | 0 | 0 | 21 | 0 |
| Cross-Cutting (XCT) | 18 | 0 | 3 | 15 | 0 |
| **TOTAL** | **159** | **20** | **18** | **116** | **5** |

> **Note:** The count is 159 rather than 138 because some traceability matrix entries cover ranges (e.g. AC-CNT-01-01 to 08 = 8 ACs); the matrix was enumerated individually for this analysis.

**Production-ready implementation: 0 / 159 (0%)**  
**Stub-level coverage (mock server only): 20 / 159 (12.6%)**  
**Not started (no code at any level): 121 / 159 (76.1%)**

---

## 1. EXPERIENCE DOMAIN

### REQ-EXP-01 — Travel Search

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-01-01 | ✅ STUB | `server.mjs` `/flights/search` POST returns offers with `price.amount` (integer) and `currency`. `fixtures.ts` has identical shape. | Amounts are **not** integer minor units (USD 450 not 45000). No IATA tax code breakdown. No Sabre call. |
| AC-EXP-01-05 | ❌ NOT IMPLEMENTED | No SLO measurement, no p99 metric instrumentation anywhere in the codebase. | Requires real Sabre adapter + observability stack. |
| AC-EXP-01-06 | ✅ STUB | `server.mjs` returns `{results:[]}` when no flights match the filter. | Mock data only; not a real Sabre empty-results path. |
| AC-EXP-01-07 | ❌ NOT IMPLEMENTED | No circuit breaker, no `GDS_UNAVAILABLE` error code, no 503 response for supplier failure. `ErrorCodeValues` has no `GDS_UNAVAILABLE`. | Requires Sabre adapter + circuit breaker. |
| AC-EXP-01-08 | ✅ STUB | `server.mjs` returns `VALIDATION_ERROR` + HTTP 400 for missing `origin`, `destination`, `departureDate`. | Missing `passengers` validation. Error body uses custom format, not RFC 7807 `problem+json`. |

---

### REQ-EXP-02 — Create Booking (Hold)

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-02-01 | ✅ STUB | `server.mjs` `/bookings/holds` POST creates a booking, returns `bookingId`, `holdExpiresAt`, and policy decision. `supplier_mapping` concept does not exist — no separate table, GDS locator not stored as `reference_type: GDS_LOCATOR`. | No real Sabre hold. No `supplier_mapping` append-only table. No ULID IDs (uses UUID). |
| AC-EXP-02-02 | ✅ STUB | Mock server calls `policyEvaluate()` inline during hold and stores `policyEvaluations`. | Policy is a JS function in the server file, not a separate evaluator. Snapshot never written to `policy_decision_snapshot`. No immutability guarantee. |
| AC-EXP-02-03 | ⚠️ PARTIAL | `policyEvaluate()` returns `outcome:'BLOCK'` for blocked destinations. However the booking is **still created** when outcome is BLOCK in the current code — the guard is in the FE, not enforced server-side with a 422. | BLOCK does not prevent booking persistence in `server.mjs`. Returns 201, not 422. |
| AC-EXP-02-04 | ✅ STUB | When `requiresApproval=true`, server sets `bookingStatus:'PENDING_APPROVAL'` and creates an approval record. `ApprovalRequested` event not emitted (no outbox). | No outbox, no event. `PENDING_APPROVAL` differs from spec's `HELD` + `approval.status: PENDING` model. |
| AC-EXP-02-06 | ❌ NOT IMPLEMENTED | `server.mjs` does not validate the `Idempotency-Key` header. No API gateway, no idempotency store. | No idempotency infrastructure at all. |
| AC-EXP-02-07 | ❌ NOT IMPLEMENTED | Same — no idempotency check, no cached response on retry. | No idempotency store. |
| AC-EXP-02-08 | ⚠️ PARTIAL | `server.mjs` returns 404 `OFFER_NOT_FOUND` and 409 `SOLD_OUT` for some Sabre-like failure scenarios. No `GDS_HOLD_FAILED` error code exists. | Wrong error code. `GDS_HOLD_FAILED` / `retry_eligible` not present. |
| AC-EXP-02-09 | ⚠️ PARTIAL | `passengerInfo` is stored on the booking object in `server.mjs`. No separate `passenger` table with `traveler_id` pointer. Raw `firstName`, `lastName` stored directly. | PII embedded in booking (violates GUARDRAIL-D3). No `passenger` entity. No `traveler_id` PII pointer. |

---

### REQ-EXP-03 — Confirm Booking (Issue Ticket via Ticketing Queue)

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-03-01 | ⚠️ PARTIAL | `server.mjs` `/bookings/:id/confirm` transitions booking to `CONFIRMED` synchronously. No `PENDING_ISSUE` state. No `BookingQueuedForTicketing` event. No outbox. | Missing `PENDING_ISSUE` state entirely. No ticketing queue. No outbox event. |
| AC-EXP-03-02 | ❌ NOT IMPLEMENTED | No webhook consumer, no reconciliation-driven ticket number receipt. Ticket number generated immediately and synchronously in `server.mjs`. | No `TICKETING_QUEUE` model. No coupon records. No financial legs. No `void_window_expires_at` from host. |
| AC-EXP-03-03 | ❌ NOT IMPLEMENTED | No `CONFIRM_EXCEPTION` state or path in `server.mjs`. | No partial-failure handling. |
| AC-EXP-03-04 | ❌ NOT IMPLEMENTED | No metric `booking.pending_issue.age_seconds`, no alerting, no `PENDING_ISSUE` state. | No observability infrastructure. |
| AC-EXP-03-05 | ✅ STUB | `server.mjs` returns 409 `INVALID_STATUS` for `CANCELLED` bookings. Hold expiry guard (`hold_expires_at`) is **not** checked on confirm. | Hold expiry not validated at confirm time. Wrong error code (should be `BOOKING_STATE_INVALID`). |
| AC-EXP-03-06 | ❌ NOT IMPLEMENTED | Cost allocations not present in `BookingConfirmRequest` type or `server.mjs`. | No cost allocation model at all. |
| AC-EXP-03-09 | ❌ NOT IMPLEMENTED | No `Idempotency-Key` validation on confirm endpoint. | No idempotency infrastructure. |

---

### REQ-EXP-04 — Cancel Booking

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-04-01 | ✅ STUB | `server.mjs` `/bookings/:id/cancel` transitions to `CANCELLED` and returns `cancellationId`. No Sabre hold release, no outbox event. | No real GDS call. No `BookingCancelled` outbox event. `PENDING_ISSUE` not handled. |
| AC-EXP-04-02 | ⚠️ PARTIAL | Cancel response returns `refundEligible: true` and `refundAmount: fareBreakdown.totalFare`. No `within_void_window` field. No coupon status check. | No void window field. No coupon model. No distinction between within/outside void window. |
| AC-EXP-04-03 | ⚠️ PARTIAL | Cancellation response has `refundAmount` but no `gross_amount`, `penalty_amount`, `non_refundable_amount` breakdown. No `tax_breakdown` by IATA code. | Refund arithmetic not implemented. No penalty field. No tax breakdown. |
| AC-EXP-04-04 | ❌ NOT IMPLEMENTED | No refund invariant enforcement (`refundable_amount ≥ 0`). | No invariant checking anywhere. |
| AC-EXP-04-06 | ❌ NOT IMPLEMENTED | `COMPLETED` state does not exist in the server — never set, never checked. | No `COMPLETED` state. |
| AC-EXP-04-07 | ❌ NOT IMPLEMENTED | No `Idempotency-Key` validation on cancel. | No idempotency infrastructure. |
| AC-EXP-04-08 | ❌ NOT IMPLEMENTED | `CONFIRMED → CANCELLED` guard on ticket status not implemented. `server.mjs` cancels immediately regardless. | No coupon/ticket model to check. |

---

### REQ-EXP-05 — Trip Management

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-05-01 | ✅ STUB | `server.mjs` `GET /bookings/:id` returns booking with flight details and status. No `trip` entity — bookings are the top-level unit. | No Trip entity. No `trip_id`. No segments. Returns individual booking, not trip aggregate. |
| AC-EXP-05-02 | ❌ NOT IMPLEMENTED | No tenant isolation — `server.mjs` looks up bookings by `bookingId` only, no `tenant_id` scope. Any caller can retrieve any booking. Returns 404 for unknown ID (not by design — no tenant awareness). | No tenant model. Cross-tenant access is unrestricted. |
| AC-EXP-05-03 | ✅ STUB | `server.mjs` returns 404 `BOOKING_NOT_FOUND` for unknown IDs. | Route is per-booking not per-trip. Error code differs from spec (`RESOURCE_NOT_FOUND`). |

---

### REQ-EXP-06 — Booking Hold Expiry

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-06-01 | ❌ NOT IMPLEMENTED | No scheduler, no expiry job, no `EXPIRED` transition. `holdExpiresAt` field is stored but never acted on. | No background scheduler. No `EXPIRED` state transition. No outbox. No notification. |
| AC-EXP-06-02 | ❌ NOT IMPLEMENTED | Approval expiry (`approval.expires_at`) not monitored or enforced. | No scheduler. Auto-approval prevention not enforceable. |
| AC-EXP-06-04 | ❌ NOT IMPLEMENTED | `EXPIRED` status does not exist in the server's state machine. Confirm on expired booking not rejected with `BOOKING_STATE_INVALID`. | No `EXPIRED` state. |

---

### REQ-EXP-07 — Approval Workflow

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-07-01 | ✅ STUB | `server.mjs` `/approvals/:id/decision` accepts `APPROVED`/`REJECTED`, updates approval status, updates booking to `HELD` (approved) or `CANCELLED` (rejected). | No `PolicyOverrideRecorded` event. No outbox. Role check not implemented. |
| AC-EXP-07-02 | ❌ NOT IMPLEMENTED | Repeated approval decision is re-applied — no idempotency check. | No idempotency on approval endpoint. |
| AC-EXP-07-03 | ✅ STUB | `server.mjs` sets booking to `CANCELLED` on REJECTED. No Sabre hold release, no `BookingCancelled` event. | No GDS call. No outbox event. |
| AC-EXP-07-04 | ❌ NOT IMPLEMENTED | No JWT validation, no role-based access control. Any caller can submit an approval decision. | No authentication or authorisation anywhere in the server. |

---

### REQ-EXP-08 — Notification Delivery

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-EXP-08-01 | ❌ NOT IMPLEMENTED | No notification service, no email sender, no in-app notification system. | No notification infrastructure. |
| AC-EXP-08-02 | ❌ NOT IMPLEMENTED | Same — no notification on approval request. | No notification infrastructure. |
| AC-EXP-08-03 | ❌ NOT IMPLEMENTED | Same — no notification on expiry. | No notification infrastructure. |
| AC-EXP-08-04 | ❌ NOT IMPLEMENTED | Same — no notification on refund confirmation. | No notification infrastructure. |
| AC-EXP-08-05 | ❌ NOT IMPLEMENTED | No notification retry logic. | No notification infrastructure. |

---

## 2. CONTENT DOMAIN

### REQ-CNT-01 — Sabre GDS Adapter

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-CNT-01-01 | 🚫 BLOCKED | No Sabre adapter exists. Credentials would come from AWS Secrets Manager but no AWS SDK usage in repo. | Blocked: no host PCC yet (HITL-REQ-03). Requires adapter implementation. |
| AC-CNT-01-02 | 🚫 BLOCKED | No token management. | Blocked: no Sabre adapter. |
| AC-CNT-01-03 | 🚫 BLOCKED | No normalisation layer. | Blocked: no Sabre adapter. |
| AC-CNT-01-04 | ❌ NOT IMPLEMENTED | No `supplier_mapping` table. Locators not stored as append-only references. | No data persistence layer. |
| AC-CNT-01-05 | ❌ NOT IMPLEMENTED | No `GDS_HOLD_FAILED` error code in the canonical taxonomy. | No Sabre adapter, no canonical error codes. |
| AC-CNT-01-06 | ❌ NOT IMPLEMENTED | `httpClient.ts` has retry logic for GET requests only; no supplier-specific retry with exponential backoff for hold/issue. No `GDS_TIMEOUT` error code. | No Sabre adapter. FE-side retry is not the backend retry. |
| AC-CNT-01-07 | ❌ NOT IMPLEMENTED | No circuit breaker implementation. | No Sabre adapter, no circuit breaker library. |
| AC-CNT-01-08 | 🚫 BLOCKED | No capability matrix. | Blocked: no Sabre adapter. |
| AC-CNT-01-09 | 🚫 BLOCKED | No wiremock fixtures for Sabre endpoints. | Blocked: adapter not yet built; fixtures depend on adapter design. |

---

### REQ-CNT-02 — GDS Response Normalisation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-CNT-02-01 | ❌ NOT IMPLEMENTED | `server.mjs` amounts are **not** integer minor units (`450` not `45000`). No per-IATA-tax-code breakdown — `taxes` is a single `Money` object. | Amounts in wrong unit. No IATA tax breakdown. |
| AC-CNT-02-02 | ❌ NOT IMPLEMENTED | No fare invariant check: `base_fare + Σ taxes + Σ fees = total` not enforced anywhere. In `fixtures.ts`: `450 + 67.5 + 25 = 542.5` — uses floats. | No invariant. Uses floats. |
| AC-CNT-02-03 | ❌ NOT IMPLEMENTED | No `product_type: AIR` envelope, no versioned JSONB payload. Segment stored as flat object. | No segment envelope model. |
| AC-CNT-02-04 | ❌ NOT IMPLEMENTED | No S3 integration. Raw payloads not persisted. | No S3, no persistence. |
| AC-CNT-02-05 | ❌ NOT IMPLEMENTED | Raw mock error codes used; no canonical mapping. `OFFER_NOT_FOUND`, `SOLD_OUT` are not canonical codes. | No normaliser, no canonical error taxonomy. |

---

### REQ-CNT-03 — Outbound Idempotency

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-CNT-03-01 | ❌ NOT IMPLEMENTED | No `idempotency_record` table, no PostgreSQL, no durable pre-call write. | No idempotency infrastructure. |
| AC-CNT-03-02 | ❌ NOT IMPLEMENTED | Same. | No idempotency infrastructure. |
| AC-CNT-03-03 | ❌ NOT IMPLEMENTED | Same. | No idempotency infrastructure. |
| AC-CNT-03-04 | ❌ NOT IMPLEMENTED | Same. `SUPPLIER_OUTCOME_UNKNOWN` error code not defined. | No idempotency infrastructure. |
| AC-CNT-03-05 | ❌ NOT IMPLEMENTED | Same. `CONFLICT_DUPLICATE` not in canonical error taxonomy. | No idempotency infrastructure. |

---

### REQ-CNT-04 — Webhook Ingestion

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-CNT-04-01 | ❌ NOT IMPLEMENTED | No `/webhooks/gds-events` endpoint in `server.mjs`. No HMAC validation. No S3 persistence. No outbox. | No webhook endpoint. |
| AC-CNT-04-02 | ❌ NOT IMPLEMENTED | Same. | No webhook infrastructure. |
| AC-CNT-04-03 | ❌ NOT IMPLEMENTED | Same. | No webhook infrastructure. |
| AC-CNT-04-04 | ❌ NOT IMPLEMENTED | Same. | No webhook infrastructure. |
| AC-CNT-04-05 | ❌ NOT IMPLEMENTED | No version-aware event consumer. No aggregate versioning model. | No event sourcing. |
| AC-CNT-04-06 | ❌ NOT IMPLEMENTED | No DLQ table, no retry budget tracking. | No outbox/event infrastructure. |

---

### REQ-CNT-05 — Supplier Reconciliation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-CNT-05-01 | ❌ NOT IMPLEMENTED | No reconciliation job, no `supplier_reconciliation_exception` table. | No reconciliation. |
| AC-CNT-05-02 | ❌ NOT IMPLEMENTED | Same. No `ORPHAN_TICKET` detection. | No reconciliation. |
| AC-CNT-05-03 | ❌ NOT IMPLEMENTED | Same. No `STATUS_DRIFT` detection. | No reconciliation. |
| AC-CNT-05-04 | ❌ NOT IMPLEMENTED | Same. No `AMOUNT_DRIFT` detection. | No reconciliation. |
| AC-CNT-05-05 | ❌ NOT IMPLEMENTED | No scheduler, no `reconciliation.run.age_seconds` metric. | No observability, no scheduler. |

---

## 3. POLICY DOMAIN

### REQ-POL-01 — Synchronous Policy Evaluation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-POL-01-01 | ✅ STUB | `server.mjs` `policyEvaluate()` returns `BLOCK`, `REQUIRE_APPROVAL`, `WARN`, or `ALLOW` based on fare threshold and advance booking days. Precedence order `BLOCK > REQUIRE_APPROVAL > WARN > ALLOW` is implicitly correct (if/else waterfall). | Not a separate service. No rule store. No tenant-specific rules. No 200 ms SLO enforcement. |
| AC-POL-01-02 | ❌ NOT IMPLEMENTED | No `scope_level`, no specificity ranking, no tie-breaking algorithm. Single hardcoded rule per scenario. | No rule schema, no conflict resolution. |
| AC-POL-01-03 | ❌ NOT IMPLEMENTED | No `policy_decision_snapshot` table. Evaluation result stored in `policyEvaluations[]` array in the JSON db but never linked to the booking as an immutable snapshot. | No snapshot entity. No immutability. |
| AC-POL-01-04 | ❌ NOT IMPLEMENTED | No 200 ms timeout enforcement. `policyEvaluate()` is synchronous JS with no timeout. | No timeout, no circuit breaker. |

---

### REQ-POL-02 — Policy Rule Schema and Versioning

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-POL-02-01 | ❌ NOT IMPLEMENTED | No YAML/JSON rule files. Rules are hardcoded JS conditionals in `server.mjs`. | No rule schema, no schema validation. |
| AC-POL-02-02 | ❌ NOT IMPLEMENTED | No `override_allowed` field on any rule. | No rule schema. |
| AC-POL-02-03 | ❌ NOT IMPLEMENTED | No hot-reload, no `rule_set_version`. | No rule store. |
| AC-POL-02-04 | ❌ NOT IMPLEMENTED | No `effective_to` date on rules. | No rule schema. |
| AC-POL-02-05 | ❌ NOT IMPLEMENTED | No `effective_from` date on rules. | No rule schema. |

---

### REQ-POL-03 — Policy Override

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-POL-03-01 | ❌ NOT IMPLEMENTED | No `policy_override` table, no override endpoint, no reason code. | No override model. |
| AC-POL-03-02 | ❌ NOT IMPLEMENTED | Same. | No override model. |
| AC-POL-03-03 | ⚠️ PARTIAL | `server.mjs` returns no path to override a `BLOCK` — the FE enforces this UI-side. No explicit HTTP 422 from server on a BLOCK override attempt. | No server-side guard. Error code `POLICY_BLOCKED` exists in `ErrorCodeValues` on FE but not returned by server. |
| AC-POL-03-04 | ❌ NOT IMPLEMENTED | No reason code validation. | No override model. |
| AC-POL-03-06 | ❌ NOT IMPLEMENTED | No `financial_event` table, no D9 dimension update. | No financial event model. |

---

### REQ-POL-04 — BLOCK Rule Behaviour

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-POL-04-01 | ⚠️ PARTIAL | `policyEvaluate()` returns `BLOCK` outcome for destination `XXX`, but `server.mjs` does **not** prevent booking creation — the booking hold still succeeds (201). `POLICY_BLOCKED` 422 is not returned from the server. | Critical gap: BLOCK does not actually block the booking server-side. |
| AC-POL-04-02 | ❌ NOT IMPLEMENTED | No authentication, no ADMIN role, no override attempt pathway. | No auth, no role model. |

---

## 4. PAYMENT & EXPENSE DOMAIN

### REQ-PAY-01 — Financial Event Recording

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-PAY-01-01 | ❌ NOT IMPLEMENTED | No `financial_event` table. No 21-dimension event write on ticket issue. | No financial ledger. |
| AC-PAY-01-02 | ❌ NOT IMPLEMENTED | Same. No `dimension_source`. | No financial ledger. |
| AC-PAY-01-03 | ❌ NOT IMPLEMENTED | Same. No org hierarchy cache. | No financial ledger. |
| AC-PAY-01-04 | ❌ NOT IMPLEMENTED | Booking confirmation is never blocked on dimension availability. | No financial ledger, no dimension check. |
| AC-PAY-01-05 | ❌ NOT IMPLEMENTED | No append-only enforcement. JSON db is freely mutable. | No database role, no append-only guarantee. |
| AC-PAY-01-06 | ❌ NOT IMPLEMENTED | No financial event written at all. | No financial ledger. |

---

### REQ-PAY-02 — Cost Allocation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-PAY-02-01 | ❌ NOT IMPLEMENTED | No `cost_allocation` entity. `BookingConfirmRequest` has no `cost_allocations` field. | No cost allocation model. |
| AC-PAY-02-02 | ❌ NOT IMPLEMENTED | Same. | No cost allocation. |
| AC-PAY-02-03 | ❌ NOT IMPLEMENTED | No largest-remainder algorithm. | No cost allocation. |
| AC-PAY-02-04 | ⚠️ PARTIAL | `server.mjs` returns 400 `VALIDATION_ERROR` for missing `paymentReference`. Split validation not implemented. | No split validation. `paymentReference` validation is present but not related to allocation. |
| AC-PAY-02-05 | ❌ NOT IMPLEMENTED | No fixed-amount split validation. | No cost allocation. |
| AC-PAY-02-06 | ❌ NOT IMPLEMENTED | No `CostAllocationRecorded` event, no outbox, no ERP stub. | No event infrastructure. |

---

### REQ-PAY-03 — Refund Request

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-PAY-03-01 | ❌ NOT IMPLEMENTED | No `POST /refunds` endpoint. Cancel returns `refundEligible: true` but no separate refund entity with `status: REQUESTED`. | No refund entity. Refund lifecycle not implemented. |
| AC-PAY-03-02 | ❌ NOT IMPLEMENTED | No refund invariant enforcement. | No refund entity. |
| AC-PAY-03-03 | ❌ NOT IMPLEMENTED | No coupon model; partial use eligibility check impossible. | No coupon model. |
| AC-PAY-03-04 | ❌ NOT IMPLEMENTED | `is_refundable` flag not on ticket/booking. | No ticket/refundability model. |
| AC-PAY-03-05 | ❌ NOT IMPLEMENTED | No `RefundRequested` event. No outbox. | No event infrastructure. |
| AC-PAY-03-06 | ❌ NOT IMPLEMENTED | No `Idempotency-Key` validation on refund endpoint (endpoint doesn't exist). | No idempotency. |

---

### REQ-PAY-04 — Refund Confirmation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-PAY-04-01 | ❌ NOT IMPLEMENTED | No `RefundConfirmed` event consumer. No ledger credit. No allocation reversal. | No refund lifecycle. |
| AC-PAY-04-02 | ❌ NOT IMPLEMENTED | No allocation reversal model. | No cost allocation. |
| AC-PAY-04-03 | ❌ NOT IMPLEMENTED | No reversal invariant. | No cost allocation. |
| AC-PAY-04-04 | ❌ NOT IMPLEMENTED | No `RefundRejected` handling. | No refund lifecycle. |
| AC-PAY-04-05 | ❌ NOT IMPLEMENTED | No idempotent refund confirmation consumer. | No event infrastructure. |

---

### REQ-PAY-05 — Void

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-PAY-05-01 | ❌ NOT IMPLEMENTED | No void endpoint. No `void_window_expires_at` check. No coupon model. | No void capability. |
| AC-PAY-05-02 | ❌ NOT IMPLEMENTED | No `VOID_WINDOW_EXPIRED` error code. | No void capability. |
| AC-PAY-05-03 | ❌ NOT IMPLEMENTED | No Sabre void call. | No Sabre adapter. |
| AC-PAY-05-04 | ❌ NOT IMPLEMENTED | No idempotency key on void endpoint. | No idempotency, no void endpoint. |

---

### REQ-PAY-06 — Form of Payment Tracking

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-PAY-06-01 | ⚠️ PARTIAL | `server.mjs` confirm endpoint accepts `paymentReference` but does **not** store it on the booking object. `booking.ts` `BookingConfirmRequest` has `paymentReference`. The mock confirm handler ignores it. | `paymentReference` accepted but not persisted. No Luhn check. No `payment_instrument_type`. |
| AC-PAY-06-02 | ❌ NOT IMPLEMENTED | No refund entity, no copy of `payment_reference` onto refund. | No refund entity. |
| AC-PAY-06-03 | ❌ NOT IMPLEMENTED | No financial audit endpoint. No `return_to: ORIGINAL_FORM_OF_PAYMENT` on any record. | No refund entity. |

---

## 5. SERVICING DOMAIN

### REQ-SVC-01 — CONFIRM_EXCEPTION Handling

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-SVC-01-01 | ❌ NOT IMPLEMENTED | No `CONFIRM_EXCEPTION` state in `server.mjs`. Partial failure not modelled. | No partial-failure state machine. |
| AC-SVC-01-02 | ❌ NOT IMPLEMENTED | No `CONFIRM_EXCEPTION` status check on retry. | No state. |
| AC-SVC-01-03 | ❌ NOT IMPLEMENTED | No `booking.confirm_exception.count` metric, no alerting. | No observability. |

---

### REQ-SVC-02 — Refund Submission to Supplier

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-SVC-02-01 | ❌ NOT IMPLEMENTED | No Sabre refund endpoint, no idempotency key, no `supplier_refund_ref`. | No Sabre adapter, no refund entity. |
| AC-SVC-02-02 | ❌ NOT IMPLEMENTED | No `SUPPLIER_OUTCOME_UNKNOWN` handling, no reconciliation queue. | No idempotency infrastructure. |
| AC-SVC-02-03 | ❌ NOT IMPLEMENTED | No rejection path from Sabre. | No Sabre adapter. |

---

### REQ-SVC-03 — Illegal State Transition Rejection

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-SVC-03-01 | ✅ STUB | `server.mjs` returns 409 for `CANCELLED` booking confirm, 409 for `PENDING_APPROVAL` confirm, 409 for already-cancelled booking. `BOOKING_STATE_INVALID` error code not used — different codes used (`INVALID_STATUS`, `ALREADY_CANCELLED`). | Wrong error codes. Only 3 of many transitions are guarded. No generic state machine. |
| AC-SVC-03-02 | ❌ NOT IMPLEMENTED | No `REFUND_REQUESTED` ticket status. No void-on-REFUND_REQUESTED guard. | No coupon/ticket state machine. |
| AC-SVC-03-03 | ❌ NOT IMPLEMENTED | No `VOIDED` ticket status. No refund-on-VOIDED guard. | No coupon/ticket state machine. |
| AC-SVC-03-04 | ❌ NOT IMPLEMENTED | No `COMPLETED` booking state or guard. | No `COMPLETED` state. |

---

## 6. DATA DOMAIN

### REQ-DAT-01 — Transaction Spine

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-DAT-01-01 | ❌ NOT IMPLEMENTED | IDs use `randomUUID()` (UUID v4), not ULID/UUIDv7. IDs are not derived from supplier IDs (accidental partial compliance). | Wrong ID format. No ULID library. |
| AC-DAT-01-02 | ❌ NOT IMPLEMENTED | No `coupon` entity. No `coupon_number`. Tickets are just strings in `ticketNumbers[]`. | No coupon model. |
| AC-DAT-01-03 | ❌ NOT IMPLEMENTED | No `supplier_mapping` table. GDS locators not stored as append-only rows with `valid_from`/`valid_to`. | No supplier mapping model. |
| AC-DAT-01-04 | ❌ NOT IMPLEMENTED | No `tenant_id` on any entity. No tenant scoping in any query. | No multi-tenancy at all. |
| AC-DAT-01-05 | ❌ NOT IMPLEMENTED | No historical supplier mapping lookup. | No supplier mapping model. |

---

### REQ-DAT-02 — Append-Only Immutable Tables

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-DAT-02-01 | ❌ NOT IMPLEMENTED | JSON flat file is freely mutable. No database role enforcement. `server.mjs` writes and rewrites the same JSON file on every operation. | No PostgreSQL, no database roles, no append-only enforcement. |
| AC-DAT-02-02 | ❌ NOT IMPLEMENTED | No `financial_leg` with `ACTIVE`/`SUPERSEDED` lifecycle. | No financial leg model. |
| AC-DAT-02-03 | ❌ NOT IMPLEMENTED | No `policy_override` entity. `policy_decision_snapshot` not implemented. | No policy snapshot model. |

---

### REQ-DAT-03 — PII Pointer Model

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-DAT-03-01 | ❌ NOT IMPLEMENTED | `passengerInfo` in `server.mjs` contains `firstName`, `lastName`, `passportNumber`, `dateOfBirth` directly on the booking object. Raw PII embedded on the spine entity. | Direct PII violation. No `traveler_id` pointer. |
| AC-DAT-03-02 | ❌ NOT IMPLEMENTED | No PII store, no GDPR erasure path. | No PII pointer model. |
| AC-DAT-03-03 | ❌ NOT IMPLEMENTED | Same — erasure would break the booking record as PII is embedded. | Architectural constraint: PII is in the record. |
| AC-DAT-03-04 | ❌ NOT IMPLEMENTED | No log sanitiser in CI. No structured logging at all in `server.mjs` (uses `console.error` only). | No logging infrastructure. |

---

### REQ-DAT-04 — Transactional Outbox

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-DAT-04-01 | ❌ NOT IMPLEMENTED | No outbox table. `db.events[]` in `server.mjs` is an audit log array, not a transactional outbox. State change and event are not in the same ACID transaction. | No transactional outbox. No PostgreSQL. |
| AC-DAT-04-02 | ❌ NOT IMPLEMENTED | No dispatcher, no `dispatched_at`, no retry. | No outbox infrastructure. |
| AC-DAT-04-03 | ❌ NOT IMPLEMENTED | No DLQ, no retry budget. | No outbox infrastructure. |
| AC-DAT-04-04 | ❌ NOT IMPLEMENTED | No `event_id` deduplication on consumers. | No event infrastructure. |
| AC-DAT-04-05 | ❌ NOT IMPLEMENTED | No version-aware event consumers. | No event infrastructure. |
| AC-DAT-04-06 | ❌ NOT IMPLEMENTED | No `/health/ready` endpoint in `server.mjs`. Only `/health` returns `{status:'UP'}`. No outbox dispatcher health check. | No health check infrastructure matching spec. |

---

### REQ-DAT-05 — Multi-Tenant Data Isolation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-DAT-05-01 | ❌ NOT IMPLEMENTED | No `tenant_id` on any entity. No tenant claim validation. Repository has no tenant scoping. | No multi-tenancy. |
| AC-DAT-05-02 | ❌ NOT IMPLEMENTED | Cross-tenant 404 rule not implementable — all bookings are visible to all callers. | No tenant isolation. |
| AC-DAT-05-03 | ❌ NOT IMPLEMENTED | No JWT validation at all. No `tenant_id` claim. | No authentication. |

---

## 7. CROSS-CUTTING

### REQ-XCT-01 — Correlation ID Propagation

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-XCT-01-01 | ❌ NOT IMPLEMENTED | `server.mjs` does not read or generate `X-Correlation-ID` headers. No API gateway. | No correlation ID infrastructure. |
| AC-XCT-01-02 | ❌ NOT IMPLEMENTED | Same — not forwarded to any downstream. | No correlation ID. |
| AC-XCT-01-03 | ❌ NOT IMPLEMENTED | `db.events[]` does not include `correlation_id`. | No correlation ID. |
| AC-XCT-01-04 | ❌ NOT IMPLEMENTED | No `financial_event` table. | No financial event. |

---

### REQ-XCT-02 — Authentication and Role-Based Access

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-XCT-02-01 | ❌ NOT IMPLEMENTED | `server.mjs` does not validate `Authorization` headers. No 401 response for missing/invalid JWT. | No authentication. |
| AC-XCT-02-02 | ❌ NOT IMPLEMENTED | No role checking. Any caller can do anything. | No authorisation. |
| AC-XCT-02-03 | ❌ NOT IMPLEMENTED | No IdP integration, no MFA enforcement. | No identity infrastructure. |
| AC-XCT-02-04 | ❌ NOT IMPLEMENTED | Single deployable (mock server). No mTLS. | No mTLS, no inter-service calls. |
| AC-XCT-02-05 | ⚠️ PARTIAL | `server.mjs` returns 404 for unknown booking IDs — coincidentally correct behaviour for wrong reason. Not by tenant-scope logic. | Not by design. No tenant isolation. |

---

### REQ-XCT-03 — Idempotency on Mutating Endpoints

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-XCT-03-01 | ❌ NOT IMPLEMENTED | No `Idempotency-Key` header read or validated by `server.mjs`. `httpClient.ts` sends no such header. | No idempotency anywhere. |
| AC-XCT-03-02 | ❌ NOT IMPLEMENTED | Same. | No idempotency. |
| AC-XCT-03-03 | ❌ NOT IMPLEMENTED | Same. | No idempotency. |

---

### REQ-XCT-04 — Structured Logging and Observability

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-XCT-04-01 | ❌ NOT IMPLEMENTED | `server.mjs` uses `console.error(error)` only. No JSON structured logs, no `correlation_id`, no `tenant_id` in any log line. | No structured logging. |
| AC-XCT-04-02 | ❌ NOT IMPLEMENTED | No log sanitiser in CI. No CI pipeline exists in the repository. | No CI, no log sanitiser. |
| AC-XCT-04-03 | ❌ NOT IMPLEMENTED | No OpenTelemetry SDK. No spans. | No observability infrastructure. |
| AC-XCT-04-04 | ⚠️ PARTIAL | `server.mjs` has `/health` endpoint returning `{status:'UP'}` — covers `/health/live` concept. No `/health/ready`. No DB, Redis, or outbox checks. | `/health/live` concept present. `/health/ready` absent. No real health checks. |

---

### REQ-XCT-05 — Error Response Format

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-XCT-05-01 | ❌ NOT IMPLEMENTED | `server.mjs` returns `{success: false, error: {code, message, details, timestamp}}` — not RFC 7807 `application/problem+json`. No `type`, `title`, `status` fields. No `Content-Type: application/problem+json`. | Wrong error format. Not RFC 7807. |
| AC-XCT-05-02 | ⚠️ PARTIAL | `server.mjs` catches errors and returns 500 `INTERNAL_ERROR` without stack trace (error message only). | Correct HTTP 500 and no stack trace. Missing RFC 7807 format. |

---

### REQ-XCT-06 — No Raw PAN Storage

| AC ID | Status | Evidence | Gap |
|-------|--------|----------|-----|
| AC-XCT-06-01 | ❌ NOT IMPLEMENTED | No Luhn check on `payment_reference`. `generatePaymentApprovalStub()` produces `PAY-XXXXXXXX` tokens which are safe, but no validation enforced server-side. | No CI security scan. |
| AC-XCT-06-02 | ❌ NOT IMPLEMENTED | No PAN-pattern scan in any CI or test. | No CI. |
| AC-XCT-06-03 | ❌ NOT IMPLEMENTED | No secrets scan. No CI pipeline. | No CI. |

---

## 8. IMPLEMENTATION ROADMAP — WHAT MUST BE BUILT

Based on the gap analysis, the following backend capabilities have **zero implementation** and must be built from scratch:

| Priority | Capability | Blocks |
|----------|-----------|--------|
| 🔴 P0 | PostgreSQL schema (all spine entities) | Everything |
| 🔴 P0 | Tenant isolation (tenant_id on all entities, repository-layer enforcement) | Security, data isolation |
| 🔴 P0 | JWT authentication + role-based access (Auth0/Cognito) | All protected endpoints |
| 🔴 P0 | ULID/UUIDv7 ID generation | Data model correctness |
| 🔴 P0 | Integer minor-unit amounts + IATA tax code breakdown | Financial invariants |
| 🔴 P0 | PII pointer model (remove raw PII from booking/passenger; separate PII store) | GDPR, security |
| 🔴 P0 | Idempotency store (PostgreSQL `idempotency_record`, pre-call durable write) | Duplicate booking/ticket prevention |
| 🔴 P0 | Transactional outbox (same-transaction event emission) | Event-driven integration |
| 🔴 P0 | Sabre GDS adapter (search, hold, queue, cancel, void, retrieve) — wiremock fixtures first | Core booking flow |
| 🔴 P0 | `POLICY_BLOCKED` enforcement server-side (block creation, not just return outcome) | Compliance |
| 🟠 P1 | Policy decision snapshot (immutable, linked to booking) | Policy audit trail |
| 🟠 P1 | Booking state machine (DRAFT→HELD→PENDING_ISSUE→CONFIRMED→COMPLETED; EXPIRED; CONFIRM_EXCEPTION) | Booking lifecycle |
| 🟠 P1 | Ticket + coupon model (TICKET→COUPON→SEGMENT) | Refund eligibility, void window |
| 🟠 P1 | Financial ledger (`financial_event` with 21 dimensions, append-only) | Reporting, compliance |
| 🟠 P1 | Cost allocation (largest-remainder, Σ invariant) | Financial integrity |
| 🟠 P1 | Refund entity and two-phase lifecycle (REQUESTED→CONFIRMED) | Refund processing |
| 🟠 P1 | Void endpoint (void_window_expires_at guard) | Servicing |
| 🟠 P1 | Supplier mapping (append-only reference log on booking) | Supplier reconciliation |
| 🟡 P2 | Webhook ingestion (HMAC-SHA256, deduplication, outbox) | Post-booking events |
| 🟡 P2 | Supplier reconciliation job (scheduled drift detection) | Operational safety |
| 🟡 P2 | Policy rule engine (YAML/JSON rule store, versioned, hot-reload) | Multi-tenant policy |
| 🟡 P2 | Policy override model (`policy_override` append-only) | Policy audit trail |
| 🟡 P2 | Notification service (email + in-app, event-driven from outbox) | Traveler communication |
| 🟡 P2 | Hold expiry scheduler (EventBridge or equivalent) | Hold lifecycle |
| 🟡 P2 | RFC 7807 error format (`application/problem+json`) | API contract compliance |
| 🟡 P2 | Correlation ID propagation (all requests, events, financial events) | Observability |
| 🟡 P2 | Structured JSON logging (correlation_id, tenant_id mandatory) | Observability |
| 🟡 P2 | OpenTelemetry instrumentation | Observability |
| 🟡 P2 | CONFIRM_EXCEPTION state + ops queue | Partial-failure safety |
| 🟢 P3 | Health endpoints `/health/live` + `/health/ready` (with real checks) | Deployment readiness |
| 🟢 P3 | CI pipeline (lint, unit, integration, financial invariant tests, PAN scan) | Quality gate |
| 🟢 P3 | Sabre wiremock fixture library (Sprint 1 CI gate per HITL-REQ-03) | Sprint 1 DoD |

---

## 9. TRACEABILITY METRICS

| Metric | Value |
|--------|-------|
| Total BE ACs (from be_acceptance_criteria.md) | 138 |
| ACs enumerated individually for status analysis | 159 |
| Implemented at stub level (mock server) | 20 (12.6%) |
| Partial (mock server covers some but not all of AC) | 18 (11.3%) |
| Not implemented (no code at any level) | 116 (73.0%) |
| Blocked (external dependency — Sabre PCC) | 5 (3.1%) |
| Production-ready implementations | 0 (0%) |

### Traceability by Requirement

| Req ID | ACs | ✅ Stub | ⚠️ Partial | ❌ Not Impl. | 🚫 Blocked |
|--------|-----|---------|----------|------------|---------|
| REQ-EXP-01 | 5 | 3 | 0 | 2 | 0 |
| REQ-EXP-02 | 8 | 3 | 3 | 2 | 0 |
| REQ-EXP-03 | 7 | 1 | 1 | 5 | 0 |
| REQ-EXP-04 | 7 | 1 | 2 | 4 | 0 |
| REQ-EXP-05 | 3 | 2 | 0 | 1 | 0 |
| REQ-EXP-06 | 3 | 0 | 0 | 3 | 0 |
| REQ-EXP-07 | 4 | 2 | 0 | 2 | 0 |
| REQ-EXP-08 | 5 | 0 | 0 | 5 | 0 |
| REQ-CNT-01 | 9 | 0 | 0 | 4 | 5 |
| REQ-CNT-02 | 5 | 0 | 0 | 5 | 0 |
| REQ-CNT-03 | 5 | 0 | 0 | 5 | 0 |
| REQ-CNT-04 | 6 | 0 | 0 | 6 | 0 |
| REQ-CNT-05 | 5 | 0 | 0 | 5 | 0 |
| REQ-POL-01 | 4 | 1 | 0 | 3 | 0 |
| REQ-POL-02 | 5 | 0 | 0 | 5 | 0 |
| REQ-POL-03 | 5 | 0 | 1 | 4 | 0 |
| REQ-POL-04 | 2 | 0 | 1 | 1 | 0 |
| REQ-PAY-01 | 6 | 0 | 0 | 6 | 0 |
| REQ-PAY-02 | 6 | 0 | 1 | 5 | 0 |
| REQ-PAY-03 | 6 | 0 | 0 | 6 | 0 |
| REQ-PAY-04 | 5 | 0 | 0 | 5 | 0 |
| REQ-PAY-05 | 4 | 0 | 0 | 4 | 0 |
| REQ-PAY-06 | 3 | 0 | 1 | 2 | 0 |
| REQ-SVC-01 | 3 | 0 | 0 | 3 | 0 |
| REQ-SVC-02 | 3 | 0 | 0 | 3 | 0 |
| REQ-SVC-03 | 4 | 1 | 0 | 3 | 0 |
| REQ-DAT-01 | 5 | 0 | 0 | 5 | 0 |
| REQ-DAT-02 | 3 | 0 | 0 | 3 | 0 |
| REQ-DAT-03 | 4 | 0 | 0 | 4 | 0 |
| REQ-DAT-04 | 6 | 0 | 0 | 6 | 0 |
| REQ-DAT-05 | 3 | 0 | 0 | 3 | 0 |
| REQ-XCT-01 | 4 | 0 | 0 | 4 | 0 |
| REQ-XCT-02 | 5 | 0 | 1 | 4 | 0 |
| REQ-XCT-03 | 3 | 0 | 0 | 3 | 0 |
| REQ-XCT-04 | 4 | 0 | 1 | 3 | 0 |
| REQ-XCT-05 | 2 | 0 | 1 | 1 | 0 |
| REQ-XCT-06 | 3 | 0 | 0 | 3 | 0 |
| **TOTAL** | **159** | **20** | **18** | **116** | **5** |

### Coverage by Domain

```
Experience    ██████░░░░░░░░░░░░░░  38%  (stub + partial)
Content       ░░░░░░░░░░░░░░░░░░░░   0%  (5 blocked, rest not started)
Policy        █████░░░░░░░░░░░░░░░  25%  (stub + partial)
Payment       █░░░░░░░░░░░░░░░░░░░   7%  (partial only)
Servicing     ██░░░░░░░░░░░░░░░░░░  10%  (1 stub, 2 partial)
Data          ░░░░░░░░░░░░░░░░░░░░   0%  (nothing)
Cross-Cutting █░░░░░░░░░░░░░░░░░░░  22%  (partial only)
```

---

## 10. CRITICAL GAPS REQUIRING IMMEDIATE ATTENTION

These gaps would cause **production failures or compliance violations** if not addressed before Phase 1 launch:

| # | Gap | AC | Risk |
|---|-----|----|------|
| 1 | **BLOCK policy does not prevent booking creation** — server creates booking even when policy returns BLOCK | AC-POL-04-01 | Compliance breach: sanctioned destinations can be booked |
| 2 | **Raw PII (firstName, lastName, passportNumber, DOB) stored directly on booking** | AC-DAT-03-01 | GDPR violation |
| 3 | **No authentication — any caller can create/cancel/confirm any booking** | AC-XCT-02-01 | Security breach |
| 4 | **No tenant isolation — all bookings visible to all callers** | AC-DAT-05-01, AC-EXP-05-02 | Data breach |
| 5 | **Amounts not in integer minor units (float arithmetic in money calculations)** | AC-CNT-02-01, AC-CNT-02-02 | Financial invariant violations, rounding errors |
| 6 | **No idempotency — duplicate holds and confirms are possible** | AC-CNT-03-01, AC-XCT-03-01 | Double-booking, double-ticket issuance |
| 7 | **No CONFIRM_EXCEPTION state — partial failures silently corrupt state** | AC-SVC-01-01 | Financial integrity: money committed, no ledger record |
| 8 | **No append-only enforcement — financial records mutable** | AC-DAT-02-01 | SOX audit trail violation |

---

**Assessment Date:** 2026-09-10  
**Next Review:** After Sprint 1 backend scaffolding is complete
