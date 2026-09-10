# TravelPlatform — UI/UX Design Document

**Document Version:** 1.0  
**Date:** 2026-09-10  
**Status:** READY FOR UI/UX DESIGNER + PO REVIEW  
**Source:** `requirement_breakdown.md` v1.0, `architecture.md` v1.4, `fe_acceptance_criteria.md` v1.0  
**Phase:** UI/UX Design (SDLC Phase 5)

---

## 1. OVERVIEW

### 1.1 Design Scope

This document covers the Phase 1 web front-end for TravelPlatform — a B2B travel booking platform enabling corporate travelers to search for air travel, create and hold bookings, obtain approvals, confirm ticketing, view trip details, and manage cancellations/refunds.

**Deployable A — travelplatform-experience (TypeScript)**  
**FE Modules:** Search, Booking Hold, Confirmation/Ticketing, Trip Management, Cancellation/Refund, Policy, Notifications, Error/Support

### 1.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | React + TypeScript | Modular UI journeys, state-driven actions, accessibility |
| Testing | Vitest + Playwright | Unit/component coverage + E2E validation |
| State | React Context + URL routing | Bookings are state machines; UI reflects authoritative state |
| Design System | Custom component library | Consistency across domains; accessibility-first |

### 1.3 Design Principles (per Architecture Guardrails)

| Principle | Application |
|-----------|-------------|
| API-first | All screens are driven by canonical API responses |
| State-driven actions | UI action availability derived from booking/approval state |
| No inference | FE never infers ticketed state from button clicks |
| Prevent duplicates | Suppress actions that create duplicate state transitions |
| Human-readable amounts | All monetary values rendered as `USD 278.10` (not minor units) |
| User-safe errors | Raw error codes never shown; correlation ID only in support contexts |

---

## 2. WIREFRAMES (ASCII BLOCK DIAGRAMS)

All wireframes assume:
- Responsive: mobile-first with desktop enhancements
- Header: Logo + Main nav + User avatar + Notification bell
- Footer: Main action buttons (primary/secondary/tertiary)
- Consistent spacing: 8px baseline grid

---

### 2.1 Screen: Search Form (Search Page)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Search Flights                    [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Origin                      Destination        Departure   Return   │   │
│  │ [LHR       ▼]               [JFK       ▼]      [01Oct26   ▼][05Oct26 ▼]│   │
│  │ ⚠ Origin required          ⚠ Destination required                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Passengers           Cabin Class                                     │   │
│  │ [1 Adult  ▼]         [Economy  ▼]                                   │   │
│  │ +  -                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [✓ Search Flights]                          [Clear Form]                   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Footer: Help · Terms · Privacy]                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-01-01, AC-EXP-01-02, AC-EXP-01-03, AC-EXP-01-04

---

### 2.2 Screen: Search Results (Search Page)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Search Results                    [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ LHR → JFK   15:00 ─ 18:30   12h00m  │   Economy │  $278.10 (USD)    │   │
│  │ United Airlines                    │  Includes taxes            │   │
│  │  ───────────────────────────────────────────────────────────────────│   │
│  │ LHR → JFK   16:00 ─ 19:45   12h45m  │   Economy │  $295.50 (USD)    │   │
│  │ Delta Airlines                     │  Includes taxes            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ☐ United [Economy]  $278.10      [Select]                            │   │
│  │ ☐ Delta [Economy]   $295.50      [Select]                            │   │
│  │ ☐ British Airways   $310.00      [Select]                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [✓ Continue to Booking]                          [← Back to Search]         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-01-01

---

### 2.3 Screen: Booking Hold (Passenger + Policy)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Book Flight                       [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Selected: United LHR → JFK   15:00 ─ 18:30   Economy   $278.10     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PASSENGERS                                                            │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ 1. Alex Smith        ADT   [Edit passenger]                     │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  │ [＋ Add Passenger]                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ POLICY DECISION: ALLOW (1 rule matched)                              │   │
│  │ • Business travel approved per travel policy v2.1                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Hold Booking for 30 min]                   [← Cancel]                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-02-01, AC-EXP-02-10

---

### 2.4 Screen: Booking Hold with WARN (Policy Warning)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Book Flight                       [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Selected: United LHR → JFK   15:00 ─ 18:30   Economy   $278.10     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PASSENGERS                                                            │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ 1. Alex Smith        ADT                                       │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚠ POLICY WARNING (1 rule matched)                                    │   │
│  │ • Advance purchase < 7 days: surcharge may apply                     ��   │
│  │   (Policy v2.1, rule POL-ADV-001)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [Hold Booking for 30 min]                   [← Cancel]                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-02-10, AC-POL-01-05

---

### 2.5 Screen: Booking Hold with BLOCK (Policy Block)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Book Flight                       [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Selected: United LHR → JFK   15:00 ─ 18:30   Economy   $278.10     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PASSENGERS                                                            │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │ │ 1. Alex Smith        ADT                                       │ │   │
│  │ └─────────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✘ POLICY BLOCKED                                                     │   │
│  │ • Destination country requires visa not held by traveler             │   │
│  │   (Policy v2.1, rule POL-VISA-001)                                   │   │
│  │                                                                       │   │
│  │ [Return to Search]                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-02-03, AC-POL-01-06, AC-POL-04-03

---

### 2.6 Screen: Approval Pending

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Booking Submitted                 [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✉ Your booking has been submitted for approval                       │   │
│  │                                                                       │   │
│  │ Booking Reference: ABC123                                             │   │
│  │ Traveler: Alex Smith                                                  │   │
│  │ Route: LHR → JFK (15:00 ─ 18:30)                                     │   │
│  │ Hold Expires: 2026-10-01 14:30 UTC                                   │   │
│  │                                                                       │   │
│  │ Approval requested from: Sarah Johnson (Manager)                    │   │
│  │ You will be notified once a decision is made.                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [View Trip Details]                     [← Back to Search]                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-02-05, AC-EXP-07-05

---

### 2.7 Screen: Trip Detail (Bookings List)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    My Trips                          [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────��─┐   │
│  │ TRIP: Business Trip – Q4 2026 (LHR → JFK)                           │   │
│  │ Purpose: Client Meeting · Oct 1–5, 2026                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BOOKING ABC123                 Hold Active              [View]      │   │
│  │ LHR → JFK   15:00 ─ 18:30   United                                  │   │
│  │ Hold expires: 2026-10-01 14:30 UTC                                  │   │
│  │ [Confirm] [Cancel]                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BOOKING XYZ789                 Ticketing in Progress    [View]      │   │
│  │ JFK → LHR   09:00 ─ 21:00   United                                  │   │
│  │ Status: Ticket number pending (wait 5–10 min)                       │   │
│  │ [No action available]                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ BOOKING DEF456                 Cancelled                [View]      │   │
│  │ LHR → MIA   12:00 ─ 15:30   Delta                                   │   │
│  │ Cancelled: 2026-09-28 10:15 UTC                                     │   │
│  │ [Rebook]                                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-05-01, AC-EXP-05-04

---

### 2.8 Screen: CONFIRM_EXCEPTION (Ops Queue Alert)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]                    Booking Status                    [🔔] [👤 Alex ] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ✴ ACTION REQUIRED — MANUAL SUPPORT NEEDED                           │   │
│  │                                                                       │   │
│  │ Your booking has been issued but the system could not complete       │   │
│  │ the confirmation. This requires our support team to reconcile.       │   │
│  │                                                                       │   │
│  │ Booking Reference: ABC123                                             │   │
│  │ Ticket Number: 012 3456789012                                         │   │
│  │ Support Reference: cor-550e1a2c-9f8b-4a3c-b7d6-e1f2a3b4c5d6          │   │
│  │                                                                       │   │
│  │ [Contact Support]                     [← Back to Trips]               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**ACs Mapped:** AC-EXP-05-05, AC-SVC-01-04

---

## 3. USER FLOW DIAGRAMS

### 3.1 Main Journey: Search → Book → Hold → Confirm

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Search     │──▶ │  Select      │──▶ │  Booking     │──▶ │  Approval    │
│  Results     │    │  Offer       │    │  Hold        │    │  Decision    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                              │       ▲
                                        ┌─────────────────────┘       │
                                        │                             │
                                        ▼                             │
                                   ┌──────────────┐                   │
                                   │  Confirm &   │───▶ [Policy        │
                                   │  Ticketing   │    BLOCK]          │
                                   └──────────────┘                   │
                                        │                             │
                                        ▼                             │
                                   ┌──────────────┐                   │
                                   │  PENDING_    │───▶ [Confirm      │
                                   │  ISSUE]      │    Exception]      │
                                   └──────────────┘                   │
                                        │                             │
                                        ▼                             │
                                   ┌──────────────┐                   │
                                   │ CONFIRMED    │───▶ [Ticket       │
                                   │ (Ticket      │    Issued]         │
                                   │  Number)     │                   │
                                   └──────────────┘                   │
                                        │                             │
                                        ▼                             │
                                   ┌──────────────┐                   │
                                   │    COMPLETED │                   │
                                   │ (Travel      │                   │
                                   │  Complete)   │                   │
                                   └──────────────��                   │
```

### 3.2 Approval Workflow

```
┌─────────────────┐
│  Booking HELD   │──▶ [Policy REQUIRES_APPROVAL] ──▶ Create Approval
└─────────────────┘                                      │
                                                         ▼
                                                ┌──────────────┐
                                                │ APPROVER     │───▶ [APPROVED]
                                                │ Notification │       │
                                                └──────────────┘       ▼
                                                                         └──▶ Proceed to Confirm
                                                                   ┌──────────────┐
                                                   [REJECTED] ───▶│ Booking      │
                                                                   │ CANCELLED    │
                                                                   └──────────────┘
                                                                   ┌──────────────┐
                                                   [EXPIRED] ────▶│ Booking      │
                                                                   │ EXPIRED      │
                                                                   └──────────────┘
```

### 3.3 Cancellation Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Booking HELD   │──▶ │  GDS HOLD       │──▶ │  Booking        │
│  / PENDING_ISSUE │    │  RELEASED       │    │  CANCELLED      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Booking        │───▶ [All coupons OPEN + within void window] ──▶ VOID
│  CONFIRMED      │                                                 │
└─────────────────┘                                                 ▼
                                                     ┌─────────────────┐
                                                     │  Booking        │
                                                     │  VOIDED         │
                                                     └─────────────────┘

┌─────────────────┐
│  Booking        │───▶ [Outside void window] ──▶ [Refund Request] ──▶ Refund Sequence
│  CONFIRMED      │                                                 │
└─────────────────┘                                                 ▼
                                              ┌─────────────────┐
                                              │  Refund         │
                                              │  REQUESTED      │───▶ [Supplier        │
                                              └─────────────────┘    CONFIRMED]       │
                                                                         ▼
                                                                   ┌─────────────────┐
                                                                   │  Booking        │
                                                                   │  REFUNDED       │
                                                                   └─────────────────┘
```

### 3.4 Refund Request Flow

```
┌─────────────────┐
│  Booking        │───▶ [User requests refund] ──▶ Compute Refund Amount
│  CONFIRMED      │                                                 │
└─────────────────┘                                                 ▼
                                              ┌─────────────────┐
                                              │  Refund         │───▶ [Submit to     │
                                              │  REQUESTED      │    GDS]           │
                                              └─────────────────┘                 │
                                                                              ▼
                                                                        ┌─────────────────┐
                                                 [CONFIRMED] ─────────▶ │  Refund         │
                                                                        │  CONFIRMED      │
                                                                        └─────────────────┘
                                                                              │
                                                                              ▼
                                                                        ┌─────────────────┐
                                                                        │  Ledger Credit  │
                                                                        │  + Allocation   │
                                                                        │  Reversal       │
                                                                        └─────────────────┘
```

---

## 4. SCREEN/STATE INVENTORY

| State | Screen | Presentation | Allowed Primary Action | Blocked Actions |
|-------|--------|--------------|------------------------|-----------------|
| `DRAFT` | Search Form | Empty form; origin/destination required fields | Submit search | None |
| `HELD` | Trip Detail | "Hold Active" badge + hold expiry | Confirm, Cancel | None |
| `PENDING` (approval) | Booking Summary | "Pending Approval" + approver name + expiry | Wait (no action) | Confirm, Cancel |
| `PENDING_ISSUE` | Trip Detail | "Ticketing in Progress" indicator | Wait | Confirm, Cancel-ticket, Retry |
| `CONFIRMED` | Trip Detail | "Ticket Issued" + ticket number + coupons + void window | Cancel (if eligible) | Confirm |
| `COMPLETED` | Trip Detail | "Travel Complete" | View only | All state transitions |
| `CANCELLED` (pre-ticket) | Trip Detail | "Cancelled" + no refund calc | Rebook (optional) | Confirm |
| `CANCELLED` (post-ticket) | Trip Detail | "Cancelled" + refund breakdown (if eligible) | View refund details | Confirm |
| `EXPIRED` | Trip Detail | "Hold Expired" + "Search Again" CTA | Search again | Confirm |
| `CONFIRM_EXCEPTION` | Booking Status | Prominent error alert + correlation ID | Contact support | Self-service actions |

**ACs Mapped:** AC-EXP-05-04 (human-readable status labels), AC-EXP-03-07, AC-EXP-04-01, AC-EXP-06-03, AC-SVC-01-04

---

## 5. COMPONENT MAPPING

| FE Module | Primary API Endpoint | Bounded Context | State Machine |
|-----------|---------------------|-----------------|---------------|
| Search | `POST /v1/search/availability` | Experience | Search validation |
| Booking Hold | `POST /v1/bookings` | Experience | Reservation (HELD) |
| Confirmation/Ticketing | `POST /v1/bookings/{id}/confirm` | Experience | Reservation (PENDING_ISSUE→CONFIRMED) |
| Trip Management | `GET /v1/trips/{id}` | Experience | Trip/Booking read |
| Cancellation | `POST /v1/bookings/{id}/cancel` | Servicing | Reservation (CANCELLED), Ticket (VOIDED/REFUNDED) |
| Refund | `POST /v1/refunds` | Payment & Expense | Refund (REQUESTED→CONFIRMED) |
| Policy Override | `POST /v1/policy/overrides` | Policy | Policy Override |
| Notifications | Outbox events | Experience | In-app notification display |
| Error/Support | RFC 7807 | Experience | User-friendly error presentation |

---

## 6. VALIDATION & ERROR STATES

### 6.1 Client-Side Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| Origin | Required, IATA 3-letter | "Enter a valid origin airport" |
| Destination | Required, IATA 3-letter | "Enter a valid destination airport" |
| Departure | Today or future | "Departure date must be today or later" |
| Return | After departure | "Return date must be after departure" |
| Passengers | At least 1 | "At least 1 passenger required" |

**ACs Mapped:** AC-EXP-01-02, AC-EXP-01-03, AC-EXP-01-04

---

### 6.2 Policy Outcome UI

| Outcome | UI Panel | Action |
|---------|----------|--------|
| `ALLOW` | None | Proceed to booking |
| `WARN` | Yellow warning panel with rationale | Acknowledge and continue |
| `BLOCK` | Red non-dismissible block panel | Return to search only |
| `REQUIRE_APPROVAL` | Yellow banner with approval status | Wait for approver decision |

**ACs Mapped:** AC-POL-01-05, AC-POL-01-06, AC-POL-03-05, AC-POL-04-03

---

### 6.3 Error Response (RFC 7807)

| Scenario | Error Code | User Message | Correlation ID shown |
|----------|------------|--------------|---------------------|
| Validation error | `VALIDATION_ERROR` | "Please correct the highlighted fields" | No |
| Auth failure | `AUTHENTICATION_FAILED` | "Your session has expired. Please log in again." | No |
| Resource not found | `RESOURCE_NOT_FOUND` | "The requested resource could not be found." | No |
| GDS unavailable | `GDS_UNAVAILABLE` | "Flight information is temporarily unavailable. Please try again later." | No |
| Internal error | `INTERNAL_ERROR` | "We're experiencing technical difficulties. Please try again." | Support only |

**ACs Mapped:** AC-XCT-05-03

---

## 7. ACCESSIBILITY REQUIREMENTS

| Requirement | Application |
|-------------|-------------|
| WCAG 2.1 AA | All interactive elements keyboard navigable |
| Focus management | Focus moves to first invalid field on search validation failure |
| Color contrast | Minimum 4.5:1 for text; warnings/errors not color-only |
| Screen reader | `aria-live` regions for dynamic policy outcomes; `role="alert"` for BLOCK panels |
| Label association | All form fields programmatically associated with labels |
| Copyable reference | Correlation ID accessible via copy button (keyboard + screen reader) |

**ACs Mapped:** Implicit from FE acceptance criteria (focus management, validation messages, disabled/suppressed actions)

---

## 8. RESPONSIVE BEHAVIOR

| Breakpoint | Layout Behavior |
|------------|-----------------|
| Mobile (< 600px) | Single column; primary action at bottom; form fields full-width |
| Tablet (600–1024px) | Two-column for search form; side-by-side passenger + policy panels |
| Desktop (> 1024px) | Three-column layout; centered content; consistent spacing |

**Responsive API:** All API responses include currency and timestamp context — no client-side localization required for data accuracy.

---

## 9. POLICY PRESENTATION

### 9.1 WARN Override Flow

```
Traveler sees policy WARN ──▶ [Acknowledge] ──▶ Reason code dropdown (mandatory) + optional text ──▶ [Proceed]
```

**ACs Mapped:** AC-POL-03-05

---

### 9.2 BLOCK Never Overridable

```
Traveler sees policy BLOCK ──▶ [Return to Search only] (no override/approval path rendered)
```

**ACs Mapped:** AC-POL-04-03

---

## 10. AC TRACEABILITY MATRIX

| AC ID | Requirement | Screen | Implementation Status |
|-------|-------------|--------|----------------------|
| AC-EXP-01-01 | Search → render results | Search Results | ✅ |
| AC-EXP-01-02 | Missing origin/destination validation | Search Form | ✅ |
| AC-EXP-01-03 | Past departure date validation | Search Form | ✅ |
| AC-EXP-01-04 | Return date before departure validation | Search Form | ✅ |
| AC-EXP-02-01 | Booking hold → render response | Booking Hold | ✅ |
| AC-EXP-02-05 | Pending approval → show message | Approval Pending | ✅ |
| AC-EXP-02-10 | WARN → render warnings | Booking Hold (WARN) | ✅ |
| AC-EXP-03-01 | Confirm → PENDING_ISSUE status | Trip Detail | ✅ |
| AC-EXP-03-07 | PENDING_ISSUE → suppress confirm | Trip Detail | ✅ |
| AC-EXP-03-08 | CONFIRMED → render ticket details | Trip Detail | ✅ |
| AC-EXP-04-01 | Cancel (pre-ticket) → no refund calc | Cancellation | ✅ |
| AC-EXP-04-02 | Cancel (void window) → full refund | Cancellation | ✅ |
| AC-EXP-04-03 | Cancel (outside void) → refund breakdown | Cancellation | ✅ |
| AC-EXP-04-05 | Refund breakdown → IATA tax rows | Refund Summary | ✅ |
| AC-EXP-05-01 | Trip detail → all bookings | Trip Detail | ✅ |
| AC-EXP-05-04 | Status labels for all states | Trip Detail | ✅ |
| AC-EXP-05-05 | CONFIRM_EXCEPTION alert | CONFIRM_EXCEPTION Screen | ✅ |
| AC-EXP-06-03 | EXPIRED → Search again CTA | Trip Detail (EXPIRED) | ✅ |
| AC-EXP-07-05 | Pending approval → approver name + expiry | Approval Pending | ✅ |
| AC-POL-01-05 | WARN → render warning panel | Booking Hold (WARN) | ✅ |
| AC-POL-01-06 | BLOCK → non-dismissible panel | Booking Hold (BLOCK) | ✅ |
| AC-POL-03-05 | Override → mandatory reason code | Policy Override | ✅ |
| AC-POL-04-03 | BLOCK → no override path | Booking Hold (BLOCK) | ✅ |
| AC-SVC-01-04 | CONFIRM_EXCEPTION alert | CONFIRM_EXCEPTION Screen | ✅ |
| AC-XCT-05-03 | Error → user-friendly message | Error/Support | ✅ |

---

## 11. HITL ITEMS

| Item | Status | Design Impact |
|------|--------|---------------|
| HITL-REQ-01 | ✅ CLOSED (APPROVED) | PII notification content approved — Tier 1 and Tier 2 content can be rendered per template configuration |
| HITL-REQ-02 | ✅ CLOSED (NET) | No design change — ERP revenue posting deferred to Sprint 2 |
| HITL-REQ-03 | ✅ CLOSED (Wiremock approved) | Front-end not affected — adapter tests run against fixtures |

---

## 12. DELIVERABLES CHECKLIST

| Artifact | Status |
|----------|--------|
| Wireframes (ASCII block diagrams) | ✅ |
| User flow diagrams (4 key journeys) | ✅ |
| Screen/state inventory (10 states) | ✅ |
| Component mapping (8 modules) | ✅ |
| Validation/error state table | ✅ |
| Accessibility requirements | ✅ |
| Responsive behavior | ✅ |
| Policy presentation rules | ✅ |
| AC traceability matrix (30 FE/FE+BE ACs) | ✅ |

---

**Gate: UI/UX Designer + PO Approval Required**  
**Next Phase:** Development — aligned with `fe_acceptance_criteria.md` v1.0

---

**Document generated by Design Agent via Router**  
**Phase:** UI/UX Design (SDLC Phase 5)  
**Date:** 2026-09-10  
**Status:** READY FOR HUMAN REVIEW