# TravelPlatform — Front-End Acceptance Criteria

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Derived from:** `requirement_breakdown.md` v1.0  
**Scope:** All acceptance criteria tagged `[FE]` or `[FE+BE]` — front-end implementation is required for these criteria.  
**Layer convention:**  
- `[FE]` — front-end only responsibility  
- `[FE+BE]` — both layers must satisfy the criterion; the front-end portion is described here  

> Criteria tagged `[BE]` only are not listed in this file. See `be_acceptance_criteria.md`.

---

## TABLE OF CONTENTS

1. [Experience Domain](#1-experience-domain)
2. [Content Domain](#2-content-domain)
3. [Policy Domain](#3-policy-domain)
4. [Payment & Expense Domain](#4-payment--expense-domain)
5. [Servicing Domain](#5-servicing-domain)
6. [Cross-Cutting](#6-cross-cutting)
7. [HITL Items Affecting Front-End](#7-hitl-items-affecting-front-end)
8. [FE Traceability Matrix](#8-fe-traceability-matrix)

---

## 1. EXPERIENCE DOMAIN

### REQ-EXP-01 — Travel Search

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-01-01 | [FE+BE] | **Given** a traveler provides origin, destination, departure date, return date, at least one passenger, and cabin class, **When** they submit the search, **Then** the UI sends the request and renders the returned list of available offers showing base fare, itemised taxes, fees, and total — all amounts displayed with currency code. |
| AC-EXP-01-02 | [FE] | **Given** the search form is displayed, **When** the traveler leaves origin or destination blank and attempts to submit, **Then** the form prevents submission, focus is moved to the first invalid field, and a visible field-level validation message identifying the missing field is displayed adjacent to that field. |
| AC-EXP-01-03 | [FE] | **Given** the traveler enters a departure date in the past, **When** they attempt to submit the search, **Then** the form prevents submission and displays an inline error on the departure date field stating the date must be today or a future date. |
| AC-EXP-01-04 | [FE] | **Given** a return date is provided that is earlier than or equal to the departure date, **When** the traveler attempts to submit, **Then** the form prevents submission and displays an inline error on the return date field stating it must be after the departure date. |

---

### REQ-EXP-02 — Create Booking (Hold)

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-02-01 | [FE+BE] | **Given** a traveler selects a valid offer and provides at least one passenger, **When** they submit the booking request, **Then** the UI displays the returned `booking_id`, `hold_expires_at` formatted as a human-readable date/time, and the policy decision outcome. |
| AC-EXP-02-05 | [FE] | **Given** the booking response includes `approval.status: PENDING`, **When** the booking confirmation screen is rendered, **Then** the UI displays a clearly labelled message stating the booking is awaiting approval and cannot be confirmed until approved; no confirm action is presented. |
| AC-EXP-02-10 | [FE] | **Given** the policy evaluation returns one or more `WARN` outcomes, **When** the booking hold result is displayed, **Then** the UI renders each warning message alongside the booking details as a visible but non-blocking notice, without preventing the user from proceeding to confirm. |

---

### REQ-EXP-03 — Confirm Booking (Issue Ticket)

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-03-01 | [FE+BE] | **Given** a booking is in `HELD` status and approval is `NOT_REQUIRED` or `APPROVED`, **When** the traveler submits a confirm request with payment reference and cost allocations, **Then** the UI transitions to a "Ticketing in progress" state and displays the returned `status: PENDING_ISSUE`. |
| AC-EXP-03-07 | [FE] | **Given** a booking is in `PENDING_ISSUE` status, **When** the trip detail screen is displayed, **Then** the UI shows a clear "Ticketing in progress" status indicator and does not present a confirm button, a cancel ticket button, or any other action that would create a duplicate confirmation attempt. |
| AC-EXP-03-08 | [FE] | **Given** the booking has transitioned to `CONFIRMED`, **When** the traveler views the booking detail screen, **Then** the UI displays the ticket number, coupon list with coupon numbers and statuses, void window expiry date/time, and total amount with currency. |

---

### REQ-EXP-04 — Cancel Booking

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-04-01 | [FE+BE] | **Given** a booking is in `HELD` or `PENDING_ISSUE` status, **When** the traveler submits a cancel request and the system confirms, **Then** the UI updates the booking status label to `CANCELLED` and displays a confirmation message with no refund calculation (no ticket was issued). |
| AC-EXP-04-02 | [FE+BE] | **Given** a `CONFIRMED` booking has all coupons `OPEN` and is within the void window, **When** the cancel response is received, **Then** the UI displays `within_void_window: true`, the full refundable amount, and a "Void eligible" indicator. |
| AC-EXP-04-03 | [FE+BE] | **Given** a `CONFIRMED` booking is outside the void window, **When** the cancel response is received, **Then** the UI displays the refund breakdown: gross amount, penalty amount, each non-refundable tax itemised by IATA code with amount and currency, and the net refundable amount. |
| AC-EXP-04-05 | [FE] | **Given** the cancellation response includes a non-zero `refundable_amount`, **When** the cancellation confirmation screen is displayed, **Then** the UI shows gross amount, penalty, itemised non-refundable taxes (label: IATA tax code, amount, currency), and net refundable amount — each on a distinct labelled row. |

---

### REQ-EXP-05 — Trip Management

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-05-01 | [FE+BE] | **Given** an authenticated traveler requests a trip, **When** the trip detail screen renders, **Then** the UI displays trip purpose, date window (start and end), and all associated bookings — each showing its status label and segment origin/destination/departure/arrival. |
| AC-EXP-05-04 | [FE] | **Given** a trip has bookings in multiple states, **When** the trip detail screen is displayed, **Then** each booking shows a human-readable status label for all valid states: `HELD` ("Hold Active"), `PENDING_ISSUE` ("Ticketing in Progress"), `CONFIRMED` ("Ticket Issued"), `COMPLETED` ("Travel Complete"), `CANCELLED` ("Cancelled"), `EXPIRED` ("Hold Expired"), `CONFIRM_EXCEPTION` ("Action Required"). |
| AC-EXP-05-05 | [FE] | **Given** a booking is in `CONFIRM_EXCEPTION` status, **When** the trip detail screen renders, **Then** the UI displays a prominent error alert with the message "This booking requires manual intervention" and shows the `correlation_id` as a support reference. No self-service action button is presented. |

---

### REQ-EXP-06 — Booking Hold Expiry

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-06-03 | [FE] | **Given** a booking has transitioned to `EXPIRED`, **When** the traveler navigates to the trip detail screen, **Then** the UI clearly displays the booking as expired with a message explaining the hold has been released and presents a "Search again" call-to-action. |

---

### REQ-EXP-07 — Approval Workflow

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-07-05 | [FE] | **Given** the traveler views a booking in `PENDING` approval status, **When** the booking detail screen is rendered, **Then** the UI displays the approver's name (from the snapshotted approver), the approval expiry date/time, and the status label "Pending Approval" — with a note that confirmation is blocked until a decision is received. |

---

### REQ-EXP-08 — Notification Delivery

> 🔴 **HITL-REQ-01 applies.** Front-end notification template content for itinerary PII cannot be finalised until the Compliance/Legal policy is approved. The ACs below reflect the interim constraint (email + booking reference only).

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-EXP-08-01 | [BE → FE trigger] | **Given** the in-app `BookingHeld` notification is delivered, **When** the traveler opens the in-app notification centre, **Then** the notification is displayed with booking reference, hold expiry time, and a link to the trip detail screen. Raw traveler name and passport are not shown (interim constraint — pending HITL-REQ-01). |
| AC-EXP-08-02 | [BE → FE trigger] | **Given** the in-app `ApprovalRequested` notification is delivered, **When** the approver opens the in-app notification centre, **Then** the notification is displayed with the booking reference and an "Approve / Reject" action link. |
| AC-EXP-08-03 | [BE → FE trigger] | **Given** the in-app `BookingExpired` notification is delivered, **When** the traveler opens the in-app notification centre, **Then** the notification reads "Your booking [reference] has expired. The hold has been released." with a "Search again" link. |
| AC-EXP-08-04 | [BE → FE trigger] | **Given** the in-app `RefundConfirmed` notification is delivered, **When** the traveler opens the in-app notification centre, **Then** the notification shows the refund amount with currency and the payment reference — no raw PAN or card number. |

---

## 2. CONTENT DOMAIN

> No `[FE]` or `[FE+BE]` criteria exist in the Content domain for Phase 1. All Content ACs are back-end only.  
> The search results and error messages surfaced by REQ-EXP-01 and REQ-EXP-02 are the front-end manifestations of Content domain data — those ACs are captured under the Experience domain above.

---

## 3. POLICY DOMAIN

### REQ-POL-01 — Synchronous Policy Evaluation

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-01-05 | [FE] | **Given** policy evaluation returns a `WARN` outcome, **When** the booking result is rendered, **Then** each warning message (the `rationale` from the matched rule) is shown in a visible, distinct warning panel adjacent to the offer details — the traveler can acknowledge and continue. |
| AC-POL-01-06 | [FE] | **Given** policy evaluation returns a `BLOCK` outcome, **When** the booking result is rendered, **Then** the UI shows a non-dismissible error panel with the block reason; no confirm button, no override option, and no approval path is presented. The only available action is to return to the search. |

---

### REQ-POL-03 — Policy Override

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-03-05 | [FE] | **Given** a booking has a `WARN` outcome and the traveler chooses to proceed, **When** the override confirmation step is rendered, **Then** the UI presents a mandatory dropdown of reason codes (loaded from the tenant-configured enum) with an optional free-text field; the traveler cannot proceed until a reason code is selected. |

---

### REQ-POL-04 — BLOCK Rule Behaviour

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-POL-04-03 | [FE] | **Given** a `BLOCK` outcome is received, **When** the booking result is rendered, **Then** the UI renders only the block reason message and a "Return to search" button — no confirm, override, or approval path is visible or accessible. |

---

## 4. PAYMENT & EXPENSE DOMAIN

### REQ-PAY-03 — Refund Request

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-PAY-03-07 | [FE] | **Given** a refund request is initiated by the traveler, **When** the refund summary screen is rendered, **Then** the UI displays: gross ticket amount with currency, penalty amount with currency, a table of non-refundable taxes (one row per IATA tax code: code, amount, currency, "Non-refundable" label), net refundable amount with currency, and the return-to payment method description (e.g., "Original lodge card"). All amounts are formatted in human-readable form (e.g., "USD 278.10"), not as raw integer minor units. |

---

## 5. SERVICING DOMAIN

### REQ-SVC-01 — CONFIRM_EXCEPTION Handling

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-SVC-01-04 | [FE] | **Given** a booking is in `CONFIRM_EXCEPTION` status, **When** the trip detail screen is rendered, **Then** the UI displays a prominent error alert styled to distinguish it from warnings, with the text "This booking requires manual support intervention." The correlation ID is displayed as a copyable reference. No self-service action (cancel, retry, refund) is offered. |

---

## 6. CROSS-CUTTING

### REQ-XCT-05 — Error Response Format

| AC ID | Tag | Acceptance Criterion |
|-------|-----|---------------------|
| AC-XCT-05-03 | [FE] | **Given** any API call returns an error response, **When** the UI renders the error state, **Then** a user-friendly message is displayed appropriate to the error type; raw `error_code` values, HTTP status codes, stack traces, correlation IDs (except in support-facing contexts), and internal identifiers are never shown to the end user in the primary UI surface. |

---

## 7. HITL ITEMS AFFECTING FRONT-END

### HITL-REQ-01 — Notification Template PII Content Policy

🔴 **OPEN — blocks finalisation of in-app notification content ACs.**

Front-end notification templates for booking confirmation, approval request, hold expiry, and refund confirmation cannot be fully specified until Compliance/Legal approves the PII content policy (gap-analysis.md GAP-ARCH-03).

**Interim constraint applied to all in-app notification ACs above:** Only booking reference and expiry/amount data are shown. Raw traveler name, route details, and passport information are excluded from notification content until the policy is confirmed.

**Impact:** AC-EXP-08-01 through AC-EXP-08-04 carry partial specification only. Full notification template ACs are deferred until HITL-REQ-01 is resolved.

---

## 8. FE TRACEABILITY MATRIX

| AC ID | Req ID | Layer | Description |
|-------|--------|-------|-------------|
| AC-EXP-01-01 | REQ-EXP-01 | FE+BE | Search form submission — render results with amounts and currencies |
| AC-EXP-01-02 | REQ-EXP-01 | FE | Search form — missing origin/destination validation |
| AC-EXP-01-03 | REQ-EXP-01 | FE | Search form — past departure date validation |
| AC-EXP-01-04 | REQ-EXP-01 | FE | Search form — return date before departure validation |
| AC-EXP-02-01 | REQ-EXP-02 | FE+BE | Booking hold — render booking_id, hold_expires_at, policy decision |
| AC-EXP-02-05 | REQ-EXP-02 | FE | Booking hold — show pending approval message, suppress confirm |
| AC-EXP-02-10 | REQ-EXP-02 | FE | Booking hold — render WARN messages non-blocking |
| AC-EXP-03-01 | REQ-EXP-03 | FE+BE | Confirm — show PENDING_ISSUE status |
| AC-EXP-03-07 | REQ-EXP-03 | FE | Confirm — suppress duplicate confirm while PENDING_ISSUE |
| AC-EXP-03-08 | REQ-EXP-03 | FE | Confirm — render ticket number, coupons, void window on CONFIRMED |
| AC-EXP-04-01 | REQ-EXP-04 | FE+BE | Cancel (pre-ticket) — update status, no refund calculation |
| AC-EXP-04-02 | REQ-EXP-04 | FE+BE | Cancel (within void window) — show full refundable amount |
| AC-EXP-04-03 | REQ-EXP-04 | FE+BE | Cancel (outside void window) — show refund breakdown |
| AC-EXP-04-05 | REQ-EXP-04 | FE | Cancel — render itemised tax breakdown on confirmation screen |
| AC-EXP-05-01 | REQ-EXP-05 | FE+BE | Trip detail — show all bookings with status and segments |
| AC-EXP-05-04 | REQ-EXP-05 | FE | Trip detail — human-readable status labels for all states |
| AC-EXP-05-05 | REQ-EXP-05 | FE | Trip detail — CONFIRM_EXCEPTION alert with correlation ID |
| AC-EXP-06-03 | REQ-EXP-06 | FE | Expired booking — expiry message and Search again CTA |
| AC-EXP-07-05 | REQ-EXP-07 | FE | Approval pending — show approver name, expiry, blocked state |
| AC-EXP-08-01 | REQ-EXP-08 | FE trigger | In-app: BookingHeld — reference + expiry + link |
| AC-EXP-08-02 | REQ-EXP-08 | FE trigger | In-app: ApprovalRequested — reference + action link |
| AC-EXP-08-03 | REQ-EXP-08 | FE trigger | In-app: BookingExpired — expiry message + search again |
| AC-EXP-08-04 | REQ-EXP-08 | FE trigger | In-app: RefundConfirmed — amount + payment reference |
| AC-POL-01-05 | REQ-POL-01 | FE | Policy WARN — render warning panel, allow continuation |
| AC-POL-01-06 | REQ-POL-01 | FE | Policy BLOCK — non-dismissible block panel, return to search only |
| AC-POL-03-05 | REQ-POL-03 | FE | Override — mandatory reason code dropdown before proceeding |
| AC-POL-04-03 | REQ-POL-04 | FE | BLOCK — no confirm/override/approval path rendered |
| AC-PAY-03-07 | REQ-PAY-03 | FE | Refund summary — human-readable breakdown with IATA tax rows |
| AC-SVC-01-04 | REQ-SVC-01 | FE | CONFIRM_EXCEPTION — alert with correlation ID, no self-service actions |
| AC-XCT-05-03 | REQ-XCT-05 | FE | Error display — user-friendly messages, no raw codes or stack traces |

**Total FE / FE+BE criteria: 30**  
*(4 in-app notification ACs marked as partial pending HITL-REQ-01)*

---

**Status: READY FOR HIL REVIEW**
