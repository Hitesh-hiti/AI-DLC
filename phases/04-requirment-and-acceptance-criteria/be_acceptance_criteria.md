# TravelPlatform — Back-End Acceptance Criteria

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Derived from:** `requirement_breakdown.md` v1.0  
**Scope:** All acceptance criteria tagged `[BE]` or `[FE+BE]` — back-end implementation is required for these criteria.  
**Layer convention:**  
- `[BE]` — back-end only responsibility  
- `[FE+BE]` — both layers must satisfy; the back-end portion is described here  

> Criteria tagged `[FE]` only are not listed in this file. See `fe_acceptance_criteria.md`.

---

## TABLE OF CONTENTS

1. [Experience Domain](#1-experience-domain)
2. [Content Domain](#2-content-domain)
3. [Policy Domain](#3-policy-domain)
4. [Payment & Expense Domain](#4-payment--expense-domain)
5. [Servicing Domain](#5-servicing-domain)
6. [Data Domain](#6-data-domain)
7. [Cross-Cutting](#7-cross-cutting)
8. [HITL Items Affecting Back-End](#8-hitl-items-affecting-back-end)
9. [BE Traceability Matrix](#9-be-traceability-matrix)

---

## 1. EXPERIENCE DOMAIN

### REQ-EXP-01 — Travel Search

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-01-01 | [FE+BE] | **Given** a traveler provides origin, destination, departure date, return date, at least one passenger, and cabin class, **When** they submit the search, **Then** the system returns a list of available offers from Sabre including base fare, itemised taxes (per IATA tax code), fees, and total in integer minor units with ISO 4217 currency code. |
| AC-EXP-01-05 | [BE] | **Given** a valid search request is received, **When** the Sabre adapter returns results within the SLO, **Then** the API response is returned to the caller within 3000 ms at p99. |
| AC-EXP-01-06 | [BE] | **Given** a valid search request is received, **When** Sabre returns no available offers, **Then** the system returns an empty `offers` array and HTTP 200 — not an error. |
| AC-EXP-01-07 | [BE] | **Given** a valid search request is received, **When** Sabre is unavailable (circuit open or timeout), **Then** the system returns HTTP 503 with `error_code: GDS_UNAVAILABLE` and `retry_eligible: true`. |
| AC-EXP-01-08 | [BE] | **Given** a search request is received missing any mandatory field (origin, destination, departure_date, or at least one passenger), **When** the system validates the request, **Then** HTTP 400 with `error_code: VALIDATION_ERROR` identifying the specific missing field is returned. |

---

### REQ-EXP-02 — Create Booking (Hold)

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-02-01 | [FE+BE] | **Given** a traveler selects a valid offer and provides at least one passenger, **When** they submit a booking request with a unique `Idempotency-Key` header, **Then** the system creates a booking in `HELD` status, stores the Sabre GDS locator in `supplier_mapping`, returns `booking_id`, `hold_expires_at`, and the policy decision. |
| AC-EXP-02-02 | [BE] | **Given** a booking request is received, **When** the booking is created, **Then** the policy evaluator is called synchronously, the decision is snapshotted onto the booking in `policy_decision_snapshot` before the response is sent, and the snapshot is never subsequently updated. |
| AC-EXP-02-03 | [BE] | **Given** policy evaluation returns `BLOCK`, **When** the booking request is processed, **Then** no hold is created at Sabre, no booking record is persisted, and HTTP 422 with `error_code: POLICY_BLOCKED` is returned. |
| AC-EXP-02-04 | [BE] | **Given** policy evaluation returns `REQUIRE_APPROVAL`, **When** the booking hold is created at Sabre, **Then** the booking is stored in `HELD` status, an `approval` record is created in `PENDING` status with `expires_at` set, an `ApprovalRequested` event is written to the outbox, and the response includes `approval.status: PENDING`. |
| AC-EXP-02-06 | [BE] | **Given** a booking request arrives **without** an `Idempotency-Key` header, **When** the API gateway validates it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned before any business logic executes. |
| AC-EXP-02-07 | [BE] | **Given** an identical `Idempotency-Key` is submitted for the same scope a second time, **When** the system looks up the idempotency record, **Then** the original HTTP status and response body are returned verbatim without creating a second booking or calling Sabre. |
| AC-EXP-02-08 | [BE] | **Given** Sabre returns a structured non-retryable error on hold creation, **When** the adapter processes the response, **Then** HTTP 502 with `error_code: GDS_HOLD_FAILED` and `retry_eligible: false` is returned and no booking record is persisted. |
| AC-EXP-02-09 | [BE] | **Given** a booking is created for multiple passengers, **When** the booking record is stored, **Then** a `passenger` record is created for each passenger, each linked to the booking with a `traveler_id` PII pointer and a `passenger_type`. |

---

### REQ-EXP-03 — Confirm Booking (Issue Ticket via Ticketing Queue)

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-03-01 | [FE+BE] | **Given** a booking is in `HELD` status and approval is `NOT_REQUIRED` or `APPROVED`, **When** the traveler submits a confirm request with payment reference and per-passenger cost allocations, **Then** the booking transitions to `PENDING_ISSUE`, a `BookingQueuedForTicketing` event is written to the outbox, and the response returns `status: PENDING_ISSUE`. |
| AC-EXP-03-02 | [BE] | **Given** a ticket number is received (via webhook or reconciliation) for a `PENDING_ISSUE` booking, **When** the ticket and coupon records are persisted along with financial legs and cost allocations — all in one transaction, **Then** the booking transitions to `CONFIRMED`, `BookingConfirmed` and `TicketIssued` events are written to the outbox, and `void_window_expires_at` is set from the host confirmation. |
| AC-EXP-03-03 | [BE] | **Given** a ticket number is received and any downstream write (financial leg, cost allocation, financial event) fails within the same confirm transaction, **When** the error is handled, **Then** the booking transitions to `CONFIRM_EXCEPTION`, a `ConfirmExceptionRaised` event is written to the outbox with the supplier ticket reference and failed step, and `booking.confirm_exception.count` increments. |
| AC-EXP-03-04 | [BE] | **Given** a booking is in `PENDING_ISSUE` status, **When** its age exceeds 30 minutes (1800 seconds), **Then** the metric `booking.pending_issue.age_seconds` at p95 exceeds 1800 and an operational alert fires. |
| AC-EXP-03-05 | [BE] | **Given** a confirm request is received for a booking in `HELD` status where `hold_expires_at` has passed, **When** the system validates the guard, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned and the booking is not queued. |
| AC-EXP-03-06 | [BE] | **Given** cost allocations are submitted per passenger, **When** percentage splits for any passenger do not sum to 100%, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned and the booking is not confirmed. |
| AC-EXP-03-09 | [BE] | **Given** a confirm request is submitted without an `Idempotency-Key` header, **When** the API gateway validates it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |

---

### REQ-EXP-04 — Cancel Booking

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-04-01 | [FE+BE] | **Given** a booking is in `HELD` or `PENDING_ISSUE` status, **When** the traveler submits a cancel request, **Then** the Sabre hold is released, the booking transitions to `CANCELLED`, a `BookingCancelled` event is written to the outbox, and the response confirms cancellation with no refund calculation. |
| AC-EXP-04-02 | [FE+BE] | **Given** a `CONFIRMED` booking with all coupons `OPEN` is within the void window, **When** a cancel request is processed, **Then** the response includes `within_void_window: true` and `refundable_amount` equal to the full ticket total. |
| AC-EXP-04-03 | [FE+BE] | **Given** a `CONFIRMED` booking with all coupons `OPEN` is outside the void window, **When** a cancel request is processed, **Then** the response includes `within_void_window: false`, `gross_amount`, `penalty_amount` (from `ticket.refund_penalty_amount`), `non_refundable_amount` (Σ non-refundable taxes and fees), and `refundable_amount = gross − penalty − non_refundable`. |
| AC-EXP-04-04 | [BE] | **Given** a cancellation response is generated, **When** `refundable_amount` is computed, **Then** the invariant `refundable_amount = gross_amount − penalty_amount − non_refundable_amount` must hold and `refundable_amount ≥ 0`; any negative result returns HTTP 422 `INVARIANT_VIOLATED`. |
| AC-EXP-04-06 | [BE] | **Given** a cancel request is received for a booking in `COMPLETED` status, **When** the system validates the state transition, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |
| AC-EXP-04-07 | [BE] | **Given** a cancel request is submitted without an `Idempotency-Key` header, **When** the API gateway validates it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |
| AC-EXP-04-08 | [BE] | **Given** a `CONFIRMED → CANCELLED` transition is attempted, **When** at least one ticket on the booking is not in `VOIDED` or `REFUNDED` status, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |

---

### REQ-EXP-05 — Trip Management

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-05-01 | [FE+BE] | **Given** an authenticated traveler requests a trip by `trip_id`, **When** the trip exists for their tenant, **Then** the API response includes trip purpose, date window, and all associated bookings with statuses and segments. |
| AC-EXP-05-02 | [BE] | **Given** a `trip_id` that belongs to a different tenant is requested, **When** the system validates the tenant scope, **Then** HTTP 404 is returned — not HTTP 403 — to avoid confirming cross-tenant resource existence. |
| AC-EXP-05-03 | [BE] | **Given** a `trip_id` that does not exist for the caller's tenant is requested, **When** the system queries the spine, **Then** HTTP 404 with `error_code: RESOURCE_NOT_FOUND` is returned. |

---

### REQ-EXP-06 — Booking Hold Expiry

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-06-01 | [BE] | **Given** a booking is in `HELD` status, **When** `now() >= hold_expires_at`, **Then** the system transitions the booking to `EXPIRED`, releases the Sabre hold, writes a `BookingExpired` event to the outbox, and the notification consumer delivers expiry notifications to the traveler. |
| AC-EXP-06-02 | [BE] | **Given** a booking is in `HELD` status with a `PENDING` approval and `approval.expires_at` is reached, **When** the scheduler triggers, **Then** the approval transitions to `EXPIRED`, the booking transitions to `EXPIRED`, the Sabre hold is released, and the traveler is notified. The approval is **never** auto-approved. |
| AC-EXP-06-04 | [BE] | **Given** a confirm request is submitted for a booking in `EXPIRED` status, **When** the system validates the state, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |

---

### REQ-EXP-07 — Approval Workflow

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-07-01 | [BE] | **Given** an approval is in `PENDING` status, **When** an approver with the `APPROVER` role submits an `APPROVED` decision, **Then** the approval transitions to `APPROVED`, the booking becomes eligible for confirmation, and if any matched rule was overridden a `PolicyOverrideRecorded` event is written to the outbox. |
| AC-EXP-07-02 | [BE] | **Given** an approver submits the same approval decision a second time (idempotent replay), **When** the system processes the repeated request, **Then** the original decision is returned without re-evaluating or changing state. |
| AC-EXP-07-03 | [BE] | **Given** an approver with the `APPROVER` role submits a `REJECTED` decision, **When** the system processes it, **Then** the approval transitions to `REJECTED`, the booking transitions to `CANCELLED`, the Sabre hold is released, and a `BookingCancelled` event is written to the outbox. |
| AC-EXP-07-04 | [BE] | **Given** a caller without the `APPROVER` role submits an approval decision, **When** the service checks authorization, **Then** HTTP 403 with `error_code: AUTHORIZATION_DENIED` is returned. |

---

### REQ-EXP-08 — Notification Delivery

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-08-01 | [BE] | **Given** a `BookingHeld` event is dispatched from the outbox, **When** the notification consumer processes it, **Then** an email and in-app notification is sent to the traveler containing the booking reference and hold expiry time (interim constraint: no raw traveler name or PII beyond email address and booking reference until HITL-REQ-01 is resolved). |
| AC-EXP-08-02 | [BE] | **Given** an `ApprovalRequested` event is dispatched, **When** the notification consumer processes it, **Then** an email and in-app notification is sent to the resolved approver containing the booking reference and an action link. |
| AC-EXP-08-03 | [BE] | **Given** a `BookingExpired` event is dispatched, **When** the notification consumer processes it, **Then** an email and in-app notification is sent to the traveler indicating the booking has expired and the hold was released. |
| AC-EXP-08-04 | [BE] | **Given** a `RefundConfirmed` event is dispatched, **When** the notification consumer processes it, **Then** an email and in-app notification is sent to the traveler confirming the refund amount, currency, and payment reference. No raw PAN or card number is included. |
| AC-EXP-08-05 | [BE] | **Given** a notification delivery fails transiently, **When** the retry budget is not yet exhausted, **Then** the system retries delivery without emitting a duplicate notification to the recipient (idempotent on the outbox `event_id`). |

---

## 2. CONTENT DOMAIN

### REQ-CNT-01 — Sabre GDS Adapter

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-CNT-01-01 | [BE] | **Given** the adapter is initialised, **When** Sabre credentials are required, **Then** they are retrieved exclusively from AWS Secrets Manager — never from environment variables, source code, or logs. |
| AC-CNT-01-02 | [BE] | **Given** a Sabre ATH token is approaching expiry, **When** a call is about to be issued, **Then** the token is refreshed proactively without failing the in-flight request. |
| AC-CNT-01-03 | [BE] | **Given** a valid availability request is sent to the adapter, **When** Sabre returns results, **Then** the response is normalised to the canonical `AvailabilityResponse` model before leaving the Content module. |
| AC-CNT-01-04 | [BE] | **Given** a hold request succeeds at Sabre, **When** the GDS record locator is returned, **Then** it is stored in `supplier_mapping` as `reference_type: GDS_LOCATOR` with `valid_from` set to current timestamp — no UPDATE to any existing row. |
| AC-CNT-01-05 | [BE] | **Given** a hold request fails at Sabre with a structured non-retryable error, **When** the adapter processes the response, **Then** the error is mapped to canonical `GDS_HOLD_FAILED` with `retry_eligible: false` and no booking record is persisted. |
| AC-CNT-01-06 | [BE] | **Given** a hold request times out, **When** the adapter retries under the same idempotency key (up to 3 attempts, exponential backoff: 500 ms, 1 s, 2 s ±10% jitter), **Then** if all retries fail the error is surfaced as `GDS_TIMEOUT` with `retry_eligible: true`. |
| AC-CNT-01-07 | [BE] | **Given** the Sabre circuit breaker is open, **When** any adapter operation is attempted, **Then** `GDS_UNAVAILABLE` (HTTP 503) is returned immediately without calling Sabre and an alert fires. |
| AC-CNT-01-08 | [BE] | **Given** a verb (e.g., exchange) is not declared `true` in the adapter capability matrix, **When** the orchestration layer calls it, **Then** HTTP 422 with `error_code: GDS_CAPABILITY_UNSUPPORTED` is returned before any Sabre call is attempted. |

---

### REQ-CNT-02 — GDS Response Normalisation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-CNT-02-01 | [BE] | **Given** a Sabre fare response is received, **When** the normaliser processes it, **Then** all monetary amounts are converted to integer minor units in ISO 4217 currency, taxes are split into per-IATA-code rows, and fees are itemised separately. |
| AC-CNT-02-02 | [BE] | **Given** a Sabre fare response is normalised, **When** the invariant check runs, **Then** `base_fare + Σ taxes + Σ fees = total` must hold in integer minor units; if the invariant fails, normalisation returns `INVARIANT_VIOLATED` and the result is not returned to the caller. |
| AC-CNT-02-03 | [BE] | **Given** a Sabre segment response is received, **When** normalised, **Then** the segment is stored as a common envelope with `product_type: AIR` and a versioned JSONB typed payload containing product-specific attributes. |
| AC-CNT-02-04 | [BE] | **Given** any Sabre API call is made, **When** the raw response is received (success or error), **Then** the raw payload is persisted to S3 with the `correlation_id` for audit and reconciliation. |
| AC-CNT-02-05 | [BE] | **Given** a Sabre error code is received, **When** the normaliser processes it, **Then** it is mapped to a canonical platform `error_code` — no raw Sabre codes are exposed in the platform API response. |

---

### REQ-CNT-03 — Outbound Idempotency for Supplier Calls

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-CNT-03-01 | [BE] | **Given** a mutating Sabre call is about to be issued, **When** the idempotency key is generated, **Then** a record with `status: PENDING` is written to `idempotency_record` in PostgreSQL and the transaction is committed before the HTTP call is issued. |
| AC-CNT-03-02 | [BE] | **Given** the Sabre call succeeds, **When** the response is received, **Then** the idempotency record status is updated to `COMPLETE` and the response body is stored in the same database transaction as the spine state change. |
| AC-CNT-03-03 | [BE] | **Given** a retry arrives for an idempotency key with `status: COMPLETE`, **When** the store is checked, **Then** the stored response is returned verbatim without issuing a second Sabre call. |
| AC-CNT-03-04 | [BE] | **Given** a retry arrives for an idempotency key with `status: PENDING`, **When** the store is checked, **Then** HTTP 409 with `error_code: SUPPLIER_OUTCOME_UNKNOWN` and `retry_eligible: false` is returned; the supplier is queried and the state is reconciled — no re-issuance. |
| AC-CNT-03-05 | [BE] | **Given** the same idempotency key is submitted with a different `request_hash`, **When** the store is checked, **Then** HTTP 409 with `error_code: CONFLICT_DUPLICATE` is returned. |

---

### REQ-CNT-04 — Webhook Ingestion

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-CNT-04-01 | [BE] | **Given** a Sabre webhook POST arrives with a valid HMAC-SHA256 signature and a signed timestamp within ±5 minutes, **When** the ingestion handler processes it, **Then** the raw payload is persisted to S3, `supplier message_id` deduplication is checked, a `SupplierWebhookReceived` event is written to the outbox, and HTTP 200 is returned — all before any spine mutation. |
| AC-CNT-04-02 | [BE] | **Given** a Sabre webhook POST arrives with an invalid or absent HMAC-SHA256 signature, **When** the handler validates the request, **Then** HTTP 401 is returned immediately and no processing occurs. |
| AC-CNT-04-03 | [BE] | **Given** a Sabre webhook POST arrives with a valid signature but a timestamp outside ±5 minutes, **When** the handler validates the request, **Then** HTTP 401 is returned (replay protection) and no processing occurs. |
| AC-CNT-04-04 | [BE] | **Given** a duplicate webhook is received (same `supplier message_id`), **When** the deduplication check runs, **Then** HTTP 200 is returned and the event is not re-enqueued or re-processed. |
| AC-CNT-04-05 | [BE] | **Given** a `SupplierWebhookReceived` event is consumed for a `PENDING_ISSUE` booking ticket confirmation, **When** the consumer processes it, **Then** the aggregate version is checked — the ticket number is applied only if the event is newer than the current state; a `CONFIRMED` record is never overwritten with stale data. |
| AC-CNT-04-06 | [BE] | **Given** a webhook event fails processing after the retry budget is exhausted, **When** the DLQ handler runs, **Then** the event is moved to the DLQ table and an operational alert is raised; no spine state mutation occurs from within the HTTP handler. |

---

### REQ-CNT-05 — Supplier Reconciliation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-CNT-05-01 | [BE] | **Given** the reconciliation job runs, **When** a booking exists locally but not at Sabre, **Then** a `supplier_reconciliation_exception` record of type `MISSING_AT_SUPPLIER` is created and `ReconciliationExceptionRaised` is emitted. |
| AC-CNT-05-02 | [BE] | **Given** the reconciliation job runs, **When** a ticket exists at Sabre with no local record (`ORPHAN_TICKET`), **Then** an exception record is created, `ReconciliationExceptionRaised` is emitted, and an immediate operational page alert fires. |
| AC-CNT-05-03 | [BE] | **Given** the reconciliation job runs, **When** booking or ticket status differs between the platform and Sabre, **Then** a `STATUS_DRIFT` exception is created. The platform state is **not** automatically updated. |
| AC-CNT-05-04 | [BE] | **Given** the reconciliation job runs, **When** ticket amounts or taxes differ between the platform and Sabre, **Then** an `AMOUNT_DRIFT` exception is created. No financial correction is applied automatically. |
| AC-CNT-05-05 | [BE] | **Given** the reconciliation job has not completed within 2× its scheduled interval, **When** the liveness metric `reconciliation.run.age_seconds` is evaluated, **Then** an operational alert fires — a stalled reconciler is a service readiness failure. |

---

## 3. POLICY DOMAIN

### REQ-POL-01 — Synchronous Policy Evaluation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-01-01 | [BE] | **Given** a booking request is received, **When** policy is evaluated, **Then** all active rules for the tenant are loaded, each is evaluated against the booking context, and the most restrictive matching outcome is returned: `BLOCK > REQUIRE_APPROVAL > WARN > ALLOW`. |
| AC-POL-01-02 | [BE] | **Given** two rules match with the same outcome, **When** conflict resolution runs, **Then** the rule with the higher `scope_level` specificity wins (TRIP=5 > TRAVELER=4 > DEPARTMENT=3 > TENANT=2 > GLOBAL=1); ties resolved by later `effective_from`; further ties by ascending `rule_id`. |
| AC-POL-01-03 | [BE] | **Given** a policy evaluation completes, **When** the result is persisted, **Then** a `policy_decision_snapshot` record is written containing `outcome`, matched rules array (each with `rule_id`, `rule_version`, `scope_level`, `specificity`, `enforcement_level`, `rationale`), and `rule_set_version` — the record is never subsequently updated. |
| AC-POL-01-04 | [BE] | **Given** the policy evaluator does not respond within 200 ms, **When** the timeout fires, **Then** the booking request fails with HTTP 503 `DOWNSTREAM_UNAVAILABLE`; the GDS hold is not created. |

---

### REQ-POL-02 — Policy Rule Schema and Versioning

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-02-01 | [BE] | **Given** a policy rule file is deployed, **When** loaded by the evaluator, **Then** it passes schema validation: `rule_id`, `rule_version`, `enforcement_level` (BLOCK/REQUIRE_APPROVAL/WARN/ALLOW), `scope_level` (GLOBAL/TENANT/DEPARTMENT/TRAVELER/TRIP), `override_allowed` (boolean), and at least one `condition` must all be present; missing fields cause load-time rejection. |
| AC-POL-02-02 | [BE] | **Given** a rule with `enforcement_level: BLOCK`, **When** the file is loaded, **Then** `override_allowed` must be `false`; any `BLOCK` rule with `override_allowed: true` is rejected at load time. |
| AC-POL-02-03 | [BE] | **Given** a new rule set version is deployed, **When** the evaluator hot-reloads, **Then** all subsequent evaluations use the new `rule_set_version` and no in-flight evaluation is interrupted. |
| AC-POL-02-04 | [BE] | **Given** a rule has an `effective_to` date in the past, **When** the evaluator runs, **Then** the rule is not applied to new evaluations. |
| AC-POL-02-05 | [BE] | **Given** a rule has an `effective_from` date in the future, **When** the evaluator runs before that date, **Then** the rule is not applied to current evaluations. |

---

### REQ-POL-03 — Policy Override

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-03-01 | [BE] | **Given** a `WARN` rule outcome is overridden, **When** the override is submitted, **Then** a `policy_override` record is inserted with `reason_code` (from the tenant enum), `actor_id` (PII pointer), `actor_role: TRAVELER`, and `snapshot_id` — the `policy_decision_snapshot` row is not modified. |
| AC-POL-03-02 | [BE] | **Given** a `REQUIRE_APPROVAL` outcome is overridden by the approver, **When** the approval is processed, **Then** a `policy_override` record is inserted and a `PolicyOverrideRecorded` event is written to the outbox. |
| AC-POL-03-03 | [BE] | **Given** an override attempt targets a `BLOCK` rule outcome, **When** the system processes the request, **Then** HTTP 422 with `error_code: POLICY_BLOCKED` is returned; no override record is created. |
| AC-POL-03-04 | [BE] | **Given** a `WARN` override is submitted without a `reason_code`, **When** validated, **Then** HTTP 400 with `error_code: VALIDATION_ERROR` identifying the missing field is returned; no override record is created. |
| AC-POL-03-06 | [BE] | **Given** a `PolicyOverrideRecorded` event is dispatched, **When** the reporting consumer processes it, **Then** the `override_reason_code` dimension (D9) is populated on the corresponding `financial_event` row. |

---

### REQ-POL-04 — BLOCK Rule Behaviour

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-04-01 | [BE] | **Given** a booking request matches a `BLOCK` rule, **When** the evaluator returns `outcome: BLOCK`, **Then** no Sabre hold is created, no booking record is persisted, and HTTP 422 with `error_code: POLICY_BLOCKED` and the rule rationale is returned. |
| AC-POL-04-02 | [BE] | **Given** a `BLOCK` outcome is active, **When** any authenticated user (including `ADMIN`) attempts an override, **Then** HTTP 422 with `error_code: POLICY_BLOCKED` is returned. |

---

## 4. PAYMENT & EXPENSE DOMAIN

### REQ-PAY-01 — Financial Event Recording (21 Dimensions)

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-01-01 | [BE] | **Given** a ticket is issued, **When** the `financial_event` row is written, **Then** all 21 dimensions (D1–D22; D9 nullable only when no override occurred) are present and non-null for D1–D8 and D10–D22. |
| AC-PAY-01-02 | [BE] | **Given** org hierarchy is retrieved from a live source at confirmation, **When** the financial event is written, **Then** `dimension_source: LIVE` and `dimension_snapshot_age_seconds: 0` are recorded. |
| AC-PAY-01-03 | [BE] | **Given** org hierarchy is retrieved from cache (staleness ≤ 24 hours), **When** the financial event is written, **Then** `dimension_source: CACHED` and the actual cache age in seconds are recorded. |
| AC-PAY-01-04 | [BE] | **Given** no org hierarchy snapshot exists or the cache exceeds 24 hours, **When** confirmation is attempted, **Then** confirmation is blocked — the financial event is never written with null dimension values. |
| AC-PAY-01-05 | [BE] | **Given** a financial event is written, **When** any subsequent process reads it, **Then** no field is updated or overwritten; the `financial_event` table permits no UPDATE or DELETE at the database role level. |
| AC-PAY-01-06 | [BE] | **Given** Phase 1 operates USD-only, **When** a financial event is written, **Then** `sale_currency`, `settlement_currency`, and `reporting_currency` are all `USD`; `amount_sale = amount_settlement = amount_reporting`; FX rates are both `1.00000000`. |

---

### REQ-PAY-02 — Cost Allocation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-02-01 | [BE] | **Given** per-passenger cost allocations are declared in the confirm request, **When** expanded across financial legs, **Then** for every leg: `Σ cost_allocation.allocated_amount = financial_leg.amount` in integer minor units with no silent rounding. |
| AC-PAY-02-02 | [BE] | **Given** allocations are expanded across all legs of a ticket, **When** the expansion completes, **Then** `Σ allocated_amounts across all legs = ticket.total_amount`. |
| AC-PAY-02-03 | [BE] | **Given** percentage splits are applied using the largest-remainder algorithm, **When** rounding is applied, **Then** the lowest-`priority` split absorbs the remainder — the invariant holds exactly. |
| AC-PAY-02-04 | [BE] | **Given** percentage splits for a passenger do not sum to 100%, **When** validated, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned before any allocation is written. |
| AC-PAY-02-05 | [BE] | **Given** a fixed-amount split value does not equal the leg amount after expansion, **When** validated, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned. |
| AC-PAY-02-06 | [BE] | **Given** a `CostAllocationRecorded` event is dispatched, **When** the ERP posting stub (Sprint 1) receives it, **Then** the event is acknowledged without error and allocation data is preserved for Sprint 2 full posting. |

---

### REQ-PAY-03 — Refund Request

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-03-01 | [BE] | **Given** a ticket is `ISSUED` with all coupons `OPEN` and `is_refundable: true`, **When** a refund request is submitted, **Then** a `refund` record is created with `status: REQUESTED`, `refund_type: FULL_REFUND`, `gross_amount`, `penalty_amount` (from `ticket.refund_penalty_amount`), `non_refundable_amount` (Σ non-refundable taxes and fees), `refund_amount = gross − penalty − non_refundable`, and `return_to: ORIGINAL_FORM_OF_PAYMENT`. |
| AC-PAY-03-02 | [BE] | **Given** `refund_amount` is computed, **When** `gross − penalty − non_refundable < 0`, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned and no refund record is created. |
| AC-PAY-03-03 | [BE] | **Given** at least one coupon is **not** `OPEN` (partial use), **When** a refund request is submitted, **Then** HTTP 422 with `error_code: REFUND_NOT_ELIGIBLE` is returned. |
| AC-PAY-03-04 | [BE] | **Given** `ticket.is_refundable: false`, **When** a refund request is submitted, **Then** HTTP 422 with `error_code: REFUND_NOT_ELIGIBLE` is returned. |
| AC-PAY-03-05 | [BE] | **Given** a `RefundRequested` event is dispatched, **When** processed by any consumer, **Then** no `financial_event` row is written and no allocation reversal occurs — ledger movement is deferred to `CONFIRMED`. |
| AC-PAY-03-06 | [BE] | **Given** a refund request is submitted without an `Idempotency-Key`, **When** the API gateway validates it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |

---

### REQ-PAY-04 — Refund Confirmation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-04-01 | [BE] | **Given** a `RefundConfirmed` event is received, **When** the payment module processes it, **Then** the `refund` record transitions to `CONFIRMED`, ticket coupons transition to `REFUNDED`, a ledger credit `financial_event` is written, and allocation reversals are inserted with `reverses_allocation_id` linking to the original rows. |
| AC-PAY-04-02 | [BE] | **Given** allocation reversals are written, **When** each row is inserted, **Then** `allocated_amount` is negative and reproduces the original proportions exactly — no fresh split is computed. |
| AC-PAY-04-03 | [BE] | **Given** a `RefundConfirmed` event is processed, **When** the allocation reversal invariant is checked, **Then** `Σ reversed_allocated_amounts = −refund.refund_amount`. |
| AC-PAY-04-04 | [BE] | **Given** a supplier rejects a refund, **When** `RefundRejected` is processed, **Then** the `refund` record transitions to `REJECTED`, the ticket reverts to `ISSUED`, no ledger movement occurs, and the notification consumer alerts the traveler. |
| AC-PAY-04-05 | [BE] | **Given** a `RefundConfirmed` event is received as a duplicate (same `refund_id` already `CONFIRMED`), **When** the consumer processes it, **Then** the event is discarded idempotently — no double credit is written. |

---

### REQ-PAY-05 — Void (Within ARC Same-Day Window)

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-05-01 | [BE] | **Given** a ticket is `ISSUED`, all coupons are `OPEN`, and `now() < ticket.void_window_expires_at`, **When** a void is requested, **Then** void is submitted to Sabre, the ticket transitions to `VOIDED`, coupons transition to `VOIDED`, full ledger reversal is written, allocation reversals are created via `reverses_allocation_id`, and `TicketVoided` is emitted. |
| AC-PAY-05-02 | [BE] | **Given** `now() >= ticket.void_window_expires_at`, **When** a void is attempted, **Then** HTTP 422 with `error_code: VOID_WINDOW_EXPIRED` is returned and the refund path is indicated. |
| AC-PAY-05-03 | [BE] | **Given** Sabre confirms the void, **When** local state is updated, **Then** the reversal amount equals the full ticket total and all cost-object allocations are reversed in original proportions. |
| AC-PAY-05-04 | [BE] | **Given** a void request is submitted without an `Idempotency-Key`, **When** the API gateway validates it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |

---

### REQ-PAY-06 — Form of Payment Tracking

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-06-01 | [BE] | **Given** a confirm request includes `payment_reference` and `payment_instrument_type` (LODGE_CARD or VIRTUAL_CARD), **When** the booking is confirmed, **Then** both values are stored on the `booking` record; the value must not match a 13–19 digit Luhn-valid card number pattern. |
| AC-PAY-06-02 | [BE] | **Given** a refund record is created, **When** `payment_reference` is copied from the booking, **Then** the value on the `refund` record is identical to `booking.payment_reference`. |
| AC-PAY-06-03 | [BE] | **Given** a financial audit queries the refund record, **When** the record is read, **Then** `return_to: ORIGINAL_FORM_OF_PAYMENT` and `payment_reference` are present and non-null. |

---

## 5. SERVICING DOMAIN

### REQ-SVC-01 — CONFIRM_EXCEPTION Handling

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-SVC-01-01 | [BE] | **Given** a ticket number is received from Sabre and any subsequent downstream write fails, **When** the error is handled, **Then** the booking transitions to `CONFIRM_EXCEPTION`, a `supplier_reconciliation_exception` record is created, `ConfirmExceptionRaised` is written to the outbox with the Sabre ticket reference and failed step, and `booking.confirm_exception.count` increments. |
| AC-SVC-01-02 | [BE] | **Given** a booking is in `CONFIRM_EXCEPTION` status, **When** any caller retries the confirm operation, **Then** HTTP 409 with `error_code: CONFIRM_EXCEPTION` and `retry_eligible: false` is returned. |
| AC-SVC-01-03 | [BE] | **Given** a `ConfirmExceptionRaised` event is emitted, **When** the monitoring system processes the metric, **Then** an immediate operational page alert is raised (threshold: any occurrence). |

---

### REQ-SVC-02 — Refund Submission to Supplier

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-SVC-02-01 | [BE] | **Given** a `refund` record is in `REQUESTED` status, **When** submitted to Sabre, **Then** a durable idempotency key is written to `idempotency_record` before the call, the supplier refund reference is stored in `refund.supplier_refund_ref`, and the ticket transitions to `REFUND_REQUESTED`. |
| AC-SVC-02-02 | [BE] | **Given** the Sabre refund submission times out and the idempotency record is `PENDING`, **When** the adapter handles the retry, **Then** `SUPPLIER_OUTCOME_UNKNOWN` is returned and the refund is routed to the reconciliation exception queue — no re-issuance. |
| AC-SVC-02-03 | [BE] | **Given** Sabre rejects the refund with a non-retryable error, **When** processed, **Then** the `refund` record transitions to `REJECTED`, a `RefundRejected` event is written to the outbox, and the ticket reverts to `ISSUED`. |

---

### REQ-SVC-03 — Illegal State Transition Rejection

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-SVC-03-01 | [BE] | **Given** any state transition is attempted that is not defined in the reservation, ticket, or approval state machines, **When** the system processes the request, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned and no state changes. |
| AC-SVC-03-02 | [BE] | **Given** a void is attempted on a ticket in `REFUND_REQUESTED` status, **When** validated, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |
| AC-SVC-03-03 | [BE] | **Given** a refund is requested for a ticket in `VOIDED` status, **When** validated, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |
| AC-SVC-03-04 | [BE] | **Given** a state-changing operation is attempted on a `COMPLETED` booking, **When** validated, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |

---

## 6. DATA DOMAIN

### REQ-DAT-01 — Transaction Spine Entities

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-DAT-01-01 | [BE] | **Given** any spine entity is created, **When** its ID is generated, **Then** it is a ULID (or UUIDv7) and is never derived from a GDS locator, ticket number, or supplier identifier. |
| AC-DAT-01-02 | [BE] | **Given** a ticket is issued for a two-segment itinerary, **When** the ticket is persisted, **Then** two `coupon` rows are written with `coupon_number` 1 and 2, each `status: OPEN`, each referencing the correct `segment_id`. |
| AC-DAT-01-03 | [BE] | **Given** a new GDS locator is received for an existing booking, **When** stored, **Then** a new `supplier_mapping` row is inserted with `valid_from = now()` and `valid_to` is set on the prior row — no DELETE or UPDATE on the prior row. |
| AC-DAT-01-04 | [BE] | **Given** any repository method is called, **When** it executes a query, **Then** `tenant_id` is the first argument and no query returns records from a different tenant. |
| AC-DAT-01-05 | [BE] | **Given** a stale GDS locator (past `valid_to`) is used to look up a booking, **When** the supplier mapping is queried with historical inclusion, **Then** the system resolves it to the correct booking via the historical mapping row. |

---

### REQ-DAT-02 — Append-Only Immutable Tables

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-DAT-02-01 | [BE] | **Given** the application database role is applied, **When** UPDATE or DELETE is attempted against `supplier_mapping`, `financial_event`, `policy_decision_snapshot`, or `policy_override`, **Then** the database rejects the operation — the application role holds no UPDATE or DELETE privilege on these tables. |
| AC-DAT-02-02 | [BE] | **Given** a financial leg is superseded, **When** the change is persisted, **Then** a new `financial_leg` row is inserted with `status: ACTIVE` and the prior row's `status` is updated to `SUPERSEDED` with `superseded_by` pointing to the new row — the prior row's `amount` is never modified. |
| AC-DAT-02-03 | [BE] | **Given** a policy decision is overridden, **When** the override is recorded, **Then** a new `policy_override` row is inserted referencing `snapshot_id` — the `policy_decision_snapshot` row is not modified. |

---

### REQ-DAT-03 — PII Pointer Model and GDPR Erasure

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-DAT-03-01 | [BE] | **Given** any spine entity is created, **When** the record is written, **Then** no raw traveler name, email address, passport number, or date of birth is present in any column — only the opaque `traveler_id` pointer. |
| AC-DAT-03-02 | [BE] | **Given** a GDPR erasure request is received, **When** processed, **Then** the traveler's PII record is deleted from the PII store; all spine records retain their `traveler_id` pointer and remain intact. |
| AC-DAT-03-03 | [BE] | **Given** a GDPR erasure is completed, **When** any financial audit or reporting query runs, **Then** the query succeeds, returns the financial record with the opaque `traveler_id`, and does not produce a broken-reference error. |
| AC-DAT-03-04 | [BE] | **Given** any service emits a log line, **When** the log sanitiser scans it in CI, **Then** no raw traveler name, email address, or passport number is present. |

---

### REQ-DAT-04 — Transactional Outbox and Event Delivery

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-DAT-04-01 | [BE] | **Given** a spine state change is persisted, **When** the transaction commits, **Then** a corresponding `outbox` row is committed in the same transaction — state change and event are never split across two transactions. |
| AC-DAT-04-02 | [BE] | **Given** the outbox dispatcher polls undispatched rows, **When** a row is delivered, **Then** `dispatched_at` is set; if delivery fails, `attempt_count` increments and the row is retried within the configured backoff. |
| AC-DAT-04-03 | [BE] | **Given** an outbox row exceeds the retry budget, **When** the dispatcher handles it, **Then** it is moved to the DLQ table and an operational alert fires — it is never silently discarded. |
| AC-DAT-04-04 | [BE] | **Given** a consumer receives a duplicate event (same `event_id`), **When** processed, **Then** the duplicate is discarded without reapplying the state change. |
| AC-DAT-04-05 | [BE] | **Given** a consumer receives an event older than the state already applied, **When** processed, **Then** the stale event is discarded — the current state is never overwritten. |
| AC-DAT-04-06 | [BE] | **Given** the outbox dispatcher has not completed a cycle within the health check interval, **When** `/health/ready` is called on Deployable B, **Then** HTTP non-200 is returned — a stalled dispatcher is a readiness failure. |

---

### REQ-DAT-05 — Multi-Tenant Data Isolation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-DAT-05-01 | [BE] | **Given** an authenticated request carries a `tenant_id` claim in the JWT, **When** any repository method executes, **Then** `WHERE tenant_id = :tenantId` is appended to every query and calls with a null or empty `tenant_id` are rejected. |
| AC-DAT-05-02 | [BE] | **Given** a request carries `tenant_id: tenant_A` and requests a resource belonging to `tenant_B`, **When** the system validates the scope, **Then** HTTP 404 is returned — not 403. |
| AC-DAT-05-03 | [BE] | **Given** a JWT without a `tenant_id` claim is presented, **When** the token is validated, **Then** HTTP 401 with `error_code: AUTHENTICATION_FAILED` is returned before any data access. |

---

## 7. CROSS-CUTTING

### REQ-XCT-01 — Correlation ID Propagation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-01-01 | [BE] | **Given** an inbound request lacks `X-Correlation-ID`, **When** the API gateway processes it, **Then** a new ULID is generated and attached before the request reaches any service. |
| AC-XCT-01-02 | [BE] | **Given** a service makes an outbound call (to another service or to Sabre), **When** the request is formed, **Then** the `X-Correlation-ID` header is forwarded unchanged. |
| AC-XCT-01-03 | [BE] | **Given** an outbox event is written, **When** the event envelope is constructed, **Then** `correlation_id` is non-null in the envelope. |
| AC-XCT-01-04 | [BE] | **Given** a financial event is written, **When** the row is inserted, **Then** `financial_event.correlation_id` is non-null and matches the correlation ID from the originating booking request. |

---

### REQ-XCT-02 — Authentication and Role-Based Access

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-02-01 | [BE] | **Given** a request arrives at any endpoint with an absent or expired JWT, **When** validated, **Then** HTTP 401 with `error_code: AUTHENTICATION_FAILED` is returned before any business logic runs. |
| AC-XCT-02-02 | [BE] | **Given** a valid JWT is presented but the caller's role does not permit the operation, **When** authorization is enforced, **Then** HTTP 403 with `error_code: AUTHORIZATION_DENIED` is returned. |
| AC-XCT-02-03 | [BE] | **Given** a user with `ADMIN` or `APPROVER` role attempts to authenticate, **When** the IdP processes the login, **Then** MFA is enforced from Phase 1 — login without a valid MFA challenge is rejected. |
| AC-XCT-02-04 | [BE] | **Given** Deployable A makes a call to Deployable B, **When** the connection is established, **Then** mTLS is used — plaintext HTTP between deployables is never accepted in any environment. |
| AC-XCT-02-05 | [BE] | **Given** a JWT `tenant_id` claim does not match the resource being accessed, **When** validated, **Then** HTTP 404 is returned — not 403 — to avoid confirming cross-tenant resource existence. |

---

### REQ-XCT-03 — Idempotency on All Mutating Endpoints

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-03-01 | [BE] | **Given** a mutating request arrives without an `Idempotency-Key` header, **When** the API gateway validates it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned before any business logic runs. |
| AC-XCT-03-02 | [BE] | **Given** an `Idempotency-Key` was previously processed to completion, **When** the same key is resubmitted, **Then** the original HTTP status and response body are returned without re-executing the operation. |
| AC-XCT-03-03 | [BE] | **Given** an `Idempotency-Key` is in `PENDING` status, **When** resubmitted, **Then** HTTP 409 with `error_code: SUPPLIER_OUTCOME_UNKNOWN` is returned — no re-execution. |

---

### REQ-XCT-04 — Structured Logging and Observability

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-04-01 | [BE] | **Given** any service emits a log line, **When** written, **Then** it is valid JSON containing `timestamp` (ISO 8601 UTC), `level`, `service`, `correlation_id`, and `tenant_id` — all non-null. |
| AC-XCT-04-02 | [BE] | **Given** a log sanitiser runs in CI against all log output, **When** it scans, **Then** no raw traveler name, email address, or passport number is present in any log line from any service. |
| AC-XCT-04-03 | [BE] | **Given** an outbound Sabre call is made, **When** the OpenTelemetry span is created, **Then** the span includes `supplier`, `operation`, and `idempotency_key` as attributes. |
| AC-XCT-04-04 | [BE] | **Given** a health check is issued, **When** `GET /health/live` is called, **Then** HTTP 200 is returned if the process is running. **When** `GET /health/ready` is called, **Then** HTTP 200 is returned only if the database, Redis connections are healthy and (Deployable B) the outbox dispatcher has completed a recent cycle. |

---

### REQ-XCT-05 — Error Response Format

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-05-01 | [BE] | **Given** any API error occurs, **When** the response is serialised, **Then** `Content-Type: application/problem+json` is set with body fields `type`, `title`, `status`, `error_code`, `correlation_id`, and `detail`. |
| AC-XCT-05-02 | [BE] | **Given** an unhandled server error occurs, **When** the error response is returned, **Then** HTTP 500 with `error_code: INTERNAL_ERROR` is returned; no stack trace, internal path, or PII appears in the response body. |

---

### REQ-XCT-06 — No Raw PAN Storage or Transmission

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-06-01 | [BE] | **Given** a confirm request is received, **When** `payment_reference` is stored, **Then** a CI security scan verifies the value does not match a 13–19 digit Luhn-valid card number pattern. |
| AC-XCT-06-02 | [BE] | **Given** any log, database column, or API response is scanned, **When** a PAN-pattern scan runs, **Then** no 13–19 digit numeric sequence matching the Luhn algorithm is present in any stored or transmitted value. |
| AC-XCT-06-03 | [BE] | **Given** GDS credentials and application configuration are scanned, **When** a secrets scan runs, **Then** no PAN, CVV, or card expiry date is present in any configuration artifact. |

---

## 8. HITL ITEMS AFFECTING BACK-END

### HITL-REQ-01 — Notification Template PII Content Policy
🔴 **OPEN.** Email notification template content (beyond booking reference and expiry/amount data) is blocked pending Compliance/Legal decision. Affects AC-EXP-08-01 through AC-EXP-08-04.

### HITL-REQ-02 — ASC 606 / IFRS 15 Gross vs. Net Revenue Treatment
🔴 **OPEN.** ERP posting logic for `FinancialEventRecorded` (Sprint 2) cannot be implemented until Finance confirms gross vs. net recognition. Sprint 1 stub is approved. Affects REQ-PAY-01 downstream ERP consumer — no AC can be written for ERP revenue posting until resolved.

### HITL-REQ-03 — Host Partner Selection and Sabre PCC Availability
🟡 **IN PROGRESS.** AC-EXP-03-01/02 and AC-CNT-01-01/02 depend on the host PCC being available in the staging environment. Sprint 1 uses wiremock fixture-based testing. Live ticketing tests are gated on PCC availability.

---

## 9. BE TRACEABILITY MATRIX

| AC ID | Req ID | Description |
|-------|--------|-------------|
| AC-EXP-01-01 | REQ-EXP-01 | Search returns offers with amounts in minor units + ISO 4217 |
| AC-EXP-01-05 | REQ-EXP-01 | Search p99 response ≤ 3000 ms |
| AC-EXP-01-06 | REQ-EXP-01 | Empty results → HTTP 200, not error |
| AC-EXP-01-07 | REQ-EXP-01 | GDS unavailable → HTTP 503 GDS_UNAVAILABLE |
| AC-EXP-01-08 | REQ-EXP-01 | Missing field → HTTP 400 VALIDATION_ERROR |
| AC-EXP-02-01 | REQ-EXP-02 | Booking hold created, GDS locator stored |
| AC-EXP-02-02 | REQ-EXP-02 | Policy evaluated synchronously, snapshotted |
| AC-EXP-02-03 | REQ-EXP-02 | BLOCK → no hold, no booking, HTTP 422 |
| AC-EXP-02-04 | REQ-EXP-02 | REQUIRE_APPROVAL → PENDING approval record created |
| AC-EXP-02-06 | REQ-EXP-02 | No Idempotency-Key → HTTP 400 |
| AC-EXP-02-07 | REQ-EXP-02 | Duplicate key → cached response returned |
| AC-EXP-02-08 | REQ-EXP-02 | Sabre non-retryable → HTTP 502, no booking |
| AC-EXP-02-09 | REQ-EXP-02 | Multi-passenger → passenger rows created |
| AC-EXP-03-01 | REQ-EXP-03 | Confirm → PENDING_ISSUE, outbox event emitted |
| AC-EXP-03-02 | REQ-EXP-03 | Ticket received → CONFIRMED, coupons, financial legs |
| AC-EXP-03-03 | REQ-EXP-03 | Downstream write fail → CONFIRM_EXCEPTION |
| AC-EXP-03-04 | REQ-EXP-03 | PENDING_ISSUE SLO alert at 30 min |
| AC-EXP-03-05 | REQ-EXP-03 | Expired hold → HTTP 409 on confirm |
| AC-EXP-03-06 | REQ-EXP-03 | Splits ≠ 100% → HTTP 422 INVARIANT_VIOLATED |
| AC-EXP-03-09 | REQ-EXP-03 | No Idempotency-Key → HTTP 400 |
| AC-EXP-04-01 | REQ-EXP-04 | Cancel pre-ticket, hold released |
| AC-EXP-04-02 | REQ-EXP-04 | Cancel within void window response |
| AC-EXP-04-03 | REQ-EXP-04 | Cancel outside void window response |
| AC-EXP-04-04 | REQ-EXP-04 | Refundable amount invariant ≥ 0 |
| AC-EXP-04-06 | REQ-EXP-04 | COMPLETED cancel → HTTP 409 |
| AC-EXP-04-07 | REQ-EXP-04 | No Idempotency-Key → HTTP 400 |
| AC-EXP-04-08 | REQ-EXP-04 | CONFIRMED → CANCELLED guard on ticket status |
| AC-EXP-05-01 | REQ-EXP-05 | Trip detail returns bookings and segments |
| AC-EXP-05-02 | REQ-EXP-05 | Cross-tenant trip → HTTP 404 |
| AC-EXP-05-03 | REQ-EXP-05 | Non-existent trip → HTTP 404 |
| AC-EXP-06-01 | REQ-EXP-06 | Expiry → EXPIRED, hold released, notified |
| AC-EXP-06-02 | REQ-EXP-06 | Approval expiry → EXPIRED, never auto-approve |
| AC-EXP-06-04 | REQ-EXP-06 | Confirm on EXPIRED → HTTP 409 |
| AC-EXP-07-01 | REQ-EXP-07 | APPROVED decision recorded |
| AC-EXP-07-02 | REQ-EXP-07 | Idempotent replay of approval |
| AC-EXP-07-03 | REQ-EXP-07 | REJECTED → CANCELLED, hold released |
| AC-EXP-07-04 | REQ-EXP-07 | Non-approver role → HTTP 403 |
| AC-EXP-08-01 | REQ-EXP-08 | BookingHeld notification (interim PII constraint) |
| AC-EXP-08-02 | REQ-EXP-08 | ApprovalRequested notification |
| AC-EXP-08-03 | REQ-EXP-08 | BookingExpired notification |
| AC-EXP-08-04 | REQ-EXP-08 | RefundConfirmed notification |
| AC-EXP-08-05 | REQ-EXP-08 | Retry without duplicate notification |
| AC-CNT-01-01 to 08 | REQ-CNT-01 | Sabre adapter: credentials, token, normalise, hold, errors, circuit breaker, capability |
| AC-CNT-02-01 to 05 | REQ-CNT-02 | Normalisation: minor units, invariant, segment, S3 audit, error mapping |
| AC-CNT-03-01 to 05 | REQ-CNT-03 | Idempotency: durable write, complete, cached response, PENDING guard, hash conflict |
| AC-CNT-04-01 to 06 | REQ-CNT-04 | Webhooks: HMAC, timestamp, dedup, version-aware, DLQ |
| AC-CNT-05-01 to 05 | REQ-CNT-05 | Reconciliation: MISSING_AT_SUPPLIER, ORPHAN_TICKET, STATUS_DRIFT, AMOUNT_DRIFT, stall alert |
| AC-POL-01-01 to 04 | REQ-POL-01 | Evaluate: precedence, conflict resolution, snapshot, 200 ms timeout |
| AC-POL-02-01 to 05 | REQ-POL-02 | Rule schema: load validation, BLOCK+override, hot-reload, effectivity dates |
| AC-POL-03-01 to 04,06 | REQ-POL-03 | Override: WARN record, REQUIRE_APPROVAL record, BLOCK rejected, reason required, D9 update |
| AC-POL-04-01 to 02 | REQ-POL-04 | BLOCK: no hold/booking, ADMIN cannot override |
| AC-PAY-01-01 to 06 | REQ-PAY-01 | Financial event: 21 dims, live/cached provenance, blocking on null, append-only, USD-only |
| AC-PAY-02-01 to 06 | REQ-PAY-02 | Cost allocation: leg invariant, ticket invariant, largest-remainder, validation, stub |
| AC-PAY-03-01 to 06 | REQ-PAY-03 | Refund request: create record, invariant, partial use, non-refundable, no ledger, idempotency |
| AC-PAY-04-01 to 05 | REQ-PAY-04 | Refund confirm: CONFIRMED, reversal, invariant, rejected, idempotent |
| AC-PAY-05-01 to 04 | REQ-PAY-05 | Void: eligibility, window expired, full reversal, idempotency |
| AC-PAY-06-01 to 03 | REQ-PAY-06 | FOP: non-PAN storage, copied to refund, audit presence |
| AC-SVC-01-01 to 03 | REQ-SVC-01 | CONFIRM_EXCEPTION: transition, no retry, alert |
| AC-SVC-02-01 to 03 | REQ-SVC-02 | Refund submission: durable key, PENDING guard, rejection |
| AC-SVC-03-01 to 04 | REQ-SVC-03 | Illegal transitions: generic, void on REFUND_REQUESTED, refund on VOIDED, COMPLETED |
| AC-DAT-01-01 to 05 | REQ-DAT-01 | Spine: ULID, coupons, supplier mapping append-only, tenant-scoped, historical lookup |
| AC-DAT-02-01 to 03 | REQ-DAT-02 | Append-only: DB role, supersession pattern, override new row |
| AC-DAT-03-01 to 04 | REQ-DAT-03 | PII: no raw PII on spine, erasure safe, audit intact, log clean |
| AC-DAT-04-01 to 06 | REQ-DAT-04 | Outbox: same-tx, dispatch, DLQ, idempotent consumer, version-aware, health check |
| AC-DAT-05-01 to 03 | REQ-DAT-05 | Tenant isolation: mandatory tenant_id, 404 on cross-tenant, 401 on missing claim |
| AC-XCT-01-01 to 04 | REQ-XCT-01 | Correlation ID: gateway generation, forwarded, in envelope, in financial_event |
| AC-XCT-02-01 to 05 | REQ-XCT-02 | Auth: 401, 403, MFA for ADMIN/APPROVER, mTLS, 404 on cross-tenant |
| AC-XCT-03-01 to 03 | REQ-XCT-03 | Idempotency: missing key, cached response, PENDING guard |
| AC-XCT-04-01 to 04 | REQ-XCT-04 | Logging: JSON structure, PII scan, OTEL span attributes, health endpoints |
| AC-XCT-05-01 to 02 | REQ-XCT-05 | Error format: problem+json fields, no stack trace |
| AC-XCT-06-01 to 03 | REQ-XCT-06 | No PAN: Luhn scan, log/DB scan, config scan |

**Total BE / FE+BE criteria: 138**

---

**Status: READY FOR HIL REVIEW**
