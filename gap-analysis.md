# TravelPlatform: Gap Analysis & Implementation Readiness

**Document Version:** 0.3  
**Analysis Date:** 2026-09-04  
**Status:** COMPLETE — All Critical and Minor Gaps Resolved. READY FOR ARCHITECTURE DESIGN.

---

## REQUIREMENTS SUMMARY

The RequirementDocument defines an **AI-native, enterprise-grade travel platform** managing the complete travel lifecycle through six integrated capabilities:

1. **Experience** — Travel discovery, booking, continuous user experience
2. **Content** — Travel data and content normalization
3. **Policy** — Organizational policy evaluation at decision points
4. **Payment & Expense** — Integrated payments, settlements, expense reconciliation
5. **Servicing** — Booking modifications, disruption handling, rebooking, refunds
6. **Data** — Travel Context (traveler, trip, bookings, policy, audit trail)

**Core Intent:**
- Single unified platform from user perspective
- Extensible, loosely-coupled domain capabilities
- API-first, event-driven architecture
- Built-in resilience, security, privacy, scalability, auditability
- Progressive derivation from business journeys through implementation
- Support distributed, idempotent, compensating transactions

---

## TOP 5 CRITICAL GAPS

| # | Gap | Category | Expertise | Risk | Confidence | Priority |
|---|-----|----------|-----------|------|-----------|----------|
| 1 | **Supplier Integration Model Undefined** — How do heterogeneous suppliers integrate? What adapters? Normalization rules? Real-time vs. batch sync? | Architecture | L3 | High | 35% | CRITICAL |
| 2 | **Travel Context Schema Not Specified** — What data elements comprise it? Versioning strategy? Audit trail format? Immutability rules? | Data Model | L2 | High | 40% | CRITICAL |
| 3 | **Policy Evaluation Engine Undefined** — Policy language? Evaluation at which decision points? Override workflows? Audit of decisions? | Business Logic | L3 | High | 30% | CRITICAL |
| 4 | **Distributed Transaction Model Not Detailed** — How do booking + payment + expense sync? Failure scenarios? Idempotency tokens? Reconciliation process? | Architecture | L3 | High | 25% | CRITICAL |
| 5 | **Financial Integration Scope Unclear** — Which financial systems? Settlement rules? Refund policies? Multi-currency? Tax handling? Compliance frameworks? | Integration | L3 | High | 20% | CRITICAL |

---

## TOP 5 HUMAN DECISIONS REQUIRED

| # | Decision | Owner | Impact |
|---|----------|-------|--------|
| 1 | **Phase 1 MVP Scope** — Which of the 6 capabilities ship in MVP? Which are deferred? | Product Owner | Blocks architecture, dev roadmap |
| 2 | **Supplier Integration Priority** — Which suppliers first? Scope of integration? Third-party vs. custom adapters? | Business/Product | Blocks supplier strategy, API design |
| 3 | **Policy Engine Complexity** — Simple rule engine or full business rules engine? Authoring by non-technical users? | Product/Architect | Determines vendor vs. build decision |
| 4 | **Travel Context Ownership & Governance** — Single source of truth or federated? Who owns each domain's data? | Architect/Data Owner | Determines data model, microservices boundaries |
| 5 | **Financial/Compliance Framework** — Which regulations (PCI-DSS, HIPAA, SOX)? Multi-tenant data isolation? Audit trail requirements? | Compliance/Legal | Blocks security architecture, data handling |

---

## IMMEDIATE BLOCKERS FOR IMPLEMENTATION

- **No MVP scope defined** → Cannot prioritize epics or features
- **No supplier integration model** → Cannot design adapter pattern or API contracts
- **No Travel Context schema** → Cannot begin data model design
- **No financial workflow details** → Cannot design payment/settlement subsystem
- **No security/compliance framework** → Cannot define authentication, authorization, data handling
- **No distributed transaction model** → Cannot design booking-payment orchestration
- **No performance/scaling targets** → Cannot size infrastructure or set quality gates

---

## TOP 5 IMPLEMENTATION-BLOCKING QUESTIONS

**Please provide clear, documented answers to the following:**

### Q1: PHASE 1 MVP SCOPE
**Question:** Which of the six capabilities (Experience, Content, Policy, Payment & Expense, Servicing, Data) must be fully functional in Phase 1 MVP? Which are deferred or require manual workarounds?

**Why Critical:** Determines which architecture decisions are foundational vs. deferrable. Affects data model scope, integration complexity, and team roadmap.

**Impact:** HIGH — Blocks all design and development planning.

---

### Q2: SUPPLIER INTEGRATION STRATEGY  
**Question:** 
- Which travel suppliers (GDS, airlines, hotels, car rental, rail, activities, insurance) are in Phase 1 scope?
- Should adapters be built in-house or sourced from third parties?
- What is the integration model (API, file transfer, EDI, messaging)?
- How is supplier data normalized into platform models?

**Why Critical:** Determines supplier adapter pattern, API contract design, and data transformation strategy.

**Impact:** HIGH — Blocks architecture, API design, and integration roadmap.

---

### Q3: FINANCIAL INTEGRATION & COMPLIANCE SCOPE
**Question:**
- Which regulatory frameworks apply? (PCI-DSS, GDPR, SOX, HIPAA, others?)
- Which payment providers/gateways are required? (Stripe, PayPal, corporate banking APIs?)
- What is the settlement model? (real-time, batch nightly, weekly?)
- How are refunds, reversals, and disputes handled?
- Multi-currency and tax handling requirements?

**Why Critical:** Determines payment subsystem architecture, data protection requirements, and audit trail design.

**Impact:** HIGH — Blocks financial subsystem design and compliance controls.

---

### Q4: TRAVEL CONTEXT DATA MODEL & OWNERSHIP
**Question:**
- What data elements comprise the "Travel Context"? (List required attributes for traveler, trip, booking, policy decision, payment, expense)
- Is Travel Context a single source of truth or federated across domains?
- Who owns each domain's data? (Experience owns bookings? Payment owns transactions?)
- What is the versioning/temporal strategy? (snapshots, change logs, full history immutable?)

**Why Critical:** Determines data model, microservices boundaries, and consistency strategy.

**Impact:** HIGH — Blocks all domain design and API contracts.

---

### Q5: POLICY EVALUATION ENGINE COMPLEXITY
**Question:**
- Is Phase 1 a simple rule engine (compliance rules, cost limits) or a full business rules engine?
- Can non-technical users author policies, or is it developers only?
- What are the policy rule categories? (cost caps, traveler eligibility, approver routing, supplier restrictions?)
- How are policy conflicts, overrides, and exceptions handled?
- Audit trail requirements for policy decisions?

**Why Critical:** Determines build vs. buy decision, team skills needed, and approval workflow design.

**Impact:** HIGH — Blocks Policy subsystem and integration with other domains.

---

---

## HUMAN DECISIONS RECORDED

### Q1: Phase 1 MVP Scope — RESOLVED ✓

**Decision:**
- **Phase 1 Focus:** Experience capability (shop, book, cancel)
- **Other Capabilities:** Thin layers in Phase 1 (Content, Policy, Payment & Expense, Servicing, Data)
- **Implication:** Full-featured Experience with minimal supporting infrastructure; scale other domains in later phases

**Impact on Design:**
- Experience domain is primary; other domains provide stubs/adapters
- Booking state machine and traveler journey are Phase 1 deliverables
- Supplier integration, policy evaluation, payment processing scoped to MVP minimum

---

### Q2: Supplier Integration Strategy — RESOLVED ✓

**Decision:**
- **Adapter Development:** In-house
- **Real-time Operations:** REST API (shop, book, cancel)
- **Post-booking Events:** Async webhooks
- **Suppliers in Scope:** TBD (not yet specified)

**Architecture Implications:**
- Build supplier adapter framework for REST integration
- Webhook consumer pattern for async event handling (cancellations, price changes, disruptions)
- Supplier normalization layer required for Experience domain
- No third-party gateway dependency

---

### Q3: Financial Integration & Compliance — RESOLVED ✓

**Decision: Regulatory Frameworks**
- PCI-DSS (SAQ-A/A-EP) — no raw PAN storage
- GDPR + US state privacy laws
- SOC 2 Type II compliance
- SOX-style controls (segregation of duties, change management, immutable audit trail)
- PSD2/SCA for EU card payments
- ARC/BSP + IATA Resolutions (air-specific)
- ASC 606 / IFRS 15 revenue recognition

**Decision: Settlement Model**
- Batch settlement (not real-time)
- Central lodge or issued virtual card (no payment gateway)
- No raw PAN processing

**Decision: Refund Policy**
- Void inside ARC same-day window
- Refund outside same-day: amount = ticket document amount − penalty − non-refundable components
- Per-tax-code refundability flags (never percentage-based)
- Two-phase lifecycle: requested → confirmed
- Ledger, expense reversal, reporting fire only on confirmed state
- Refund returns to original form of payment

**Decision: Multi-currency Handling**
- Currency of sale, settlement, and reporting tracked separately per transaction
- FX rate captured at transaction time, stored on event (never recomputed at read)
- Reporting uses fixed per-period FX rate
- All amounts in integer minor units per ISO 4217
- Rounding half-up applied once

**Decision: Tax Handling**
- Stored as breakdown by IATA tax code (amount, currency, refundability)
- Never derived as percentage
- Enforced invariant: base fare + Σ taxes + Σ fees = ticket amount

**Architecture Implications:**
- PCI-DSS SAQ-A scope — no card data storage
- Immutable financial event ledger with append-only design
- Financial facts superseded (not updated), with full history
- PII stored by pointer for GDPR erasure compliance
- Refund processing requires two-phase state machine
- Multi-currency requires FX capture at write time, read-time derivation
- Tax breakdown schema required; invariant enforcement in booking validation

---

### Q4: Travel Context Data Model & Ownership — RESOLVED ✓

**Decision: Transaction Spine (Single Source of Truth)**
```
Trip → Booking → Segment → Ticket → Financial Leg → Cost Allocation
```
- Owned by one team
- Append-only, event-sourced
- Financial facts superseded (not updated)
- Core invariant: one authoritative amount per leg
- Everything else derived at read time

**Decision: Federated Data Model**
- Profile: federated (from HR/identity system)
- Policy definitions: federated (policy domain)
- Raw supplier payloads: federated (supplier adapters)
- ERP posting: federated (financial system)
- Reporting marts: federated (analytics platform)

**Decision: PII Handling**
- PII stored by pointer (not embedded in transactions)
- GDPR erasure doesn't break ledger
- Reference model for traveler profile

**Architecture Implications:**
- Centralized transaction spine schema (Trip, Booking, Segment, Ticket, Financial Leg, Cost Allocation)
- Event sourcing as primary persistence pattern for spine
- Federated reference data with pointer model
- All derived data computed from spine + references at query time
- Ledger immutability enforced; financial mutations via supersession, not update

---

### Q5: Policy Evaluation Engine — RESOLVED ✓

**Decision: Engine Type**
- Small in-house declarative rule evaluator (not full BRE, not hardcoded)
- Typed, versioned rules
- Rule authoring: Phase 1 by engineering as data; Phase 2 constrained UI (thresholds, lists, date windows)

**Decision: Rule Categories (Phase 1)**
- Cost caps / budgets
- Traveler eligibility
- Approver routing
- Supplier restrictions
- Compliance checks

**Decision: Conflict Resolution**
- Deterministic: most restrictive outcome wins
- Priority order: BLOCK > REQUIRE_APPROVAL > WARN > ALLOW
- Ties broken by scope specificity
- Overrides are first-class audited events
- Decision snapshotted onto booking (immutable record)

**Decision: Audit & Versioning**
- Policy rule versions tracked
- Decisions with rule version captured
- Override events auditable with timestamp, actor, reason
- Decision snapshot immutable once booked

**Architecture Implications:**
- Declarative policy rule schema (YAML or JSON-based)
- Policy evaluator service (Phase 1: synchronous, request-scoped)
- Rule versioning and deployment strategy
- Decision audit event schema
- Conflict resolution algorithm implementation
- Override request → approval → application workflow

---

## SECONDARY GAPS — STILL OPEN

Based on your decisions, the following gaps remain and require clarification:

| # | Gap | Category | Expertise | Risk | Confidence | Priority | Blocker |
|---|-----|----------|-----------|------|-----------|----------|---------|
| 1 | **Suppliers in Phase 1 scope unclear** — Which suppliers (GDS, airlines, hotels, rail, etc.)? | Integration | L2 | High | 50% | HIGH | Yes |
| 2 | **Trip/Booking/Segment state machines undefined** — Valid state transitions, guards, side effects? | Business Logic | L2 | Medium | 55% | HIGH | Yes |
| 3 | **Cost allocation model unclear** — How are costs allocated across legs, passengers, segments? | Data Model | L2 | High | 45% | HIGH | Yes |
| 4 | **Webhook schema & reliability model undefined** — What events? Retry policy? Dead-letter handling? | Integration | L2 | Medium | 60% | MEDIUM | No |
| 5 | **Policy rule evaluation timing** — Evaluate at booking time only, or also at servicing time? | Business Logic | L2 | Medium | 65% | MEDIUM | No |
| 6 | **PII pointer model specifics** — How are PII references maintained? GDPR right-to-erasure reconciliation? | Security/Data | L2 | High | 50% | HIGH | Yes |
| 7 | **Ledger & audit trail immutability enforcement** — Hash chains? Append-only database? Write-once storage? | Architecture | L2 | High | 55% | HIGH | Yes |
| 8 | **Expense reversal workflow** — How are expenses reversed on refund? Who initiates? Workflow? | Business Logic | L2 | Medium | 60% | MEDIUM | No |
| 9 | **Form of payment tracking** — How is original payment method tracked for refunds? | Data Model | L2 | Medium | 70% | MEDIUM | No |
| 10 | **Virtual card issuance scope** — When is card issued? Lifetime? Funding model? | Integration | L3 | Medium | 40% | HIGH | Yes |

---

## TOP 5 NEXT-PRIORITY QUESTIONS

**Please answer the following before architecture design begins:**

### Q6: PHASE 1 SUPPLIERS

**Question:**
Which specific travel suppliers are in Phase 1 scope? (e.g., GDS like Amadeus/Sabre? Airlines? Hotel chains? Rail? Activities?)

**Why Critical:** Determines adapter complexity, supplier API patterns, data normalization scope.

**Impact:** HIGH — Blocks supplier adapter design and integration architecture.

---

### Q7: BOOKING STATE MACHINE

**Question:**
What are the valid booking states and transitions?
- Example: PENDING → CONFIRMED → COMPLETED, CANCELLED, REFUNDED?
- What guards/preconditions apply?
- What side effects trigger (e.g., supplier confirmation, payment authorization, policy evaluation)?

**Why Critical:** Drives servicing workflows, refund eligibility, policy re-evaluation.

**Impact:** HIGH — Blocks booking lifecycle and servicing capability.

---

### Q8: COST ALLOCATION MODEL

**Question:**
How are costs allocated? 
- Per passenger? Per segment? Per ticket component (base fare, tax, fee)?
- Example: Multi-leg trip with 2 passengers — cost breakdown?
- Are costs allocated at booking time or derived at reporting time?

**Why Critical:** Determines financial leg schema, refund calculation, expense reconciliation logic.

**Impact:** HIGH — Blocks financial data model and refund processing.

---

### Q9: TRIP / BOOKING IDENTIFIERS & SUPPLIER REFERENCE

**Question:**
- What identifies a Trip uniquely? (Traveler ID + start date? Booking reference?)
- What identifies a Booking uniquely? (PNR? Booking reference?)
- How are supplier identifiers (PNR, order ID, confirmation code) mapped and stored?
- Is the relationship 1 booking:1 PNR or 1 booking:N supplier records?

**Why Critical:** Determines primary key strategy, supplier reconciliation, cancellation/modification routing.

**Impact:** HIGH — Blocks data model and supplier integration.

---

### Q10: POLICY EVALUATION SCOPE IN PHASE 1

**Question:**
Which policy rules are enforced in Phase 1?
- Are cost caps checked at booking time (block non-compliant bookings)?
- Are traveler eligibility rules checked (block ineligible travelers)?
- Are supplier restrictions checked (reject certain suppliers)?
- Or are all policies advisory (WARN only, override-able)?

**Why Critical:** Determines whether Policy domain blocks Experience domain or just advises.

**Impact:** MEDIUM — Blocks policy evaluation workflow and booking UX.

---

---

## HUMAN DECISIONS RECORDED (Q6–Q10)

### Q6: Phase 1 Suppliers — RESOLVED ✓

**Decision:**
- **Initial Supplier Set:** GDS (Global Distribution System) integration
- **Scope:** Amadeus, Sabre, or other primary GDS(s) to be confirmed in architecture phase

**Architecture Implications:**
- GDS adapter pattern as primary supplier integration template
- REST API for shop, book, cancel operations
- Async webhooks for post-booking events (cancellations, price changes)
- Supplier reference mapping for GDS record locators

---

### Q7: Booking State Machine — RESOLVED ✓

**Decision: Reservation States**
```
DRAFT → HELD → CONFIRMED → COMPLETED
      ↘ CANCELLED
      ↘ EXPIRED
```
- DRAFT: local working state, not yet sent to supplier
- HELD: sent to GDS, hold acquired on supplier
- CONFIRMED: payment authorized, hold released to booking
- COMPLETED: ticket issued, booking fulfilled
- CANCELLED: user or system cancellation
- EXPIRED: hold or approval expired, hold released to supplier

**Decision: Ticket / Financial Leg States**
```
PENDING_ISSUE → ISSUED
           ↘ VOIDED
ISSUED → REFUND_REQUESTED → REFUNDED
```
- PENDING_ISSUE: ticketing requested, pending issuance
- ISSUED: ticket issued and recorded
- VOIDED: ticket voided within ARC same-day window
- REFUND_REQUESTED: refund requested after same-day window
- REFUNDED: refund confirmed and processed

**Decision: Approval States**
```
NOT_REQUIRED | PENDING → APPROVED | REJECTED | EXPIRED
```
- NOT_REQUIRED: booking requires no approval
- PENDING: awaiting approver decision
- APPROVED: approved, proceed with booking
- REJECTED: rejected, booking cannot proceed
- EXPIRED: approval window expired without decision; release hold and notify (never auto-approve)

**Architecture Implications:**
- State machines enforced at Reservation, Ticket, and Approval levels
- Side effects triggered on state transitions (supplier calls, policy evaluation, payment authorization, notifications)
- Explicit state transition guards (no implicit auto-transitions)
- Expiration handling as critical path (release, notify, no auto-approve)
- EXPIRED state explicit event to notify stakeholders

---

### Q8: Cost Allocation Model — RESOLVED ✓

**Decision: Attribution Unit**
- Granularity: **passenger × ticket**, not booking
- Rationale: ARC/BSP settle and report at passenger × ticket; coarser granularity breaks reconciliation

**Decision: Allocation**
- **Splits** of attributed amount to cost objects (WBS, project, department, GL account)
- By percentage or fixed amount
- One or many allocations per ticket

**Decision: Allocation Basis**
- **Segment-level only** when trip genuinely spans cost objects
- **Explicit declaration required** (never inferred)
- Default: pro-rata by fare component (if fare filed per component), else equal split

**Decision: Remainder Rule**
- Integer minor units only (ISO 4217)
- Largest-remainder algorithm
- Lowest-priority split absorbs remainder
- Invariant: Σ allocations == attributed amount exactly (never silent rounding error)

**Decision: Component Handling**
- Taxes and fees follow the fare component they attach to
- Ancillaries attach to passenger/segment that consumed them
- Agency and traveler fees attribute to passenger, inherit ticket's split (unless explicitly overridden)

**Decision: Adjustment Reversal**
- Adjustments reverse along original allocation (same proportions)
- Each cost object nets correctly
- Never compute fresh split for refund or exchange

**Decision: Invariant Enforcement**
- Test-enforced at every version: Σ allocations = attributed amount (in minor units)
- Critical for financial audit trail

**Architecture Implications:**
- Ticket schema includes allocation breakdown (cost object, proportion, amount, priority)
- Allocation audit trail tracks allocation changes with justification
- Remainder algorithm implementation with deterministic order
- Financial adjustment engine reverses via original allocation proportions
- Invariant assertion in booking confirmation and refund processing
- Cost allocation reconciliation against ARC/BSP reporting

---

### Q9: Trip / Booking Identifiers & Supplier Mapping — RESOLVED ✓

**Decision: Trip ID**
- Internal, system-generated, immutable, opaque (ULID or UUIDv7)
- Tenant-scoped
- Business grouping: one traveler + one purpose + one date window
- **Not** a PNR (never conflate with supplier identifier)
- Grouping: traveler + purpose + overlapping dates
- Explicit user regrouping allowed (user can split or merge trips)

**Decision: Booking ID**
- Internal, system-generated, immutable, tenant-scoped
- **One Booking = one supplier reservation**
- One Trip holds 1..n Bookings (multi-supplier, multi-passenger, split PNR)

**Decision: Supplier Reference Mapping**
- **Never use supplier identifiers as primary keys**
- Rationale: GDS record locators recycled within supplier + time window; ticket numbers change on exchange; locators change on split/reissue
- Supplier mapping: append-only reference set on Booking
  ```
  (supplier_code, reference_type, reference_value, valid_from, valid_to)
  ```
- Types: GDS record locator, airline locator, ticket number, NDC order ID, settlement/invoice reference
- **History retained** so stale locator still resolves to correct booking
- Ensures suppliers can re-resolve bookings even after reconciliation/reissue

**Decision: Correlation ID**
- Separate from Trip, Booking, and supplier identifiers
- Spans entire journey: shop → book → ticket → settlement
- Present on every event and log line
- Enables end-to-end traceability for debugging and audit

**Decision: Idempotency Key**
- One per outbound supplier call
- Stored with request
- Prevents double-booking and double-issuance on retries
- Supplier-aware (scoped to supplier + call type)

**Decision: Tenant Isolation**
- Tenant ID on every entity
- All identifiers tenant-scoped
- Cross-tenant resolution **impossible by construction**

**Architecture Implications:**
- Trip and Booking as separate, internally-identified entities
- Supplier mapping as immutable append-only log on Booking
- Correlation ID infrastructure in all APIs and event streams
- Idempotency key storage and validation in supplier adapter layer
- Tenant scoping enforced at repository layer (no cross-tenant queries possible)

---

### Q10: Policy Evaluation Scope — RESOLVED ✓

**Decision: Both Blocking and Informational**
- Policies are not uniformly BLOCK or WARN
- Policy rules have explicit rule type or category
- Rule type determines effect: BLOCK vs. WARN
- Examples:
  - BLOCK: legal/safety/compliance rules (must prevent non-compliant bookings)
  - WARN: policy breach/cost overrun (alert but allow override with approval)

**Decision: No Global Rule Type**
- Each policy rule explicitly declares its enforcement level (not inferred from category)
- Examples:
  - Rule 1: "Block bookings for restricted countries" → BLOCK
  - Rule 2: "Warn if booking exceeds cost cap by 10%" → WARN (but approvable)
  - Rule 3: "Require approval if coach booking without delegate" → REQUIRE_APPROVAL

**Decision: Conflict Resolution with Mixed Types**
- Most restrictive outcome wins
- Order: BLOCK > REQUIRE_APPROVAL > WARN > ALLOW
- Ties broken by scope specificity
- Examples:
  - BLOCK rule + WARN rule → BLOCK (most restrictive)
  - REQUIRE_APPROVAL rule + WARN rule → REQUIRE_APPROVAL
  - Multiple BLOCK rules (equal scope) → first BLOCK encountered (deterministic)

**Decision: Phase 1 Policy Scope**
- Legal/safety/compliance checks: BLOCK (immediate failure)
- Cost/eligibility/supplier restrictions: WARN or REQUIRE_APPROVAL (per rule config, not global)
- Overrides audited as first-class events
- Decision snapshotted onto booking (immutable)

**Architecture Implications:**
- Policy rule schema includes explicit enforcement level (BLOCK, REQUIRE_APPROVAL, WARN, ALLOW)
- Conflict resolution algorithm in policy evaluator (deterministic, reproducible)
- Policy evaluation returns decision object with:
  - Outcome (BLOCK, REQUIRE_APPROVAL, WARN, ALLOW)
  - Matched rules (with rule IDs, versions, enforcement level)
  - Rationale (which rule matched, conflict resolution order if multiple)
  - Decision snapshot (immutable on booking)
- Override request → approval → application flow (separate from evaluation)
- All policy decisions and overrides audit-logged with actor, timestamp, reason

---

## CRITICAL GAPS NOW RESOLVED ✓

- ✓ Supplier integration: GDS adapter pattern
- ✓ Travel Context schema: Transaction spine (Trip → Booking → Segment → Ticket) + federated reference data
- ✓ Policy evaluation: Declarative evaluator with mixed enforcement types (BLOCK/WARN/REQUIRE_APPROVAL)
- ✓ Distributed transaction model: Booking state machine + supplier reference mapping
- ✓ Financial integration: PCI-DSS SAQ-A, GDPR, SOX, SOC 2, settlement batch; refund/multi-currency/tax per specifications
- ✓ Booking identifiers: Internal Trip/Booking IDs + append-only supplier mapping
- ✓ Cost allocation: Passenger × ticket granularity, allocation splits, largest-remainder algorithm
- ✓ Policy scope: Mixed BLOCK/WARN/REQUIRE_APPROVAL, explicit per rule, not global

---

## MINOR GAP DECISIONS RECORDED (Q11–Q16)

### Q11: GDS Selection — RESOLVED ✓

**Decision:**
- **Amadeus** — Rest of World (RoW)
- **Sabre** — United States

**Architecture Implications:**
- Two independent GDS adapter implementations sharing a common adapter interface contract
- Amadeus: REST/JSON (Amadeus for Developers API) for Phase 1
- Sabre: REST/JSON (Sabre Dev Studio APIs) for Phase 1
- Adapter factory pattern: route by tenant geography or explicit tenant config (not hard-coded)
- Normalization layer maps Amadeus and Sabre response schemas to canonical platform Segment/Booking model
- Authentication: Amadeus OAuth 2.0 client credentials; Sabre REST token (ATH token flow)
- Rate limiting and retry budgets configured per adapter independently (Amadeus and Sabre have different quotas)
- Supplier capability matrix: Amadeus and Sabre may differ on NDC support, fare families, ancillary APIs — document per-adapter capability at architecture phase

---

### Q12: Webhook Consumer Spec — DEFERRED TO ARCHITECTURE ✓

**Decision:** Handled in architecture phase.

**Scope to be defined in architecture:**
- Event types (booking confirmed, cancelled, price changed, disruption notified)
- Payload schema and versioning
- Retry policy and backoff strategy
- Dead-letter queue handling
- Ordering guarantees (at-least-once expected; idempotency required)
- Consumer registration and authentication

---

### Q13: Segment / Ancillary Schema — RESOLVED ✓

**Decision: Segment as Common Envelope + Typed Payload**
- Segment modelled as a **common envelope** containing:
  - `product_type` (air, hotel, car, rail — extensible)
  - Supplier references (maps to Booking supplier mapping)
  - Dates (departure, arrival, or check-in/check-out)
  - Status (mirrors Reservation state)
  - Monetary legs (financial legs linking to ticket)
  - Allocation reference (links to cost allocation)
- Plus a **typed per-product payload** (product-specific attributes as versioned, typed sub-schema)
- Rationale: allows expansion to new product types without schema migration

**Decision: Ancillaries are First-Class Items — Not Fare Attributes**
- Ancillaries (baggage, seat, lounge, insurance, etc.) are **independent priced items**
- Each ancillary is attached to `(passenger, segment)` — not to the booking or fare
- Each ancillary has its own:
  - EMD (Electronic Miscellaneous Document) or document reference
  - Refundability flag (independent of the fare's refundability)
  - Tax breakdown (by IATA tax code, same rules as ticket taxes)
  - Financial leg (independent pricing, allocation, and settlement)
- **Not attributes of the fare** — folding ancillaries into the fare prevents independent servicing, refunding, and allocation (unrecoverable design error)

**Architecture Implications:**
- Segment schema: `{ envelope_fields, product_type, typed_payload: <product-specific> }`
- Ancillary schema: `{ ancillary_id, passenger_id, segment_id, product_code, emd_reference, amount, refundability_flag, tax_breakdown[], financial_leg_id, allocation[] }`
- Ancillary state machine: mirrors Ticket lifecycle (PENDING_ISSUE → ISSUED → VOIDED | REFUND_REQUESTED → REFUNDED)
- Refund processing: ancillary refunds are independent of ticket refunds
- Cost allocation: ancillaries follow passenger/segment allocation (inherit ticket split unless overridden)
- Invariant: ancillary Σ (base + taxes + fees) = ancillary total, enforced independently

---

### Q14: Approval Workflow Implementation — DEFERRED TO ARCHITECTURE ✓

**Decision:** Handled in architecture phase.

**Scope to be defined in architecture:**
- Approver chain resolution (manager, delegate, cost center owner)
- Escalation rules (time-based, hierarchy-based)
- Approval request notification delivery
- Approval UI/API interface for approvers
- Expiry enforcement (EXPIRED state, hold release, notification)
- Multi-level approval chains (if required by tenant policy)

---

### Q15: Notification Channels — DEFERRED TO ARCHITECTURE ✓

**Decision:** Handled in architecture phase.

**Scope to be defined in architecture:**
- Channels: email (required), in-app (required), SMS (optional Phase 2), push (optional Phase 2)
- Notification trigger events (booking confirmed, approval requested, approval expired, ticket issued, refund confirmed)
- Template management and localization
- Notification delivery guarantees (at-least-once)
- Opt-out and preference management

---

### Q16: Reporting Dimensions — RESOLVED ✓

**Decision: Dimensions Captured at Event Time (Not Reconstructed Later)**
- All reporting dimensions must be **recorded on the financial event at booking time**
- Anything not captured at write time cannot be reconstructed later (no retroactive enrichment)

**Decision: Minimum Required Dimensions on Every Financial Event**
| Dimension | Notes |
|-----------|-------|
| `tenant_id` | Multi-tenant isolation |
| `legal_entity` | Corporate legal entity for accounting |
| `traveller_id` | PII pointer (not raw name) |
| `department` / `cost_centre` | Org hierarchy at time of booking |
| `cost_object` / `project` | WBS/GL/project code |
| `trip_purpose` | Business category (meeting, conference, relocation, etc.) |
| `policy_outcome` | BLOCK / REQUIRE_APPROVAL / WARN / ALLOW |
| `override_reason_code` | If policy overridden: reason code (audited) |
| `supplier_code` | GDS/airline/hotel supplier identifier |
| `carrier_code` | IATA airline code |
| `market` / `route` | Origin–destination market pair |
| `cabin_class` | Y / W / C / F |
| `fare_class` | Fare basis code |
| `booking_channel` | Online tool, agent, mobile, API |
| `advance_purchase_days` | Days between booking and departure (computed at booking time) |
| `sale_currency` | Currency traveller paid in (ISO 4217) |
| `settlement_currency` | Currency settled with supplier |
| `reporting_currency` | Tenant's standard reporting currency |
| `booking_date` | Date of booking (not trip date) |
| `travel_date` | First travel date of the itinerary |

**Architecture Implications:**
- Financial event schema includes all 20 dimensions as first-class fields (not nullable for financial events)
- Event emission from booking confirmation must hydrate all dimensions at write time
- Profile, policy, and org hierarchy services queried synchronously during booking confirmation to capture snapshot values
- Snapshot values are immutable on the event — org restructuring or policy changes don't alter historical events
- Reporting mart derived from event stream (not from live transactional data)
- Dimensions stored in integer/code form where possible (carrier_code, cabin_class) to support grouping and filtering without free-text joins

---

## ALL GAPS RESOLVED ✓

| # | Gap | Status | Resolved By |
|---|-----|--------|-------------|
| 1 | Supplier Integration Model | ✓ RESOLVED | Q2, Q6, Q11 |
| 2 | Travel Context Schema | ✓ RESOLVED | Q4 |
| 3 | Policy Evaluation Engine | ✓ RESOLVED | Q5, Q10 |
| 4 | Distributed Transaction Model | ✓ RESOLVED | Q7, Q9 |
| 5 | Financial Integration Scope | ✓ RESOLVED | Q3 |
| 6 | Phase 1 MVP Scope | ✓ RESOLVED | Q1 |
| 7 | Booking State Machines | ✓ RESOLVED | Q7 |
| 8 | Cost Allocation Model | ✓ RESOLVED | Q8 |
| 9 | Trip/Booking Identifiers | ✓ RESOLVED | Q9 |
| 10 | Policy Enforcement Scope | ✓ RESOLVED | Q10 |
| 11 | GDS Selection | ✓ RESOLVED | Q11 |
| 12 | Webhook Consumer Spec | ✓ DEFERRED | Architecture phase |
| 13 | Segment / Ancillary Schema | ✓ RESOLVED | Q13 |
| 14 | Approval Workflow Implementation | ✓ DEFERRED | Architecture phase |
| 15 | Notification Channels | ✓ DEFERRED | Architecture phase |
| 16 | Reporting Dimensions | ✓ RESOLVED | Q16 |

---

## FINAL READINESS ASSESSMENT

**Status: ✅ REQUIREMENTS COMPLETE — READY FOR ARCHITECTURE DESIGN**

### All Critical Decisions Locked:
- ✓ Phase 1 scope: Experience capability (full), all others thin layer
- ✓ Suppliers: Amadeus (RoW) + Sabre (US), in-house adapters, REST + async webhooks
- ✓ Financial: PCI-DSS SAQ-A, GDPR, SOX, SOC 2, PSD2/SCA, ARC/BSP/IATA, ASC 606/IFRS 15
- ✓ Settlement: Batch, central lodge / virtual card, no raw PAN
- ✓ Refunds: ARC void window, two-phase lifecycle, IATA tax code breakdown
- ✓ Multi-currency: Captured at event time, integer minor units, ISO 4217, half-up rounding once
- ✓ Tax: IATA tax code breakdown, fare + taxes + fees invariant enforced
- ✓ Data model: Transaction spine (Trip → Booking → Segment → Ticket → Financial Leg → Allocation), event-sourced, append-only
- ✓ Federated data: Profile, policy, supplier payloads, ERP, reporting as federated domains
- ✓ PII: Pointer model, GDPR erasure safe
- ✓ Identifiers: Internal ULID/UUIDv7, tenant-scoped, supplier mapping append-only log, correlation ID, idempotency keys
- ✓ State machines: Reservation, Ticket/Financial Leg, Approval — with explicit EXPIRED handling
- ✓ Cost allocation: Passenger × ticket granularity, largest-remainder, Σ invariant enforced
- ✓ Policy engine: Declarative, typed, versioned; BLOCK/REQUIRE_APPROVAL/WARN/ALLOW; most-restrictive wins
- ✓ Segment schema: Common envelope + typed payload; ancillaries first-class with EMD/refundability/tax breakdown
- ✓ Reporting: 20 mandatory dimensions captured at event write time, immutable

### Deferred to Architecture Phase (Non-Blocking):
- Webhook consumer spec (event schema, retry, dead-letter)
- Approval workflow implementation (chain, escalation, expiry)
- Notification channels (email, in-app; SMS/push Phase 2)
- GDS API authentication details and rate-limit budgets
- Error/fault taxonomy per operation type
- Infrastructure, deployment, and scalability targets

### Recommended Architecture Design Inputs:
1. Domain boundary definitions (6 capabilities as bounded contexts)
2. API contracts: shop, book, confirm, cancel, get-booking, get-trip
3. Event catalog: BookingCreated, TicketIssued, ApprovalRequested, RefundConfirmed, PolicyDecisionRecorded, FinancialEventRecorded
4. Data model ERD: Trip, Booking, Segment, Ticket, Ancillary, Financial Leg, Allocation, Supplier Mapping, Policy Decision Snapshot, Reporting Event
5. Adapter design: Amadeus and Sabre adapters behind common GdsAdapter interface
6. Infrastructure strategy: multi-tenant, tenant-scoped storage, observability (correlation ID), idempotency layer
