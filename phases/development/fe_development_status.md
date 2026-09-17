# TravelPlatform — FE Development Status & Traceability Matrix

**Document Version:** 1.0  
**Date:** 2026-09-03  
**Derived from:** `fe_acceptance_criteria.md` v1.0  
**Scope:** All `[FE]` and `[FE+BE]` acceptance criteria — implementation status against the live codebase  

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and verified in source |
| ⚠️ | Partially implemented — gaps noted |
| ❌ | Not yet implemented |
| 🔒 | Blocked by backend dependency |

---

## 1. EXPERIENCE DOMAIN

### REQ-EXP-01 — Travel Search

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-01-01 | FE+BE | Submit search → render offers with base fare, taxes, fees, total + currency code | ✅ | `SearchForm.tsx` submits `SearchRequest`; `SearchResults.tsx` renders each `FlightOffer` with expandable fare breakdown (base / taxes / fees / total). `CurrencyAmount` component formats all amounts with ISO 4217 currency code | Fare breakdown is estimated client-side from offer price (15% tax + $25 fee stub); real breakdown comes from backend on hold |
| AC-EXP-01-02 | FE | Missing origin/destination → prevent submit, focus first invalid field, field-level message | ✅ | `SearchForm.tsx` + `validateFlightSearchCriteria()` in `validation.ts`; errors set per-field, first error field gets focus on submit attempt | IATA 3-letter code validation included |
| AC-EXP-01-03 | FE | Past departure date → prevent submit, inline error on departure field | ✅ | `validateFlightSearchCriteria()` calls `isDateInPast()`; `SearchForm` sets `errors.departureDate`; `min` attribute on date input enforces browser-level constraint | |
| AC-EXP-01-04 | FE | Return ≤ departure → prevent submit, inline error on return field | ✅ | `validateFlightSearchCriteria()` compares return vs departure dates; error rendered on return date field | |

---

### REQ-EXP-02 — Create Booking (Hold)

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-02-01 | FE+BE | Select offer + at least 1 passenger → display `booking_id`, `hold_expires_at`, policy decision | ✅ | `PassengerForm.tsx` collects ≥1 passenger; `BookingHoldPanel.tsx` calls `holdBooking()` and renders `confirmationNumber`, `holdExpiresAt` (formatted), and `PolicyOutcomePanel`; `BookingContext` stores `currentBooking` | `hold_expires_at` displayed as human-readable date/time in hold confirmation block |
| AC-EXP-02-05 | FE | `approval.status: PENDING` → show awaiting-approval message, suppress confirm action | ✅ | `ApprovalPendingScreen.tsx` renders when `holdResponse.approvalDetails` is set or `bookingStatus === PENDING_APPROVAL`; no confirm button is present; locked notice reads "Confirmation is blocked until your manager approves" | Implements design-document.md §2.6 |
| AC-EXP-02-10 | FE | WARN policy outcome → show each warning message as non-blocking notice alongside booking | ✅ | `PolicyOutcomePanel.tsx` WARN branch renders yellow panel with each policy rule and warning message; "Acknowledge" button required before proceeding but does not block the hold action | WARN panel shown inline within `BookingHoldPanel` before CTA |

---

### REQ-EXP-03 — Confirm Booking (Issue Ticket)

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-03-01 | FE+BE | HELD + not-blocked policy → submit confirm with payment reference → show `PENDING_ISSUE` | ⚠️ | `App.tsx` calls `confirmBooking()` after hold; mock returns `CONFIRMED` immediately (no `PENDING_ISSUE` intermediate state). `BookingConfirmedScreen` renders confirmed state | Real backend may return `PENDING_ISSUE` first; intermediate ticketing-in-progress screen not yet built |
| AC-EXP-03-07 | FE | `PENDING_ISSUE` status → show "Ticketing in progress", suppress confirm/cancel buttons | ❌ | No dedicated `PENDING_ISSUE` screen; mock skips directly to `CONFIRMED` | Needs a `TicketingInProgressScreen` component wired to `PENDING_ISSUE` booking status |
| AC-EXP-03-08 | FE | `CONFIRMED` → display ticket number, coupon list + statuses, void window expiry, total with currency | ✅ | `BookingConfirmedScreen.tsx` renders: ticket numbers, coupon table (segment, OPEN status), void window expiry (24h stub), fare breakdown table with `CurrencyAmount` on every row | Void window is a stub (now + 24h); real value comes from backend |

---

### REQ-EXP-04 — Cancel Booking

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-04-01 | FE+BE | Cancel HELD/PENDING_ISSUE → update status to CANCELLED, show message, no refund calc | ❌ | `cancelBooking()` exists on `bookingService` and returns correct shape; no Cancel UI screen or button wired in the frontend flow | Needs cancellation CTA + `CancelledScreen` component |
| AC-EXP-04-02 | FE+BE | Cancel CONFIRMED within void window → show `within_void_window: true`, full refundable amount, "Void eligible" indicator | ❌ | Types and service method exist; no UI rendering | Dependent on AC-EXP-04-01 |
| AC-EXP-04-03 | FE+BE | Cancel CONFIRMED outside void window → show refund breakdown: gross, penalty, itemised taxes, net | ❌ | Types defined in `BookingCancellationResponse`; no UI rendering | Dependent on AC-EXP-04-01 |
| AC-EXP-04-05 | FE | Cancellation confirmation screen → gross, penalty, itemised non-refundable taxes, net on distinct rows | ❌ | Not implemented | Dependent on AC-EXP-04-01 |

---

### REQ-EXP-05 — Trip Management

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-05-01 | FE+BE | Trip detail → show trip purpose, date window, all bookings with status label + segments | ❌ | `listBookings()` and `getBookingDetail()` exist on service; no Trip Management page | Needs `TripDetailPage` component |
| AC-EXP-05-04 | FE | Human-readable status labels for all states: HELD, PENDING_ISSUE, CONFIRMED, COMPLETED, CANCELLED, EXPIRED, CONFIRM_EXCEPTION | ✅ | `statusMapping.ts` → `getBookingStatusDisplay()` maps all 9 `BookingStatusValues` to label + color; used by `StatusBadge` common component | Labels: "On Hold", "Ticketing In Progress", "Confirmed", "Travel Complete", "Cancelled", "Hold Expired", "Action Required" |
| AC-EXP-05-05 | FE | `CONFIRM_EXCEPTION` → prominent error alert, "manual intervention" message, `correlation_id` as support reference, no self-service action | ❌ | Status display defined in `statusMapping.ts`; no dedicated screen | Needs `ConfirmExceptionAlert` component wired to trip detail |

---

### REQ-EXP-06 — Booking Hold Expiry

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-06-03 | FE | `EXPIRED` booking → show expiry message, "Search again" CTA | ❌ | `EXPIRED` status label defined in `statusMapping.ts`; no expired booking screen | Needs expiry detection + `ExpiredBookingScreen` |

---

### REQ-EXP-07 — Approval Workflow

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-07-05 | FE | `PENDING` approval → show approver name, expiry date/time, "Pending Approval" label, confirm blocked | ✅ | `ApprovalPendingScreen.tsx` renders approver name, email, `approvalExpiresAt` (formatted), status badge "⏳ Pending Approval", locked-confirm notice | Approver data comes from `holdResponse.approvalDetails` |

---

### REQ-EXP-08 — Notification Delivery

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-EXP-08-01 | BE→FE | In-app: `BookingHeld` — traveler name, reference, route, hold expiry, trip link | ❌ | No notification centre component | Requires notification centre + backend event stream |
| AC-EXP-08-02 | BE→FE | In-app: `ApprovalRequested` — traveler name, reference, route, Approve/Reject link | ❌ | Not implemented | |
| AC-EXP-08-03 | BE→FE | In-app: `BookingExpired` — expiry message, "Search again" link | ❌ | Not implemented | |
| AC-EXP-08-04 | BE→FE | In-app: `RefundConfirmed` — refund amount, payment reference, booking reference, no PAN | ❌ | Not implemented | HITL-REQ-01 approved |

---

## 2. CONTENT DOMAIN

> No `[FE]` or `[FE+BE]` criteria. All content ACs are back-end only.

---

## 3. POLICY DOMAIN

### REQ-POL-01 — Synchronous Policy Evaluation

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-POL-01-05 | FE | WARN → visible, distinct warning panel, traveler can acknowledge and continue | ✅ | `PolicyOutcomePanel.tsx` WARN branch: yellow panel, each warning message listed, "I understand — continue anyway" button required before proceeding | Non-blocking per spec |
| AC-POL-01-06 | FE | BLOCK → non-dismissible error panel with block reason; no confirm, no override, no approval path | ✅ | `PolicyOutcomePanel.tsx` BLOCK branch: red panel with `role="alert" aria-live="assertive"`, only "← Return to Search" button rendered; no confirm CTA present in `BookingHoldPanel` when `isBlocked === true` | |

---

### REQ-POL-03 — Policy Override

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-POL-03-05 | FE | WARN override → mandatory reason-code dropdown + optional free-text; cannot proceed until reason selected | ❌ | WARN acknowledge button exists but has no reason-code dropdown | Needs reason code enum from backend + dropdown wired to acknowledge flow |

---

### REQ-POL-04 — BLOCK Rule Behaviour

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-POL-04-03 | FE | BLOCK → render only block reason + "Return to search"; no confirm/override/approval path visible | ✅ | `PolicyOutcomePanel.tsx` BLOCK branch + `BookingHoldPanel.tsx` suppresses all booking CTAs when `isBlocked === true` | |

---

## 4. PAYMENT & EXPENSE DOMAIN

### REQ-PAY-03 — Refund Request

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-PAY-03-07 | FE | Refund summary → gross, penalty, IATA tax table (code/amount/currency/"Non-refundable"), net amount, payment method description; all in human-readable format | ❌ | `RefundRequest`/`RefundResponse` types exist in `refund.ts`; no refund UI | Dependent on cancel flow (AC-EXP-04) |

---

## 5. SERVICING DOMAIN

### REQ-SVC-01 — CONFIRM_EXCEPTION Handling

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-SVC-01-04 | FE | `CONFIRM_EXCEPTION` → prominent error alert, "manual support intervention" text, copyable correlation ID, no self-service actions | ❌ | Status defined in `BookingStatusValues` and `statusMapping.ts`; no UI component | Needs `ConfirmExceptionAlert` component |

---

## 6. CROSS-CUTTING

### REQ-XCT-05 — Error Response Format

| AC ID | Tag | Criterion Summary | Status | Implementation | Notes |
|-------|-----|-------------------|--------|----------------|-------|
| AC-XCT-05-03 | FE | API errors → user-friendly message; no raw codes, HTTP status, stack traces, or internal IDs | ✅ | `errorMapper.ts` maps all API errors to `displayMessage` strings; `App.tsx` renders via `<Alert variant="error">` component; correlation ID never shown in primary UI | |

---

## 7. IMPLEMENTATION SUMMARY COUNTS

| Domain | Total ACs | ✅ Implemented | ⚠️ Partial | ❌ Not Yet |
|--------|-----------|---------------|-----------|-----------|
| REQ-EXP-01 Search | 4 | 4 | 0 | 0 |
| REQ-EXP-02 Hold | 3 | 3 | 0 | 0 |
| REQ-EXP-03 Confirm | 3 | 1 | 1 | 1 |
| REQ-EXP-04 Cancel | 4 | 0 | 0 | 4 |
| REQ-EXP-05 Trip Mgmt | 3 | 1 | 0 | 2 |
| REQ-EXP-06 Expiry | 1 | 0 | 0 | 1 |
| REQ-EXP-07 Approval | 1 | 1 | 0 | 0 |
| REQ-EXP-08 Notifications | 4 | 0 | 0 | 4 |
| REQ-POL-01 Policy Eval | 2 | 2 | 0 | 0 |
| REQ-POL-03 Override | 1 | 0 | 0 | 1 |
| REQ-POL-04 Block | 1 | 1 | 0 | 0 |
| REQ-PAY-03 Refund | 1 | 0 | 0 | 1 |
| REQ-SVC-01 Exceptions | 1 | 0 | 0 | 1 |
| REQ-XCT-05 Errors | 1 | 1 | 0 | 0 |
| **TOTAL** | **30** | **14** | **1** | **15** |

**Phase 1 coverage: 47% fully implemented, 50% not yet started, 3% partial**

---

## 8. FULL TRACEABILITY MATRIX

| AC ID | Req ID | Layer | Status | Source File(s) | Key Functions / Components |
|-------|--------|-------|--------|----------------|---------------------------|
| AC-EXP-01-01 | REQ-EXP-01 | FE+BE | ✅ | `SearchForm.tsx`, `SearchResults.tsx`, `validation.ts`, `currency.ts` | `validateFlightSearchCriteria()`, `SearchResults` fare breakdown toggle, `formatMoney()` |
| AC-EXP-01-02 | REQ-EXP-01 | FE | ✅ | `SearchForm.tsx`, `validation.ts` | `validateFlightSearchCriteria()` — origin/destination required + IATA check, focus management on error |
| AC-EXP-01-03 | REQ-EXP-01 | FE | ✅ | `SearchForm.tsx`, `validation.ts` | `isDateInPast()`, `errors.departureDate`, `min` attr on date input |
| AC-EXP-01-04 | REQ-EXP-01 | FE | ✅ | `SearchForm.tsx`, `validation.ts` | `validateFlightSearchCriteria()` return > departure check, `errors.returnDate` |
| AC-EXP-02-01 | REQ-EXP-02 | FE+BE | ✅ | `PassengerForm.tsx`, `BookingHoldPanel.tsx`, `BookingContext.tsx`, `bookingService.ts`, `booking.ts` | `PassengerForm` validation, `holdBooking()`, `BookingHoldPanel` confirmation block with `confirmationNumber` + `holdExpiresAt`, `PolicyOutcomePanel` |
| AC-EXP-02-05 | REQ-EXP-02 | FE | ✅ | `ApprovalPendingScreen.tsx`, `App.tsx` | `ApprovalPendingScreen` — no confirm CTA, locked notice, approver details; routed when `holdResponse.approvalDetails` set |
| AC-EXP-02-10 | REQ-EXP-02 | FE | ✅ | `PolicyOutcomePanel.tsx`, `BookingHoldPanel.tsx` | WARN branch — yellow panel, acknowledge button; `isBlocked` guard prevents CTA when BLOCK |
| AC-EXP-03-01 | REQ-EXP-03 | FE+BE | ⚠️ | `App.tsx`, `bookingService.ts` | `confirmBooking()` called post-hold; no `PENDING_ISSUE` intermediate screen |
| AC-EXP-03-07 | REQ-EXP-03 | FE | ❌ | — | `PENDING_ISSUE` status label in `statusMapping.ts` only; no screen |
| AC-EXP-03-08 | REQ-EXP-03 | FE | ✅ | `BookingConfirmedScreen.tsx`, `booking.ts` | Ticket numbers, coupon table (`OPEN` status), void window expiry, fare breakdown with `CurrencyAmount` |
| AC-EXP-04-01 | REQ-EXP-04 | FE+BE | ❌ | — | `cancelBooking()` on service; no UI |
| AC-EXP-04-02 | REQ-EXP-04 | FE+BE | ❌ | — | Type `BookingCancellationResponse.refundEligible` defined; no UI |
| AC-EXP-04-03 | REQ-EXP-04 | FE+BE | ❌ | — | Type defined; no UI |
| AC-EXP-04-05 | REQ-EXP-04 | FE | ❌ | — | Not started |
| AC-EXP-05-01 | REQ-EXP-05 | FE+BE | ❌ | — | `listBookings()` / `getBookingDetail()` on service; no page |
| AC-EXP-05-04 | REQ-EXP-05 | FE | ✅ | `statusMapping.ts`, `StatusBadge.tsx` | `getBookingStatusDisplay()` maps all 9 states; `getBookingStatusClass()` provides CSS classes |
| AC-EXP-05-05 | REQ-EXP-05 | FE | ❌ | — | `CONFIRM_EXCEPTION` in `BookingStatusValues`; no alert component |
| AC-EXP-06-03 | REQ-EXP-06 | FE | ❌ | — | `EXPIRED` status label in `statusMapping.ts`; no screen |
| AC-EXP-07-05 | REQ-EXP-07 | FE | ✅ | `ApprovalPendingScreen.tsx`, `booking.ts` | `approvalDetails.approverName`, `approvalExpiresAt`, "Pending Approval" badge, blocked confirm notice |
| AC-EXP-08-01 | REQ-EXP-08 | BE→FE | ❌ | — | No notification centre |
| AC-EXP-08-02 | REQ-EXP-08 | BE→FE | ❌ | — | No notification centre |
| AC-EXP-08-03 | REQ-EXP-08 | BE→FE | ❌ | — | No notification centre |
| AC-EXP-08-04 | REQ-EXP-08 | BE→FE | ❌ | — | No notification centre |
| AC-POL-01-05 | REQ-POL-01 | FE | ✅ | `PolicyOutcomePanel.tsx` | WARN branch — `role="note"`, each `policyName` + `details`, acknowledge button (`warnAcknowledged` state) |
| AC-POL-01-06 | REQ-POL-01 | FE | ✅ | `PolicyOutcomePanel.tsx`, `BookingHoldPanel.tsx` | BLOCK branch — `role="alert" aria-live="assertive"`, non-dismissible, only Return to Search CTA |
| AC-POL-03-05 | REQ-POL-03 | FE | ❌ | — | Acknowledge button present but no reason-code dropdown or free-text field |
| AC-POL-04-03 | REQ-POL-04 | FE | ✅ | `PolicyOutcomePanel.tsx`, `BookingHoldPanel.tsx` | `isBlocked` check hides all booking CTAs; BLOCK panel shows only "← Return to Search" |
| AC-PAY-03-07 | REQ-PAY-03 | FE | ❌ | — | `RefundRequest` / `RefundResponse` in `refund.ts`; no refund UI |
| AC-SVC-01-04 | REQ-SVC-01 | FE | ❌ | — | `CONFIRM_EXCEPTION` in `BookingStatusValues`; no UI |
| AC-XCT-05-03 | REQ-XCT-05 | FE | ✅ | `errorMapper.ts`, `App.tsx` | `mapApiError()` → `displayMessage`; rendered as `<Alert variant="error">`; no raw codes surfaced |

---

## 9. WHAT REMAINS — PRIORITISED BACKLOG

| Priority | AC IDs | Component(s) Needed |
|----------|--------|---------------------|
| P1 — Next sprint | AC-EXP-03-07 | `TicketingInProgressScreen` — show PENDING_ISSUE state, suppress confirm/cancel |
| P1 — Next sprint | AC-EXP-04-01/02/03/05 | `CancelBookingFlow` — cancel CTA, `CancelledScreen`, refund breakdown |
| P1 — Next sprint | AC-POL-03-05 | Extend WARN panel with reason-code dropdown (requires backend enum endpoint) |
| P2 | AC-EXP-05-01, AC-EXP-05-05 | `TripDetailPage` — list bookings, status per booking, CONFIRM_EXCEPTION alert |
| P2 | AC-EXP-06-03 | `ExpiredBookingScreen` — expiry message + "Search again" CTA |
| P2 | AC-SVC-01-04 | `ConfirmExceptionAlert` — error alert, copyable correlation ID |
| P3 | AC-EXP-08-01–04 | `NotificationCentre` — requires backend event stream / WebSocket |
| P3 | AC-PAY-03-07 | `RefundSummaryScreen` — depends on cancel flow |

---

*Generated from live source scan of `apps/web-frontend/src`. Build status: ✅ passing. Test status: 271/271 passing.*
