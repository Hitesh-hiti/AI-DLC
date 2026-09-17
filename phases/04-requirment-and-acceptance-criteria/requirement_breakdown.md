# TravelPlatform — Requirement Breakdown & Acceptance Criteria

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Sources:**  
- `RequirementDocument.md` (platform intent)  
- `phases/02-gap-analysis-and-specification/gap-analysis.md` v0.5  
**Architect + PO Sign-off:** APPROVED 2026-09-10  
**Scope:** Phase 1 MVP only. Deferred items are noted but carry no acceptance criteria.

---

## DOCUMENT CONVENTIONS

| Symbol | Meaning |
|--------|---------|
| `REQ-xxx` | Unique requirement identifier |
| `AC-xxx-nn` | Acceptance criterion tied to its requirement |
| `[FE]` | Front-end implementation concern |
| `[BE]` | Back-end implementation concern |
| `[FE+BE]` | Shared concern — both layers must satisfy |
| 🔴 **HITL REQUIRED** | Contradiction, ambiguity, or missing information that requires a human decision before implementation |
| ✅ RESOLVED | Previously flagged item now resolved |

---

## TABLE OF CONTENTS

1. [Domain 1 — Experience](#1-domain-1--experience)
2. [Domain 2 — Content (GDS Adapter)](#2-domain-2--content-gds-adapter)
3. [Domain 3 — Policy Evaluation](#3-domain-3--policy-evaluation)
4. [Domain 4 — Payment & Expense](#4-domain-4--payment--expense)
5. [Domain 5 — Servicing](#5-domain-5--servicing)
6. [Domain 6 — Data (Transaction Spine)](#6-domain-6--data-transaction-spine)
7. [Cross-Cutting Requirements](#7-cross-cutting-requirements)
8. [HITL Items Register](#8-hitl-items-register)
9. [Requirement → Acceptance Criteria Traceability Matrix](#9-requirement--acceptance-criteria-traceability-matrix)

---

## 1. DOMAIN 1 — EXPERIENCE

> **Source:** RequirementDocument.md ("continuous experience from travel discovery and booking through payment, trip management"), gap-analysis.md Q1, Q7, Q9.  
> **Phase 1 scope:** Full implementation — search, book, hold, confirm, cancel, trip management.

---

### REQ-EXP-01 — Travel Search

**Statement:** The platform shall allow a traveler to search for available air travel options by specifying origin, destination, departure date, return date, passenger count, and cabin class. Results shall be drawn from the Sabre GDS in real time.

**Source:** RequirementDocument.md §"travel discovery and booking"; gap-analysis.md Q2, Q6.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-01-01 | [FE+BE] | **Given** a traveler provides origin, destination, departure date, return date, at least one passenger, and cabin class, **When** they submit the search, **Then** the system returns a list of available offers from Sabre including base fare, itemised taxes, fees, and total in integer minor units with ISO 4217 currency code. |
| AC-EXP-01-02 | [FE] | **Given** the search form is displayed, **When** the traveler leaves origin or destination blank, **Then** the form prevents submission and displays a field-level validation message identifying the missing field. |
| AC-EXP-01-03 | [FE] | **Given** the traveler enters a departure date in the past, **When** they attempt to submit the search, **Then** the form prevents submission and displays an error indicating the departure date must be today or a future date. |
| AC-EXP-01-04 | [FE] | **Given** a return date is provided, **When** it is earlier than or equal to the departure date, **Then** the form prevents submission and displays an error indicating the return date must be after the departure date. |
| AC-EXP-01-05 | [BE] | **Given** a valid search request is received, **When** the Sabre adapter returns results within the SLO, **Then** the response is returned to the caller within 3000 ms at p99. |
| AC-EXP-01-06 | [BE] | **Given** a valid search request is received, **When** Sabre returns no available offers, **Then** the system returns an empty offers array and HTTP 200 — not an error. |
| AC-EXP-01-07 | [BE] | **Given** a valid search request is received, **When** Sabre is unavailable (circuit open or timeout), **Then** the system returns HTTP 503 with `error_code: GDS_UNAVAILABLE` and `retry_eligible: true`. |
| AC-EXP-01-08 | [BE] | **Given** a search request is received, **When** the request is missing any mandatory field (origin, destination, departure_date, at least one passenger), **Then** the system returns HTTP 400 with `error_code: VALIDATION_ERROR` identifying the missing field. |

---

### REQ-EXP-02 — Create Booking (Hold)

**Statement:** The platform shall allow a traveler to create a booking for a selected offer. The booking shall be sent to Sabre to acquire a hold (PNR). The resulting booking record shall have status `HELD` and a `hold_expires_at` timestamp. Policy shall be evaluated synchronously before the hold is confirmed to the caller.

**Source:** RequirementDocument.md §"booking"; gap-analysis.md Q1, Q2, Q7, Q9, Q10.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-02-01 | [FE+BE] | **Given** a traveler selects a valid offer and provides at least one passenger, **When** they submit a booking request with a unique `Idempotency-Key` header, **Then** the system creates a booking in `HELD` status, stores the Sabre GDS locator in the supplier mapping, returns `booking_id`, `hold_expires_at`, and the policy decision in the response. |
| AC-EXP-02-02 | [BE] | **Given** a booking request is received, **When** the booking is created, **Then** the policy evaluator is called synchronously, the decision is included in the response, and the decision is snapshotted onto the booking before the response is sent. |
| AC-EXP-02-03 | [BE] | **Given** policy evaluation returns `BLOCK`, **When** the booking request is processed, **Then** the hold is not created at Sabre, the booking record is not persisted, and HTTP 422 with `error_code: POLICY_BLOCKED` is returned. |
| AC-EXP-02-04 | [BE] | **Given** policy evaluation returns `REQUIRE_APPROVAL`, **When** the booking hold is created, **Then** the booking is stored in `HELD` status, an `approval` record is created in `PENDING` status, an `ApprovalRequested` event is emitted, and the response includes `approval.status: PENDING`. |
| AC-EXP-02-05 | [FE] | **Given** the booking response includes `approval.status: PENDING`, **When** the booking confirmation screen is rendered, **Then** the UI displays a clear message that the booking is pending approval and cannot be confirmed until approved. |
| AC-EXP-02-06 | [BE] | **Given** a booking request is received **without** an `Idempotency-Key` header, **When** the system processes the request, **Then** HTTP 400 is returned with `error_code: IDEMPOTENCY_KEY_MISSING`. |
| AC-EXP-02-07 | [BE] | **Given** an identical `Idempotency-Key` is submitted a second time for the same scope, **When** the system processes the retry, **Then** the original response is returned verbatim without creating a second booking or calling Sabre again. |
| AC-EXP-02-08 | [BE] | **Given** Sabre fails to create the hold, **When** the error is non-retryable (structured GDS error), **Then** HTTP 502 with `error_code: GDS_HOLD_FAILED` and `retry_eligible: false` is returned and no booking record is persisted. |
| AC-EXP-02-09 | [BE] | **Given** a booking is created for multiple passengers, **When** the booking record is stored, **Then** a `passenger` record is created for each passenger, each linked to the booking with a `traveler_id` PII pointer and a `passenger_type`. |
| AC-EXP-02-10 | [FE] | **Given** the policy evaluation returns one or more `WARN` outcomes, **When** the booking hold result is displayed, **Then** the UI renders each warning message alongside the booking details without blocking the user from proceeding to confirm. |

---

### REQ-EXP-03 — Confirm Booking (Issue Ticket via Ticketing Queue)

**Statement:** The platform shall allow a traveler to confirm a `HELD` booking by providing a payment instrument reference and cost allocation. The booking shall be placed on the host agency ticketing queue (Model B — ADR-009). The booking transitions to `PENDING_ISSUE` at queue placement and to `CONFIRMED` only when the ticket number is received via webhook or reconciliation.

**Source:** gap-analysis.md Q1, Q3, Q7, Q8, ADR-009 (Model B).

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-03-01 | [FE+BE] | **Given** a booking is in `HELD` status and approval is `NOT_REQUIRED` or `APPROVED`, **When** the traveler submits a confirm request with a payment reference and cost allocations per passenger, **Then** the booking transitions to `PENDING_ISSUE`, a `BookingQueuedForTicketing` event is emitted, and the response returns `status: PENDING_ISSUE`. |
| AC-EXP-03-02 | [BE] | **Given** a ticket number is received (via webhook or reconciliation) for a `PENDING_ISSUE` booking, **When** the ticket and coupon records are persisted and financial legs and cost allocations are expanded, **Then** the booking transitions to `CONFIRMED`, `BookingConfirmed` and `TicketIssued` events are emitted, and `void_window_expires_at` is set from the host confirmation message. |
| AC-EXP-03-03 | [BE] | **Given** a ticket number is received from Sabre, **When** a downstream write (financial leg, allocation, or financial event) fails after the ticket is persisted, **Then** the booking transitions to `CONFIRM_EXCEPTION`, a `ConfirmExceptionRaised` event is emitted, and the supplier ticket reference is included in the event payload. |
| AC-EXP-03-04 | [BE] | **Given** a booking is in `PENDING_ISSUE` status, **When** its age exceeds the 30-minute SLO threshold, **Then** an operational alert is raised (metric `booking.pending_issue.age_seconds` p95 > 1800). |
| AC-EXP-03-05 | [BE] | **Given** a confirm request is received for a booking in `HELD` status, **When** `hold_expires_at` has already passed, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned and the booking is not queued. |
| AC-EXP-03-06 | [BE] | **Given** cost allocations are submitted per passenger, **When** the percentage splits for a passenger do not sum to 100%, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned and the booking is not confirmed. |
| AC-EXP-03-07 | [FE] | **Given** a booking is in `PENDING_ISSUE` status, **When** the trip detail screen is displayed, **Then** the UI shows a clear "Ticketing in progress" status indicator and does not allow the traveler to attempt a second confirmation. |
| AC-EXP-03-08 | [FE] | **Given** the booking transitions to `CONFIRMED`, **When** the traveler views the booking, **Then** the UI displays the ticket number, coupon details, void window expiry, and total amount. |
| AC-EXP-03-09 | [BE] | **Given** a confirm request is submitted without an `Idempotency-Key` header, **When** the system processes the request, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |

---

### REQ-EXP-04 — Cancel Booking

**Statement:** The platform shall allow a traveler to cancel a booking. Cancellation shall release the supplier hold (if `HELD` or `PENDING_ISSUE`) or trigger a void/refund eligibility determination (if `CONFIRMED`). The response shall include itemised refund eligibility including gross amount, penalty, non-refundable taxes, and the net refundable amount.

**Source:** RequirementDocument.md §"cancellations…refunds"; gap-analysis.md Q3, Q7.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-04-01 | [FE+BE] | **Given** a booking is in `HELD` or `PENDING_ISSUE` status, **When** the traveler submits a cancel request, **Then** the GDS hold is released, the booking transitions to `CANCELLED`, a `BookingCancelled` event is emitted, and the response confirms cancellation with no refund calculation (no ticket was issued). |
| AC-EXP-04-02 | [FE+BE] | **Given** a `CONFIRMED` booking has all coupons in `OPEN` status and is within the void window (`now() < ticket.void_window_expires_at`), **When** the traveler submits a cancel request, **Then** the response includes `within_void_window: true`, `refundable_amount` equal to the full ticket total, and the void path is indicated as available. |
| AC-EXP-04-03 | [FE+BE] | **Given** a `CONFIRMED` booking has all coupons in `OPEN` status and is outside the void window, **When** the traveler submits a cancel request, **Then** the response includes `within_void_window: false`, `gross_amount`, `penalty_amount` (from `ticket.refund_penalty_amount`), `non_refundable_amount` (sum of non-refundable taxes and fees), and `refundable_amount = gross − penalty − non_refundable`. |
| AC-EXP-04-04 | [BE] | **Given** a cancellation response is generated, **When** `refundable_amount` is computed, **Then** `refundable_amount = gross_amount − penalty_amount − non_refundable_amount` and the result must be ≥ 0; any negative result is an invariant violation and must return HTTP 422. |
| AC-EXP-04-05 | [FE] | **Given** the cancellation response includes a non-zero `refundable_amount`, **When** the cancellation confirmation screen is displayed, **Then** the UI shows a breakdown of gross amount, penalty, non-refundable taxes (itemised by IATA tax code), and net refundable amount with currency. |
| AC-EXP-04-06 | [BE] | **Given** a cancel request is received for a booking in `COMPLETED` status, **When** the system processes the request, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |
| AC-EXP-04-07 | [BE] | **Given** a cancel request is submitted without an `Idempotency-Key` header, **When** the system processes the request, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |
| AC-EXP-04-08 | [BE] | **Given** a `CONFIRMED → CANCELLED` transition is attempted, **When** at least one ticket on the booking is not in `VOIDED` or `REFUNDED` status, **Then** the transition is rejected with HTTP 409 `BOOKING_STATE_INVALID`. |

---

### REQ-EXP-05 — Trip Management (View Trip and Bookings)

**Statement:** The platform shall allow a traveler to view their trip, including all associated bookings, segments, and ticket status. A trip is a business grouping of one traveler, one purpose, and one date window.

**Source:** RequirementDocument.md §"trip management"; gap-analysis.md Q9.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-05-01 | [FE+BE] | **Given** an authenticated traveler requests a trip by `trip_id`, **When** the trip exists for their tenant, **Then** the response includes the trip purpose, date window, and all associated bookings with their statuses and segments. |
| AC-EXP-05-02 | [BE] | **Given** a trip is requested for a `trip_id` that belongs to a different tenant, **When** the request is processed, **Then** HTTP 404 is returned — not HTTP 403 — so as not to confirm the existence of a cross-tenant record. |
| AC-EXP-05-03 | [BE] | **Given** a trip is requested for a `trip_id` that does not exist for the caller's tenant, **When** the request is processed, **Then** HTTP 404 with `error_code: RESOURCE_NOT_FOUND` is returned. |
| AC-EXP-05-04 | [FE] | **Given** a trip has bookings in multiple statuses, **When** the trip detail screen is displayed, **Then** each booking shows its current status (`HELD`, `PENDING_ISSUE`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `CONFIRM_EXCEPTION`) with a human-readable label. |
| AC-EXP-05-05 | [FE] | **Given** a booking is in `CONFIRM_EXCEPTION` status, **When** the trip detail screen is displayed, **Then** the UI displays a prominent alert indicating manual intervention is required and shows the correlation ID for support reference. |

---

### REQ-EXP-06 — Booking Hold Expiry

**Statement:** The platform shall automatically expire a booking in `HELD` or `PENDING_ISSUE` status when `hold_expires_at` is reached. Expiry shall release the supplier hold, notify the traveler, and never auto-approve a pending approval.

**Source:** gap-analysis.md Q7; RequirementDocument.md §"disruption servicing".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-06-01 | [BE] | **Given** a booking is in `HELD` status, **When** `now() >= hold_expires_at`, **Then** the system transitions the booking to `EXPIRED`, releases the hold at Sabre, emits a `BookingExpired` event, and notifies the traveler. |
| AC-EXP-06-02 | [BE] | **Given** a booking is in `HELD` status with a `PENDING` approval, **When** `approval.expires_at` is reached, **Then** the approval transitions to `EXPIRED`, the booking transitions to `EXPIRED`, the hold is released at Sabre, and the traveler is notified. The approval is **never** auto-approved. |
| AC-EXP-06-03 | [FE] | **Given** a booking has transitioned to `EXPIRED`, **When** the traveler views the trip, **Then** the UI clearly indicates the booking has expired and provides a prompt to start a new search. |
| AC-EXP-06-04 | [BE] | **Given** a confirm request is submitted for a booking in `EXPIRED` status, **When** the system processes the request, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |

---

### REQ-EXP-07 — Approval Workflow (Phase 1 — Single Level)

**Statement:** When a policy evaluation returns `REQUIRE_APPROVAL`, the platform shall create a single-level approval record, resolve the approver from the org hierarchy and snapshot them, notify the approver, and await their decision. The approval action shall be idempotent. `EXPIRED` status shall never auto-approve.

**Source:** gap-analysis.md Q5, Q14.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-07-01 | [BE] | **Given** an approval record is in `PENDING` status, **When** an approver with the correct role submits an `APPROVED` decision, **Then** the approval transitions to `APPROVED`, the booking becomes eligible for confirmation, and a `PolicyOverrideRecorded` event is emitted if any matched rule was overridden. |
| AC-EXP-07-02 | [BE] | **Given** an approver submits the same approval decision a second time (idempotent replay), **When** the system processes the repeated action, **Then** the original decision is returned without re-evaluating or changing state. |
| AC-EXP-07-03 | [BE] | **Given** an approver with the correct role submits a `REJECTED` decision, **When** the system processes it, **Then** the approval transitions to `REJECTED`, the booking transitions to `CANCELLED`, the Sabre hold is released, and the traveler is notified. |
| AC-EXP-07-04 | [BE] | **Given** a caller without the `APPROVER` role submits an approval decision, **When** the system processes the request, **Then** HTTP 403 with `error_code: AUTHORIZATION_DENIED` is returned. |
| AC-EXP-07-05 | [FE] | **Given** the traveler views a booking in `PENDING` approval status, **When** the booking detail screen is rendered, **Then** the UI displays the approver name (resolved from the snapshot), the approval expiry time, and a clear status label. |

---

### REQ-EXP-08 — Notification Delivery (Phase 1: Email + In-App)

**Statement:** The platform shall send email and in-app notifications on key booking lifecycle events. Notifications are delivered at-least-once, event-driven from the transactional outbox.

**Source:** gap-analysis.md Q15; RequirementDocument.md §"communications services".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-08-01 | [BE] | **Given** a `BookingHeld` event is emitted, **When** the notification consumer processes the event, **Then** an email and in-app notification is sent to the traveler confirming the hold with booking reference and hold expiry time. |
| AC-EXP-08-02 | [BE] | **Given** an `ApprovalRequested` event is emitted, **When** the notification consumer processes the event, **Then** an email and in-app notification is sent to the resolved approver with a link to the approval action. |
| AC-EXP-08-03 | [BE] | **Given** a `BookingExpired` event is emitted, **When** the notification consumer processes the event, **Then** an email and in-app notification is sent to the traveler indicating the booking expired and the hold was released. |
| AC-EXP-08-04 | [BE] | **Given** a `RefundConfirmed` event is emitted, **When** the notification consumer processes the event, **Then** an email and in-app notification is sent to the traveler confirming the refund amount and return-to payment reference. |
| AC-EXP-08-05 | [BE] | **Given** a notification delivery fails transiently, **When** the retry budget is not yet exhausted, **Then** the system retries delivery without duplicating the notification to the recipient. |

> ✅ **HITL-REQ-01 RESOLVED 2026-09-10 — Tiered PII model APPROVED.**  
> **Tier 1 (permitted Phase 1 — no DPA required):** booking reference · hold expiry date/time · refund amount + currency · platform link (no PII in URL).  
> **Tier 2 (permitted once DPA with SES is confirmed):** traveler first name · route summary (e.g. "LHR → JFK, 15 Oct").  
> **Tier 3 (prohibited all phases):** full name · passport number · DOB · card details.  
> Phase 1 ships Tier 1 only. Tier 2 is a feature-flagged addition enabled per tenant after DPA confirmation. Tier 3 content is blocked at the template engine at deploy time.

| AC ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-EXP-08-01 | [BE] | **Given** a `BookingHeld` event is dispatched, **When** the notification consumer renders the email, **Then** the email body contains: booking reference, hold expiry date/time (Tier 1), and a link to the platform. It does **not** contain passport number, full card details, or DOB. If the tenant has an active DPA with SES, traveler first name and route summary (Tier 2) may also be included. |
| AC-EXP-08-02 | [BE] | **Given** an `ApprovalRequested` event is dispatched, **When** the notification consumer renders the email to the approver, **Then** the email contains: booking reference, a platform action link (Tier 1), and — if DPA confirmed — traveler first name and route summary (Tier 2). |
| AC-EXP-08-03 | [BE] | **Given** a `BookingExpired` event is dispatched, **When** the notification consumer renders the email, **Then** the email contains: booking reference and expiry time (Tier 1), with message "Your booking has expired and the hold has been released." |
| AC-EXP-08-04 | [BE] | **Given** a `RefundConfirmed` event is dispatched, **When** the notification consumer renders the email, **Then** the email contains: booking reference, refund amount with currency, and return-to payment method description (Tier 1). No raw PAN or card number is included. |
| AC-EXP-08-05 | [BE] | **Given** a notification delivery fails transiently, **When** the retry budget is not yet exhausted, **Then** the system retries delivery without sending a duplicate notification (idempotent on outbox `event_id`). |
| AC-EXP-08-06 | [BE] | **Given** a notification template is deployed, **When** a template validation check runs at deploy time, **Then** any template referencing a Tier 3 field (passport number, full card number, DOB) causes the deployment to fail with a validation error — Tier 3 fields are never reachable from the template engine. |

---

## 2. DOMAIN 2 — CONTENT (GDS ADAPTER)

> **Source:** RequirementDocument.md §"connect directly or indirectly with travel suppliers and normalize heterogeneous supplier capabilities"; gap-analysis.md Q2, Q6, Q11, Q12.  
> **Phase 1 scope:** Sabre adapter only. Amadeus deferred to Phase 2.

---

### REQ-CNT-01 — Sabre GDS Adapter (Shop, Hold, Issue Queue, Cancel, Void, Retrieve)

**Statement:** The platform shall implement an in-house Sabre GDS adapter that supports: search availability, create hold (PNR), place booking on ticketing queue (TICKETING_QUEUE model), cancel, void, retrieve booking. The adapter authenticates via the Sabre ATH token flow. Credentials are stored in AWS Secrets Manager.

**Source:** gap-analysis.md Q2, Q6, Q11, ADR-008, ADR-009.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-CNT-01-01 | [BE] | **Given** the adapter is initialised, **When** Sabre credentials are required, **Then** they are retrieved from AWS Secrets Manager and never from environment variables, source code, or log output. |
| AC-CNT-01-02 | [BE] | **Given** a Sabre ATH token is approaching expiry, **When** a call is about to be made, **Then** the token is refreshed proactively without failing the in-flight request. |
| AC-CNT-01-03 | [BE] | **Given** a valid availability request is sent to the adapter, **When** Sabre returns results, **Then** the response is normalised to the platform canonical `AvailabilityResponse` model before leaving the Content domain. |
| AC-CNT-01-04 | [BE] | **Given** a hold request is sent to Sabre, **When** Sabre returns a GDS record locator, **Then** the locator is stored in `supplier_mapping` as `reference_type: GDS_LOCATOR` with `valid_from` set to the current timestamp. |
| AC-CNT-01-05 | [BE] | **Given** a hold request fails at Sabre with a structured non-retryable error, **When** the adapter processes the response, **Then** the error is mapped to `GDS_HOLD_FAILED` and `retry_eligible: false` without any booking record being created. |
| AC-CNT-01-06 | [BE] | **Given** a hold request times out, **When** the adapter retries under the same idempotency key (up to 3 attempts with exponential backoff), **Then** if all retries fail, the error is returned as `GDS_TIMEOUT` and `retry_eligible: true`. |
| AC-CNT-01-07 | [BE] | **Given** the circuit breaker for Sabre is open, **When** any adapter operation is attempted, **Then** `GDS_UNAVAILABLE` is returned immediately without calling Sabre, and an alert is fired. |
| AC-CNT-01-08 | [BE] | **Given** a verb (e.g., exchange) is not declared in the adapter capability matrix, **When** the orchestration layer attempts to call it, **Then** `GDS_CAPABILITY_UNSUPPORTED` (HTTP 422) is returned before any Sabre call is attempted. |

---

### REQ-CNT-02 — GDS Response Normalisation

**Statement:** The platform shall normalise all Sabre responses to canonical platform models (fare, segment, tax breakdown, error codes) before the data leaves the Content domain. Raw Sabre payloads shall be preserved for audit and reconciliation.

**Source:** RequirementDocument.md §"normalize heterogeneous supplier capabilities into consistent platform-level models"; gap-analysis.md Q13.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-CNT-02-01 | [BE] | **Given** a Sabre fare response is received, **When** the normaliser processes it, **Then** all monetary amounts are converted to integer minor units in ISO 4217 currency, taxes are split into per-IATA-tax-code breakdown, and fees are itemised separately. |
| AC-CNT-02-02 | [BE] | **Given** a Sabre fare response is received, **When** normalised, **Then** the invariant `base_fare + Σ taxes + Σ fees = total` holds; if it does not, normalisation fails with `INVARIANT_VIOLATED` and is not returned to the caller. |
| AC-CNT-02-03 | [BE] | **Given** a Sabre segment response is received, **When** normalised, **Then** the segment is stored as a common envelope with `product_type: AIR` and a versioned typed payload containing product-specific attributes. |
| AC-CNT-02-04 | [BE] | **Given** any Sabre API call is made, **When** the raw response is received (success or error), **Then** the raw payload is persisted to S3 with the `correlation_id` for audit and reconciliation purposes. |
| AC-CNT-02-05 | [BE] | **Given** a Sabre error code is received, **When** the normaliser processes it, **Then** it is mapped to a canonical platform `error_code` — no raw Sabre error codes are exposed in the platform API response. |

---

### REQ-CNT-03 — Outbound Idempotency for Supplier Calls

**Statement:** Every outbound Sabre call (hold, queue, void, refund) shall use a durable idempotency key written to PostgreSQL and committed before the call. A `PENDING` record on retry means the outcome is unknown and must not be re-issued.

**Source:** gap-analysis.md Q9, ADR-011; RequirementDocument.md §"idempotency, retries".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-CNT-03-01 | [BE] | **Given** a mutating Sabre call is about to be made, **When** the idempotency key is generated, **Then** a record with `status: PENDING` is written to `idempotency_record` in PostgreSQL and committed before the HTTP call is issued. |
| AC-CNT-03-02 | [BE] | **Given** a Sabre call succeeds, **When** the response is received, **Then** the idempotency record is updated to `status: COMPLETE` and the response body is stored in the same transaction as the spine state change. |
| AC-CNT-03-03 | [BE] | **Given** a retry arrives for an idempotency key with `status: COMPLETE`, **When** the system checks the store, **Then** the stored response is returned verbatim without making a second Sabre call. |
| AC-CNT-03-04 | [BE] | **Given** a retry arrives for an idempotency key with `status: PENDING`, **When** the system checks the store, **Then** `SUPPLIER_OUTCOME_UNKNOWN` (HTTP 409, `retry_eligible: false`) is returned; the supplier is queried and the state is reconciled — no re-issuance. |
| AC-CNT-03-05 | [BE] | **Given** the same idempotency key is submitted with a different request payload (different `request_hash`), **When** the system checks the store, **Then** HTTP 409 with `error_code: CONFLICT_DUPLICATE` is returned. |

---

### REQ-CNT-04 — Webhook Ingestion

**Statement:** The platform shall receive and process asynchronous push notifications from Sabre (ticket issuance confirmation, cancellations, schedule changes, refund settlement confirmation). All webhook requests must be validated by HMAC-SHA256 signature and signed timestamp within ±5 minutes. Webhooks will be missed; supplier reconciliation is the guaranteed path.

**Source:** gap-analysis.md Q12; architecture.md §8.7.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-CNT-04-01 | [BE] | **Given** a Sabre webhook POST is received, **When** the HMAC-SHA256 signature is valid and the signed timestamp is within ±5 minutes of server time, **Then** the raw payload is persisted to S3, a deduplication check is performed on `supplier message_id`, and a `SupplierWebhookReceived` event is written to the outbox — all before HTTP 200 is returned. |
| AC-CNT-04-02 | [BE] | **Given** a Sabre webhook POST is received with an invalid or absent HMAC-SHA256 signature, **When** the request is processed, **Then** HTTP 401 is returned immediately and the payload is not processed or stored. |
| AC-CNT-04-03 | [BE] | **Given** a Sabre webhook POST is received with a valid signature but a signed timestamp outside the ±5-minute replay window, **When** the request is processed, **Then** HTTP 401 is returned and the payload is not processed. |
| AC-CNT-04-04 | [BE] | **Given** a duplicate webhook is received (same `supplier message_id`), **When** the deduplication check runs, **Then** HTTP 200 is returned immediately and the event is not re-processed or re-enqueued. |
| AC-CNT-04-05 | [BE] | **Given** a `SupplierWebhookReceived` event is consumed, **When** the consumer processes a ticket issuance confirmation for a `PENDING_ISSUE` booking, **Then** the consumer checks the aggregate version, applies the ticket number only if it is newer than the current state, and does not overwrite a `CONFIRMED` record with stale data. |
| AC-CNT-04-06 | [BE] | **Given** a webhook event fails processing after the retry budget is exhausted, **When** the system handles the failure, **Then** the event is moved to the DLQ table and an operational alert is raised; no spine state is mutated from the HTTP handler itself. |

---

### REQ-CNT-05 — Supplier Reconciliation

**Statement:** The platform shall run a scheduled reconciliation job that compares platform booking state against Sabre's state and raises exceptions for any drift. The job shall never auto-correct financial state.

**Source:** gap-analysis.md rows 18, M2; RequirementDocument.md §"recoverability and transaction integrity".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-CNT-05-01 | [BE] | **Given** the reconciliation job runs, **When** a booking exists in the platform but not at Sabre, **Then** a `supplier_reconciliation_exception` record of type `MISSING_AT_SUPPLIER` is created and a `ReconciliationExceptionRaised` event is emitted. |
| AC-CNT-05-02 | [BE] | **Given** the reconciliation job runs, **When** a ticket exists at Sabre with no corresponding local record, **Then** an exception of type `ORPHAN_TICKET` is created, a `ReconciliationExceptionRaised` event is emitted, and an immediate operational alert is raised. |
| AC-CNT-05-03 | [BE] | **Given** the reconciliation job runs, **When** a ticket or booking status differs between the platform and Sabre, **Then** an exception of type `STATUS_DRIFT` is created. The platform state is **not** automatically updated. |
| AC-CNT-05-04 | [BE] | **Given** the reconciliation job runs, **When** a ticket amount or tax differs between the platform and Sabre, **Then** an exception of type `AMOUNT_DRIFT` is created. No financial correction is applied automatically. |
| AC-CNT-05-05 | [BE] | **Given** the reconciliation job has not completed a run within 2× its scheduled interval, **When** the liveness check evaluates the metric `reconciliation.run.age_seconds`, **Then** an operational alert is raised — a stalled reconciler is a silent operational failure. |

---

## 3. DOMAIN 3 — POLICY EVALUATION

> **Source:** RequirementDocument.md §"Organizational policies shall be evaluated at the point of travel decision-making"; gap-analysis.md Q5, Q10.  
> **Phase 1 scope:** Synchronous declarative evaluator; rules authored as YAML data by engineering.

---

### REQ-POL-01 — Synchronous Policy Evaluation at Booking

**Statement:** The platform shall evaluate all applicable policy rules synchronously during the booking hold flow. The evaluation result (outcome + matched rules + rationale) shall be snapshotted immutably onto the booking before the response is returned to the caller.

**Source:** RequirementDocument.md §"required approvals, explanations, and exceptions before transactions are completed"; gap-analysis.md Q5, Q10, ADR-004.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-POL-01-01 | [BE] | **Given** a booking request is received, **When** policy is evaluated, **Then** all active rules for the tenant are loaded from the rule store, each rule is evaluated against the booking context, and the most restrictive matching outcome is returned following the precedence: `BLOCK > REQUIRE_APPROVAL > WARN > ALLOW`. |
| AC-POL-01-02 | [BE] | **Given** two rules match with the same outcome, **When** conflict resolution runs, **Then** the rule with the higher `scope_level` specificity (TRIP > TRAVELER > DEPARTMENT > TENANT > GLOBAL) provides the rationale; if specificity is also equal, the rule with the later `effective_from` wins; if still tied, the lower `rule_id` in ascending lexicographic order wins. |
| AC-POL-01-03 | [BE] | **Given** a policy evaluation completes, **When** the result is persisted, **Then** a `policy_decision_snapshot` record is written with the outcome, matched rules array (each with `rule_id`, `rule_version`, `scope_level`, `specificity`, `enforcement_level`, `rationale`), and `rule_set_version` — and this record is never subsequently updated. |
| AC-POL-01-04 | [BE] | **Given** the policy evaluator is called, **When** it does not respond within 200 ms, **Then** the booking request fails with HTTP 503 (`DOWNSTREAM_UNAVAILABLE`); the booking is not held. |
| AC-POL-01-05 | [FE] | **Given** policy evaluation returns a `WARN` outcome, **When** the booking result is displayed, **Then** each warning message (rationale from the matched rule) is shown to the traveler in the UI alongside the offer details. |
| AC-POL-01-06 | [FE] | **Given** policy evaluation returns a `BLOCK` outcome, **When** the result is displayed, **Then** the UI shows the block reason and does not present a path to confirm or override the booking. |

---

### REQ-POL-02 — Policy Rule Schema and Versioning

**Statement:** Policy rules shall be declarative, typed, and versioned YAML files. Each rule shall declare its `enforcement_level`, `scope_level`, `override_allowed` flag, condition, and effectivity dates. The entire rule set carries a `rule_set_version` stamped on every decision snapshot.

**Source:** gap-analysis.md Q5, ADR-004; architecture.md §9.2.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-POL-02-01 | [BE] | **Given** a policy rule file is deployed, **When** it is loaded by the evaluator, **Then** it passes schema validation: `rule_id`, `rule_version`, `enforcement_level` (one of BLOCK/REQUIRE_APPROVAL/WARN/ALLOW), `scope_level` (one of GLOBAL/TENANT/DEPARTMENT/TRAVELER/TRIP), `override_allowed` (boolean), and at least one `condition` must all be present. |
| AC-POL-02-02 | [BE] | **Given** a rule with `enforcement_level: BLOCK` is defined, **When** the rule is loaded, **Then** `override_allowed` must be `false`; any rule file with `enforcement_level: BLOCK` and `override_allowed: true` is rejected at load time. |
| AC-POL-02-03 | [BE] | **Given** a new version of the rule set is deployed, **When** the evaluator hot-reloads the rules, **Then** all subsequent evaluations use the new `rule_set_version` and no in-flight booking evaluation is interrupted. |
| AC-POL-02-04 | [BE] | **Given** a rule has an `effective_to` date in the past, **When** the evaluator runs, **Then** the rule is not applied to new evaluations. |
| AC-POL-02-05 | [BE] | **Given** a rule has an `effective_from` date in the future, **When** the evaluator runs before that date, **Then** the rule is not applied to current evaluations. |

---

### REQ-POL-03 — Policy Override

**Statement:** When a `WARN` or `REQUIRE_APPROVAL` rule is overridden, the override shall be recorded as an append-only `policy_override` record with a mandatory reason code, actor PII pointer, and role. `BLOCK` rules are never overridable. The decision snapshot is never mutated.

**Source:** gap-analysis.md Q5, Q10, rows C1, ADR-014; architecture.md §9.5.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-POL-03-01 | [BE] | **Given** a `WARN` rule outcome is overridden by the traveler, **When** the override is submitted, **Then** a `policy_override` record is created with `reason_code` (from the tenant-configured enum), `actor_id` (PII pointer), `actor_role: TRAVELER`, and a reference to the `snapshot_id`. The snapshot itself is not modified. |
| AC-POL-03-02 | [BE] | **Given** a `REQUIRE_APPROVAL` outcome is overridden by the approver, **When** the approval is processed, **Then** a `policy_override` record is created and a `PolicyOverrideRecorded` event is emitted. |
| AC-POL-03-03 | [BE] | **Given** an attempt is made to override a `BLOCK` rule outcome, **When** the system processes the request, **Then** HTTP 422 with `error_code: POLICY_BLOCKED` is returned; no override record is created. |
| AC-POL-03-04 | [BE] | **Given** a `WARN` override is submitted without a `reason_code`, **When** the system processes the request, **Then** HTTP 400 with `error_code: VALIDATION_ERROR` identifying the missing reason code is returned; the override is not recorded. |
| AC-POL-03-05 | [FE] | **Given** a booking has a `WARN` outcome, **When** the traveler proceeds past the warning, **Then** the UI requires the traveler to select a reason code from the tenant-configured enum before proceeding; free text is optional. |
| AC-POL-03-06 | [BE] | **Given** a `PolicyOverrideRecorded` event is emitted, **When** the reporting consumer processes the event, **Then** the `override_reason_code` is updated on the corresponding `financial_event` row (D9 dimension, the single intentionally nullable field). |

---

### REQ-POL-04 — BLOCK Rule Behaviour

**Statement:** A `BLOCK` policy outcome shall always prevent booking creation. It is not overridable by any role, including `ADMIN`. `BLOCK` is reserved for legal, safety, and compliance constraints (e.g., sanctioned destinations, embargoed carriers).

**Source:** gap-analysis.md Q10, ADR-004, GUARDRAIL-P2.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-POL-04-01 | [BE] | **Given** a booking request matches a `BLOCK` rule, **When** the evaluator returns `outcome: BLOCK`, **Then** no hold is created at Sabre, no booking record is persisted, and HTTP 422 with `error_code: POLICY_BLOCKED` and the rule rationale is returned. |
| AC-POL-04-02 | [BE] | **Given** a `BLOCK` outcome is active, **When** any authenticated user (including `ADMIN` role) attempts to override, **Then** HTTP 422 with `error_code: POLICY_BLOCKED` is returned. |
| AC-POL-04-03 | [FE] | **Given** a `BLOCK` outcome is received, **When** the booking result is rendered, **Then** the UI shows only the block reason and the option to return to the search — no confirm, no override, no approval path is presented. |

---

## 4. DOMAIN 4 — PAYMENT & EXPENSE

> **Source:** RequirementDocument.md §"Payment, settlement, refund, expense, reconciliation and reimbursement processes shall be integrated with the travel lifecycle"; gap-analysis.md Q3, Q8, rows S1–S4.  
> **Phase 1 scope:** Financial ledger writes, cost allocation, refund state machine (REQUESTED → CONFIRMED). No payment gateway. Lodge card / virtual card reference token only.

---

### REQ-PAY-01 — Financial Event Recording (21 Reporting Dimensions)

**Statement:** The platform shall record a `financial_event` row when a ticket is issued. The event shall carry all 21 mandatory reporting dimensions captured at write time from live or cached sources. Values are immutable once written.

**Source:** RequirementDocument.md §"trusted and continuously evolving Travel Context"; gap-analysis.md Q16, row C5.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-PAY-01-01 | [BE] | **Given** a ticket is issued (`BookingConfirmed` event), **When** the financial event is written, **Then** all 21 dimensions (D1 tenant_id, D2 legal_entity, D3 traveler_id, D4 department, D5 cost_centre, D6 cost_object, D7 trip_purpose, D8 policy_outcome, D9 override_reason_code, D10 supplier_code, D11 carrier_code, D12 market_origin, D13 market_destination, D14 cabin_class, D15 fare_class, D16 booking_channel, D17 advance_purchase_days, D18 sale_currency, D19 settlement_currency, D20 reporting_currency, D21 booking_date, D22 travel_date) are non-null except D9 which is null when no override occurred. |
| AC-PAY-01-02 | [BE] | **Given** org hierarchy data is retrieved from a live source at booking confirmation, **When** the financial event is written, **Then** `dimension_source: LIVE` and `dimension_snapshot_age_seconds: 0` are recorded. |
| AC-PAY-01-03 | [BE] | **Given** org hierarchy data is retrieved from a cache (staleness ≤ 24 hours) at booking confirmation, **When** the financial event is written, **Then** `dimension_source: CACHED` and `dimension_snapshot_age_seconds` reflecting actual cache age are recorded. |
| AC-PAY-01-04 | [BE] | **Given** no org hierarchy snapshot exists or the cached snapshot exceeds 24 hours of age, **When** booking confirmation is attempted, **Then** the confirmation is blocked — the financial event is never written with null dimension values. |
| AC-PAY-01-05 | [BE] | **Given** a financial event is written, **When** any subsequent process (reporting, ERP posting) reads it, **Then** no field is updated or overwritten; the record is append-only and the financial event table permits no UPDATE or DELETE. |
| AC-PAY-01-06 | [BE] | **Given** Phase 1 operates USD-only, **When** a financial event is written, **Then** `sale_currency`, `settlement_currency`, and `reporting_currency` are all `USD`; `amount_sale`, `amount_settlement`, and `amount_reporting` are all equal; FX rates `fx_rate_sale_to_settlement` and `fx_rate_sale_to_reporting` are both `1.00000000`. |

---

### REQ-PAY-02 — Cost Allocation

**Statement:** Cost allocations shall be declared per passenger at the confirm API. The platform shall expand the declaration across every financial leg of that passenger's ticket using the largest-remainder algorithm in integer minor units. The invariant Σ allocations = leg amount must hold for every leg, and Σ allocations across all legs of a ticket = ticket total.

**Source:** gap-analysis.md Q8, rows C2–C3, ADR-003.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-PAY-02-01 | [BE] | **Given** a confirm request contains per-passenger cost allocations as percentage splits, **When** the system expands them across every financial leg, **Then** for every leg: `Σ cost_allocation.allocated_amount = financial_leg.amount` (integer minor units, no silent rounding). |
| AC-PAY-02-02 | [BE] | **Given** cost allocations are expanded across all legs of a passenger's ticket, **When** the expansion is complete, **Then** `Σ allocated_amounts across all legs = ticket.total_amount`. |
| AC-PAY-02-03 | [BE] | **Given** percentage splits for a passenger are provided, **When** the largest-remainder algorithm runs, **Then** the lowest-`priority` split absorbs the rounding remainder so the invariant holds exactly — rounding error is never silently distributed. |
| AC-PAY-02-04 | [BE] | **Given** percentage splits for a passenger do not sum to 100%, **When** the system validates the request, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned before any allocation is written. |
| AC-PAY-02-05 | [BE] | **Given** a fixed-amount split is provided and its value does not equal the leg amount after expansion, **When** the system validates the request, **Then** HTTP 422 with `error_code: INVARIANT_VIOLATED` is returned. |
| AC-PAY-02-06 | [BE] | **Given** a `CostAllocationRecorded` event is emitted, **When** the ERP posting stub (Sprint 1) receives it, **Then** the event is acknowledged without error and the allocation data is preserved for Sprint 2 full posting. |

---

### REQ-PAY-03 — Refund Request (Phase 1: Full Refund, All Coupons Open)

**Statement:** The platform shall allow a traveler to request a refund for a fully unused ticket (all coupons `OPEN`). Requesting a refund shall not move money — it creates a `refund` record in `REQUESTED` status and submits to the supplier. No ledger movement occurs until `CONFIRMED`.

**Source:** gap-analysis.md Q3, Q7, row S1; RequirementDocument.md §"refunds and rebooking".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-PAY-03-01 | [BE] | **Given** a ticket is in `ISSUED` status with all coupons `OPEN` and `ticket.is_refundable: true`, **When** a refund request is submitted, **Then** a `refund` record is created with `status: REQUESTED`, `refund_type: FULL_REFUND`, `gross_amount`, `penalty_amount` (from `ticket.refund_penalty_amount`), `non_refundable_amount` (Σ non-refundable taxes and fees), `refund_amount = gross − penalty − non_refundable`, and `return_to: ORIGINAL_FORM_OF_PAYMENT`. |
| AC-PAY-03-02 | [BE] | **Given** a refund request is submitted, **When** the `refund` record is created, **Then** `refund_amount` must be ≥ 0; if `gross − penalty − non_refundable < 0` the system returns HTTP 422 `INVARIANT_VIOLATED` and does not create the refund record. |
| AC-PAY-03-03 | [BE] | **Given** a refund request is submitted for a ticket with at least one coupon **not** in `OPEN` status (partial use), **When** the system validates eligibility, **Then** HTTP 422 with `error_code: REFUND_NOT_ELIGIBLE` is returned (partial refunds are Phase 2). |
| AC-PAY-03-04 | [BE] | **Given** a refund request is submitted for a non-refundable ticket (`ticket.is_refundable: false`), **When** the system validates eligibility, **Then** HTTP 422 with `error_code: REFUND_NOT_ELIGIBLE` is returned. |
| AC-PAY-03-05 | [BE] | **Given** a `RefundRequested` event is emitted, **When** it is processed, **Then** no `financial_event` row is written and no allocation reversal occurs — ledger movement is deferred to `CONFIRMED`. |
| AC-PAY-03-06 | [BE] | **Given** a refund request is submitted without an `Idempotency-Key` header, **When** the system processes it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |
| AC-PAY-03-07 | [FE] | **Given** a refund request is initiated, **When** the refund summary screen is displayed, **Then** the UI shows gross amount, penalty amount, itemised non-refundable taxes by IATA code, net refundable amount, and the return-to payment method — all with currency labels. |

---

### REQ-PAY-04 — Refund Confirmation (Two-Phase Lifecycle)

**Statement:** When the supplier confirms settlement of a refund, the platform shall transition the `refund` record to `CONFIRMED`, write a ledger credit, reverse allocations via `reverses_allocation_id`, and emit `RefundConfirmed`. All downstream effects (expense reversal, reporting) fire only on `CONFIRMED`.

**Source:** gap-analysis.md Q3, Q7, row S1; architecture.md §5.3.2.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-PAY-04-01 | [BE] | **Given** a `RefundConfirmed` event is received from the supplier (via webhook or reconciliation), **When** the payment module processes it, **Then** the `refund` record transitions to `CONFIRMED`, ticket coupons transition to `REFUNDED`, a ledger credit financial event is written, and allocation reversals are created with `reverses_allocation_id` linking to the original rows. |
| AC-PAY-04-02 | [BE] | **Given** allocation reversals are written on refund confirmation, **When** each reversal row is created, **Then** the `allocated_amount` is negative and reproduces the original proportions exactly — no fresh split is computed. |
| AC-PAY-04-03 | [BE] | **Given** a `RefundConfirmed` event is processed, **When** the allocation reversal invariant is checked, **Then** `Σ reversed_allocated_amounts = −refund.refund_amount` (the full refunded amount is reversed across the original cost objects). |
| AC-PAY-04-04 | [BE] | **Given** a supplier rejects a refund, **When** the `RefundRejected` event is processed, **Then** the `refund` record transitions to `REJECTED`, ticket status remains `REFUND_REQUESTED` is unwound back to `ISSUED`, no ledger movement occurs, and the traveler is notified. |
| AC-PAY-04-05 | [BE] | **Given** a `RefundConfirmed` event is received as a duplicate (same `refund_id` already `CONFIRMED`), **When** the consumer processes it, **Then** the event is discarded idempotently — no double credit is written. |

---

### REQ-PAY-05 — Void (Within ARC Same-Day Window)

**Statement:** The platform shall allow voiding a ticket within the ARC same-day void window. A void reverses the ticket fully and immediately, without the two-phase refund lifecycle.

**Source:** gap-analysis.md Q3; RequirementDocument.md §"cancellations".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-PAY-05-01 | [BE] | **Given** a ticket is in `ISSUED` status, all coupons are `OPEN`, and `now() < ticket.void_window_expires_at`, **When** a void is requested, **Then** the void is submitted to Sabre, the ticket transitions to `VOIDED`, coupons transition to `VOIDED`, full ledger reversal is written, allocation reversals are created via `reverses_allocation_id`, and `TicketVoided` is emitted. |
| AC-PAY-05-02 | [BE] | **Given** a void is requested for a ticket where `now() >= ticket.void_window_expires_at`, **When** the system validates eligibility, **Then** HTTP 422 with `error_code: VOID_WINDOW_EXPIRED` is returned; the refund path is indicated in the response. |
| AC-PAY-05-03 | [BE] | **Given** a void is submitted to Sabre and Sabre confirms, **When** the local state is updated, **Then** the void is treated as a full reversal — the `refund_amount` equals the full ticket total and all cost-object allocations are reversed in original proportions. |
| AC-PAY-05-04 | [BE] | **Given** a void request is submitted without an `Idempotency-Key` header, **When** the system processes it, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned. |

---

### REQ-PAY-06 — Form of Payment Tracking

**Statement:** The booking's form of payment (lodge card or virtual card reference token — never a PAN) shall be stored on the booking and copied to the refund record to prove the return-to-original-FOP path.

**Source:** gap-analysis.md row S3; RequirementDocument.md §"Payment…integrated".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-PAY-06-01 | [BE] | **Given** a confirm request includes a `payment_reference` and `payment_instrument_type` (LODGE_CARD or VIRTUAL_CARD), **When** the booking is confirmed, **Then** both values are stored on the `booking` record and are never a raw PAN, CVV, or full card number. |
| AC-PAY-06-02 | [BE] | **Given** a refund record is created, **When** the `payment_reference` is copied from the booking to the `refund` record, **Then** the value matches the original booking `payment_reference` exactly. |
| AC-PAY-06-03 | [BE] | **Given** a financial audit queries the refund record, **When** the record is read, **Then** `return_to: ORIGINAL_FORM_OF_PAYMENT` and `payment_reference` are present and non-null. |

---

## 5. DOMAIN 5 — SERVICING

> **Source:** RequirementDocument.md §"Bookings shall remain fully serviceable throughout their lifecycle, including voluntary changes, cancellations, supplier changes, disruptions, refunds and rebooking"; gap-analysis.md Q7.  
> **Phase 1 scope:** Cancel (pre-ticket), void (within window), refund request, CONFIRM_EXCEPTION ops queue. Exchanges, involuntary changes, and partial refunds are Phase 2.

---

### REQ-SVC-01 — Partial Failure Handling (CONFIRM_EXCEPTION)

**Statement:** If a ticket is issued at Sabre but a downstream write fails, the booking shall transition to `CONFIRM_EXCEPTION` — an explicit state in the ops queue. It shall never revert to `HELD`. The supplier reference shall be preserved and exposed so the condition is actionable.

**Source:** gap-analysis.md rows B6, ADR-012; RequirementDocument.md §"controlled recovery from partial failures".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-SVC-01-01 | [BE] | **Given** a ticket number is received from Sabre and any subsequent write (financial leg, cost allocation, financial event) fails, **When** the error is handled, **Then** the booking transitions to `CONFIRM_EXCEPTION`, a `supplier_reconciliation_exception` record is created, a `ConfirmExceptionRaised` event is emitted with the Sabre ticket reference and the failed step, and `booking.confirm_exception.count` increments. |
| AC-SVC-01-02 | [BE] | **Given** a booking is in `CONFIRM_EXCEPTION` status, **When** any caller attempts to retry the confirm operation, **Then** HTTP 409 with `error_code: CONFIRM_EXCEPTION` and `retry_eligible: false` is returned — retrying is never the correct resolution. |
| AC-SVC-01-03 | [BE] | **Given** a `ConfirmExceptionRaised` event is emitted, **When** the system processes the metric, **Then** an immediate operational page alert is raised (`booking.confirm_exception.count` threshold: any occurrence). |
| AC-SVC-01-04 | [FE] | **Given** a booking is in `CONFIRM_EXCEPTION` status, **When** the trip detail screen is rendered, **Then** the UI displays a prominent alert with the correlation ID and a message indicating that support intervention is required; no self-service action is offered. |

---

### REQ-SVC-02 — Refund Request Submission to Supplier

**Statement:** The platform shall submit a refund request to Sabre on behalf of the traveler after the booking is cancelled outside the void window. The submission uses a durable idempotency key. Refund outcome confirmation arrives asynchronously.

**Source:** RequirementDocument.md §"refunds"; gap-analysis.md Q3, Q7.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-SVC-02-01 | [BE] | **Given** a refund record is in `REQUESTED` status, **When** the servicing module submits the refund to Sabre, **Then** a durable idempotency key is written to `idempotency_record` before the Sabre call, the supplier refund reference is stored in `refund.supplier_refund_ref`, and the ticket status transitions to `REFUND_REQUESTED`. |
| AC-SVC-02-02 | [BE] | **Given** the Sabre refund submission times out, **When** the adapter retries under the same idempotency key, **Then** if the idempotency record is `PENDING`, `SUPPLIER_OUTCOME_UNKNOWN` is returned and the refund is routed to the reconciliation exception queue for manual resolution. |
| AC-SVC-02-03 | [BE] | **Given** Sabre rejects the refund submission with a non-retryable error, **When** the adapter processes the response, **Then** the refund record transitions to `REJECTED`, a `RefundRejected` event is emitted, and the ticket reverts to `ISSUED`. |

---

### REQ-SVC-03 — Illegal State Transition Rejection

**Statement:** Every invalid booking, ticket, or approval state transition shall be rejected explicitly with `BOOKING_STATE_INVALID`. No transition shall be silently ignored or silently revert to a prior state.

**Source:** gap-analysis.md row M1; RequirementDocument.md §"transaction integrity".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-SVC-03-01 | [BE] | **Given** any state transition is attempted that is not defined in the reservation, ticket, or approval state machines (§5.3.1–§5.3.3 of architecture.md), **When** the system processes the request, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned and no state is changed. |
| AC-SVC-03-02 | [BE] | **Given** a void is attempted on a ticket in `REFUND_REQUESTED` status, **When** the system validates the transition, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |
| AC-SVC-03-03 | [BE] | **Given** a refund is requested for a ticket in `VOIDED` status, **When** the system validates the transition, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned. |
| AC-SVC-03-04 | [BE] | **Given** a state transition is attempted for a `COMPLETED` booking (all travel has occurred), **When** the system validates the transition, **Then** HTTP 409 with `error_code: BOOKING_STATE_INVALID` is returned for any further state-changing operation. |

---

## 6. DOMAIN 6 — DATA (TRANSACTION SPINE)

> **Source:** RequirementDocument.md §"All platform interactions shall contribute to a trusted and continuously evolving Travel Context"; gap-analysis.md Q4, Q9, rows B4, C1.  
> **Phase 1 scope:** Full implementation. The spine is required by all other domains.

---

### REQ-DAT-01 — Transaction Spine Entities (Trip, Booking, Passenger, Segment, Ticket, Coupon)

**Statement:** The platform shall maintain a single append-only event-sourced transaction spine: Trip → Booking → Passenger → Segment → Ticket → Coupon → Financial Leg → Cost Allocation. Supplier IDs shall never be used as primary keys. All entity IDs shall be ULIDs.

**Source:** gap-analysis.md Q4, Q9, ADR-001, ADR-002, ADR-010.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-DAT-01-01 | [BE] | **Given** any spine entity is created, **When** the ID is generated, **Then** it is a ULID (or UUIDv7), tenant-scoped, and never derived from a GDS record locator, ticket number, or other supplier identifier. |
| AC-DAT-01-02 | [BE] | **Given** a ticket is issued covering a two-segment itinerary, **When** the ticket record is created, **Then** two `coupon` rows are written — one per segment — each with a unique `coupon_number` (1 and 2), `status: OPEN`, and a reference to the correct `segment_id`. |
| AC-DAT-01-03 | [BE] | **Given** a GDS record locator changes (e.g., due to a split PNR), **When** the new locator is received, **Then** a new `supplier_mapping` row is added with `valid_from` set to now and `valid_to` set on the prior row — the old row is never deleted or updated. |
| AC-DAT-01-04 | [BE] | **Given** any repository method is called, **When** it queries or writes to the spine, **Then** `tenant_id` is the first argument and no query can return records belonging to a different tenant. |
| AC-DAT-01-05 | [BE] | **Given** a stale GDS locator (with a past `valid_to`) is used to look up a booking, **When** the supplier mapping is queried, **Then** the system resolves it to the correct booking via the historical mapping record. |

---

### REQ-DAT-02 — Append-Only Immutable Tables

**Statement:** The tables `supplier_mapping`, `financial_event`, `policy_decision_snapshot`, and `policy_override` shall be strictly append-only. No UPDATE or DELETE shall ever be issued against them. This constraint is enforced by database role, not by convention.

**Source:** gap-analysis.md ADR-002, GUARDRAIL-D1; RequirementDocument.md §"auditability".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-DAT-02-01 | [BE] | **Given** the database role used by the application is applied, **When** an UPDATE or DELETE is attempted against `supplier_mapping`, `financial_event`, `policy_decision_snapshot`, or `policy_override`, **Then** the database rejects the operation with a permission error — the application role does not hold UPDATE or DELETE privileges on these tables. |
| AC-DAT-02-02 | [BE] | **Given** a financial fact changes (e.g., a financial leg is superseded), **When** the change is persisted, **Then** a new `financial_leg` row is inserted with `status: ACTIVE` and the prior row's `status` is updated to `SUPERSEDED` with `superseded_by` set — the original row's `amount` is never modified. |
| AC-DAT-02-03 | [BE] | **Given** a policy decision is overridden after the snapshot is written, **When** the override is recorded, **Then** a new `policy_override` row is inserted referencing the `snapshot_id` — the `policy_decision_snapshot` row itself is not modified. |

---

### REQ-DAT-03 — PII Pointer Model and GDPR Erasure

**Statement:** Raw PII (name, email, passport number, date of birth) shall never be stored on spine entities. All spine references to travelers shall use a PII pointer (`traveler_id`). The PII store is the only location of raw PII and supports right-to-erasure without breaking the financial ledger.

**Source:** gap-analysis.md Q4, GUARDRAIL-D3; RequirementDocument.md §"security, privacy".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-DAT-03-01 | [BE] | **Given** any spine entity (booking, ticket, financial_event) is created, **When** the record is written, **Then** no raw traveler name, email address, passport number, or date of birth is stored in any column — only the opaque `traveler_id` pointer. |
| AC-DAT-03-02 | [BE] | **Given** a GDPR erasure request is received for a traveler, **When** the erasure is processed, **Then** the traveler's PII record is deleted from the PII store; all spine records retain their `traveler_id` pointer and remain intact — the ledger is not broken. |
| AC-DAT-03-03 | [BE] | **Given** a GDPR erasure is completed, **When** any financial audit or reporting query runs against the spine, **Then** the query succeeds and returns the financial record with the opaque `traveler_id`; no lookup error or broken reference occurs. |
| AC-DAT-03-04 | [BE] | **Given** a log line is written by any service, **When** the log is inspected, **Then** no raw PII fields appear — traveler name, email, and passport number are absent from all log output. |

---

### REQ-DAT-04 — Transactional Outbox and Event Delivery

**Statement:** Every state change in the spine shall write a domain event to the outbox table in the same database transaction as the state change itself. The outbox dispatcher delivers events at-least-once. Every consumer shall be idempotent on `event_id` and version-aware.

**Source:** gap-analysis.md row M4, ADR-013; RequirementDocument.md §"event-driven integration".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-DAT-04-01 | [BE] | **Given** a spine state change is persisted (e.g., booking status update), **When** the database transaction commits, **Then** a corresponding `outbox` row is committed in the same transaction — the state change and the event are never split across two transactions. |
| AC-DAT-04-02 | [BE] | **Given** the outbox dispatcher polls for undispatched rows, **When** a row is delivered, **Then** `dispatched_at` is set and the row is not redelivered; if delivery fails, `attempt_count` increments and the row is retried within the configured backoff. |
| AC-DAT-04-03 | [BE] | **Given** an outbox row exceeds the retry budget, **When** the dispatcher processes it, **Then** it is moved to the DLQ table and an operational alert is raised; it is never silently discarded. |
| AC-DAT-04-04 | [BE] | **Given** an event consumer receives a duplicate event (same `event_id`), **When** the consumer processes it, **Then** the duplicate is discarded without reapplying the state change. |
| AC-DAT-04-05 | [BE] | **Given** an event consumer receives an event older than the state it has already applied (out-of-order delivery), **When** the consumer processes it, **Then** the stale event is discarded and the current state is not overwritten. |
| AC-DAT-04-06 | [BE] | **Given** the outbox dispatcher has not completed a cycle within the health check interval, **When** `/health/ready` is called on Deployable B, **Then** it returns unhealthy (non-200) — a stalled dispatcher is a service readiness failure. |

---

### REQ-DAT-05 — Multi-Tenant Data Isolation

**Statement:** The platform shall enforce tenant data isolation at the repository layer. Every entity carries a `tenant_id`. Cross-tenant queries are impossible by construction.

**Source:** RequirementDocument.md §"enterprise…multi-tenant"; gap-analysis.md Q9, GUARDRAIL-D2.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-DAT-05-01 | [BE] | **Given** an authenticated request carries a JWT with a `tenant_id` claim, **When** any repository method is called, **Then** the method appends `WHERE tenant_id = :tenantId` to every query and rejects calls where `tenant_id` is null or empty. |
| AC-DAT-05-02 | [BE] | **Given** a request carries a JWT with `tenant_id: tenant_A`, **When** the caller requests a resource (trip, booking, ticket) belonging to `tenant_B`, **Then** HTTP 404 is returned — the existence of the resource is not confirmed. |
| AC-DAT-05-03 | [BE] | **Given** an authenticated request carries a JWT without a `tenant_id` claim, **When** the system validates the token, **Then** HTTP 401 with `error_code: AUTHENTICATION_FAILED` is returned before any data access occurs. |

---

## 7. CROSS-CUTTING REQUIREMENTS

> **Source:** RequirementDocument.md §"resilience, security, privacy, scalability, availability, auditability, recoverability and transaction integrity"; gap-analysis.md rows GUARDRAIL series.

---

### REQ-XCT-01 — Correlation ID Propagation

**Statement:** Every API request, internal service call, Kafka/outbox event, GDS outbound call, and `financial_event` row shall carry a `correlation_id`. The API gateway generates one if absent from the inbound request.

**Source:** gap-analysis.md Q9, GUARDRAIL-A2; RequirementDocument.md §"distributed observability".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-XCT-01-01 | [BE] | **Given** an inbound API request does not include an `X-Correlation-ID` header, **When** the API gateway processes it, **Then** a new ULID is generated and attached as `X-Correlation-ID` before the request reaches any service. |
| AC-XCT-01-02 | [BE] | **Given** a service makes a call to another service or to Sabre, **When** the outbound request is formed, **Then** the `X-Correlation-ID` header is forwarded unchanged. |
| AC-XCT-01-03 | [BE] | **Given** an outbox event is written, **When** the event envelope is constructed, **Then** `correlation_id` is a non-null field in the envelope. |
| AC-XCT-01-04 | [BE] | **Given** a financial event is written, **When** the row is inserted, **Then** `financial_event.correlation_id` is non-null and matches the correlation ID from the originating booking request. |

---

### REQ-XCT-02 — Authentication and Role-Based Access

**Statement:** All API endpoints shall require a valid tenant-scoped JWT. `ADMIN` and `APPROVER` roles shall require MFA from Phase 1. Service-to-service calls between Deployable A and B shall use mTLS.

**Source:** gap-analysis.md row C6, GUARDRAIL-S2, GUARDRAIL-S5, GUARDRAIL-S6; RequirementDocument.md §"security".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-XCT-02-01 | [BE] | **Given** a request arrives at any API endpoint, **When** the JWT is absent or expired, **Then** HTTP 401 with `error_code: AUTHENTICATION_FAILED` is returned before any business logic executes. |
| AC-XCT-02-02 | [BE] | **Given** a request carries a valid JWT but the caller's role does not permit the operation, **When** the service enforces authorization, **Then** HTTP 403 with `error_code: AUTHORIZATION_DENIED` is returned. |
| AC-XCT-02-03 | [BE] | **Given** a user with `ADMIN` or `APPROVER` role attempts to authenticate, **When** the IdP processes the login, **Then** MFA is enforced — login without a valid MFA challenge is rejected. |
| AC-XCT-02-04 | [BE] | **Given** Deployable A makes a call to Deployable B, **When** the connection is established, **Then** mTLS is used — plaintext HTTP between the two deployables is never accepted in any environment. |
| AC-XCT-02-05 | [BE] | **Given** a JWT contains a `tenant_id` claim that does not match the resource being accessed, **When** the service validates the claim, **Then** HTTP 404 is returned (not 403) — to avoid confirming cross-tenant resource existence. |

---

### REQ-XCT-03 — Idempotency on All Mutating API Endpoints

**Statement:** Every mutating API endpoint (POST, PATCH) shall require an `Idempotency-Key` header. The key shall be stored durably and used to return a cached response on retry.

**Source:** gap-analysis.md Q9, GUARDRAIL-A1, ADR-011.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-XCT-03-01 | [BE] | **Given** a mutating request is received without an `Idempotency-Key` header, **When** the API gateway validates the request, **Then** HTTP 400 with `error_code: IDEMPOTENCY_KEY_MISSING` is returned before any business logic executes. |
| AC-XCT-03-02 | [BE] | **Given** a mutating request is received with an `Idempotency-Key` that was previously processed to completion, **When** the system looks up the key, **Then** the original HTTP status code and response body are returned without re-executing the operation. |
| AC-XCT-03-03 | [BE] | **Given** a mutating request is received with an `Idempotency-Key` that is in `PENDING` status (prior call outcome unknown), **When** the system looks up the key, **Then** HTTP 409 with `error_code: SUPPLIER_OUTCOME_UNKNOWN` is returned and no re-execution occurs. |

---

### REQ-XCT-04 — Structured Logging and Observability

**Statement:** Every log line emitted by any service shall be JSON and shall include `timestamp`, `level`, `service`, `correlation_id`, and `tenant_id`. PII fields (traveler name, email, passport) shall never appear in logs.

**Source:** RequirementDocument.md §"distributed observability"; gap-analysis.md GUARDRAIL-O1, GUARDRAIL-S3.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-XCT-04-01 | [BE] | **Given** any service emits a log line, **When** the log is written, **Then** it is valid JSON and contains `timestamp` (ISO 8601 UTC), `level`, `service`, `correlation_id`, and `tenant_id` as non-null fields. |
| AC-XCT-04-02 | [BE] | **Given** a log sanitiser is applied in CI, **When** it scans all log output, **Then** no raw traveler name, email address, or passport number is present in any log line from any service. |
| AC-XCT-04-03 | [BE] | **Given** an outbound Sabre call is made, **When** the OpenTelemetry span is created, **Then** the span includes `supplier`, `operation`, and `idempotency_key` as span attributes. |
| AC-XCT-04-04 | [BE] | **Given** either deployable receives a health check request, **When** `GET /health/live` is called, **Then** HTTP 200 is returned if the process is running. **When** `GET /health/ready` is called, **Then** HTTP 200 is returned only if the database, Redis connections are healthy and (for Deployable B) the outbox dispatcher has completed a recent cycle. |

---

### REQ-XCT-05 — Error Response Format

**Statement:** All API errors shall return `application/problem+json` conforming to RFC 7807. Stack traces shall never appear in responses. Every error shall include `correlation_id` and a canonical `error_code`.

**Source:** RequirementDocument.md §"security"; gap-analysis.md §15.1 error taxonomy.

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-XCT-05-01 | [BE] | **Given** any API error occurs, **When** the response is serialised, **Then** `Content-Type: application/problem+json` is set, and the body contains `type`, `title`, `status`, `error_code`, `correlation_id`, and `detail`. |
| AC-XCT-05-02 | [BE] | **Given** an unhandled server error occurs, **When** the error response is returned, **Then** HTTP 500 is returned with `error_code: INTERNAL_ERROR` and no stack trace, internal path, or PII appears in the response body. |
| AC-XCT-05-03 | [FE] | **Given** an API returns an error response, **When** the UI renders the error, **Then** a user-friendly message is displayed; raw `error_code` values, stack traces, and internal IDs are never shown to the end user. |

---

### REQ-XCT-06 — No Raw PAN Storage or Transmission

**Statement:** The platform shall never store, process, or transmit raw card numbers (PANs), CVVs, or full card details. Settlement is via lodge card or virtual card reference token only. The platform remains out of PCI-DSS network scope.

**Source:** gap-analysis.md Q3, ADR-005, GUARDRAIL-S1; RequirementDocument.md §"security".

| ID | Layer | Acceptance Criterion |
|----|-------|---------------------|
| AC-XCT-06-01 | [BE] | **Given** a confirm request is received, **When** the `payment_reference` field is stored, **Then** a CI security scan verifies the value matches a non-PAN reference token pattern (not a 13–19 digit card number). |
| AC-XCT-06-02 | [BE] | **Given** any log, database column, or API response is inspected, **When** a PAN-pattern scan is run, **Then** no 13–19 digit numeric sequence matching the Luhn algorithm is present in any stored or transmitted value. |
| AC-XCT-06-03 | [BE] | **Given** a GDS credentials file or application configuration is inspected, **When** a secrets scan is run, **Then** no PAN, CVV, or card expiry date is present in any configuration artifact. |

---

## 8. HITL ITEMS REGISTER

All items below require a human decision before the related acceptance criteria can be finalised or implemented. Per HITL.md, the agent may not resolve these autonomously.

---

### HITL-REQ-01 — Notification Template PII Content Policy

**Status:** ✅ CLOSED — APPROVED 2026-09-10  
**Human Decision:** APPROVE — tiered model accepted as stated.  
**Decided by:** Product Owner  
**Expertise:** L3 | **Risk:** High | **Confidence (post-decision):** 100%

**Approved Policy — Notification PII Tiers:**

| Tier | Fields | Permitted in Phase 1? | Condition |
|------|--------|-----------------------|-----------|
| Tier 1 | Booking reference, hold expiry date/time, refund amount + currency, platform link (no PII in URL) | ✅ Yes — unconditionally | No DPA requirement |
| Tier 2 | Traveler first name (e.g. "Hi Alex,"), route summary (e.g. "LHR → JFK, 15 Oct") | ✅ Yes — if DPA with delivery provider (SES) is confirmed | DPA must be in place before Tier 2 content is enabled |
| Tier 3 | Full name, passport number, DOB, email address in message body, card details | ❌ Never | Prohibited in all channels, all phases |

**Implementation Rule:**
- All Phase 1 notification templates ship with Tier 1 content only.
- Tier 2 content is a feature-flagged addition, enabled per-tenant only after the DPA with SES is confirmed.
- Tier 3 content is blocked at the template engine layer — any template referencing a Tier 3 field fails validation at deploy time.

**Acceptance Criteria now unlocked:** AC-EXP-08-01 through AC-EXP-08-04 updated with full specification (see §1 DOMAIN 1 — EXPERIENCE).

---

### HITL-REQ-02 — ASC 606 / IFRS 15 Gross vs. Net Revenue Treatment

**Status:** ✅ CLOSED — NET (agent) decided 2026-09-10  
**Human Decision:** NET — platform recognises service fee only as revenue.  
**Decided by:** Product Owner (Finance to confirm fee structure before Sprint 2)  
**Expertise:** L3 | **Risk:** High | **Confidence (post-decision):** 100%

**Approved Policy — Revenue Recognition:**

| Item | Decision |
|------|----------|
| Recognition model | **NET (agent)** — ASC 606 / IFRS 15 agent treatment |
| Revenue amount | Platform service fee only — **not** the full ticket price |
| What is posted to ERP | Service fee amount per booking; ticket price is pass-through |
| `FinancialEventRecorded` usage | Event carries full ticket amounts for traveler/supplier reconciliation; ERP consumer extracts the fee component only |
| Sprint 1 | ERP posting stub — no revenue line posted (approved) |
| Sprint 2 gate | Fee amount/structure must be confirmed by Finance before Sprint 2 ERP posting AC is finalised |

**Implementation Rule:**
- `financial_event` schema unchanged — carries gross ticket amounts for audit and reconciliation.
- ERP posting consumer (Sprint 2) extracts the net service fee only.
- A `service_fee_amount` and `service_fee_currency` field must be added to `FinancialEventRecorded` in Sprint 2 to carry the net revenue amount explicitly.
- Fee amount/basis is a Sprint 2 pre-condition from Finance.

**Acceptance Criterion now unlocked:** AC-PAY-01-07 added to REQ-PAY-01.

---

### HITL-REQ-03 — Host Partner Selection and Sabre PCC Availability

**Status:** ✅ CLOSED — Wiremock fixture tests approved for Sprint 1, 2026-09-10  
**Human Decision:** Proceed with wiremock fixture tests for Sprint 1.  
**Decided by:** Product Owner  
**Expertise:** L2 | **Risk:** High | **Confidence (post-decision):** 100%

**Approved Approach:**

| Item | Decision |
|------|----------|
| Sprint 1 CI gate | Wiremock recorded-fixture tests — adapter conformance suite runs against fixtures, never against live Sabre sandbox |
| Sprint 1 acceptance gate | Live ticketing tests gated on host PCC availability in staging (DoD item) |
| Host partner name | Pending commercial confirmation — not blocking Sprint 1 development |
| Sabre sandbox PCC | Must be loaded into AWS Secrets Manager (staging) before Sprint 1 live acceptance tests |
| Production PCC | Required before Phase 1 go-live |

**Implementation Rule:**
- Wiremock fixtures are a Phase 1 deliverable per architecture.md §16.3 — not a temporary workaround.
- Every Sabre adapter operation (availability, hold, queue, void, refund) must have a corresponding recorded fixture.
- Sprint 1 Definition of Done for REQ-CNT-01 and REQ-EXP-03: all ACs pass against wiremock; live Sabre tests pass once PCC is available.
- A programme milestone is set: host partner name and sandbox PCC date confirmed ≥ 2 weeks before Sprint 1 integration test window.

**Acceptance Criterion now unlocked:** AC-CNT-01-09 added to REQ-CNT-01.

---

## 9. REQUIREMENT → ACCEPTANCE CRITERIA TRACEABILITY MATRIX

| Req ID | Requirement Title | AC IDs | Layer | Source |
|--------|-------------------|--------|-------|--------|
| REQ-EXP-01 | Travel Search | AC-EXP-01-01 to 08 | FE+BE | RequirementDocument §discovery; gap Q2, Q6 |
| REQ-EXP-02 | Create Booking (Hold) | AC-EXP-02-01 to 10 | FE+BE | RequirementDocument §booking; gap Q1, Q2, Q7, Q9, Q10 |
| REQ-EXP-03 | Confirm Booking (TICKETING_QUEUE) | AC-EXP-03-01 to 09 | FE+BE | gap Q1, Q3, Q7, Q8, ADR-009 |
| REQ-EXP-04 | Cancel Booking | AC-EXP-04-01 to 08 | FE+BE | RequirementDocument §cancellations; gap Q3, Q7 |
| REQ-EXP-05 | Trip Management | AC-EXP-05-01 to 05 | FE+BE | RequirementDocument §trip management; gap Q9 |
| REQ-EXP-06 | Booking Hold Expiry | AC-EXP-06-01 to 04 | FE+BE | gap Q7; RequirementDocument §disruption |
| REQ-EXP-07 | Approval Workflow | AC-EXP-07-01 to 05 | FE+BE | gap Q5, Q14 |
| REQ-EXP-08 | Notification Delivery | AC-EXP-08-01 to 05 (fully specified — HITL-REQ-01 resolved) | BE | gap Q15; RequirementDocument §communications |
| REQ-CNT-01 | Sabre GDS Adapter | AC-CNT-01-01 to 09 (AC-CNT-01-09 added — HITL-REQ-03 resolved) | BE | gap Q2, Q6, Q11, ADR-008, ADR-009 |
| REQ-CNT-02 | GDS Response Normalisation | AC-CNT-02-01 to 05 | BE | RequirementDocument §normalize; gap Q13 |
| REQ-CNT-03 | Outbound Idempotency | AC-CNT-03-01 to 05 | BE | gap Q9, ADR-011 |
| REQ-CNT-04 | Webhook Ingestion | AC-CNT-04-01 to 06 | BE | gap Q12 |
| REQ-CNT-05 | Supplier Reconciliation | AC-CNT-05-01 to 05 | BE | gap row M2; RequirementDocument §recoverability |
| REQ-POL-01 | Synchronous Policy Evaluation | AC-POL-01-01 to 06 | FE+BE | RequirementDocument §policies; gap Q5, Q10, ADR-004 |
| REQ-POL-02 | Policy Rule Schema & Versioning | AC-POL-02-01 to 05 | BE | gap Q5, ADR-004 |
| REQ-POL-03 | Policy Override | AC-POL-03-01 to 06 | FE+BE | gap Q5, Q10, C1, ADR-014 |
| REQ-POL-04 | BLOCK Rule Behaviour | AC-POL-04-01 to 03 | FE+BE | gap Q10, ADR-004, GUARDRAIL-P2 |
| REQ-PAY-01 | Financial Event (21 Dimensions) | AC-PAY-01-01 to 07 (AC-PAY-01-07 added — HITL-REQ-02 resolved) | BE | RequirementDocument §Travel Context; gap Q16, C5 |
| REQ-PAY-02 | Cost Allocation | AC-PAY-02-01 to 06 | BE | gap Q8, C2, C3, ADR-003 |
| REQ-PAY-03 | Refund Request | AC-PAY-03-01 to 07 | FE+BE | RequirementDocument §refunds; gap Q3, Q7, S1 |
| REQ-PAY-04 | Refund Confirmation | AC-PAY-04-01 to 05 | BE | gap Q3, Q7, S1 |
| REQ-PAY-05 | Void (Same-Day Window) | AC-PAY-05-01 to 04 | BE | gap Q3; RequirementDocument §cancellations |
| REQ-PAY-06 | Form of Payment Tracking | AC-PAY-06-01 to 03 | BE | gap S3 |
| REQ-SVC-01 | CONFIRM_EXCEPTION Handling | AC-SVC-01-01 to 04 | FE+BE | gap B6, ADR-012 |
| REQ-SVC-02 | Refund Submission to Supplier | AC-SVC-02-01 to 03 | BE | RequirementDocument §refunds; gap Q3, Q7 |
| REQ-SVC-03 | Illegal State Transition Rejection | AC-SVC-03-01 to 04 | BE | gap M1; RequirementDocument §transaction integrity |
| REQ-DAT-01 | Transaction Spine Entities | AC-DAT-01-01 to 05 | BE | gap Q4, Q9, ADR-001, ADR-010 |
| REQ-DAT-02 | Append-Only Immutable Tables | AC-DAT-02-01 to 03 | BE | gap ADR-002, GUARDRAIL-D1 |
| REQ-DAT-03 | PII Pointer Model & GDPR Erasure | AC-DAT-03-01 to 04 | BE | gap Q4, GUARDRAIL-D3 |
| REQ-DAT-04 | Transactional Outbox & Event Delivery | AC-DAT-04-01 to 06 | BE | gap M4, ADR-013 |
| REQ-DAT-05 | Multi-Tenant Data Isolation | AC-DAT-05-01 to 03 | BE | RequirementDocument §enterprise; gap Q9, GUARDRAIL-D2 |
| REQ-XCT-01 | Correlation ID Propagation | AC-XCT-01-01 to 04 | BE | gap Q9, GUARDRAIL-A2 |
| REQ-XCT-02 | Authentication & Role-Based Access | AC-XCT-02-01 to 05 | BE | gap C6, GUARDRAIL-S2, S5, S6 |
| REQ-XCT-03 | Idempotency on Mutating Endpoints | AC-XCT-03-01 to 03 | BE | gap Q9, GUARDRAIL-A1, ADR-011 |
| REQ-XCT-04 | Structured Logging & Observability | AC-XCT-04-01 to 04 | BE | RequirementDocument §observability; gap GUARDRAIL-O1, S3 |
| REQ-XCT-05 | Error Response Format | AC-XCT-05-01 to 03 | FE+BE | gap §15.1 |
| REQ-XCT-06 | No Raw PAN Storage | AC-XCT-06-01 to 03 | BE | gap Q3, ADR-005, GUARDRAIL-S1 |

---

## TOTALS SUMMARY

| Domain | Requirements | Acceptance Criteria |
|--------|-------------|---------------------|
| Experience (EXP) | 8 | 45 |
| Content / GDS (CNT) | 5 | 29 (+1 AC-CNT-01-09) |
| Policy (POL) | 4 | 18 |
| Payment & Expense (PAY) | 6 | 27 (+1 AC-PAY-01-07) |
| Servicing (SVC) | 3 | 11 |
| Data / Spine (DAT) | 5 | 21 |
| Cross-Cutting (XCT) | 6 | 19 |
| **Total** | **37** | **170** |

**HITL Items:** ✅ All 3 resolved (HITL-REQ-01, HITL-REQ-02, HITL-REQ-03)  
**Deferred (no ACs):** Exchanges, partial refunds, multi-currency, Amadeus adapter, approval chain/UI, policy authoring UI, SMS/push notifications, ADM handling, reporting mart, Sprint 2 ERP revenue posting (fee structure pending Finance) — all Phase 2+

---

**Status: APPROVED — READY FOR DEVELOPMENT**
