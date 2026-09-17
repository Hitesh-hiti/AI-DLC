# TravelPlatform: Gap Analysis & Implementation Readiness

**Document Version:** 0.5  
**Analysis Date:** 2026-09-10  
**Source of Truth:** `phases/03-architecture/architecture.md` v1.2  
**Status:** ✅ NO BLOCKERS — all critical gaps and human decisions resolved. Ready for Architect + PO sign-off and User Stories phase.

---

## REVISION HISTORY

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-09-04 | Initial gap analysis from RequirementDocument |
| 0.2 | 2026-09-04 | Q1–Q5 human decisions recorded |
| 0.3 | 2026-09-04 | Q6–Q16 resolved; all 16 gaps closed; status set COMPLETE |
| 0.4 | 2026-09-10 | Re-baselined against architecture.md v1.1. Q11 GDS decision revised (Sabre-only Phase 1; Amadeus Phase 2). 26 architecture review remediations recorded. 1 new blocking gap identified (ADR-009 ticketing authority). 3 new open items added to the gate. Gap resolution table updated throughout. |
| 0.5 | 2026-09-10 | ADR-009 closed: Model B (host agency) decided. PENDING_ISSUE state and TICKETING_QUEUE consequences recorded. GAP-ARCH-01 closed. ARCH-02 status updated. Overall readiness changed to NO BLOCKERS. |

---

## REQUIREMENTS SUMMARY

The RequirementDocument defines an **AI-native, enterprise-grade travel platform** managing the complete travel lifecycle through six integrated capabilities:

1. **Experience** — Travel discovery, booking, continuous user experience
2. **Content** — Travel data and content normalization
3. **Policy** — Organizational policy evaluation at decision points
4. **Payment & Expense** — Integrated payments, settlements, expense reconciliation
5. **Servicing** — Booking modifications, disruption handling, rebooking, refunds
6. **Data** — Travel Context (traveler, trip, bookings, policy, audit trail)

**Core Intent:** unified platform from user perspective; API-first; event-driven; extensible, loosely-coupled domains; built-in resilience, security, privacy, scalability, auditability; idempotent, compensating distributed transactions.

---

## OVERALL READINESS STATUS

| Area | Status |
|------|--------|
| Requirements (Q1–Q16) | ✅ COMPLETE |
| Architecture design (architecture.md v1.2) | ✅ COMPLETE |
| Original 16 gaps | ✅ ALL RESOLVED |
| Architecture review remediations (B1–C7) | ✅ 26 of 26 resolved in v1.1 |
| **ADR-009 — Ticketing authority** | ✅ **CLOSED — Model B (host agency) 2026-09-10** |
| Gate sign-off (Architect + PO) | ⏳ Pending |

---

## PART 1 — ORIGINAL GAPS (Q1–Q16)

All sixteen original gaps are resolved. Entries that changed between v0.3 and v0.4 are annotated.

### Q1: Phase 1 MVP Scope — RESOLVED ✓
- Experience capability: full implementation
- Content, Policy, Payment & Expense, Servicing: thin layers
- Data (spine): full implementation (required by all domains)
- Source: architecture.md §2.1

### Q2: Supplier Integration Strategy — RESOLVED ✓
- In-house adapters behind `GdsAdapter` interface
- Real-time REST (shop, hold, issue, cancel, void, refund)
- Async webhooks for post-booking events
- Source: architecture.md §8.1–§8.7

### Q3: Financial Integration & Compliance — RESOLVED ✓
- PCI-DSS SAQ-A/A-EP, GDPR + US state privacy, SOC 2 Type II, SOX-style controls, PSD2/SCA (EU), ARC/BSP/IATA, ASC 606/IFRS 15
- Batch settlement; central lodge or virtual card; no raw PAN
- Refund: void inside ARC same-day window; two-phase lifecycle (REQUESTED → CONFIRMED); ledger/allocation/reporting move on CONFIRMED only
- Multi-currency: sale, settlement, reporting tracked separately; FX captured at write time; integer minor units; ISO 4217
- Tax: breakdown by IATA code; invariant base fare + Σ taxes + Σ fees = ticket total
- Source: architecture.md §5.2, §6.4, §6.5, §10.2–§10.5, ADR-005, ADR-006

### Q4: Travel Context Data Model & Ownership — RESOLVED ✓
- Transaction spine (Trip → Booking → Passenger → Segment → Ticket → Coupon → Financial Leg → Allocation) — single source of truth, append-only, event-sourced
- Federated: Profile, Policy definitions, Supplier payloads, ERP, Reporting mart
- PII pointer model; GDPR erasure safe
- **v0.3 spine was:** Trip → Booking → Segment → Ticket → Financial Leg → Allocation
- **v0.4 spine adds:** Passenger (multi-passenger bookings); Coupon (ticket → coupon → segment, ADR-010)
- Source: architecture.md §5.1, §5.2, ADR-002, ADR-010, ADR-014

### Q5: Policy Evaluation Engine — RESOLVED ✓
- Small in-house declarative evaluator; typed, versioned rules (YAML); Phase 1 rules authored as data; Phase 2 authoring UI
- Enforcement levels: BLOCK > REQUIRE_APPROVAL > WARN > ALLOW
- Conflict resolution: outcome severity first → scope specificity → effective_from → rule_id (deterministic)
- Overrides: first-class append-only `policy_override` records with mandatory reason code
- Source: architecture.md §9.1–§9.5, ADR-004

### Q6: Phase 1 Suppliers — REVISED in v0.4 ✓
- **v0.3 decision:** Amadeus (RoW) + Sabre (US)
- **v0.4 decision (architecture.md v1.1):** **Sabre only in Phase 1.** Amadeus moves to Phase 2
- Rationale: the US/RoW split is a market convention, not a content boundary; Sabre covers a single-market pilot completely; a second adapter adds a second commercial contract, second certification, and second ticketing model to the Phase 1 critical path without extending coverage; cross-GDS failover is architecturally not implementable (PNR lives in one GDS)
- Phase 2: Amadeus is the deliberate proof that the `GdsAdapter` abstraction holds
- Source: architecture.md §2.2, §8.1, §8.4, ADR-008

### Q7: Booking State Machines — RESOLVED ✓ (expanded in v1.1)

**Reservation states:**
```
DRAFT → HELD → CONFIRMED → COMPLETED
              ↘ EXPIRED
              ↘ CANCELLED
HELD → CONFIRM_EXCEPTION  (new in v1.1: ticket issued at supplier but downstream write failed)
```
**Ticket / financial states:**
```
PENDING_ISSUE → ISSUED → VOIDED
             → ISSUED → REFUND_REQUESTED → REFUNDED
                                         → REFUND_REJECTED  (new in v1.1)
```
**Approval states:**
```
NOT_REQUIRED | PENDING → APPROVED | REJECTED | EXPIRED
```
Key guards: `CONFIRMED → CANCELLED` requires all tickets VOIDED or REFUNDED. EXPIRED never auto-approves. CONFIRM_EXCEPTION never retries — resolves via ops queue.

- Source: architecture.md §5.3.1–§5.3.3, ADR-012

### Q8: Cost Allocation Model — RESOLVED ✓ (clarified in v1.1)

Three granularities now formally separated:

| Level | Definition |
|-------|-----------|
| **Attribution** | `passenger × ticket` — unit ARC/BSP settles at |
| **Declaration** | Split declared per passenger at the API (cost objects + percentages) |
| **Storage** | Declaration expanded across every financial leg of that passenger's ticket |

- Largest-remainder algorithm; lowest-priority split absorbs rounding; integer minor units
- Invariants: F2a (`Σ allocations = leg amount`) and F2b (`Σ allocations across ticket legs = ticket total`)
- Reversals via `reverses_allocation_id` — never a fresh split
- Source: architecture.md §5.2 (COST_ALLOCATION), ADR-003

### Q9: Trip / Booking Identifiers & Supplier Mapping — RESOLVED ✓

- Trip ID: ULID/UUIDv7, tenant-scoped, business grouping (traveler + purpose + date window)
- Booking ID: internal, one per supplier reservation; 1..n per Trip
- Supplier mapping: append-only `(supplier_code, reference_type, reference_value, valid_from, valid_to)`; history retained; never primary key
- Correlation ID: spans shop → ticket → settlement; present on every event, log line, and `financial_event` row
- Idempotency key: durable PostgreSQL record, written and committed **before** outbound call (ADR-011)
- Tenant isolation: all IDs tenant-scoped; cross-tenant resolution impossible by construction
- Source: architecture.md §5.2, §5.4, ADR-001, ADR-011

### Q10: Policy Evaluation Scope — RESOLVED ✓

- Mixed enforcement: BLOCK (legal/safety, `override_allowed: false`) and WARN / REQUIRE_APPROVAL (policy breach, per-rule config)
- Each rule explicitly declares `enforcement_level` and `override_allowed`
- BLOCK is reserved for sanctioned destinations, embargoed carriers, invalid documents — not business policy
- Source: architecture.md §9.2, §9.5, GUARDRAIL-P2

### Q11: GDS Selection — REVISED in v0.4 ✓

- **v0.3:** Amadeus (RoW) + Sabre (US), two adapters from Phase 1
- **v0.4:** Sabre only in Phase 1 (see Q6 above). Amadeus in Phase 2. Cross-GDS failover removed (not implementable)
- Source: architecture.md ADR-008

### Q12: Webhook Consumer Spec — RESOLVED in v1.1 ✓ (was DEFERRED in v0.3)

Four binding constraints defined in architecture.md §8.7:
1. HMAC-SHA256 signature + ±5 min signed timestamp replay window
2. At-least-once delivery; deduplication on supplier `message_id` in PostgreSQL (not in-memory)
3. Out-of-order delivery is normal; consumers must be version-aware and never overwrite newer state
4. Webhooks will be missed; §8.8 reconciliation is the guaranteed path

Event types handled: ticket issuance confirmation (when `issuanceModel=TICKETING_QUEUE`), supplier cancellation, schedule change, price change, refund settlement confirmation.

- Source: architecture.md §8.7, §8.8

### Q13: Segment / Ancillary Schema — RESOLVED ✓

- Segment: common envelope (`product_type`, supplier refs, dates, status) + versioned JSONB typed payload
- Ancillaries: first-class entities on `(passenger, segment)`; own EMD, refundability flag, tax breakdown, financial leg, cost allocation — never folded into the fare
- Ticket → Coupon → Segment: ADR-010; coupon status drives usage and refundability
- Source: architecture.md §5.1, §5.2, ADR-007, ADR-010

### Q14: Approval Workflow — RESOLVED ✓ (detail in architecture)

Phase 1: single-level approval; approver resolved from org hierarchy and snapshotted at request time; approval actions idempotent; EXPIRED never auto-approves. Multi-level chains, delegation, out-of-office, and approval UI are Phase 2.

- Source: architecture.md §9.4, §5.3.3

### Q15: Notification Channels — RESOLVED ✓

- Phase 1: email + in-app; event-driven from outbox
- Phase 2: SMS, Slack, Teams, push
- Open item: retention and forwarding policy for itinerary PII in notification content needs an owner before notifications carry itinerary detail
- Source: architecture.md §13

### Q16: Reporting Dimensions — RESOLVED ✓ (count corrected in v1.1)

- **v0.3 stated 20 dimensions.** Architecture review found 21 were listed with one (override_reason_code) intentionally nullable. **Corrected to 21 dimensions (D1–D22; D9 is the deliberately nullable one).**
- All 21 captured at write time from live or cached sources; immutable once written
- `dimension_source` (LIVE | CACHED) and `dimension_snapshot_age_seconds` stamped on every event for provenance
- Source: architecture.md §5.2 (FINANCIAL_EVENT), §2.3

---

## PART 2 — ARCHITECTURE REVIEW REMEDIATIONS (v1.0 → v1.1)

Architecture review found 26 findings across three severity tiers. All 26 are resolved in v1.1.

### Tier B — Blocking Design Errors (would have caused production failures)

| Finding | Issue in v1.0 | Resolution in v1.1 | Section |
|---------|--------------|-------------------|---------|
| B1 | Two GDS adapters in Phase 1 | Sabre only; Amadeus Phase 2; interface + factory built for both | §2.2, §8.1, ADR-008 |
| B2 | Cross-GDS failover stated as a fallback | Removed — not implementable (PNR lives in one GDS) | §16.1, ADR-008 |
| B3 | ARC/IATA accreditation absent; ticket issuance left as TBD | Accreditation models A and B defined; ADR-009 raised as **open blocker** | §8.3, ADR-009 |
| B4 | `ticket.segment_id` — one-to-one ticket/segment | `TICKET → COUPON → SEGMENT`; coupon status drives usage and refundability | §5.1, §5.2, ADR-010 |
| B5 | Redis as authoritative idempotency store | Moved to PostgreSQL; durable write committed **before** the outbound call | §3.1, §5.4, §8.6, ADR-011 |
| B6 | Partial failure (ticket issued, ledger write failed) left booking in `HELD` | `CONFIRM_EXCEPTION` state + ops queue; partial failure is an explicit state, not reverted | §5.3.1, §16.2, ADR-012 |

### Tier S — Schema / Contract Errors (would have broken financial integrity or refunds)

| Finding | Issue in v1.0 | Resolution in v1.1 | Section |
|---------|--------------|-------------------|---------|
| S1 | No `refund` entity; two-phase lifecycle had no table | `refund` table added; REQUESTED/CONFIRMED/REJECTED/FAILED lifecycle | §5.2 |
| S2 | No penalty field; cancel response had an unexplained `non_refundable_amount` | `refund_penalty_amount` + `change_penalty_amount` persisted on ticket; cancel response now reconciles | §5.2, §6.4 |
| S3 | Form of payment not stored; refund had no way to prove return-to-original path | `booking.payment_reference` + `payment_instrument_type`; copied onto `refund` | §5.2 |
| S4 | Single `amount` on `financial_event` with three currency columns; ambiguous denomination | Three denominated amounts (`amount_sale`, `amount_settlement`, `amount_reporting`) + explicit FX rates | §5.2 |
| S5 | `correlation_id` missing from `financial_event` | Added; chain now terminates in the financial record auditors actually query | §5.2, §11.1 |
| S6 | `hold_expires_at` and `void_window_expires_at` not persisted | Added to `booking` and `ticket` schemas respectively | §5.2 |

### Tier M — Missing Capabilities (required for safe operation)

| Finding | Issue in v1.0 | Resolution in v1.1 | Section |
|---------|--------------|-------------------|---------|
| M1 | No booking state machine; guards, side effects, compensations undefined | Three state machines (reservation, ticket, approval) with guards and compensations | §5.3 |
| M2 | No supplier reconciliation job | Scheduled drift detection; `supplier_reconciliation_exception` table; exception queue | §8.8, §5.4 |
| M3 | Webhook spec incomplete: no ordering, replay, or reconciliation-fallback constraint | All four constraints defined; no longer deferred | §8.7 |
| M4 | No transactional outbox; dual-write failure mode silently loses events | Transactional outbox in same DB transaction as state change; replaces Kafka/MSK in Phase 1 | §5.4, §7.1, ADR-013 |
| M5 | Debit memo (ADM) handling absent | Explicit Phase 2 item; `DEBIT_MEMO` event type reserved in schema | §13 |
| M6 | Policy conflict resolution stated but no specificity ranking field on rules | `scope_level` + five-level specificity table; three-step deterministic resolution algorithm | §9.2, §9.3 |

### Tier C — Internal Contradictions (document contradicted itself)

| Finding | Issue in v1.0 | Resolution in v1.1 | Section |
|---------|--------------|-------------------|---------|
| C1 | `override_reason` / `override_actor` on `policy_decision_snapshot` — UPDATE on an append-only table | `policy_override` table added; overrides are append-only records referencing the snapshot | §5.2, §9.5, ADR-014 |
| C2 | Three allocation granularities conflated (API used `traveler_id`, ADR said `passenger×ticket`, storage was per-leg) | Attribution / declaration / storage formally separated; API declares per passenger; storage expanded per leg | §5.2, ADR-003 |
| C3 | No link from refund/adjustment allocation row to original | `reverses_allocation_id` added; proportions reproduced exactly, never recomputed | §5.2, GUARDRAIL-F5 |
| C4 | Org hierarchy as hard synchronous dependency would block all bookings on HR outage | 24-hour cached snapshot; `dimension_source` provenance stamped; blocked only if no snapshot exists | §2.3, §16.1 |
| C5 | "All 20 dimensions non-nullable" while listing 21 with one nullable | Corrected to 21 dimensions (D1–D22); `override_reason_code` (D9) is the single intentionally nullable field | §5.2 |
| C6 | MFA contradicted: "mandatory for admin" in §3.1, "optional Phase 1" in §10.1 | Resolved to mandatory for ADMIN and APPROVER from Phase 1 | §3.1, §10.1, GUARDRAIL-S6 |
| C7 | `BookingConfirmed` sample used `reporting_currency: GBP` against a USD-only Phase 1 | Corrected to USD in all currency roles in Phase 1 | §6, §7.3 |
| — | Six services + MSK applied to a one-supplier pilot | Two deployables + transactional outbox; domain boundaries unchanged | §2.1, §12, ADR-013 |
| — | TypeScript + Java split cut across deployables | Split retained per Inception decision; now defines the deployable boundary | §3.2, ADR-013 |

---

## PART 3 — OPEN ITEMS AT THE APPROVAL GATE

### � GAP-ARCH-01 — ADR-009: Ticketing Authority & ARC Accreditation  
**Status:** ✅ CLOSED — **Model B (host agency) decided 2026-09-10**  
**Expertise:** L3 | **Risk:** High | **Confidence:** 100% (decision made)  
**Priority:** RESOLVED

| | |
|-|-|
| **Decision** | Model B — host agency / accredited partner as agent of record |
| **Rationale** | Eliminates ARC accreditation, agent bonding, financial guarantees and Sabre own-PCC certification from the Phase 1 critical path. Ships materially sooner than Model A |
| **Issuance model** | `TICKETING_QUEUE` — booking placed on host's queue; ticket number arrives asynchronously via webhook (§8.7) or reconciliation (§8.8) |
| **New reservation state** | `PENDING_ISSUE` added between `HELD` and `CONFIRMED`. Booking sits here between queue placement and ticket confirmation. SLO: alert if p95 age exceeds 30 minutes |
| **Sabre contract** | Negotiated with the host partner; TravelPlatform has no direct Sabre commercial agreement in Phase 1 |
| **Host PCC** | Stored in AWS Secrets Manager; operational credential, not a domain concept |
| **ARC debit memos** | Host's responsibility in Phase 1; TravelPlatform receives ADM notifications as informational events only |
| **Model A** | Not closed — deferred to Phase 2+ re-evaluation |
| **Architecture changes** | architecture.md v1.2: §8.3 rewritten; §5.3.1 updated; `BookingQueuedForTicketing` event added; `booking.pending_issue.age_seconds` metric added; ADR-009 updated |

---

### 🟡 GAP-ARCH-02 — Sabre Commercial Terms & Certification Slot  
**Status:** IN PROGRESS — host partner selection and contract negotiation. Dependent on Model B decision (now closed).  
**Expertise:** L2 | **Risk:** High | **Confidence:** N/A (external dependency)  
**Priority:** HIGH — critical path item; must be tracked as a programme milestone

---

### 🟡 GAP-ARCH-03 — Notification Content Retention & PII Forwarding Policy  
**Status:** OPEN — needed before Phase 1 notifications carry itinerary detail  
**Expertise:** L3 | **Risk:** Medium | **Confidence:** 40%  
**Priority:** MEDIUM

Notification emails and in-app messages may contain itinerary details (dates, routes, traveler names). No policy exists for how long these are retained, whether they are forwarded to third parties (email providers, push services), or what consent is required. Needs a compliance/legal owner before itinerary content is included in notification templates.

**Owner:** Compliance / Legal

---

### 🟡 GAP-ARCH-04 — Gross vs. Net Agency Revenue Treatment (ASC 606 / IFRS 15)  
**Status:** OPEN — does not block Phase 1 data model but blocks Sprint 2 ERP posting  
**Expertise:** L3 | **Risk:** Medium | **Confidence:** 35%  
**Priority:** MEDIUM

ASC 606 / IFRS 15 require a determination of whether the platform is acting as principal (gross revenue recognition) or agent (net). This affects how `FinancialEventRecorded` is consumed by the ERP posting module and how revenue is reported. The spine schema does not change, but the ERP posting logic and the chart-of-accounts mapping depend on this decision. Cheaper to settle before Sprint 2 than to retrofit.

**Owner:** Finance

---

## PART 4 — DEFERRED ITEMS (Architecture Phase 2+)

The following are tracked as deferred, not gaps. All have explicit placeholders in the architecture (schema fields, event types, or capability matrix entries) so Phase 2 requires no migration.

| Item | Phase | Placeholder in Phase 1 |
|------|-------|----------------------|
| Second GDS adapter (Amadeus) | Phase 2 | `GdsAdapter` interface + factory; capability matrix |
| ARC/BSP debit memo (ADM) handling | Phase 2 | `DEBIT_MEMO` event type on `financial_event` |
| ARC/BSP settlement file ingest | Phase 2 | Financial event schema extensible |
| Exchanges, add-collect, partial refunds | Phase 2 | `coupon`, `refund`, `financial_leg` schemas complete |
| Approval chain, delegation, out-of-office, UI | Phase 2 | Single-level approval fully implemented |
| Notification: SMS, Slack, Teams, push | Phase 2 | Email + in-app in Phase 1; outbox event-driven |
| Hotel / Car / Rail supplier adapters | Phase 2+ | Segment common envelope + typed payload extensible |
| Policy authoring UI | Phase 2 | Rules-as-data; constrained UI deferred |
| Kafka / MSK event streaming | Phase 2 | Outbox + same channel names + same event envelope |
| Canary deployment | Phase 2 | Blue-green in Phase 1 |
| Dedicated tenant infrastructure | Phase 2+ | Row-level isolation in Phase 1 |
| ERP / GL outbound posting | Phase 1 Sprint 2 | Stub in Sprint 1 |
| Reporting mart pipeline | Phase 2 | All 21 dimensions captured from day 1 |
| Multi-currency operation | Phase 2 | Three-currency structure present from Phase 1 |
| PSD2/SCA enforcement | As needed | Required only if EU card payments go live |
| NDC adapter support | Phase 2+ | `NDC_ORDER_ID` reference type exists |
| Consent tracking | Phase 2 | `consent_version` field reserved in PII store |

---

## PART 5 — COMPLETE GAP RESOLUTION TABLE

| # | Gap | Resolved By | Version | Status |
|---|-----|-------------|---------|--------|
| 1 | Supplier Integration Model | Q2, Q6, Q11, architecture.md §8 | v0.2 / v0.4 | ✅ RESOLVED |
| 2 | Travel Context Schema | Q4, architecture.md §5 | v0.2 | ✅ RESOLVED |
| 3 | Policy Evaluation Engine | Q5, Q10, architecture.md §9 | v0.2 | ✅ RESOLVED |
| 4 | Distributed Transaction Model | Q7, Q9, architecture.md §5.3, §5.4 | v0.2 / v0.4 | ✅ RESOLVED |
| 5 | Financial Integration Scope | Q3, architecture.md §5.2, §10 | v0.2 | ✅ RESOLVED |
| 6 | Phase 1 MVP Scope | Q1, architecture.md §2.1 | v0.2 | ✅ RESOLVED |
| 7 | Booking State Machines | Q7, architecture.md §5.3 | v0.2 / v0.4 | ✅ RESOLVED |
| 8 | Cost Allocation Model | Q8, architecture.md §5.2 | v0.2 / v0.4 | ✅ RESOLVED |
| 9 | Trip/Booking Identifiers | Q9, architecture.md §5.2, §5.4 | v0.2 | ✅ RESOLVED |
| 10 | Policy Enforcement Scope | Q10, architecture.md §9.2 | v0.2 | ✅ RESOLVED |
| 11 | GDS Selection | Q11 (revised), architecture.md ADR-008 | v0.3 / v0.4 | ✅ RESOLVED |
| 12 | Webhook Consumer Spec | architecture.md §8.7 | v0.4 | ✅ RESOLVED |
| 13 | Segment / Ancillary Schema | Q13, architecture.md §5.2 | v0.3 | ✅ RESOLVED |
| 14 | Approval Workflow | architecture.md §9.4, §5.3.3 | v0.4 | ✅ RESOLVED |
| 15 | Notification Channels | architecture.md §13 | v0.4 | ✅ RESOLVED (Phase 2 detail open) |
| 16 | Reporting Dimensions | Q16, architecture.md §5.2 | v0.3 / v0.4 | ✅ RESOLVED (count corrected: 21) |
| 17 | Partial failure handling | architecture.md §5.3.1, ADR-012 | v0.4 | ✅ RESOLVED |
| 18 | Supplier reconciliation | architecture.md §8.8 | v0.4 | ✅ RESOLVED |
| 19 | Refund entity & two-phase lifecycle | architecture.md §5.2 | v0.4 | ✅ RESOLVED |
| 20 | Ticket → Coupon → Segment modelling | architecture.md ADR-010 | v0.4 | ✅ RESOLVED |
| 21 | Idempotency store durability | architecture.md ADR-011 | v0.4 | ✅ RESOLVED |
| 22 | Policy override model | architecture.md §9.5, ADR-014 | v0.4 | ✅ RESOLVED |
| 23 | Policy specificity ranking | architecture.md §9.2 | v0.4 | ✅ RESOLVED |
| 24 | Financial event currency ambiguity | architecture.md §5.2 | v0.4 | ✅ RESOLVED |
| 25 | Org hierarchy availability | architecture.md §2.3 | v0.4 | ✅ RESOLVED |
| **26** | **ARC accreditation & ticketing authority** | **ADR-009 — Model B decided 2026-09-10** | **v0.5** | ✅ **CLOSED** |
| 27 | Sabre commercial terms & certification | Dependent on #26 — now in progress | v0.5 | 🟡 IN PROGRESS |
| 28 | Notification PII retention policy | Needs compliance owner | v0.4 | 🟡 OPEN |
| 29 | Gross vs. net revenue treatment (ASC 606) | Needs Finance decision | v0.4 | 🟡 OPEN |

---

## FINAL READINESS ASSESSMENT

**Requirements:** ✅ Complete  
**Architecture design:** ✅ Complete (architecture.md v1.2)  
**All 26 review remediations:** ✅ Resolved  
**ADR-009 (ticketing authority):** ✅ Closed — Model B (host agency) decided 2026-09-10  

> ✅ **No hard blockers remain. The project is ready for Architect + PO sign-off on architecture.md v1.2 and for the User Stories & Acceptance Criteria phase to begin.**

**Three supporting open items** remain non-blocking for user story authoring:

| Item | Blocks |
|------|--------|
| ARCH-02: Host partner selection + Sabre contract | Sprint 1 ticketing stories cannot be tested until the host PCC is available in staging |
| ARCH-03: Notification PII retention policy | Notifications must not carry itinerary detail until the policy is set |
| ARCH-04: ASC 606 gross vs. net revenue treatment | Sprint 2 ERP posting logic depends on this; must be resolved before Sprint 2 planning |

**Recommended gate condition:** Architect and PO approval of architecture.md v1.2. ARCH-02 through ARCH-04 are noted as Sprint-level pre-conditions in the User Stories phase, not gate blockers.
