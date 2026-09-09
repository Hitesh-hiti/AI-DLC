# Gap Analysis — TravelPlatform Requirements
**Document Version:** 1.0 — Initial Analysis  
**Status:** OPEN — Awaiting Human Answers (Round 1)  
**HITL Decision:** HUMAN_REVIEW_REQUIRED  
**Analyst:** AI (Design Agent via Router)  
**Date:** 2026-09-03  
**Source Document:** `.kiro/steering/RequirementDocument.md`  
**Guardrail Applied:** HITL.md — Expertise L2, Risk High, Confidence 52% → HUMAN_REVIEW

---

## HITL Guardrail Assessment

| Dimension        | Assessment                                                                 |
|------------------|----------------------------------------------------------------------------|
| Expertise        | L2 — Requirements analysis is within capability but domain depth (travel industry regulations, enterprise financials, supplier ecosystems) requires human SME validation |
| Risk             | High — Financially material decisions, regulatory compliance, security, and enterprise integrations are in scope |
| Evidence Quality | Low — Source is a high-level intent statement only; no detailed requirements, no domain specifications |
| Evidence Completeness | Insufficient — No business rules, no data models, no integration contracts, no SLAs defined |
| Confidence       | 52% — Insufficient evidence prevents confident derivation of complete requirements |
| **Guardrail Decision** | **HUMAN_REVIEW — mandatory before proceeding to design or development** |

---

## 1. Requirements Summary

The RequirementDocument.md is a **high-level platform intent statement**, not an implementation-ready requirements specification. It defines six integrated capabilities (Experience, Content, Policy, Payment & Expense, Servicing, Data) and establishes architectural principles (API-first, event-driven, extensible, resilient). 

It does **not** contain:
- Specific functional requirements or user stories
- Business rules or policy logic
- Data models or schemas
- Integration contracts or supplier specifications
- Security or compliance requirements
- Non-functional requirement targets (SLAs, throughput, latency)
- Organizational or deployment context
- Prioritization or phasing

**Verdict: NOT implementation-ready.** The document is a valid starting point for decomposition but cannot drive design, architecture, or development without significant elaboration.

---

## 2. Gap Register

Each gap is classified by: **Expertise (L1/L2/L3) | Risk (Low/Medium/High) | Confidence (%) | Status | Priority (Critical/High/Medium/Low)**

---

### DOMAIN A — Scope & Boundaries

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-001 | No definition of which traveler segments are in scope (corporate only, leisure, mixed). Business rules, policy models, and expense workflows differ fundamentally by segment. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-002 | No geographic or regulatory scope defined. PCI-DSS, GDPR, PSD2, NDC, IATA regulations, and local payment laws vary by region. Compliance requirements are entirely undefined. | Missing | L3 | High | 25% | OPEN | Critical |
| GAP-003 | No phasing or MVP scope defined. The platform describes six full capabilities — building all simultaneously is high risk. No indication of what constitutes a minimum viable platform. | Missing | L2 | High | 45% | OPEN | Critical |
| GAP-004 | "Unified platform" vs. "independent capabilities" is architecturally ambiguous. The document says the product behaves as one platform but capabilities evolve independently. The boundary between shared and isolated state is undefined. | Ambiguous | L2 | High | 50% | OPEN | Critical |
| GAP-005 | No definition of the organizational model. Is this a B2B platform (enterprise sells to corporate clients), B2C, or multi-tenant SaaS? This determines identity, data isolation, billing, and policy architecture fundamentally. | Missing | L2 | High | 35% | OPEN | Critical |

---

### DOMAIN B — Identity & Access

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-006 | "Centralized identity" is stated architecturally but no identity model is defined. Traveler, organization admin, travel manager, approver, finance, and supplier roles are all implied but unspecified. | Missing | L2 | High | 45% | OPEN | Critical |
| GAP-007 | Integration with "enterprise HR and identity platforms" is required but no specific protocols are defined (SAML, OIDC, SCIM, Active Directory). No SSO requirements stated. | Missing | L2 | High | 40% | OPEN | High |
| GAP-008 | Authorization model is undefined. No role-based access control (RBAC) or attribute-based access control (ABAC) policy is specified. Who can view, modify, approve, or cancel bookings is entirely unspecified. | Missing | L2 | High | 40% | OPEN | Critical |

---

### DOMAIN C — Policy Engine

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-009 | "Configuration-driven policy" is stated but the policy model is not defined. No policy types, rule structures, hierarchy (org > department > traveler), or conflict resolution rules are specified. | Missing | L2 | High | 35% | OPEN | Critical |
| GAP-010 | Policy approval workflow is unspecified. The document says "required approvals" must occur before transactions complete, but the approval chain, delegation, timeout behavior, and escalation rules are undefined. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-011 | Policy exception handling is not described. What constitutes a valid exception? Who approves exceptions? Are exceptions time-boxed or permanent? No exception lifecycle is defined. | Missing | L2 | Medium | 45% | OPEN | High |

---

### DOMAIN D — Payment & Expense

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-012 | Payment methods are unspecified. Corporate card, virtual card, personal card, direct billing, lodge card, and wallet-based payment are all common in enterprise travel. None are defined. | Missing | L2 | High | 35% | OPEN | Critical |
| GAP-013 | Refund and settlement timing SLAs are undefined. The document requires reconciliation but provides no timelines, tolerance thresholds, or failure escalation policies for financial discrepancies. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-014 | Expense policy rules are entirely absent. Per diem limits, receipt requirements, category mapping, out-of-policy spend handling, and reimbursement approval workflows are not specified. | Missing | L2 | High | 35% | OPEN | Critical |
| GAP-015 | "Integration with enterprise financial ecosystem" is stated but no specific financial systems are named or described (SAP, Oracle, Workday, Concur, NetSuite). Integration contracts are undefined. | Missing | L2 | High | 35% | OPEN | High |
| GAP-016 | Multi-currency handling is not addressed. Enterprise travel spans geographies. FX conversion, reporting currency, settlement currency, and multi-currency expense reconciliation are undefined. | Missing | L2 | High | 40% | OPEN | High |

---

### DOMAIN E — Supplier & Content

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-017 | Travel supplier types are not enumerated. Air, hotel, car, rail, transfers, and activities are all plausible. Priority, scope, and minimum supplier coverage for MVP are undefined. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-018 | Supplier adapter architecture is mentioned but no adapter contract, data normalization model, or canonical booking object schema is specified. | Missing | L2 | High | 45% | OPEN | Critical |
| GAP-019 | GDS/NDC/direct-connect strategy is unaddressed. This is a fundamental architectural choice with major cost, capability, and compliance implications. | Missing | L3 | High | 30% | OPEN | Critical |
| GAP-020 | Content freshness and caching strategy for availability and pricing is undefined. Real-time vs. cached content involves significant latency, cost, and accuracy tradeoffs. | Missing | L2 | Medium | 45% | OPEN | High |

---

### DOMAIN F — Servicing & Disruption

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-021 | "Disruption servicing" is mentioned but no disruption types, SLAs, automated vs. manual handling thresholds, or supplier notification workflows are specified. | Missing | L2 | High | 40% | OPEN | High |
| GAP-022 | Rebooking rules and traveler consent flows during disruption are not defined. Who initiates? What options are presented? What is the fallback if no alternatives exist? | Missing | L2 | Medium | 45% | OPEN | High |
| GAP-023 | Servicing channel strategy is undefined. Is servicing self-service (app/web), agent-assisted (call center), automated, or all of the above? This drives architecture significantly. | Missing | L2 | High | 40% | OPEN | High |

---

### DOMAIN G — Data & Travel Context

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-024 | "Travel Context" is described as a continuously evolving trusted record but no data model, retention policy, access rules, or privacy classification is defined. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-025 | Data governance model is absent. Who owns traveler data? What are the data residency requirements? How long is data retained? What is the deletion/right-to-be-forgotten workflow? | Missing | L3 | High | 30% | OPEN | Critical |
| GAP-026 | Audit log specification is incomplete. "Relevant audit information" is mentioned but audit event types, retention durations, access controls, and tamper-evidence requirements are undefined. | Missing | L2 | High | 40% | OPEN | High |

---

### DOMAIN H — Non-Functional Requirements

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-027 | No availability SLA is defined (e.g., 99.9%, 99.99%). This drives infrastructure, redundancy, and deployment architecture. | Missing | L2 | High | 35% | OPEN | Critical |
| GAP-028 | No performance/latency targets defined. Search response time, booking confirmation time, payment processing time, and page load time are all unspecified. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-029 | No scalability targets defined. Peak concurrent users, transaction throughput, supplier query volume, and data volume are undefined. | Missing | L2 | High | 40% | OPEN | Critical |
| GAP-030 | "Recoverability" is stated but no RTO (Recovery Time Objective) or RPO (Recovery Point Objective) is defined. | Missing | L2 | High | 40% | OPEN | High |
| GAP-031 | Accessibility requirements are not stated. WCAG level (2.1 AA, 2.2 AAA) and assistive technology support requirements are unspecified. | Missing | L1 | Medium | 70% | OPEN | Medium |
| GAP-032 | No internationalization (i18n) or localization (l10n) requirements are stated. Language support, date/time formats, and locale-specific content are unaddressed. | Missing | L1 | Medium | 65% | OPEN | Medium |

---

### DOMAIN I — Security & Compliance

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-033 | Security requirements are entirely absent. PCI-DSS scope, tokenization requirements, encryption standards, penetration testing expectations, and vulnerability management are undefined. | Missing | L3 | High | 25% | OPEN | Critical |
| GAP-034 | Privacy requirements are absent despite "privacy" being listed as a design principle. GDPR, CCPA, or other applicable privacy regulations are not identified. | Missing | L3 | High | 25% | OPEN | Critical |
| GAP-035 | No authentication requirements stated. MFA enforcement, session management, token expiry, and device trust policies are unspecified. | Missing | L2 | High | 40% | OPEN | Critical |

---

### DOMAIN J — Integration & Extensibility

| Gap ID | Gap Description | Type | Expertise | Risk | Confidence | Status | Priority |
|--------|----------------|------|-----------|------|------------|--------|----------|
| GAP-036 | "API-first interfaces" stated but no API versioning strategy, deprecation policy, or backward compatibility contract is defined. | Missing | L2 | High | 45% | OPEN | High |
| GAP-037 | Event-driven integration is stated architecturally but no event schema, broker technology, event catalog, or ordering/delivery guarantee requirements are specified. | Missing | L2 | High | 40% | OPEN | High |
| GAP-038 | "Analytics platforms" integration is mentioned but no analytics requirements, reporting capabilities, or data export formats are defined. | Missing | L2 | Medium | 50% | OPEN | Medium |

---

## 3. Gap Summary by Priority

| Priority | Count | % of Total |
|----------|-------|------------|
| Critical | 20    | 53%        |
| High     | 14    | 37%        |
| Medium   | 4     | 10%        |
| Low      | 0     | 0%         |
| **Total**| **38**| **100%**   |

**Critical gaps by domain:**
- Scope & Boundaries: 5 Critical
- Identity & Access: 2 Critical
- Policy Engine: 2 Critical
- Payment & Expense: 3 Critical
- Supplier & Content: 3 Critical
- Data & Travel Context: 2 Critical
- Non-Functional: 3 Critical
- Security & Compliance: 3 Critical (with L3 expertise — mandatory HUMAN_REVIEW)

---

## 4. Human Decisions Required

The following gaps cannot be resolved by AI analysis alone. Business or domain-expert human input is mandatory.

| Decision ID | Decision Required | Domain | Risk | HITL Decision |
|-------------|------------------|--------|------|---------------|
| HD-001 | Define the primary business model: B2B corporate travel management, B2C leisure, or multi-tenant SaaS | Scope | High | HUMAN_REVIEW |
| HD-002 | Define geographic and regulatory scope to determine applicable compliance framework (PCI-DSS level, GDPR, PSD2, regional payment regulations) | Compliance | High | HUMAN_REVIEW |
| HD-003 | Define supplier strategy: GDS (Sabre/Amadeus/Travelport), NDC, direct connects, or hybrid — this is the single highest architectural impact decision | Supplier | High | HUMAN_REVIEW |
| HD-004 | Define payment architecture: which payment methods are in scope, which payment providers/PSPs are preferred or mandated, and what PCI-DSS scope the organization accepts | Payment | High | HUMAN_REVIEW |
| HD-005 | Define MVP scope and phasing: which of the six capabilities ship first, and what constitutes a releasable v1 | Scope | High | HUMAN_REVIEW |
| HD-006 | Define organizational and multi-tenancy model: single enterprise, multi-enterprise, white-label, or marketplace | Architecture | High | HUMAN_REVIEW |
| HD-007 | Define the policy engine model: rule-based, configuration-driven workflow, or AI-assisted — and define the policy hierarchy (org > department > trip type > traveler) | Policy | High | HUMAN_REVIEW |
| HD-008 | Define data residency and privacy requirements: jurisdictions, data sovereignty constraints, and applicable privacy regulations | Data/Legal | High | HUMAN_REVIEW |
| HD-009 | Define availability, RTO, and RPO targets: these drive infrastructure cost and architecture choices | NFR | High | HUMAN_REVIEW |
| HD-010 | Define enterprise financial system integration targets: which ERP/expense systems must be integrated for MVP (SAP, Oracle, Concur, Workday, etc.) | Integration | High | HUMAN_REVIEW |

---

## 5. Top 5 Gaps (Highest Impact — Round 1)

These five gaps have the widest downstream blast radius. Answering them unblocks the largest number of dependent design and architecture decisions.

| Rank | Gap ID(s) | Gap | Why It's Blocking |
|------|-----------|-----|-------------------|
| 1 | GAP-001, GAP-005 | Business model and traveler segment scope undefined | Determines identity model, policy architecture, data isolation, billing, and nearly every other domain |
| 2 | GAP-019 | GDS/NDC/direct-connect supplier strategy undefined | Highest-impact single technical decision; drives content architecture, booking flow, cost model, and supplier adapter design |
| 3 | GAP-002, GAP-033, GAP-034 | Geographic scope and compliance framework undefined | Without knowing applicable regulations, security architecture, payment scope, and data privacy design cannot proceed |
| 4 | GAP-003 | No MVP or phasing defined | Cannot prioritize epics, stories, or architecture work without knowing which capabilities ship first |
| 5 | GAP-012, GAP-013 | Payment methods and financial settlement model undefined | Blocks payment architecture, PCI-DSS scoping, expense integration, and reconciliation design |

---

## 6. First 5 Questions for Human Decision — ROUND 1

> **HITL Escalation: HUMAN_REVIEW_REQUIRED**  
> The following five questions must be answered before gap analysis can proceed to design or architecture derivation.  
> No downstream artifacts (epics, stories, architecture, APIs) should be created until these are resolved.

---

**Q1 — Business Model & Traveler Segment (HD-001, GAP-001, GAP-005)**

> What is the primary business model for TravelPlatform?
>
> - **(A) B2B Corporate Travel Management** — organizations subscribe to manage employee travel under policy
> - **(B) B2C Leisure Travel** — individual travelers book directly
> - **(C) Multi-tenant SaaS** — the platform is licensed to travel management companies (TMCs) or enterprises who configure it for their own users
> - **(D) Marketplace / Hybrid** — a combination of the above
>
> And: Is the initial target traveler segment corporate employees only, or does it include leisure travelers?

---

**Q2 — Supplier Strategy (HD-003, GAP-017, GAP-018, GAP-019)**

> What is the intended supplier connectivity strategy?
>
> - **(A) GDS-only** (Sabre, Amadeus, Travelport)
> - **(B) NDC-first** (direct airline content via IATA NDC)
> - **(C) Direct supplier connects** (hotel chains, car rental APIs)
> - **(D) Aggregator/meta-search** (third-party content aggregators)
> - **(E) Hybrid** — if so, which supplier types are in scope for MVP and in what priority order?
>
> And: Which travel verticals are in scope for the initial release? (Air / Hotel / Car / Rail / Other — rank by priority)

---

**Q3 — Geographic & Regulatory Scope (HD-002, GAP-002, GAP-033, GAP-034)**

> What is the intended geographic scope of the platform at launch?
>
> - Which countries or regions will travelers book in and travel to?
> - Which countries or regions will the platform be operated from (for data residency and compliance purposes)?
> - Are there known regulatory requirements to comply with? (e.g., PCI-DSS level, GDPR, CCPA, PSD2, local aviation regulations, IATA requirements)
>
> This answer determines the entire security, privacy, and payment compliance architecture.

---

**Q4 — MVP Scope & Phasing (HD-005, GAP-003)**

> The document describes six integrated capabilities. What is the intended MVP scope?
>
> - Which capabilities must be present in v1 for the platform to be usable?
> - Is there a target go-live date or timeline?
> - Are there any capabilities that are explicitly deferred to v2 or later?
>
> Suggested framing: "A traveler should be able to [do X] by [date]."

---

**Q5 — Payment Architecture (HD-004, GAP-012, GAP-013, GAP-016)**

> What payment model is in scope for the platform?
>
> - Which payment methods must be supported? (Corporate card, virtual card, personal card with reimbursement, direct billing/lodge card, other)
> - Are there preferred or mandated payment processors or PSPs?
> - Is the platform handling card data directly (PCI-DSS in-scope) or tokenizing via a third-party vault (reducing PCI scope)?
> - Is multi-currency support required at launch? If yes, which currencies?

---

## 7. Implementation Readiness Verdict

> **STATUS: NOT IMPLEMENTATION-READY**

The requirements document is a platform intent statement. It defines *what* the platform should be at a strategic level but does not contain sufficient specificity to drive design, architecture, or development.

**Blocking conditions (must be resolved before proceeding):**
- 20 Critical gaps identified across 8 domains
- 10 Human decisions required — 3 require L3 specialist input (regulatory, security, supplier)
- No NFR targets, no compliance framework, no data model, no integration contracts
- HITL guardrail: Confidence 52% — insufficient for AI to proceed autonomously

**Next steps:**
1. Answer Round 1 questions (Q1–Q5 above)
2. AI will update this document and issue Round 2 questions
3. Continue until all Critical gaps are resolved
4. Product Owner + Architect sign-off required before proceeding to Design phase

---

*This document was generated by AI analysis and requires human review and approval per HITL.md guardrails before any downstream artifacts are created.*
