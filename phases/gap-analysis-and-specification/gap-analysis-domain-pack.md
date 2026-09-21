# TravelPlatform: Domain Pack Gap Analysis

**Document Version:** 1.0  
**Analysis Date:** 2026-09-18  
**Source of Truth:** `domainpack/airlines.json`  
**Baseline Reference:** `gap-analysis.md` v0.5 (2026-09-10)  
**Architecture Reference:** `architecture.md` v1.4 (2026-09-10)  

---

## EXECUTIVE SUMMARY

This gap analysis compares the TravelPlatform Phase 1 design (as documented in gap-analysis.md v0.5 and architecture.md v1.4) against the **airlines domain specifications** in `domainpack/airlines.json`.

**Overall Findings:**
- ✅ **Phase 1 Scope Alignment:** The platform correctly focuses on "Booking & Retailing" sub-domain, which matches the domain pack's Phase 1 MVP.
- ❗ **4 Domain-Specific Gaps Identified:** All deferred to Phase 2 as they're outside the Phase 1 MVP scope.
- ❗ **1 State Machine Alignment Issue:** PNR lifecycle differs between domain pack expectations and current implementation.
- ❗ **1 Missing Capability:** Baggage reconciliation tracking.
- ❗ **1 Missing Capability:** Interline/codeshare modeling.

**Impact:** These gaps are **non-blocking for Phase 1** but must be tracked for Phase 2 planning.

---

## DOMAIN PACK SUMMARY

### Core Domain Functions (from domainpack/airlines.json)

| Sub-Domain | Business Functions | Relevance to Phase 1 |
|-----------|-------------------|---------------------|
| Passenger Service Systems (PSS) | Reservation & PNR management, Fare calculation | ✅ **HIGH** - Core to Phase 1 |
| Booking & Retailing | Check-in & boarding | ⚠️ **MEDIUM** - Not explicitly implemented |
| Crew Management | Crew scheduling & compliance | ❌ **LOW** - Not in Phase 1 scope |
| Ops & Maintenance | Aircraft maintenance planning | ❌ **LOW** - Not in Phase 1 scope |
| Cargo | Cargo booking & tracking | ❌ **LOW** - Not in Phase 1 scope |
| Inflight Operations | Inflight connectivity & IFE | ❌ **LOW** - Not in Phase 1 scope |

### High-Risk Domain Areas (from domainpack/airlines.json)

| Risk Area | Likelihood | Impact on Phase 1 |
|----------|-----------|-------------------|
| PNR data consistency across GDS/PSS/check-in touchpoints | High | ⚠️ **MEDIUM** - Partially addressed by Sabre adapter |
| Fare calculation & rule engine correctness | High | ⚠️ **MEDIUM** - Policy evaluator is simplified (threshold-based) |
| Irregular operations (IROPS) rebooking | Medium | ❌ **LOW** - Not in Phase 1 scope |
| Crew Flight Time Limitation (FTL) compliance | Medium | ❌ **LOW** - Not in Phase 1 scope |
| Baggage reconciliation | Medium | ⚠️ **MEDIUM** - Missing from Phase 1 design |
| Interline/codeshare data exchange | Medium | ⚠️ **MEDIUM** - Not implemented in Phase 1 |

---

## GAP REGISTER

### GAP-DP-01: PNR Lifecycle State Machine Alignment

| Item | Value |
|------|-------|
| **GAP ID** | GAP-DP-01 |
| **Category** | State Machine / Workflow |
| **Severity** | Medium (not blocking) |
| **Domain Pack Reference** | "PNR lifecycle state machine: created → ticketed → checked-in → boarded → flown/rebooked/cancelled" |
| **Current Implementation** | `DRAFT → HELD → PENDING_ISSUE → CONFIRMED → COMPLETED` |
| **Gap** | Missing "checked-in" and "boarded" states in the current state machine |
| **Rationale** | The domain pack explicitly lists "Check-in & boarding" as a core business function, but the current state machine jumps directly from "ticketed" (ISSUED) to "boarded" (CONFIRMED) without explicit states. This is acceptable for Phase 1 since the system is backend-only and doesn't track passenger touchpoints. |
| **Phase** | Phase 1 (acceptable deviation) |
| **Phase 2 Action** | Consider adding "CHECKED_IN" and "BOARDED" states if frontend or departure control integration is added. |
| **Resolution** | **ACCEPTED** - The state machine is correct for a backend-only system that doesn't track passenger touchpoints. |

### GAP-DP-02: Baggage Reconciliation Tracking

| Item | Value |
|------|-------|
| **GAP ID** | GAP-DP-02 |
| **Category** | Missing Capability |
| **Severity** | Medium (safety/compliance risk) |
| **Domain Pack Reference** | "Baggage reconciliation (bag-passenger match) at departure. Bag-passenger mismatch is both a security requirement and an operational delay risk." |
| **Current Implementation** | No baggage entity or reconciliation tracking in the data model |
| **Gap** | The domain pack identifies baggage reconciliation as a high-priority risk area (99.9% target accuracy), but Phase 1 has no baggage tracking capability |
| **Rationale** | Baggage reconciliation is a core airline function but is not required for Phase 1's PNR reservation and ticketing focus. The system currently tracks passengers and segments but not baggage. |
| **Phase** | Phase 2+ |
| **Impact on Phase 1** | **NONE** - Baggage reconciliation is outside Phase 1 scope. The current system focuses on reservation and ticketing, not departure control. |
| **Phase 2 Action** | Add `baggage` entity with: baggage_id, booking_id, passenger_id, baggage_weight, baggage_tag_number, reconciliation_status (PENDING/RECONCILED/OFFLOADED), offload_reason (if applicable). |

### GAP-DP-03: Interline/Codeshare Modeling

| Item | Value |
|------|-------|
| **GAP ID** | GAP-DP-03 |
| **Category** | Missing Capability |
| **Severity** | Medium (data exchange risk) |
| **Domain Pack Reference** | "Interline/codeshare data exchange correctness (baggage, fare, PNR) is hard to reproduce because they only manifest at the boundary between two airlines' systems." |
| **Current Implementation** | Single GDS (Sabre) only in Phase 1. No interline/codeshare modeling. |
| **Gap** | The domain pack identifies interline/codeshare data exchange as a medium-risk area, but Phase 1 is single-vendor only. |
| **Rationale** | The current architecture correctly defers interline/codeshare to Phase 2 (see ADR-008, Q6, Q11 in gap-analysis.md). Single-supplier Phase 1 simplifies implementation and reduces risk. |
| **Phase** | Phase 2+ |
| **Impact on Phase 1** | **NONE** - Single GDS (Sabre) Phase 1 is intentional. |
| **Phase 2 Action** | Add `interline_partner` and `codeshare_agency` entities. Add `segment.partner_code` and `segment.operating_carrier` fields to support interline/codeshare modeling. |

### GAP-DP-04: Irregular Operations (IROPS) Rebooking

| Item | Value |
|------|-------|
| **GAP ID** | GAP-DP-04 |
| **Category** | Missing Capability |
| **Severity** | Medium (high-visibility disruption handling) |
| **Domain Pack Reference** | "IROPS rebooking priority matrix: Passenger tier x connection risk x rebooking-inventory availability determines rebooking sequencing during mass disruption." |
| **Current Implementation** | No disruption rebooking workflow. Manual cancellation only. |
| **Gap** | The domain pack emphasizes IROPS rebooking priority-based sequencing, but Phase 1 has no disruption handling beyond basic cancellation. |
| **Rationale** | IROPS rebooking is a complex domain with high business impact. It is correctly deferred to Phase 2. |
| **Phase** | Phase 2+ |
| **Impact on Phase 1** | **NONE** - Basic cancellation is sufficient for Phase 1. |
| **Phase 2 Action** | Add `disruption` entity with: disruption_id, type (WEATHER/ATC/MECHANICAL/OPERATIONAL), severity, rebooking_priority_matrix, affected_bookings[]. Add `rebooking` entity with: rebooking_id, original_segment_id, new_segment_id, priority, status (PROPOSED/APPROVED/REJECTED). |

### GAP-DP-05: Fare Rule Decision Table Complexity

| Item | Value |
|------|-------|
| **GAP ID** | GAP-DP-05 |
| **Category** | Simplification / Future Enhancement |
| **Severity** | Low (revenue risk at scale) |
| **Domain Pack Reference** | "Fare rule decision table: Route x cabin x fare-class x booking-window x change/cancel-rule combinations — fare engines are a textbook decision-table domain given the combinatorial rule structure." |
| **Current Implementation** | Simple threshold-based policy evaluator (e.g., fare > $500 → REQUIRE_APPROVAL). |
| **Gap** | The domain pack describes fare engines as combinatorial decision tables, but Phase 1 uses simple thresholds without full fare rule processing. |
| **Rationale** | Phase 1's "Policy Evaluator" is intentionally simplified for rapid MVP delivery. Full fare rule processing is deferred to Phase 2. |
| **Phase** | Phase 2+ |
| **Impact on Phase 1** | **MINIMAL** - Threshold-based policies are sufficient for Phase 1 business rules. |
| **Phase 2 Action** | Replace simplified policy evaluator with full fare rule decision table engine. Support IATA fare rules, seasonal surcharges, advance purchase restrictions, and change/cancel fees. |

---

## COMPLIANCE CHECKLIST ALIGNMENT

### Domain Pack Compliance Requirements (from airlines.json)

| Standard | Applies To | Current Implementation | Gap |
|----------|-----------|----------------------|-----|
| IATA NDC (New Distribution Capability) / ONE Order | Booking, retailing, order-management | ❌ **NOT IMPLEMENTED** | NDC is a future-phase requirement |
| IATA PADIS / Type B messaging | PNR and departure-control message exchange | ❌ **NOT IMPLEMENTED** | Legacy messaging not needed for Phase 1 |
| EASA/FAA Flight Time Limitation (FTL) | Crew scheduling systems | ❌ **NOT APPLICABLE** | Crew management outside Phase 1 scope |
| Airworthiness Directive (AD) compliance tracking | Maintenance & engineering | ❌ **NOT APPLICABLE** | M&E outside Phase 1 scope |
| TSA/regional baggage-reconciliation mandates | Baggage handling systems | ❌ **NOT IMPLEMENTED** | Baggage handling deferred to Phase 2 |
| EU261/local passenger-rights compensation | IROPS/disruption-management | ❌ **NOT IMPLEMENTED** | Disruption handling deferred to Phase 2 |

### Compliance Gap Summary

| Compliance Area | Phase 1 Status | Phase 2 Action |
|----------------|---------------|----------------|
| IATA NDC | Not required | Add NDC/ONE Order adapter in Phase 2 |
| Passenger Rights (EU261) | Not required | Add compensation calculation in Phase 2 |
| Baggage Reconciliation | Not required | Add baggage tracking in Phase 2 |
| Crew FTL | Not applicable | Not needed for Phase 1 |

---

## DOMAIN PACK TEST COVERAGE GAPS

### Missing Test Scenarios from Domain Pack

| Domain Pack Test Technique | Scenario | Current Coverage | Gap |
|---------------------------|----------|-----------------|-----|
| **PNR lifecycle state transitions** | Created → Ticketed → Checked-in → Boarded → Flown | ✅ Partial - Missing "checked-in" and "boarded" states | GAP-DP-01 (acceptable deviation for Phase 1) |
| **Fare rule decision table** | Route × Cabin × Fare-Class × Booking-Window combinations | ❌ **NOT TESTED** - Only threshold-based tests exist | GAP-DP-05 (simplified Phase 1) |
| **IROPS rebooking priority matrix** | Passenger tier × Connection risk × Rebooking-inventory | ❌ **NOT TESTED** - IROPS not implemented | GAP-DP-04 (Phase 2+) |
| **Baggage reconciliation matrix** | Boarded-passenger × Loaded-bag × Offload-triggers | ❌ **NOT TESTED** - Baggage not implemented | GAP-DP-02 (Phase 2+) |
| **FTL compliance boundaries** | Duty-period and rest-period at exact regulatory limits | ❌ **NOT TESTED** - FTL not in scope | Not applicable to Phase 1 |

---

## RECOMMENDATIONS

### Phase 1 (Current State)
✅ **Approved** - The current architecture (v1.4) and gap analysis (v0.5) are aligned with Phase 1 scope.  
✅ **Domain Pack Gaps** - All identified domain pack gaps are deferred to Phase 2 as intended.  
✅ **Testing Strategy** - Phase 1 test cases (be_testcase.md) focus on core reservation/ticketing workflows.

### Phase 2 Actions (Required)

1. **Add Baggage Handling Entity** - Address GAP-DP-02
   - Add `baggage` table with reconciliation tracking
   - Add baggage reconciliation tests

2. **Add Interline/Codeshare Support** - Address GAP-DP-03
   - Add `interline_partner` and `codeshare_agency` entities
   - Add interline data exchange tests

3. **Add IROPS/Disruption Rebooking** - Address GAP-DP-04
   - Add `disruption` and `rebooking` entities
   - Add priority-based rebooking tests

4. **Enhance Fare Rule Engine** - Address GAP-DP-05
   - Replace simplified policy evaluator with decision table engine
   - Add combinatorial fare rule tests

5. **Add NDC/ONE Order Support** - Address IATA NDC gap
   - Add NDC adapter in Phase 2
   - Add ONE Order message format support

---

## IMPACT MATRIX

| Gap ID | Severity | Phase 1 Impact | Phase 2 Priority | Effort |
|--------|----------|---------------|-----------------|--------|
| GAP-DP-01 | Medium | None (acceptable deviation) | Low (if passenger touchpoints needed) | Low |
| GAP-DP-02 | Medium | None (outside scope) | High (security/compliance) | Medium |
| GAP-DP-03 | Medium | None (single GDS intentional) | Medium (interline business) | Medium |
| GAP-DP-04 | Medium | None (basic cancel sufficient) | High (high-visibility disruption) | High |
| GAP-DP-05 | Low | Minimal (threshold policies OK) | High (revenue risk at scale) | High |

---

## ASSUMPTIONS

1. **Phase 1 Scope:** Single GDS (Sabre), single-supplier reservation and ticketing only.
2. **Domain Pack Focus:** Airlines domain pack emphasizes operations and safety-critical systems; TravelPlatform is a passenger booking platform with backend-only implementation.
3. **Compliance Deferrals:** IATA NDC, baggage reconciliation, and EU261 passenger rights are deferred to Phase 2.
4. **Testing Approach:** Phase 1 uses simplified policy evaluator (threshold-based) rather than full fare rule decision tables.

---

## OPEN QUESTIONS

1. **Baggage Handling:** Should Phase 2 baggage tracking include weight/balance calculations (safety-critical) or just baggage reconciliation (security/compliance)?
2. **Disruption Handling:** Should Phase 2 IROPS include automated rebooking (high-complexity) or manual intervention only?
3. **Interline/Codeshare:** Should Phase 2 support codeshare-only (same carrier, different flight numbers) or full interline (different carriers)?
4. **Fare Rules:** Should Phase 2 fare rule engine support IATA Fare Families (Basic Economy, Main Cabin, Premium Economy, Business, First)?

---

## HUMAN REVIEW CHECKLIST

- [ ] Architect: Review domain pack gaps and confirm Phase 2 priorities
- [ ] Product Owner: Validate business priorities for Phase 2 gaps
- [ ] Compliance: Review compliance checklist alignment
- [ ] QA Lead: Confirm test coverage gaps are acceptable for Phase 1
- [ ] Security: Review security implications of deferred capabilities

---

## REVISION HISTORY

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-09-18 | AI Gap Analysis | Initial document - Domain pack gap analysis |

---

**Status:** READY FOR HUMAN REVIEW  
**Next Steps:** Human review of open questions and Phase 2 priorities
