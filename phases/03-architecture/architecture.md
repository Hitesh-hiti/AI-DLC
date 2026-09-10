# TravelPlatform — Phase 1 Architecture Design

**Document Version:** 1.2  
**Date:** 2026-09-10  
**Status:** DRAFT — Pending Architect + PO Approval  
**Source:** gap-analysis.md v0.5 + Inception HITL decisions Q1–Q10, follow-up clarifications, ADR-009 Model B decision  
**Phase:** Architecture Design (SDLC Phase 4)

---

## REVISION HISTORY

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-09-04 | Initial draft |
| 1.1 | 2026-09-09 | Architecture review remediation — see change log below |
| 1.2 | 2026-09-10 | ADR-009 closed: Model B (host agency) decided. `PENDING_ISSUE` reservation state added (§5.3.1). §8.3 rewritten with Model B consequences. `BookingQueuedForTicketing` event added (§7.2). `booking.pending_issue.age_seconds` metric added (§11.3). Gate open item #1 closed. |

### v1.1 change log

**Scope corrections (alignment with Inception decisions)**
- Phase 1 reduced to **one GDS adapter (Sabre)**; Amadeus moved to Phase 2 (§2.2, §8, §13, ADR-008)
- Cross-GDS failover removed — not implementable (§16.1, ADR-008)
- **ARC/IATA accreditation and the ticketing model** added as the Phase 1 critical path item (§8.3, ADR-009, §16.1)
- Six services collapsed to **two deployables**; Kafka/MSK replaced by a transactional outbox (§3, §4, §12, ADR-013)

**Schema corrections**
- `TICKET → COUPON → SEGMENT` replaces the one-to-one ticket/segment relationship (§5.2, ADR-010)
- New entities: `coupon`, `refund`, `policy_override`, `passenger`, `outbox`, `supplier_reconciliation_exception`
- New columns: hold/void expiry, form of payment, penalty, FX rates and `correlation_id` on `financial_event`
- Idempotency store moved from Redis to PostgreSQL (§8.6, ADR-011)

**New sections**
- §5.3 Booking state machines (reservation / ticket / approval) with guards and side effects
- §5.4 Transactional outbox
- §8.8 Supplier reconciliation (drift detection)
- §9.5 Policy override model
- ADR-009 through ADR-014

---

## TABLE OF CONTENTS

1. [Architectural Principles](#1-architectural-principles)
2. [Domain Boundaries](#2-domain-boundaries)
3. [Technology Stack](#3-technology-stack)
4. [System Context Diagram](#4-system-context-diagram)
5. [Data Model](#5-data-model)
6. [API Contracts](#6-api-contracts)
7. [Event Catalog](#7-event-catalog)
8. [GDS Adapter Pattern](#8-gds-adapter-pattern)
9. [Policy Evaluator Design](#9-policy-evaluator-design)
10. [Security Architecture](#10-security-architecture)
11. [Observability](#11-observability)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [Deferred to Later Phases](#13-deferred-to-later-phases)
14. [Architecture Decision Records (ADRs)](#14-architecture-decision-records-adrs)
15. [Error Handling & Fault Taxonomy](#15-error-handling--fault-taxonomy)
16. [Dependency Inventory](#16-dependency-inventory)
17. [Architecture Guardrails](#17-architecture-guardrails)
18. [Architecture-to-Requirement Mapping](#18-architecture-to-requirement-mapping)

---

## 1. ARCHITECTURAL PRINCIPLES

These principles are non-negotiable and apply to every service, schema, and integration decision.

| # | Principle | Rationale |
|---|-----------|-----------|
| P1 | **API-first** — every capability is exposed via a versioned REST API before any UI is built | Enables parallel development, testability, and future channel extension |
| P2 | **Event-driven integration via transactional outbox** — state changes are written to the outbox in the same DB transaction as the state itself, then dispatched. No service ever writes to the database and publishes an event as two separate operations | Decouples domains; eliminates the dual-write failure mode that silently loses events |
| P3 | **Transaction spine is append-only** — Trip/Booking/Ticket records are never updated, only superseded | Financial integrity, GDPR-safe erasure, audit immutability |
| P4 | **Identifiers are internal and opaque** — ULID/UUIDv7, tenant-scoped; supplier IDs never used as keys | GDS record locators recycle; ticket numbers change on exchange |
| P5 | **Dimensions captured at write time** — all 21 reporting dimensions stamped on the financial event at booking | Cannot be reconstructed retroactively after org restructuring |
| P6 | **Idempotency on every outbound call** — one idempotency key per supplier call, stored and checked | Prevents double-booking and double-issuance on retries |
| P7 | **Policy evaluated synchronously at booking** — policy decision snapshotted onto booking immutably | Ensures reproducible audit; policy changes don't alter historical decisions |
| P8 | **PII by pointer** — raw PII never embedded in transactions; stored in a separate PII store referenced by ID | GDPR right-to-erasure without breaking the financial ledger |
| P9 | **Multi-tenancy enforced at repository layer** — tenant_id on every entity; cross-tenant resolution impossible by construction | Prevents data leakage; enables SaaS model |
| P10 | **Ancillaries are first-class** — never folded into fare; independent EMD, refundability, tax breakdown, financial leg | Independent servicing, refunding, allocation; unrecoverable if merged into fare |
| P11 | **Partial failure is a state, not an exception** — any condition where the supplier and the platform disagree (ticket issued but ledger write failed, cancelled at GDS but not locally) has an explicit status and an ops queue | These conditions are routine in travel, not edge cases. A status enum that cannot express them will lie about the state of real money |
| P12 | **The supplier is reconciled, never trusted** — a scheduled job compares platform state against the supplier's record of truth and raises exceptions for drift | Webhooks are missed, calls time out after succeeding, and agents make offline changes in the GDS. Drift is certain; detection must be systematic |
| P13 | **Coupon is the unit of air fulfilment** — ticket documents carry coupons; coupon status drives usage, refundability and exchange | One ticket spans multiple flight segments. Modelling a ticket against a single segment makes partial usage and partial refund unrepresentable |

---

## 2. DOMAIN BOUNDARIES

### 2.1 Phase 1 Capability Map

Six bounded contexts, **two deployables**. The context boundaries below are logical and binding
regardless of how many processes they run in; §12 describes how they are packaged, and ADR-013
records why Phase 1 packages them as two rather than six.

```
╔═══ DEPLOYABLE A ── travelplatform-experience (TypeScript) ═══════════╗
║                                                                     ║
║  ┌──────────────────────────────────────┐                           ║
║  │         EXPERIENCE (FULL)            │  ← Phase 1 primary        ║
║  │  Shop · Book · Hold · Confirm ·      │                           ║
║  │  Cancel · Ticket · Trip Management   │                           ║
║  └──────────────┬───────────────────────┘                           ║
║                 │ in-process module calls                           ║
║   ┌─────────────▼──────────┐  ┌──────────────────────────────────┐  ║
║   │   POLICY  (thin)       │  │   CONTENT  (thin)                │  ║
║   │  Evaluate · Snapshot   │  │  Sabre adapter · normalisation   │  ║
║   └────────────────────────┘  └──────────────────────────────────┘  ║
╚═════════════════════════════╤═══════════════════════════════════════╝
                              │ REST (sync)  +  outbox events (async)
╔═════════════════════════════▼═══════════════════════════════════════╗
║          DEPLOYABLE B ── travelplatform-core (Java 21)              ║
║                                                                     ║
║   ┌────────────────────────┐  ┌──────────────────────────────────┐  ║
║   │  PAYMENT & EXPENSE     │  │   SERVICING  (thin)              │  ║
║   │  Ledger · Refund SM    │  │  Cancel · Void · Refund request  │  ║
║   └────────────────────────┘  └──────────────────────────────────┘  ║
║   ┌────────────────────────────────────────────────────────────┐    ║
║   │                   DATA  (spine)                            │    ║
║   │  Trip · Booking · Segment · Ticket · Coupon ·              │    ║
║   │  FinancialLeg · Allocation · Refund · SupplierMapping ·    │    ║
║   │  PolicySnapshot · PolicyOverride · Outbox · Event          │    ║
║   └────────────────────────────────────────────────────────────┘    ║
╚═════════════════════════════════════════════════════════════════════╝
```

**Split rationale.** The boundary falls on the language line (§3.2) and on the transactional line:
everything that writes the financial spine lives in one process with one database transaction,
which is what makes the §17 financial invariants enforceable synchronously rather than eventually.

### 2.2 Bounded Context Definitions

#### EXPERIENCE
- **Responsibility:** End-to-end traveler journey — search, shop, select, book, hold, confirm, view, cancel
- **Owns:** Booking orchestration, traveler session, search context
- **Consumes:** Content (normalized fares/availability), Policy (evaluation result), Payment (authorization token), Data (Trip/Booking write)
- **Phase 1 scope:** Full implementation
- **API prefix:** `/v1/trips`, `/v1/bookings`, `/v1/search`
- **Deployable:** A (TypeScript)

#### CONTENT
- **Responsibility:** Normalize heterogeneous GDS responses to canonical platform models
- **Owns:** GDS adapter implementations, fare normalization, availability caching, supplier reconciliation
- **Phase 1 scope:** Thin layer — air only; **one adapter (Sabre)**. Amadeus is Phase 2 and is the
  designed proof that the `GdsAdapter` abstraction holds (ADR-008)
- **API prefix:** `/v1/content/availability`, `/v1/content/fares`
- **Deployable:** A (TypeScript)

#### POLICY
- **Responsibility:** Evaluate declarative policy rules at booking decision points; produce immutable decision snapshots
- **Owns:** Rule store, evaluator engine, decision audit log, override records
- **Phase 1 scope:** Thin layer — synchronous evaluation; rules authored as data by engineering
- **API prefix:** `/v1/policy/evaluate`
- **Deployable:** A (TypeScript)

#### PAYMENT & EXPENSE
- **Responsibility:** Financial ledger, settlement events, refund state machine, cost allocation, expense reversal
- **Owns:** Financial event ledger (append-only), refund lifecycle, cost allocation splits, form-of-payment references
- **Phase 1 scope:** Thin layer — ledger writes, refund requested/confirmed states; no gateway integration
- **API prefix:** `/v1/ledger`, `/v1/refunds`
- **Deployable:** B (Java)

#### SERVICING
- **Responsibility:** Post-booking lifecycle — voluntary cancel, void, refund request, disruption intake
- **Owns:** Servicing request workflow, supplier cancel/void calls, refund initiation, reconciliation exception queue
- **Phase 1 scope:** Thin layer — cancel, void and refund request only
- **API prefix:** `/v1/service`
- **Deployable:** B (Java)

#### DATA
- **Responsibility:** Transaction spine storage, event sourcing, query APIs for Trip/Booking/Ticket state
- **Owns:** Canonical entity schemas (Trip, Booking, Passenger, Segment, Ticket, Coupon, Ancillary, Financial Leg, Allocation, Refund, Supplier Mapping, Policy Snapshot, Policy Override, Outbox)
- **Phase 1 scope:** Full implementation (core spine required by all other domains)
- **API prefix:** `/v1/data/trips`, `/v1/data/bookings`
- **Deployable:** B (Java)

### 2.3 Federated Reference Data (Not Owned by Spine)

| Domain | System | Integration |
|--------|--------|-------------|
| Traveler Profile | HR / Identity Platform | Read via Profile Service API; PII stored by pointer. Cached, TTL 15 min |
| Policy Definitions | Policy Config Store | Versioned YAML/JSON rule files; loaded at evaluator startup, hot-reloaded on version change |
| Org Hierarchy | HR / Identity Platform | Queried at booking confirmation to snapshot dimensions. **Cached with a 24 h staleness bound** — see below |
| ERP / GL | Financial System | Outbound posting event only; no read-back in Phase 1 |
| Reporting Mart | Analytics Platform | Derived from event stream; no write-back to spine |

**Org hierarchy availability (resolves review finding C4).** P5 requires every reporting dimension
to be stamped at write time, which makes the Org Hierarchy service a hard dependency of booking
confirmation. Treating it as strictly synchronous means an HR platform outage halts all booking.
The resolution:

- The hierarchy snapshot for a traveler is cached on read with a **24-hour staleness bound**.
- Confirmation proceeds on a cached snapshot and stamps `dimension_source = CACHED` plus
  `dimension_snapshot_age_seconds` on the financial event.
- Confirmation is blocked **only** when no snapshot exists at all, or the cached one exceeds 24 h.
  A booking is never confirmed with null dimensions.
- Finance can therefore identify and re-derive any event booked against a stale hierarchy, which a
  hard block would have prevented from existing at all — a worse outcome than a marked one.

---

## 3. TECHNOLOGY STACK

### 3.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API Gateway** | Kong or AWS API Gateway | Rate limiting, auth, routing, per-tenant config |
| **Backend Services** | Node.js (TypeScript) + Java 21 (Spring Boot 3) | Two deployables on the language boundary — see §3.2 and ADR-013 |
| **Event Transport** | **PostgreSQL transactional outbox** + dispatcher (Phase 1) | Removes the dual-write failure mode without operating a broker. Kafka/MSK deferred to Phase 2 — ADR-013 |
| **Primary Database** | PostgreSQL 16 (RDS/Aurora, Multi-AZ) | ACID, JSONB for typed segment payloads, append-only patterns, outbox in the same transaction |
| **Event Store** | PostgreSQL (append-only `domain_event` + `outbox` tables) | Event sourcing for spine entities; no separate event-store product in Phase 1 |
| **Idempotency Store** | **PostgreSQL** (`idempotency_record`), Redis as read-through cache only | Durability is a correctness requirement — an evicted key means a double-issued ticket. ADR-011 |
| **Cache** | Redis (ElastiCache) | Session state, availability cache, idempotency read-through. **Never the system of record** |
| **Search / Availability** | Sabre Dev Studio REST APIs | Real-time availability — no local fare cache in Phase 1. Single adapter (ADR-008) |
| **Identity / Auth** | Auth0 or AWS Cognito | OIDC/OAuth 2.0; tenant-scoped JWT; **MFA mandatory for ADMIN and APPROVER roles from Phase 1** |
| **PII Store** | Separate PostgreSQL schema, encrypted at rest | PII pointer model; isolated for GDPR erasure |
| **Secret Management** | AWS Secrets Manager or HashiCorp Vault | GDS credentials, API keys; never in environment variables or code |
| **Infrastructure** | AWS (primary cloud) | ECS Fargate (2 services), RDS Aurora, ElastiCache, S3, EventBridge Scheduler, CloudWatch |
| **IaC** | Terraform | All infrastructure as code; no manual cloud console provisioning |
| **CI/CD** | GitHub Actions | PR validation, test gates, deploy pipelines |
| **Observability** | OpenTelemetry + Datadog (or CloudWatch) | Traces, metrics, logs; correlation ID propagation |
| **API Docs** | OpenAPI 3.1 (Swagger UI) | Machine-readable contracts; auto-generated from code annotations |

### 3.2 Language and Deployable Decision

The language split is retained. It defines the deployable boundary rather than cutting across it,
so each deployable is a single-language, single-toolchain artefact.

| Deployable | Language | Bounded contexts | Database |
|-----------|----------|------------------|----------|
| `travelplatform-experience` | TypeScript (Node.js 22) | Experience, Content, Policy, Notification | Reads spine via Deployable B API; owns session/search state + Redis |
| `travelplatform-core` | Java 21 (Spring Boot 3) | Data (spine), Payment & Expense, Servicing | Owns the spine schema — the only writer |

- **TypeScript** — fast iteration, strong HTTP client ecosystem, `zod` validation at API boundaries
- **Java 21** — the financial domains and the spine sit in one JVM transaction boundary, which is
  what allows GUARDRAIL-F1/F2 to be enforced **synchronously inside the write transaction** rather
  than eventually by a downstream consumer
- **Both** follow the same API contract standards, event envelope, and coding conventions below
- **Accepted cost:** two toolchains, two CI paths, two dependency-scan surfaces. Recorded in ADR-013

### 3.3 Coding Conventions (enforced via linter/CI)

- All monetary amounts: `BIGINT` / `long` (minor units), never `float`, `double` or `decimal`
- Every monetary value travels with an explicit ISO 4217 currency code — no implicit currency
- All identifiers: `ULID` (sortable) or `UUIDv7`
- All timestamps: `ISO 8601` UTC (`2026-09-04T10:30:00Z`)
- All currency codes: `ISO 4217` 3-letter (`USD`, `EUR`, `GBP`); minor-unit exponent resolved from
  the ISO 4217 table, never assumed to be 2 (JPY is 0, KWD is 3)
- Rounding: half-up, applied exactly once, at the point of allocation
- All IATA codes: uppercase string, no normalization at runtime
- Secrets: never logged, never in response bodies, never in URLs
- Tenant ID: first-class field on every entity, validated in every repository query

---

## 4. SYSTEM CONTEXT DIAGRAM

```
                         ┌─────────────────────────────┐
                         │        TRAVELER / UI        │
                         │  (Web App / Mobile / API)   │
                         └──────────────┬──────────────┘
                                        │ HTTPS
                         ┌──────────────▼──────────────┐
                         │        API GATEWAY          │
                         │  Auth · Rate limit · Route  │
                         └──────────────┬──────────────┘
                                        │
   ╔════════════════════════════════════▼════════════════════════════════╗
   ║      DEPLOYABLE A — travelplatform-experience   (ECS Fargate, TS)   ║
   ║                                                                     ║
   ║   ┌────────────┐   ┌──────────┐   ┌───────────────────────────┐     ║
   ║   │ EXPERIENCE │──▶│  POLICY  │   │  CONTENT                  │     ║
   ║   │  module    │   │  module  │   │  SabreAdapter             │──┐  ║
   ║   └─────┬──────┘   └────┬─────┘   │  Normalizer · Reconciler  │  │  ║
   ║         │               │         └───────────────────────────┘  │  ║
   ║         │          ┌────▼─────┐                                  │  ║
   ║         │          │  Policy  │   (versioned YAML, hot-reloaded) │  ║
   ║         │          │  Store   │                                  │  ║
   ║         │          └──────────┘                                  │  ║
   ╚═════════╪══════════════════════════════════════════════════════╪═══╝
             │ REST (sync, mTLS)                                    │ REST
             │                                                      ▼
   ╔═════════▼═══════════════════════════════════════════╗   ┌──────────────┐
   ║  DEPLOYABLE B — travelplatform-core (Fargate, Java) ║   │  Sabre Dev   │
   ║                                                     ║   │  Studio API  │
   ║   ┌─────────────────────────────────────────────┐   ║   └──────┬───────┘
   ║   │            DATA  (spine)                    │   ║          │
   ║   │  Trip·Booking·Passenger·Segment·Ticket·     │   ║          │ webhook
   ║   │  Coupon·Ancillary·FinancialLeg·Allocation·  │   ║          │ (HMAC)
   ║   │  Refund·SupplierMapping·PolicySnapshot·     │   ║          ▼
   ║   │  PolicyOverride                             │   ║   ┌──────────────┐
   ║   └───────────────┬─────────────────────────────┘   ║   │  Webhook     │
   ║                   │ same DB transaction             ║   │  Ingest      │
   ║   ┌───────────────▼──────────┐  ┌────────────────┐  ║   │  (Deploy. A) │
   ║   │  PAYMENT & EXPENSE       │  │   SERVICING    │  ║   └──────────────┘
   ║   │  Ledger·RefundSM·Alloc   │  │ Cancel·Void·   │  ║
   ║   └──────────────────────────┘  │ Refund·ExcQueue│  ║
   ║                                 └────────────────┘  ║
   ║   ┌─────────────────────────────────────────────┐   ║
   ║   │  OUTBOX  (written in the same transaction)  │   ║
   ║   └───────────────┬─────────────────────────────┘   ║
   ╚═══════════════════╪═════════════════════════════════╝
                       │ dispatcher (poll + advisory lock)
        ┌──────────────┼───────────────┬──────────────────┐
        ▼              ▼               ▼                  ▼
  Notification   Reporting Mart   ERP / GL Posting   Deployable A
  (email/in-app) (event consumer)  (outbound only)   (async handlers)

External:
  ─ Sabre Dev Studio      (availability, PNR, ticketing, void, refund)
  ─ ARC                   (accreditation, settlement, debit memos — see §8.3 / ADR-009)
  ─ Lodge / Virtual Card  (form of payment; reference token only — no PAN)
  ─ HR/Identity Platform  (traveler profile, org hierarchy — cached, §2.3)
  ─ ERP / GL System       (financial posting — outbound only)
  ─ Reporting Mart        (outbox consumer — outbound only)
```

> **Phase 2 note.** When a second GDS or independent scaling justifies it, the outbox dispatcher is
> replaced by Kafka and the two deployables split along the module boundaries already drawn here.
> No domain boundary changes. Trigger conditions in ADR-013.

---

## 5. DATA MODEL

### 5.1 Transaction Spine Entity Relationship

```
TENANT
  └─► TRIP (1..n per tenant/traveler)
        └─► BOOKING (1..n per trip)
              ├─► PASSENGER (1..n per booking)
              ├─► SUPPLIER_MAPPING (append-only, 1..n per booking)
              ├─► APPROVAL (0..1 per booking)
              ├─► POLICY_DECISION_SNAPSHOT (1 per booking, immutable)
              │     └─► POLICY_OVERRIDE (0..n, append-only — never mutates the snapshot)
              ├─► SEGMENT (1..n per booking)
              │     └─► TYPED_SEGMENT_PAYLOAD (1 per segment, versioned)
              └─► TICKET (1..n per booking — one per PASSENGER per document)
                    ├─► COUPON (1..4 per ticket; conjunction ticket for >4)
                    │     └─► SEGMENT  (each coupon references exactly one segment)
                    ├─► FINANCIAL_LEG (1..n per ticket)
                    │     └─► COST_ALLOCATION (1..n per financial leg)
                    ├─► REFUND (0..n per ticket, two-phase lifecycle)
                    │     └─► COST_ALLOCATION (reversals, linked to the original allocation)
                    └─► ANCILLARY (0..n per passenger+segment)
                          ├─► FINANCIAL_LEG (1 per ancillary)
                          └─► COST_ALLOCATION (1..n per ancillary leg)

Cross-cutting (not part of the spine hierarchy):
  ─ OUTBOX                             (written in the same transaction as spine changes)
  ─ IDEMPOTENCY_RECORD                 (durable, authoritative — see ADR-011)
  ─ SUPPLIER_RECONCILIATION_EXCEPTION  (drift between platform and supplier — see §8.8)
  ─ FINANCIAL_EVENT                    (append-only reporting/audit projection)
```

> **Ticket is a child of BOOKING, not of SEGMENT (revised in v1.1).** A ticket document covers one
> passenger across the whole itinerary and carries one coupon per flight segment. Hanging TICKET off
> SEGMENT made a round trip unrepresentable and made partial usage, partial refund and exchange
> impossible to model. See ADR-010.

### 5.2 Entity Schemas

#### TRIP
```sql
CREATE TABLE trip (
  trip_id         TEXT        NOT NULL,          -- ULID, system-generated
  tenant_id       TEXT        NOT NULL,          -- Tenant isolation
  traveler_id     TEXT        NOT NULL,          -- PII pointer (not raw name)
  purpose         TEXT        NOT NULL,          -- Business grouping key
  date_window_start DATE      NOT NULL,
  date_window_end   DATE      NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  version         INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, trip_id)
);
```

#### BOOKING
```sql
CREATE TABLE booking (
  booking_id      TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  trip_id         TEXT        NOT NULL,
  status          TEXT        NOT NULL,          -- see reservation state machine §5.3.1
  correlation_id  TEXT        NOT NULL,          -- Spans shop→ticket→settlement
  hold_expires_at TIMESTAMPTZ,                   -- NOT NULL while status = HELD (§6.2 contract)
  payment_reference TEXT,                        -- Lodge / virtual card reference token — NEVER a PAN
  payment_instrument_type TEXT,                  -- LODGE_CARD|VIRTUAL_CARD
  booking_channel TEXT        NOT NULL,          -- WEB|API|AGENT  (reporting dimension)
  source_system   TEXT        NOT NULL,          -- Originating system (reporting dimension)
  supplier_code   TEXT        NOT NULL,          -- Owning GDS; a booking never spans suppliers
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, booking_id),
  FOREIGN KEY (tenant_id, trip_id) REFERENCES trip(tenant_id, trip_id)
);
```

> `traveler_id` removed from `booking` in v1.1 — a booking can carry several passengers. Traveler
> identity now lives on `passenger` (below) and on `ticket`. `payment_reference` added so refunds
> can honour the "return to original form of payment" contract in §6.5 and so settlement can be
> reconciled (review finding S3).

#### PASSENGER (new in v1.1)
```sql
CREATE TABLE passenger (
  passenger_id    TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  traveler_id     TEXT        NOT NULL,          -- PII pointer (never a raw name)
  passenger_type  TEXT        NOT NULL,          -- ADT|CHD|INF
  PRIMARY KEY (tenant_id, passenger_id),
  FOREIGN KEY (tenant_id, booking_id) REFERENCES booking(tenant_id, booking_id)
);
```

#### SUPPLIER_MAPPING (append-only — never update or delete)
```sql
CREATE TABLE supplier_mapping (
  id              BIGSERIAL   PRIMARY KEY,
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  supplier_code   TEXT        NOT NULL,          -- SABRE (Phase 1); AMADEUS added Phase 2
  reference_type  TEXT        NOT NULL,          -- GDS_LOCATOR|AIRLINE_LOCATOR|TICKET_NUMBER|EMD_NUMBER|NDC_ORDER_ID|SETTLEMENT_REF
  reference_value TEXT        NOT NULL,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to        TIMESTAMPTZ,                   -- NULL = currently active
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- No UPDATE or DELETE ever issued on this table
);
```

#### SEGMENT (common envelope)
```sql
CREATE TABLE segment (
  segment_id      TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  product_type    TEXT        NOT NULL,          -- AIR|HOTEL|CAR|RAIL (extensible)
  status          TEXT        NOT NULL,          -- mirrors reservation status
  departure_at    TIMESTAMPTZ,
  arrival_at      TIMESTAMPTZ,
  origin          TEXT,                          -- IATA airport/city code
  destination     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, segment_id)
);

-- Typed payload stored as versioned JSONB (product-specific attributes)
CREATE TABLE segment_payload (
  segment_id      TEXT        NOT NULL,
  tenant_id       TEXT        NOT NULL,
  payload_version INTEGER     NOT NULL,          -- schema version for typed payload
  payload         JSONB       NOT NULL,          -- product-specific fields
  PRIMARY KEY (tenant_id, segment_id, payload_version)
);
```

#### TICKET (revised in v1.1 — see ADR-010)
```sql
CREATE TABLE ticket (
  ticket_id           TEXT        NOT NULL,      -- ULID
  tenant_id           TEXT        NOT NULL,
  booking_id          TEXT        NOT NULL,      -- Ticket belongs to the BOOKING, not a segment
  passenger_id        TEXT        NOT NULL,      -- One ticket document per passenger
  traveler_id         TEXT        NOT NULL,      -- PII pointer
  status              TEXT        NOT NULL,      -- see ticket state machine §5.3.2
  document_type       TEXT        NOT NULL,      -- TKT|EMD
  conjunction_of      TEXT,                      -- ticket_id of the primary doc when >4 coupons
  base_fare_amount    BIGINT      NOT NULL,      -- Integer minor units
  base_fare_currency  TEXT        NOT NULL,      -- ISO 4217
  total_amount        BIGINT      NOT NULL,      -- base fare + Σ taxes + Σ fees (invariant enforced)
  total_currency      TEXT        NOT NULL,
  sale_currency       TEXT        NOT NULL,
  settlement_currency TEXT        NOT NULL,
  reporting_currency  TEXT        NOT NULL,
  fx_rate_sale_to_settlement NUMERIC(18,8),
  fx_rate_sale_to_reporting  NUMERIC(18,8),
  fx_rate_captured_at TIMESTAMPTZ,               -- Rate is captured, never recomputed (ADR-006)
  is_refundable       BOOLEAN     NOT NULL,      -- From fare rules at time of sale
  refund_penalty_amount   BIGINT,                -- Cancellation penalty per fare rules, minor units
  change_penalty_amount   BIGINT,                -- Change penalty per fare rules, minor units
  penalty_currency        TEXT,
  void_window_expires_at  TIMESTAMPTZ,           -- Carrier/ARC same-day void deadline
  issued_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, ticket_id),
  FOREIGN KEY (tenant_id, booking_id)   REFERENCES booking(tenant_id, booking_id),
  FOREIGN KEY (tenant_id, passenger_id) REFERENCES passenger(tenant_id, passenger_id)
);
```

> **v1.1 changes.** `segment_id` removed — replaced by the `coupon` table below (ADR-010).
> Penalty amounts persisted so §6.4 can actually compute refundable / non-refundable amounts
> (review finding S2). `void_window_expires_at` persisted so `within_void_window` in §6.4 has a
> source (review finding S6). `fx_rate_captured_at` added to make ADR-006 verifiable.

#### COUPON (new in v1.1 — the unit of air fulfilment)
```sql
CREATE TABLE coupon (
  coupon_id       TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  ticket_id       TEXT        NOT NULL,
  segment_id      TEXT        NOT NULL,          -- Exactly one segment per coupon
  coupon_number   SMALLINT    NOT NULL,          -- 1..4 within the document
  status          TEXT        NOT NULL,          -- OPEN|USED|VOIDED|REFUNDED|EXCHANGED|SUSPENDED
  status_changed_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, coupon_id),
  UNIQUE (tenant_id, ticket_id, coupon_number),
  FOREIGN KEY (tenant_id, ticket_id)  REFERENCES ticket(tenant_id, ticket_id),
  FOREIGN KEY (tenant_id, segment_id) REFERENCES segment(tenant_id, segment_id)
);
```

> **Why coupons exist.** Coupon status is what determines whether a ticket is fully unused
> (all coupons `OPEN` → refundable in Phase 1), partially used (mixed → Phase 2 partial refund),
> or exchanged. Phase 1 only refunds tickets whose coupons are **all** `OPEN`; the guard is stated
> in §5.3.2 and enforced in code, but the schema is complete now so Phase 2 needs no migration.

-- Tax breakdown by IATA tax code (never a percentage)
CREATE TABLE ticket_tax (
  id              BIGSERIAL   PRIMARY KEY,
  tenant_id       TEXT        NOT NULL,
  ticket_id       TEXT        NOT NULL,
  tax_code        TEXT        NOT NULL,          -- IATA tax code (e.g. US, XF, AY)
  amount          BIGINT      NOT NULL,          -- Integer minor units
  currency        TEXT        NOT NULL,
  is_refundable   BOOLEAN     NOT NULL
);

-- Fee breakdown
CREATE TABLE ticket_fee (
  id              BIGSERIAL   PRIMARY KEY,
  tenant_id       TEXT        NOT NULL,
  ticket_id       TEXT        NOT NULL,
  fee_code        TEXT        NOT NULL,
  amount          BIGINT      NOT NULL,
  currency        TEXT        NOT NULL,
  is_refundable   BOOLEAN     NOT NULL
);
```

> **Invariant (test-enforced):** `ticket.total_amount = ticket.base_fare_amount + Σ ticket_tax.amount + Σ ticket_fee.amount` (all in same currency).

#### FINANCIAL_LEG
```sql
CREATE TABLE financial_leg (
  leg_id          TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  ticket_id       TEXT        NOT NULL,          -- OR ancillary_id (exclusive)
  ancillary_id    TEXT,
  leg_type        TEXT        NOT NULL,          -- FARE|TAX|FEE|ANCILLARY
  amount          BIGINT      NOT NULL,          -- Authoritative amount, integer minor units
  currency        TEXT        NOT NULL,
  status          TEXT        NOT NULL,          -- ACTIVE|SUPERSEDED
  superseded_by   TEXT,                          -- leg_id of replacement (if superseded)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, leg_id)
  -- Financial facts are superseded (not updated). status=SUPERSEDED + superseded_by set.
);
```

#### COST_ALLOCATION
```sql
CREATE TABLE cost_allocation (
  allocation_id   TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  leg_id          TEXT        NOT NULL,          -- Financial leg being split
  ticket_id       TEXT        NOT NULL,          -- Denormalised attribution unit (ADR-003)
  passenger_id    TEXT        NOT NULL,          -- Attribution unit: passenger × ticket
  cost_object     TEXT        NOT NULL,          -- WBS/project/department/GL
  cost_object_type TEXT       NOT NULL,          -- WBS|PROJECT|DEPARTMENT|GL
  split_basis     TEXT        NOT NULL,          -- PERCENTAGE|FIXED_AMOUNT
  split_value     NUMERIC(10,4) NOT NULL,        -- % (0–100) or fixed minor units
  allocated_amount BIGINT     NOT NULL,          -- Computed, integer minor units (largest-remainder)
  priority        INTEGER     NOT NULL,          -- Lowest priority absorbs rounding remainder
  reverses_allocation_id TEXT,                   -- Set on refund/adjustment reversals (GUARDRAIL-F5)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, allocation_id)
);
```

**Granularity, stated once (resolves review finding C2).** Three levels were conflated in v1.0.
They are now fixed as follows and every layer uses the same vocabulary:

| Level | What it is | Where it appears |
|-------|-----------|------------------|
| **Attribution** | `passenger × ticket` — the unit ARC/BSP settles and reports at | ADR-003; `cost_allocation.ticket_id` + `passenger_id` |
| **Declaration** | The split the user supplies: cost objects and percentages, **per passenger** | §6.3 confirm request |
| **Storage** | The declared split **expanded across every financial leg of that passenger's ticket** | `cost_allocation` rows, one per (leg × cost object) |

The API accepts a declaration at passenger level; the Payment module expands it to per-leg rows at
confirm time using the same proportions, applying largest-remainder in minor units per leg with
`priority` breaking the remainder. Both invariants therefore hold simultaneously:

> **Invariant F2a (test-enforced):** `Σ cost_allocation.allocated_amount = financial_leg.amount` for each leg.
>
> **Invariant F2b (test-enforced):** `Σ cost_allocation.allocated_amount` across all legs of a ticket
> `= ticket.total_amount` — which is ADR-003's statement, now derivable rather than contradictory.

**Reversals.** A refund or adjustment writes new allocation rows with `reverses_allocation_id` set
to the original row and a negative `allocated_amount`, reproducing the original proportions exactly.
No fresh split is ever computed on a reversal (GUARDRAIL-F5, review finding C3).

#### ANCILLARY
```sql
CREATE TABLE ancillary (
  ancillary_id        TEXT        NOT NULL,      -- ULID
  tenant_id           TEXT        NOT NULL,
  booking_id          TEXT        NOT NULL,
  segment_id          TEXT        NOT NULL,
  traveler_id         TEXT        NOT NULL,      -- PII pointer
  product_code        TEXT        NOT NULL,      -- IATA SSR/service code
  emd_reference       TEXT,                      -- EMD or document reference
  status              TEXT        NOT NULL,      -- PENDING_ISSUE|ISSUED|VOIDED|REFUND_REQUESTED|REFUNDED
  total_amount        BIGINT      NOT NULL,      -- Integer minor units
  total_currency      TEXT        NOT NULL,
  is_refundable       BOOLEAN     NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, ancillary_id)
);

-- Ancillary tax breakdown (same rules as ticket taxes)
CREATE TABLE ancillary_tax (
  id              BIGSERIAL   PRIMARY KEY,
  tenant_id       TEXT        NOT NULL,
  ancillary_id    TEXT        NOT NULL,
  tax_code        TEXT        NOT NULL,
  amount          BIGINT      NOT NULL,
  currency        TEXT        NOT NULL,
  is_refundable   BOOLEAN     NOT NULL
);
```

#### POLICY_DECISION_SNAPSHOT (immutable once written — revised in v1.1)
```sql
CREATE TABLE policy_decision_snapshot (
  snapshot_id     TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  evaluated_at    TIMESTAMPTZ NOT NULL,
  outcome         TEXT        NOT NULL,          -- BLOCK|REQUIRE_APPROVAL|WARN|ALLOW
  matched_rules   JSONB       NOT NULL,          -- Array of {rule_id, rule_version, specificity, enforcement_level, rationale}
  rule_set_version TEXT       NOT NULL,          -- Version of the whole rule set at evaluation time
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, snapshot_id)
  -- No UPDATE or DELETE ever issued on this table
);
```

> **`override_reason` / `override_actor` removed (resolves review finding C1).** An override is
> decided *after* the snapshot is written, so populating those columns required an `UPDATE` on a
> table GUARDRAIL-D1 forbids updating — the document contradicted itself. Overrides are now their
> own append-only record.

#### POLICY_OVERRIDE (new in v1.1 — append-only)
```sql
CREATE TABLE policy_override (
  override_id     TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  snapshot_id     TEXT        NOT NULL,          -- The decision being overridden
  overridden_rule_id TEXT     NOT NULL,          -- Which matched rule is being overridden
  reason_code     TEXT        NOT NULL,          -- Mandatory, from a tenant-configured enum
  reason_text     TEXT,                          -- Optional free text
  actor_id        TEXT        NOT NULL,          -- PII pointer — who overrode
  actor_role      TEXT        NOT NULL,          -- TRAVELER|APPROVER|ADMIN
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, override_id),
  FOREIGN KEY (tenant_id, snapshot_id) REFERENCES policy_decision_snapshot(tenant_id, snapshot_id)
  -- No UPDATE or DELETE ever issued on this table
);
```

#### REFUND (new in v1.1 — the two-phase lifecycle needs an entity)
```sql
CREATE TABLE refund (
  refund_id           TEXT        NOT NULL,      -- ULID
  tenant_id           TEXT        NOT NULL,
  ticket_id           TEXT        NOT NULL,      -- OR ancillary_id (exclusive)
  ancillary_id        TEXT,
  status              TEXT        NOT NULL,      -- REQUESTED|CONFIRMED|REJECTED|FAILED
  refund_type         TEXT        NOT NULL,      -- VOID|FULL_REFUND  (PARTIAL_REFUND = Phase 2)
  gross_amount        BIGINT      NOT NULL,      -- Ticket document amount, minor units
  penalty_amount      BIGINT      NOT NULL,      -- From ticket.refund_penalty_amount
  non_refundable_amount BIGINT    NOT NULL,      -- Σ non-refundable taxes and fees
  refund_amount       BIGINT      NOT NULL,      -- gross − penalty − non_refundable
  currency            TEXT        NOT NULL,
  return_to           TEXT        NOT NULL,      -- ORIGINAL_FORM_OF_PAYMENT (only value in Phase 1)
  payment_reference   TEXT        NOT NULL,      -- Copied from booking — proves FOP round-trip
  requested_by        TEXT        NOT NULL,      -- PII pointer
  requested_at        TIMESTAMPTZ NOT NULL,
  confirmed_at        TIMESTAMPTZ,               -- Set only on settlement confirmation
  supplier_refund_ref TEXT,                      -- Supplier's refund/settlement reference
  PRIMARY KEY (tenant_id, refund_id),
  FOREIGN KEY (tenant_id, ticket_id) REFERENCES ticket(tenant_id, ticket_id)
);
```

> **Invariant (test-enforced):** `refund_amount = gross_amount − penalty_amount − non_refundable_amount`,
> and `refund_amount >= 0`. Ledger credit, allocation reversal, expense reversal and reporting fire
> on `CONFIRMED` only — never on `REQUESTED` (§5.3.2).

#### APPROVAL
```sql
CREATE TABLE approval (
  approval_id     TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  status          TEXT        NOT NULL,          -- NOT_REQUIRED|PENDING|APPROVED|REJECTED|EXPIRED
  approver_id     TEXT,                          -- PII pointer
  requested_at    TIMESTAMPTZ,
  decided_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, approval_id)
);
```

#### FINANCIAL_EVENT (reporting / audit — append-only, never update)
```sql
CREATE TABLE financial_event (
  event_id              TEXT        NOT NULL,    -- ULID
  tenant_id             TEXT        NOT NULL,    -- D1
  correlation_id        TEXT        NOT NULL,    -- Required by GUARDRAIL-A2 (was missing in v1.0)
  legal_entity          TEXT        NOT NULL,    -- D2
  traveler_id           TEXT        NOT NULL,    -- D3  PII pointer
  department            TEXT        NOT NULL,    -- D4
  cost_centre           TEXT        NOT NULL,    -- D5
  cost_object           TEXT        NOT NULL,    -- D6
  trip_purpose          TEXT        NOT NULL,    -- D7
  policy_outcome        TEXT        NOT NULL,    -- D8
  override_reason_code  TEXT,                    -- D9  nullable by design — see note
  supplier_code         TEXT        NOT NULL,    -- D10
  carrier_code          TEXT        NOT NULL,    -- D11
  market_origin         TEXT        NOT NULL,    -- D12
  market_destination    TEXT        NOT NULL,    -- D13
  cabin_class           TEXT        NOT NULL,    -- D14  Y|W|C|F
  fare_class            TEXT        NOT NULL,    -- D15
  booking_channel       TEXT        NOT NULL,    -- D16
  advance_purchase_days INTEGER     NOT NULL,    -- D17  Computed at booking time
  sale_currency         TEXT        NOT NULL,    -- D18
  settlement_currency   TEXT        NOT NULL,    -- D19
  reporting_currency    TEXT        NOT NULL,    -- D20
  booking_date          DATE        NOT NULL,    -- D21
  travel_date           DATE        NOT NULL,    -- D22
  -- Amounts: one per currency role, each explicitly denominated (resolves review finding S4)
  amount_sale           BIGINT      NOT NULL,    -- Minor units, in sale_currency
  amount_settlement     BIGINT      NOT NULL,    -- Minor units, in settlement_currency
  amount_reporting      BIGINT      NOT NULL,    -- Minor units, in reporting_currency
  fx_rate_sale_to_settlement NUMERIC(18,8) NOT NULL,
  fx_rate_sale_to_reporting  NUMERIC(18,8) NOT NULL,  -- Fixed per-period rate (ADR-006)
  fx_reporting_period   TEXT        NOT NULL,    -- e.g. 2026-09 — which period's rate was applied
  fx_rate_captured_at   TIMESTAMPTZ NOT NULL,
  -- Dimension provenance (see §2.3)
  dimension_source      TEXT        NOT NULL,    -- LIVE|CACHED
  dimension_snapshot_age_seconds INTEGER NOT NULL,
  event_type            TEXT        NOT NULL,    -- TICKET_ISSUED|VOID|REFUND_REQUESTED|REFUND_CONFIRMED|ANCILLARY_ISSUED|DEBIT_MEMO
  reference_id          TEXT        NOT NULL,    -- ticket_id, ancillary_id or refund_id
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, event_id)
);
```

> **21 reporting dimensions** (D1–D22 above, of which `override_reason_code` is the single
> deliberately nullable one — it is null precisely when no override occurred, and that null is
> itself the datum). v1.0 claimed "all 20 … are non-nullable" while listing 21 and leaving one
> nullable; corrected here (review finding C5).
>
> Dimensions are populated at booking confirmation from the Profile, Policy and Org Hierarchy
> sources, subject to the caching rules in §2.3, and are immutable once written.
>
> **`amount` was replaced by three explicitly denominated amounts.** v1.0 carried three currency
> columns and a single unlabelled `amount`, so no reader could tell which currency it was in.

---

### 5.3 Booking State Machines (new in v1.1)

**Three machines, not one.** Reservation state, ticket/financial state and approval state advance
independently and routinely disagree: a cancelled reservation with an unrefunded ticket is a normal
condition, not an error. A single status enum cannot express it (P11).

**Rules binding on all three machines**

1. No state change occurs without a corresponding row in `domain_event` and `outbox`, written in
   the same transaction as the state change.
2. Current state is a **projection of the event log**. The `status` column is a materialised
   convenience, never the authority.
3. An illegal transition raises `BOOKING_STATE_INVALID` (409). It is never silently ignored.
4. Every side effect is idempotent, carries an idempotency key, and has a declared compensation.
5. Any transition whose side effects partially applied lands in a `*_EXCEPTION` state and is routed
   to the ops queue. It never silently reverts to the prior state.

#### 5.3.1 Reservation state machine

```
   DRAFT ──▶ HELD ──▶ PENDING_ISSUE ──▶ CONFIRMED ──▶ COMPLETED
     │        │  │          │  │
     │        │  └──▶ EXPIRED  └──▶ CONFIRM_EXCEPTION
     │        │
     │        ▼
     └──▶ CANCELLED ◀── CONFIRMED (when all tickets VOIDED/REFUNDED)
                   ◀── PENDING_ISSUE (approval rejected or hold released)

   CONFIRM_EXCEPTION (ops queue — supplier issued ticket but platform write failed)
```

| Transition | Guard | Side effects | Compensation |
|---|---|---|---|
| `DRAFT → HELD` | Availability and price re-verified at supplier | Create PNR; write `supplier_mapping`; set `hold_expires_at`; schedule expiry | Release PNR |
| `HELD → PENDING_ISSUE` | Policy snapshot exists · approval `APPROVED` if required · payment instrument provisioned · `now() < hold_expires_at` · org dimensions resolvable (§2.3) | Place booking on host ticketing queue; set `status = PENDING_ISSUE`; write outbox event `BookingQueuedForTicketing` | Cancel queue entry via host if ticket number not yet received |
| `PENDING_ISSUE → CONFIRMED` | Ticket number received (via webhook §8.7 or reconciliation §8.8) · `ticket` + `coupon` rows written · financial legs and cost allocations expanded · `FinancialEventRecorded` emitted | Emit `BookingConfirmed` + `TicketIssued`; set `void_window_expires_at` from host confirmation | See `CONFIRM_EXCEPTION` |
| `PENDING_ISSUE → CONFIRM_EXCEPTION` | Ticket number received at supplier **but** a downstream write failed | Freeze booking; raise ops item with the supplier reference and the failed step | Manual: complete the ledger write, or void the ticket through the host |
| `HELD → EXPIRED` | `now() >= hold_expires_at` | Release supplier hold; deprovision virtual card; notify | — |
| `HELD → CANCELLED` | Traveler or approver cancels before queue placement | Release supplier hold | — |
| `PENDING_ISSUE → CANCELLED` | Approval rejected while booking is queued | Cancel queue entry via host; notify | — |
| `CONFIRMED → CANCELLED` | **All** tickets on the booking are `VOIDED` or `REFUNDED` | Cancel segments; reverse allocations; emit reporting event | — |
| `CONFIRMED → COMPLETED` | Last segment `departure_at` has passed | Close trip for reporting | — |

> **`PENDING_ISSUE` is a Phase 1 production state, not an edge case.** Under `TICKETING_QUEUE`
> (ADR-009 Model B) every booking passes through it. The reconciliation job (§8.8) is the
> guaranteed path for detecting issuance confirmations that arrive outside the webhook window.
> A booking left in `PENDING_ISSUE` beyond a configurable SLO (suggested: 30 minutes) should
> alert, because it indicates either a missed webhook or a failed queue entry.

#### 5.3.2 Ticket / financial state machine

```
   PENDING_ISSUE ──▶ ISSUED ──┬──▶ VOIDED
                              │
                              └──▶ REFUND_REQUESTED ──┬──▶ REFUNDED
                                                      └──▶ REFUND_REJECTED
   (EXCHANGED — Phase 2)
```

| Transition | Guard | Side effects |
|---|---|---|
| `PENDING_ISSUE → ISSUED` | Supplier confirms issuance; ticket number captured | Coupons created `OPEN`; `supplier_mapping` row; `TICKET_ISSUED` financial event |
| `ISSUED → VOIDED` | `now() < ticket.void_window_expires_at` **and** all coupons `OPEN` | Void at supplier; coupons → `VOIDED`; full ledger reversal; allocations reversed via `reverses_allocation_id` |
| `ISSUED → REFUND_REQUESTED` | Outside void window · `ticket.is_refundable` · **all coupons `OPEN`** (Phase 1) | Create `refund` row (`REQUESTED`); submit to supplier. **No ledger movement** |
| `REFUND_REQUESTED → REFUNDED` | Settlement confirms the refund | Coupons → `REFUNDED`; ledger credit; allocation reversal; expense reversal; `REFUND_CONFIRMED` event |
| `REFUND_REQUESTED → REFUND_REJECTED` | Supplier rejects | Refund row → `REJECTED`; notify; no ledger movement ever occurred |

> The `REQUESTED → CONFIRMED` split is the reason refunds are two-phase: ARC/BSP settlement is
> T+n, so money must not move in the ledger when the request is raised. Partially-used tickets
> (mixed coupon status) are rejected in Phase 1 with `REFUND_NOT_ELIGIBLE`.

#### 5.3.3 Approval state machine

```
   NOT_REQUIRED
   PENDING ──┬──▶ APPROVED
             ├──▶ REJECTED
             └──▶ EXPIRED
```

| Transition | Guard | Side effects |
|---|---|---|
| `→ PENDING` | Policy outcome `REQUIRE_APPROVAL` | Resolve approver from org hierarchy and **snapshot** it; set `expires_at`; `ApprovalRequested` |
| `PENDING → APPROVED` | Actor holds `APPROVER` role for this tenant and booking | Unblock confirm; write `policy_override` if a rule was overridden |
| `PENDING → REJECTED` | Same | Booking → `CANCELLED`; release hold |
| `PENDING → EXPIRED` | `now() >= expires_at` | Booking → `EXPIRED`; release hold; notify. **Never auto-approve** |

> Approval actions are idempotent — approvers click emailed links more than once. Repeating a
> decision returns the original result rather than re-deciding.

### 5.4 Outbox, Idempotency and Reconciliation Stores (new in v1.1)

#### OUTBOX
```sql
CREATE TABLE outbox (
  outbox_id       BIGSERIAL   PRIMARY KEY,
  tenant_id       TEXT        NOT NULL,
  correlation_id  TEXT        NOT NULL,
  aggregate_type  TEXT        NOT NULL,          -- Booking|Ticket|Refund|Approval
  aggregate_id    TEXT        NOT NULL,
  event_type      TEXT        NOT NULL,
  event_version   TEXT        NOT NULL,
  payload         JSONB       NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at   TIMESTAMPTZ,                   -- NULL = not yet dispatched
  attempt_count   INTEGER     NOT NULL DEFAULT 0,
  last_error      TEXT
);
CREATE INDEX ON outbox (dispatched_at) WHERE dispatched_at IS NULL;
```

The dispatcher polls undispatched rows under a Postgres advisory lock, delivers in `outbox_id`
order per aggregate, and marks `dispatched_at`. Delivery is at-least-once, so **every consumer is
idempotent on `event_id`**. Rows exceeding the retry budget move to a DLQ table and alert.

#### IDEMPOTENCY_RECORD (moved from Redis — ADR-011)
```sql
CREATE TABLE idempotency_record (
  idempotency_key TEXT        NOT NULL,
  tenant_id       TEXT        NOT NULL,
  scope           TEXT        NOT NULL,          -- API endpoint or supplier call type
  supplier_code   TEXT,
  request_hash    TEXT        NOT NULL,          -- Detects key reuse with a different payload
  status          TEXT        NOT NULL,          -- PENDING|COMPLETE|FAILED
  response_body   JSONB,                         -- Replayed verbatim on retry
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, idempotency_key, scope)
);
```

> Redis remains a read-through cache in front of this table. It is never the authority: an evicted
> or lost key would mean a second ticket issued against the same request.

#### SUPPLIER_RECONCILIATION_EXCEPTION (see §8.8)
```sql
CREATE TABLE supplier_reconciliation_exception (
  exception_id    TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT,
  ticket_id       TEXT,
  supplier_code   TEXT        NOT NULL,
  exception_type  TEXT        NOT NULL,          -- MISSING_LOCALLY|MISSING_AT_SUPPLIER|STATUS_DRIFT|AMOUNT_DRIFT|ORPHAN_TICKET
  platform_state  JSONB       NOT NULL,
  supplier_state  JSONB       NOT NULL,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  resolution      TEXT,                          -- Free text + actor
  PRIMARY KEY (tenant_id, exception_id)
);
```

---

## 6. API CONTRACTS

All APIs follow these conventions:
- Base URL: `https://api.travelplatform.io`
- Versioning: URI path prefix `/v1/`
- Auth: Bearer token (JWT, tenant-scoped, from Auth0/Cognito)
- Correlation: `X-Correlation-ID` header required on all requests; generated by API Gateway if absent
- Idempotency: `Idempotency-Key` header required on all mutating requests
- Errors: RFC 7807 Problem Details (`application/problem+json`)
- Amounts: always integer minor units + ISO 4217 currency code
- Dates/times: ISO 8601 UTC

> **Phase 1 currency.** Phase 1 transacts in **USD only**. The three-currency structure
> (sale / settlement / reporting) is present in the schema and contracts from day one because
> retrofitting it is prohibitively expensive, but every Phase 1 example below is USD in all three
> roles. v1.0's `BookingConfirmed` sample used `reporting_currency: GBP`, contradicting the scope —
> corrected in §7.3 (review finding C7).

### 6.1 Search — Shop Availability

```
POST /v1/search/availability
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "origin": "LHR",
  "destination": "JFK",
  "departure_date": "2026-10-15",
  "return_date": "2026-10-22",
  "passengers": [
    { "type": "ADT", "traveler_id": "tvl_01J..." }
  ],
  "cabin_class": "Y"
}
```

**Response 200:**
```json
{
  "search_id": "srch_01J...",
  "offers": [
    {
      "offer_id": "offer_01J...",
      "supplier_code": "SABRE",
      "itinerary": {
        "segments": [
          {
            "origin": "LHR",
            "destination": "JFK",
            "carrier_code": "BA",
            "flight_number": "BA177",
            "departure_at": "2026-10-15T10:30:00Z",
            "arrival_at": "2026-10-15T13:15:00Z",
            "cabin_class": "Y",
            "fare_class": "Q",
            "fare_basis": "QOWUS"
          }
        ]
      },
      "pricing": {
        "base_fare": { "amount": 32000, "currency": "USD" },
        "taxes": [
          { "tax_code": "US", "amount": 3750, "currency": "USD", "is_refundable": true },
          { "tax_code": "AY", "amount": 560, "currency": "USD", "is_refundable": false }
        ],
        "fees": [],
        "total": { "amount": 36310, "currency": "USD" }
      },
      "fare_rules": {
        "is_refundable": true,
        "refund_penalty": { "amount": 7940, "currency": "USD" },
        "change_penalty": { "amount": 20000, "currency": "USD" }
      },
      "expires_at": "2026-10-14T08:00:00Z"
    }
  ]
}
```

---

### 6.2 Create Booking (Hold)

```
POST /v1/bookings
Headers: Idempotency-Key: <client-generated-uuid>
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "trip_id": "trip_01J...",
  "offer_id": "offer_01J...",
  "passengers": [
    {
      "traveler_id": "tvl_01J...",
      "passenger_type": "ADT"
    }
  ],
  "contact": {
    "email_ref": "email_ptr_01J..."
  }
}
```

**Response 201:**
```json
{
  "booking_id": "bkg_01J...",
  "trip_id": "trip_01J...",
  "status": "HELD",
  "correlation_id": "01J7KQZM...",
  "passengers": [
    { "passenger_id": "pax_01J...", "traveler_id": "tvl_01J...", "passenger_type": "ADT" }
  ],
  "supplier_references": [
    {
      "supplier_code": "SABRE",
      "reference_type": "GDS_LOCATOR",
      "reference_value": "XKQPJL",
      "valid_from": "2026-09-04T10:30:00Z"
    }
  ],
  "policy_decision": {
    "outcome": "WARN",
    "warnings": [
      { "rule_id": "rule_cost_cap_01", "message": "Booking exceeds preferred fare by 15%" }
    ]
  },
  "approval": {
    "status": "NOT_REQUIRED"
  },
  "hold_expires_at": "2026-09-04T22:30:00Z",
  "created_at": "2026-09-04T10:30:00Z"
}
```

---

### 6.3 Confirm Booking (Issue Ticket)

```
POST /v1/bookings/{booking_id}/confirm
Headers: Idempotency-Key: <client-generated-uuid>
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "payment_reference": "lodge_card_ref_01J...",
  "payment_instrument_type": "LODGE_CARD",
  "cost_allocations": [
    {
      "passenger_id": "pax_01J...",
      "splits": [
        {
          "cost_object": "WBS-2026-PROJ-042",
          "cost_object_type": "WBS",
          "split_basis": "PERCENTAGE",
          "split_value": 100,
          "priority": 1
        }
      ]
    }
  ]
}
```

> Allocations are **declared per passenger** and expanded server-side across every financial leg of
> that passenger's ticket (§5.2, COST_ALLOCATION). `passenger_id` replaces v1.0's `traveler_id`
> because the attribution unit is passenger × ticket, and one traveler can appear on more than one
> booking. Splits must total 100% (or exactly the ticket amount for `FIXED_AMOUNT`); otherwise
> `INVARIANT_VIOLATED` (422).

**Response 200:**
```json
{
  "booking_id": "bkg_01J...",
  "status": "CONFIRMED",
  "tickets": [
    {
      "ticket_id": "tkt_01J...",
      "passenger_id": "pax_01J...",
      "traveler_id": "tvl_01J...",
      "status": "ISSUED",
      "supplier_references": [
        {
          "reference_type": "TICKET_NUMBER",
          "reference_value": "0012345678901"
        }
      ],
      "coupons": [
        { "coupon_number": 1, "segment_id": "seg_01J...", "status": "OPEN" },
        { "coupon_number": 2, "segment_id": "seg_02K...", "status": "OPEN" }
      ],
      "void_window_expires_at": "2026-09-04T23:59:59Z",
      "total": { "amount": 36310, "currency": "USD" }
    }
  ],
  "policy_decision_snapshot_id": "pds_01J...",
  "confirmed_at": "2026-09-04T10:35:00Z"
}
```

**Response 409 — `CONFIRM_EXCEPTION`.** If the supplier issued the ticket but a downstream write
failed, the booking moves to `CONFIRM_EXCEPTION` (§5.3.1) and the response carries the supplier
reference so the condition is actionable rather than invisible:

```json
{
  "type": "https://api.travelplatform.io/errors/confirm-exception",
  "title": "Confirmation Partially Applied",
  "status": 409,
  "detail": "Ticket issued at supplier; ledger write failed. Booking frozen and queued for operations.",
  "error_code": "CONFIRM_EXCEPTION",
  "correlation_id": "01J7KQZM...",
  "retry_eligible": false,
  "supplier_references": [
    { "reference_type": "TICKET_NUMBER", "reference_value": "0012345678901" }
  ],
  "exception_id": "exc_01J..."
}
```

---

### 6.4 Cancel Booking

```
POST /v1/bookings/{booking_id}/cancel
Headers: Idempotency-Key: <client-generated-uuid>
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "reason": "TRAVELER_REQUEST",
  "requested_by": "tvl_01J..."
}
```

**Response 200:**
```json
{
  "booking_id": "bkg_01J...",
  "status": "CANCELLED",
  "refund_eligibility": {
    "within_void_window": false,
    "void_window_expired_at": "2026-09-04T23:59:59Z",
    "all_coupons_open": true,
    "gross_amount":          { "amount": 36310, "currency": "USD" },
    "penalty_amount":        { "amount":  7940, "currency": "USD" },
    "non_refundable_amount": { "amount":   560, "currency": "USD" },
    "refundable_amount":     { "amount": 27810, "currency": "USD" },
    "tax_breakdown": [
      { "tax_code": "US", "amount": 3750, "is_refundable": true },
      { "tax_code": "AY", "amount":  560, "is_refundable": false }
    ]
  },
  "cancelled_at": "2026-09-04T18:00:00Z"
}
```

> **The arithmetic is now stated and reconciles** (review finding S2). `36310 − 7940 − 560 = 27810`.
> v1.0 showed a `non_refundable_amount` of 8500 that no field on the response explained, because
> the penalty was never persisted or exposed. `penalty_amount` comes from
> `ticket.refund_penalty_amount`, `non_refundable_amount` is the sum of taxes and fees with
> `is_refundable = false`, and `all_coupons_open` is the Phase 1 eligibility guard from §5.3.2.

---

### 6.5 Request Refund

```
POST /v1/refunds
Headers: Idempotency-Key: <client-generated-uuid>
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "ticket_id": "tkt_01J...",
  "requested_by": "tvl_01J..."
}
```

**Response 201:**
```json
{
  "refund_id": "rfnd_01J...",
  "ticket_id": "tkt_01J...",
  "status": "REQUESTED",
  "refund_type": "FULL_REFUND",
  "gross_amount":          { "amount": 36310, "currency": "USD" },
  "penalty_amount":        { "amount":  7940, "currency": "USD" },
  "non_refundable_amount": { "amount":   560, "currency": "USD" },
  "refund_amount":         { "amount": 27810, "currency": "USD" },
  "return_to": "ORIGINAL_FORM_OF_PAYMENT",
  "payment_reference": "lodge_card_ref_01J...",
  "created_at": "2026-09-04T18:05:00Z"
}
```

> **No money moves here.** `REQUESTED` writes no ledger entry and reverses no allocation; both
> happen only on `RefundConfirmed` when settlement confirms (§5.3.2). The refund status vocabulary
> is `REQUESTED|CONFIRMED|REJECTED|FAILED` on the `refund` entity — v1.0 returned
> `REFUND_REQUESTED`, which is the *ticket* status, conflating two machines.

---

### 6.6 Get Trip

```
GET /v1/trips/{trip_id}?tenant_id={tenant_id}
```

**Response 200:**
```json
{
  "trip_id": "trip_01J...",
  "tenant_id": "tenant_abc",
  "traveler_id": "tvl_01J...",
  "purpose": "CLIENT_MEETING",
  "date_window": { "start": "2026-10-15", "end": "2026-10-22" },
  "bookings": [
    {
      "booking_id": "bkg_01J...",
      "status": "CONFIRMED",
      "segments": [
        {
          "segment_id": "seg_01J...",
          "product_type": "AIR",
          "origin": "LHR",
          "destination": "JFK",
          "departure_at": "2026-10-15T10:30:00Z",
          "arrival_at": "2026-10-15T13:15:00Z"
        }
      ]
    }
  ]
}
```

---

### 6.7 Policy Evaluation

```
POST /v1/policy/evaluate
```

**Request:**
```json
{
  "tenant_id": "tenant_abc",
  "traveler_id": "tvl_01J...",
  "booking_context": {
    "offer_id": "offer_01J...",
    "total_amount": { "amount": 36310, "currency": "USD" },
    "cabin_class": "Y",
    "advance_purchase_days": 41,
    "supplier_code": "SABRE",
    "route": "LHR-JFK"
  }
}
```

**Response 200:**
```json
{
  "outcome": "WARN",
  "rule_set_version": "2026.09.1",
  "matched_rules": [
    {
      "rule_id": "rule_cost_cap_01",
      "rule_version": "1.2.0",
      "scope_level": "DEPARTMENT",
      "specificity": 3,
      "enforcement_level": "WARN",
      "rationale": "Total fare USD 363.10 exceeds preferred cap of USD 315.00 by 15%"
    }
  ],
  "requires_approval": false,
  "blocking_rules": [],
  "evaluated_at": "2026-09-04T10:29:58Z"
}
```

> `scope_level` and `specificity` are new in v1.1. §9.1 states that outcome ties break by scope
> specificity, but v1.0's rule schema carried no specificity ranking, so the documented resolution
> was not implementable (review finding M6). The ranking is defined in §9.2.

---

## 7. EVENT CATALOG

All events are written to the **transactional outbox** in the same database transaction as the state
change that produced them, then delivered by the dispatcher (§5.4). Schema format: JSON validated
against JSON Schema in Phase 1; Avro + schema registry when Kafka is introduced in Phase 2.

**Delivery semantics — binding on every consumer:**

- **At-least-once.** Every consumer must be idempotent on `event_id`.
- **Ordered per aggregate**, not globally. Ordering is guaranteed only within one `aggregate_id`.
- **Version-aware.** A consumer must compare `occurred_at` / aggregate version against the state it
  already holds and **discard events older than what it has already applied**. Out-of-order and
  duplicate delivery are normal, not faults.
- Poison messages move to the DLQ table after the retry budget, and alert.

### 7.1 Event Conventions

```json
{
  "event_id": "evt_01J...",           // ULID
  "event_type": "BookingCreated",     // PascalCase
  "event_version": "1.0",
  "occurred_at": "2026-09-04T10:30:00Z",
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "aggregate_type": "Booking",
  "aggregate_id": "bkg_01J...",
  "payload": { ... }
}
```

### 7.2 Event Definitions

Channel names are logical. In Phase 1 they are the `event_type` grouping on the outbox; in Phase 2
they become Kafka topics unchanged.

| Event | Channel | Producer | Consumers | Trigger |
|-------|---------|----------|-----------|---------|
| `BookingCreated` | `travel.bookings` | Experience | Data, Policy, Notification | Booking record created (DRAFT) |
| `BookingHeld` | `travel.bookings` | Experience | Data, Payment, Notification | GDS hold confirmed (HELD) |
| `BookingQueuedForTicketing` | `travel.bookings` | Experience | Data, Notification | Booking placed on host ticketing queue (PENDING_ISSUE). ADR-009 Model B |
| `PolicyDecisionRecorded` | `travel.policy` | Policy | Data, Notification | Policy evaluated at booking time |
| `PolicyOverrideRecorded` | `travel.policy` | Policy | Data, Reporting, Notification | Override written — reason code mandatory (§9.5) |
| `ApprovalRequested` | `travel.approvals` | Experience | Notification, Approval | Policy outcome = REQUIRE_APPROVAL |
| `ApprovalDecided` | `travel.approvals` | Approval | Experience, Notification | Approver APPROVED/REJECTED/EXPIRED |
| `BookingConfirmed` | `travel.bookings` | Experience | Data, Payment, Reporting | Ticket issued (CONFIRMED) |
| `TicketIssued` | `travel.tickets` | Experience | Data, Payment, Reporting | GDS ticket issued (ISSUED) |
| `CouponStatusChanged` | `travel.tickets` | Servicing | Data, Payment, Reporting | Coupon used, voided, refunded or exchanged |
| `FinancialEventRecorded` | `travel.financial` | Payment | Reporting, ERP Posting | Ticket issued, all 21 dimensions stamped |
| `BookingCancelled` | `travel.bookings` | Servicing | Data, Payment, Notification | Booking cancelled |
| `TicketVoided` | `travel.tickets` | Servicing | Data, Payment, Notification | Void within ARC same-day window |
| `RefundRequested` | `travel.refunds` | Servicing | Data, Notification | Refund requested outside void window. **No ledger movement** |
| `RefundConfirmed` | `travel.refunds` | Payment | Data, Expense Reversal, Reporting, Notification | Settlement confirms — ledger and allocations move here |
| `RefundRejected` | `travel.refunds` | Servicing | Data, Notification | Supplier rejected the refund |
| `BookingExpired` | `travel.bookings` | Scheduler | Data, Notification, GDS Release | Hold or approval timer expired |
| `ConfirmExceptionRaised` | `travel.exceptions` | Experience | Servicing (ops queue), Notification, Alerting | Ticket issued but a downstream write failed (§5.3.1) |
| `ReconciliationExceptionRaised` | `travel.exceptions` | Content (reconciler) | Servicing (ops queue), Alerting | Drift detected between platform and supplier (§8.8) |
| `SupplierWebhookReceived` | `travel.supplier-events` | Content (webhook consumer) | Experience, Servicing | Async GDS push notification |
| `CostAllocationRecorded` | `travel.allocation` | Payment | Reporting, ERP Posting | Cost allocation written at confirm |

### 7.3 Key Event Payloads

#### BookingConfirmed (financial dimensions stamped here)
```json
{
  "booking_id": "bkg_01J...",
  "trip_id": "trip_01J...",
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "legal_entity": "ACME_CORP_US",
  "traveler_id": "tvl_01J...",
  "department": "ENGINEERING",
  "cost_centre": "CC-ENG-042",
  "cost_object": "WBS-2026-PROJ-042",
  "trip_purpose": "CLIENT_MEETING",
  "policy_outcome": "WARN",
  "override_reason_code": null,
  "supplier_code": "SABRE",
  "carrier_code": "BA",
  "market_origin": "LHR",
  "market_destination": "JFK",
  "cabin_class": "Y",
  "fare_class": "Q",
  "booking_channel": "WEB",
  "advance_purchase_days": 41,
  "sale_currency": "USD",
  "settlement_currency": "USD",
  "reporting_currency": "USD",
  "amount_sale": 36310,
  "amount_settlement": 36310,
  "amount_reporting": 36310,
  "fx_rate_sale_to_settlement": 1.00000000,
  "fx_rate_sale_to_reporting": 1.00000000,
  "fx_reporting_period": "2026-09",
  "fx_rate_captured_at": "2026-09-04T10:35:00Z",
  "dimension_source": "LIVE",
  "dimension_snapshot_age_seconds": 0,
  "booking_date": "2026-09-04",
  "travel_date": "2026-10-15",
  "tickets": ["tkt_01J..."]
}
```

> All three currency roles are USD in Phase 1 and the FX rates are therefore 1.0 — but the fields
> are present and populated from the first release, because a consumer written against an implicit
> single currency is a consumer that has to be rewritten when the second currency arrives.

#### ConfirmExceptionRaised (new in v1.1)
```json
{
  "booking_id": "bkg_01J...",
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "exception_id": "exc_01J...",
  "failed_step": "LEDGER_WRITE",
  "supplier_state": {
    "supplier_code": "SABRE",
    "ticket_number": "0012345678901",
    "issued_at": "2026-09-04T10:35:02Z"
  },
  "platform_state": { "booking_status": "CONFIRM_EXCEPTION", "ticket_persisted": false },
  "compensation_options": ["COMPLETE_LEDGER_WRITE", "VOID_TICKET"],
  "raised_at": "2026-09-04T10:35:04Z"
}
```

#### RefundConfirmed
```json
{
  "refund_id": "rfnd_01J...",
  "ticket_id": "tkt_01J...",
  "booking_id": "bkg_01J...",
  "tenant_id": "tenant_abc",
  "correlation_id": "01J7KQZM...",
  "refund_amount": 27810,
  "currency": "USD",
  "return_to": "ORIGINAL_FORM_OF_PAYMENT",
  "payment_reference": "lodge_card_ref_01J...",
  "supplier_refund_ref": "RFD-8891422",
  "reversed_allocations": [
    {
      "reverses_allocation_id": "alloc_01J...",
      "cost_object": "WBS-2026-PROJ-042",
      "reversed_amount": -27810
    }
  ],
  "confirmed_at": "2026-09-05T09:00:00Z"
}
```

> Reversal rows carry `reverses_allocation_id` and a negative amount, reproducing the original
> proportions exactly rather than computing a new split (GUARDRAIL-F5).

---

## 8. GDS ADAPTER PATTERN

### 8.1 Architecture

```
Experience Service
      │
      ▼
┌─────────────────────────────┐
│     GdsAdapterFactory       │
│  route by tenant config     │
│  or geography               │
└──────────┬──────────────────┘
           │
    ┌──────┴──────────────────┐
    │                         ┆  (Phase 2 — same interface,
    ▼                         ┆   no core changes required)
┌────────┐              ┌ ─ ─ ─ ─ ┐
│ Sabre  │                Amadeus
│Adapter │  ◀ Phase 1 ▶  │Adapter  │
└───┬────┘              └ ─ ─ ─ ─ ┘
    │
    ▼
Sabre Dev Studio
REST API
```

**Phase 1 runs exactly one adapter.** The factory, the capability matrix and the routing mechanism
are built as designed — they are what make Phase 2's second adapter cheap — but only Sabre is
implemented, contracted and certified. Rationale in ADR-008.

### 8.2 GdsAdapter Interface Contract

```typescript
interface GdsAdapter {
  // Shop availability
  searchAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse>;

  // Create booking hold
  createHold(request: HoldRequest): Promise<HoldResponse>;

  // Issue ticket (confirm booking)
  issueTicket(request: IssueRequest): Promise<IssueResponse>;

  // Cancel / void / refund
  cancelBooking(request: CancelRequest): Promise<CancelResponse>;
  voidTicket(request: VoidRequest): Promise<VoidResponse>;
  refundTicket(request: RefundRequest): Promise<RefundResponse>;

  // Retrieve existing booking — also the reconciliation read path (§8.8)
  retrieveBooking(request: RetrieveRequest): Promise<RetrieveResponse>;

  // Phase 2 — declared now, unsupported in the Phase 1 capability matrix
  exchangeTicket?(request: ExchangeRequest): Promise<ExchangeResponse>;

  // Supplier identity
  getSupplierCode(): string;          // "SABRE" in Phase 1
  getCapabilityMatrix(): CapabilityMatrix;
}

interface CapabilityMatrix {
  supports: {
    search: boolean; hold: boolean; issue: boolean;
    void: boolean; refund: boolean; exchange: boolean;
    ancillaries: boolean; webhooks: boolean;
  };
  issuanceModel: "DIRECT_API" | "TICKETING_QUEUE";  // See §8.3
  voidWindowHours: number;
  maxCouponsPerDocument: number;
  supportedProductTypes: Array<"AIR" | "HOTEL" | "CAR" | "RAIL">;
}
```

> **The orchestration layer reads the capability matrix and degrades explicitly.** A verb the
> adapter does not declare returns `GDS_CAPABILITY_UNSUPPORTED` (422) before any call is attempted —
> it never fails at the supplier boundary with an opaque error.

### 8.3 Ticketing Authority and Accreditation — **Model B: Host Agency (DECIDED)**

**Decision recorded 2026-09-10.** Model B — host agency / accredited partner as agent of record.

**What this means for Phase 1:**

| Aspect | Detail |
|--------|--------|
| Agent of record | Host partner holds ARC accreditation; TravelPlatform books into their Sabre office ID (PCC) |
| Sabre contract | With the host partner, not TravelPlatform directly |
| Host PCC | Stored in AWS Secrets Manager; never a domain identifier in the data model |
| Issuance model | `TICKETING_QUEUE` — booking placed on host's queue; ticket number arrives asynchronously |
| Ticket confirmation path | Webhook (§8.7) or reconciliation (§8.8) — **not** synchronous response to the queue call |
| Void window | Set by host's ticketing rules; received in the issuance confirmation message or reconciliation response and persisted to `ticket.void_window_expires_at` |
| ARC debit memos (ADMs) | Host's responsibility in Phase 1; TravelPlatform receives ADM notifications as informational events only |
| Per-transaction cost | Commercial terms agreed with the host partner (not an architecture concern) |
| Servicing constraints | Involuntary changes, exchanges, and ADM contestation coordinated through host's agent desk in Phase 1 |

**Booking state path under TICKETING_QUEUE:**

```
DRAFT → HELD → PENDING_ISSUE → CONFIRMED → COMPLETED
              ↘ EXPIRED           ↑
              ↘ CANCELLED    (ticket number received via
                              webhook §8.7 or reconciliation §8.8)
```

> `PENDING_ISSUE` is the state between placing the booking on the ticketing queue and receiving
> the ticket number. `BookingConfirmed` and `TicketIssued` events are emitted **only** when the
> ticket number is received and persisted — never at queue placement. The reconciliation job (§8.8)
> is therefore a critical operational dependency in Phase 1: it is the guaranteed path for
> detecting issuance confirmations that arrive outside the webhook window.

**`CONFIRM_EXCEPTION` still applies.** If the booking is in `PENDING_ISSUE` and a downstream
write fails after the ticket number arrives, the same `CONFIRM_EXCEPTION` path (§5.3.1, ADR-012)
applies. The supplier has issued; the platform must not simply drop the state.

**Model A (own ARC accreditation) is not closed.** It is deferred. If Phase 2 volume, servicing
requirements or debit memo exposure justify the lead time and cost, own accreditation can be
pursued independently of the platform architecture — the `GdsAdapter` interface and the
`issuanceModel` field on the capability matrix are already designed to accommodate `DIRECT_API`
without changes outside the Sabre adapter.

**Two viable models (for reference):**

| Model | What it means | Chosen for Phase 1? |
|-------|--------------|---------------------|
| **A — Own ARC accreditation** | TravelPlatform holds ARC agency accreditation, own PCC, settles directly through ARC. Full control; longest lead time | No — deferred to Phase 2+ |
| **B — Host agency** | Accredited partner is agent of record; TravelPlatform books into their PCC; ADMs go to the host | **Yes — Phase 1** |

### 8.4 Sabre Adapter (Phase 1 — the only implemented adapter)

| Aspect | Detail |
|--------|--------|
| API | Sabre Dev Studio REST APIs |
| Auth | REST Token (ATH) flow: `POST /v2/auth/token` with base64 credentials |
| Token TTL | Refresh proactively; never rely on a cached token surviving a call |
| Credentials | Office ID / PCC determined by the ADR-009 accreditation decision; from Secrets Manager |
| Availability | Bargain Finder Max shopping endpoint |
| Hold (PNR) | Passenger record creation; record locator captured into `supplier_mapping` |
| Issue | Per `issuanceModel` — see §8.3. Ticket numbers and coupon count captured into `ticket` + `coupon` |
| Void | Same-day void endpoint; `void_window_expires_at` captured from the carrier/ARC rule at issue |
| Refund | Refund request endpoint; returns a supplier refund reference, **not** a settled refund |
| Cancel | Passenger record cancellation |
| Retrieve | Passenger record retrieval — also the read path used by reconciliation (§8.8) |
| Error mapping | HTTP + Sabre structured errors → canonical `GdsAdapterException` with `error_code`, `retry_eligible` |
| Rate limits | Per-credential budget; exponential backoff with jitter; circuit breaker per §15.4 |
| Idempotency | Durable key written to PostgreSQL **before** the call (§8.6, ADR-011) |

> Exact endpoint paths and payload shapes are confirmed against the Sabre sandbox during the
> Sprint 1 adapter spike and recorded in the adapter's own API reference, not restated here — v1.0
> pinned specific paths for both GDSs ahead of any sandbox verification, which is how documented
> endpoints drift from real ones.

### 8.5 Normalization Layer

All GDS responses are normalized to the platform canonical model before leaving the Content domain:

```
GDS Response (supplier-native JSON)
    │
    ▼
GdsResponseNormalizer
    │  Maps:
    │  - Supplier-specific fare breakdown → platform Pricing model
    │  - Supplier segment fields → platform Segment envelope
    │  - Supplier tax codes → IATA tax code breakdown
    │  - Supplier error codes → canonical error taxonomy
    ▼
Platform Canonical Models
(AvailabilityResponse, HoldResponse, IssueResponse, ...)
```

### 8.6 Idempotency & Retry Strategy

```
Outbound supplier call:
1. Generate idempotency_key = ULID
2. Write {idempotency_key, tenant_id, scope, supplier_code, request_hash, status=PENDING}
   to the DURABLE store — PostgreSQL idempotency_record — and COMMIT before the call
3. Issue supplier call
4. On success: status=COMPLETE, persist response_body in the same transaction as the state change
5. On failure:
   a. Supplier 4xx (non-retryable): status=FAILED, surface to caller
   b. Timeout / 5xx (retryable): exponential backoff with jitter, max 3 retries — SAME key
   c. Still failing after retries: status=FAILED, alert, and if the call may have partially
      applied at the supplier, raise a reconciliation exception (§8.8)
6. On retry of the same idempotency_key:
   a. status=COMPLETE  → return the stored response verbatim; do NOT call the supplier
   b. status=PENDING   → the previous attempt's outcome is unknown. Do NOT re-issue.
                         Query the supplier by correlation/reference and reconcile
   c. request_hash differs from the stored one → 409 CONFLICT_DUPLICATE (key reuse)
```

> **Step 2 is the correctness-critical change in v1.1 (ADR-011).** v1.0 placed this store in Redis.
> A key lost to eviction, failover or a cold cache means the retry path re-issues a ticket that was
> already issued — real money, twice, with no record connecting the two. Redis remains a
> read-through cache in front of the table; it is never the system of record.
>
> Step 6b matters as much: a `PENDING` record means *we do not know* whether the supplier acted.
> Treating unknown as "safe to retry" is exactly how duplicate tickets get issued.

### 8.7 Webhook Consumer

Async GDS notifications (supplier push updates):

```
GDS → POST /webhooks/gds-events   (HMAC-SHA256 signature + timestamp)
    │
    ▼
WebhookIngestionService
    │  1. Validate HMAC signature AND reject if the signed timestamp is
    │     outside a ±5 minute replay window
    │  2. Deduplicate on supplier message_id (durable, PostgreSQL)
    │  3. Persist the raw payload to S3 (audit) and enqueue — NEVER mutate
    │     spine state directly from the HTTP handler
    │  4. Write SupplierWebhookReceived to the outbox; return 200 immediately
    ▼
Experience / Servicing consumers
    │  5. Version check: compare the supplier sequence / event timestamp against
    │     the state already held. DISCARD anything older than what is applied
    │  6. Apply, idempotently, keyed on message_id
    ▼
DLQ after the retry budget → alert → ops queue
```

**Four constraints, binding (resolves review finding M3):**

1. **Signature + replay window.** HMAC-SHA256 over the raw body with a per-supplier shared secret
   from Secrets Manager, plus a signed timestamp checked against a ±5 minute window. Unsigned or
   stale requests are rejected without processing.
2. **At-least-once → idempotent consumers.** Deduplication on supplier `message_id` in PostgreSQL,
   not in memory and not in Redis.
3. **Out-of-order delivery is normal.** Consumers are version-aware and must never overwrite newer
   state with an older event. This was missing in v1.0 and is the failure mode that silently
   resurrects cancelled bookings.
4. **Webhooks will be missed.** They are an optimisation, never the only path. §8.8 reconciliation
   is the guaranteed path, and the system must remain correct if every webhook is dropped.

Event types handled:
- Ticket issuance confirmation (required when `issuanceModel = TICKETING_QUEUE`)
- Booking cancellation by supplier
- Schedule change / disruption notification
- Price change on held booking
- Refund settlement confirmation → drives `REFUND_REQUESTED → REFUNDED` (§5.3.2)

### 8.8 Supplier Reconciliation — drift detection (new in v1.1)

> **Absent from v1.0 entirely (review finding M2).** Webhooks are missed, calls time out after
> succeeding, and agents make offline changes directly in the GDS. Drift between platform state and
> supplier state is certain, not hypothetical — this job is what makes it visible (P12).

**Schedule.** Every 15 minutes for bookings with activity in the last 48 hours; nightly full sweep
across all active bookings and all tickets issued in the last 90 days.

**Method.** For each in-scope booking, call `retrieveBooking` on the adapter and compare:

| Check | Exception type | Typical cause |
|-------|---------------|---------------|
| Booking exists locally but not at supplier | `MISSING_AT_SUPPLIER` | Cancelled offline; hold silently expired |
| Ticket exists at supplier with no local record | `ORPHAN_TICKET` | Issuance succeeded after our timeout — **the double-issue precursor** |
| Reservation status differs | `STATUS_DRIFT` | Missed webhook; supplier-initiated change |
| Ticket / coupon status differs | `STATUS_DRIFT` | Flown, voided or refunded outside the platform |
| Amounts or taxes differ | `AMOUNT_DRIFT` | Reprice, involuntary reissue, ADM precursor |
| Local record with no supplier reference at all | `MISSING_LOCALLY` | Failed write after a successful call |

**Output.** Each difference writes a `supplier_reconciliation_exception` row (§5.4) and emits
`ReconciliationExceptionRaised`. **The job never auto-corrects financial state** — it raises an
exception for a human, because a wrong automated correction against real tickets is worse than a
queued one. Non-financial drift (segment times, seat assignments) may be auto-applied.

**Metric and alert.** `reconciliation.exception.count` by type; any `ORPHAN_TICKET` alerts
immediately — it means a ticket exists that the ledger does not know about.

---

## 9. POLICY EVALUATOR DESIGN

### 9.1 Architecture

```
Booking Request
      │
      ▼
PolicyEvaluatorService
      │
      ├── Load active rules for tenant (from Rule Store — versioned YAML/JSON)
      │
      ├── Evaluate each rule against booking context
      │   Rules: cost_caps, traveler_eligibility, supplier_restrictions, compliance_checks, approver_routing
      │
      ├── Conflict resolution:
      │   BLOCK > REQUIRE_APPROVAL > WARN > ALLOW
      │   Ties broken by scope specificity
      │
      ├── Build PolicyDecision:
      │   { outcome, matched_rules[], blocking_rules[], warnings[], requires_approval }
      │
      └── Return to caller (synchronous, request-scoped in Phase 1)

Post-booking:
      ├── Snapshot PolicyDecision onto booking (immutable)
      └── Publish PolicyDecisionRecorded event
```

### 9.2 Rule Schema (YAML — authored as data in Phase 1)

```yaml
rule_set_version: "2026.09.1"      # Stamped onto every decision snapshot

rules:
  - rule_id: rule_cost_cap_economy_intl
    rule_version: "1.0.0"
    description: "Warn if international economy fare exceeds USD 400"
    enforcement_level: WARN          # BLOCK | REQUIRE_APPROVAL | WARN | ALLOW
    scope_level: TENANT              # GLOBAL|TENANT|DEPARTMENT|TRAVELER|TRIP  → specificity 1..5
    scope:
      cabin_class: [Y]
      route_type: INTERNATIONAL
    condition:
      field: total_amount_usd
      operator: GREATER_THAN
      value: 40000                   # Minor units (USD 400.00)
    override_allowed: true           # WARN outcomes require a reason code when overridden
    effective_from: "2026-01-01"
    effective_to: null               # null = no expiry

  - rule_id: rule_blocked_country_01
    rule_version: "1.0.0"
    description: "Block bookings to OFAC-sanctioned destinations"
    enforcement_level: BLOCK
    scope_level: GLOBAL              # Specificity 1 — but BLOCK wins on outcome, not specificity
    scope:
      destination_countries: [CU, IR, KP, SY]
    condition:
      field: destination_country
      operator: IN
      value: [CU, IR, KP, SY]
    override_allowed: false          # BLOCK is never overridable (GUARDRAIL-P2)
    effective_from: "2026-01-01"
    effective_to: null
```

#### Scope specificity ranking (new in v1.1 — resolves review finding M6)

`scope_level` maps to a fixed numeric specificity. v1.0 stated that ties break by specificity but
provided no field to rank on, so the documented conflict resolution could not be implemented.

| `scope_level` | Specificity | Meaning |
|---------------|-------------|---------|
| `GLOBAL` | 1 | Platform-wide, applies to every tenant |
| `TENANT` | 2 | One customer organisation |
| `DEPARTMENT` | 3 | A department or cost centre within a tenant |
| `TRAVELER` | 4 | A named traveler grade or individual |
| `TRIP` | 5 | This specific trip or booking context |

**Resolution algorithm, in order:**

1. **Outcome severity wins first:** `BLOCK` > `REQUIRE_APPROVAL` > `WARN` > `ALLOW`.
   The most restrictive matched outcome is the decision, regardless of specificity.
2. **Specificity breaks ties within the same outcome** — the highest specificity rule supplies the
   rationale and the approver routing.
3. **Equal outcome and equal specificity** → the rule with the later `effective_from` wins;
   if still tied, `rule_id` ascending, so evaluation is deterministic and reproducible.

The vocabulary and this ordering are **fixed platform-wide and not tenant-configurable**. What *is*
tenant-configurable is which rule category maps to which `enforcement_level` — so one tenant can
treat a cabin-class breach as `WARN` and another as `REQUIRE_APPROVAL`, without either being able
to change how conflicts resolve.

**`BLOCK` is reserved.** It is for legal and safety constraints only — sanctioned destinations,
embargoed carriers, invalid travel documents — and carries `override_allowed: false`. Everything
else is `REQUIRE_APPROVAL` or `WARN`. Corporate programmes run on out-of-policy *visibility*;
over-using `BLOCK` pushes travelers to consumer channels, where the booking becomes invisible
rather than merely non-compliant.

### 9.3 PolicyDecision Object (returned + snapshotted)

```typescript
interface PolicyDecision {
  outcome: "BLOCK" | "REQUIRE_APPROVAL" | "WARN" | "ALLOW";
  rule_set_version: string;           // Stamped onto the snapshot
  matched_rules: Array<{
    rule_id: string;
    rule_version: string;
    scope_level: "GLOBAL" | "TENANT" | "DEPARTMENT" | "TRAVELER" | "TRIP";
    specificity: 1 | 2 | 3 | 4 | 5;
    enforcement_level: string;
    override_allowed: boolean;
    rationale: string;
  }>;
  blocking_rules: MatchedRule[];      // Non-empty when outcome = BLOCK
  approval_required_rules: MatchedRule[];
  warnings: MatchedRule[];
  evaluated_at: string;               // ISO 8601
}
```

### 9.4 Approval Workflow

```
PolicyDecision.outcome = REQUIRE_APPROVAL
    │
    ▼
Approver resolved from org hierarchy and SNAPSHOTTED onto the approval record
    │
    ▼
ApprovalRequested written to the outbox → Approver notified (email + in-app)
    │
    ▼
Approver action (Phase 1: API call; Phase 2: UI) — IDEMPOTENT
    │
    ├── APPROVED → confirm flow continues; policy_override row written if a rule was overridden
    ├── REJECTED → Booking → CANCELLED; hold released to GDS
    └── EXPIRED  → Booking → EXPIRED; hold released; traveler notified (NEVER auto-approve)
```

**Phase 1 constraints (confirming the Inception decision):**

- It is the approval **state machine on the booking** (§5.3.3) — not a workflow engine.
- **Single level.** The approver is resolved from the org hierarchy at request time and snapshotted,
  so a later reorganisation cannot retroactively change who approved.
- Approval actions are **idempotent** — approvers click emailed links more than once. Replaying a
  decision returns the original outcome instead of re-deciding.
- Delegation, out-of-office and multi-level chains are Phase 2.

### 9.5 Policy Override Model (new in v1.1)

An override is a **first-class append-only record** (`policy_override`, §5.2), never a mutation of
the decision snapshot. v1.0 placed `override_reason` and `override_actor` as columns on
`policy_decision_snapshot`, a table GUARDRAIL-D1 forbids updating — and the override is decided
after the snapshot is written, so populating them required exactly the `UPDATE` that was forbidden
(review finding C1).

| Rule | Detail |
|------|--------|
| Reason code mandatory | From a tenant-configured enum; free text optional but never a substitute |
| Actor recorded | PII pointer + role (`TRAVELER`, `APPROVER`, `ADMIN`) |
| `BLOCK` is never overridable | `override_allowed: false`; no code path bypasses it (GUARDRAIL-P2) |
| `WARN` override | Traveler may proceed, but the reason code is required to continue |
| `REQUIRE_APPROVAL` override | Only an approver; the approval record and the override row are written together |
| Reporting | `PolicyOverrideRecorded` flows to the reporting mart; `override_reason_code` appears on the financial event |

> Out-of-policy volume and its reasons are among the primary things a travel manager buys the
> platform for. An override that is not queryable is an override that did not happen, as far as the
> customer's programme reporting is concerned.

---

## 10. SECURITY ARCHITECTURE

### 10.1 Authentication & Authorization

| Layer | Mechanism | Detail |
|-------|-----------|--------|
| Traveler / UI | OIDC (Auth0 / Cognito) | JWT; tenant claim in token. MFA optional for travelers in Phase 1 |
| **Admin / Approver** | OIDC + role claim | `role: APPROVER`, `role: ADMIN`; enforced at API Gateway and service layer. **MFA mandatory from Phase 1** — these roles move money and approve out-of-policy spend |
| Service-to-Service | mTLS + service account JWTs | Between Deployable A and B; tenant claim validated on both sides |
| GDS API credentials | AWS Secrets Manager | Rotated; never in code or environment variables; injected at runtime |
| Webhook inbound | HMAC-SHA256 + signed timestamp | Shared secret per GDS; reject without valid signature or outside a ±5 min replay window (§8.7) |

> v1.0 said "MFA for admin roles" in §3.1 and "MFA optional Phase 1, required Phase 2" here.
> Resolved in favour of the stricter reading for privileged roles (review finding C6).

### 10.2 PCI-DSS SAQ-A Scope

- No card numbers (PANs) are stored, processed, or transmitted by TravelPlatform
- Settlement via central lodge card or issued virtual card — managed by lodge card provider
- Virtual card numbers issued by third-party; TravelPlatform stores only a non-sensitive reference token
- TravelPlatform is **out of PCI-DSS network scope** for cardholder data
- Scope boundary documented and attested annually for SAQ-A/A-EP

### 10.3 GDPR & Privacy

| Requirement | Implementation |
|-------------|----------------|
| PII stored by pointer | `traveler_id` on all spine entities; raw name/email/DOB in PII Store only |
| Right to erasure | Delete record in PII Store; spine records retain traveler_id (opaque pointer) — ledger integrity preserved |
| Data minimization | Only fields necessary for booking/financial processing stored |
| Cross-border transfer | EU data stays in EU AWS region; US data stays in US AWS region; transfer controls documented |
| Consent tracking | Phase 1 deferred; PII store has consent_version field reserved |

### 10.4 SOX-Style Controls

| Control | Implementation |
|---------|----------------|
| Segregation of duties | Booking creation, financial posting, and settlement are separate service roles |
| Immutable audit trail | `financial_event`, `supplier_mapping`, `policy_decision_snapshot` and `policy_override` are append-only; no UPDATE/DELETE; enforced by database role, not convention |
| Change management | All config/rule changes via PR + review; no direct production DB changes |
| Access logging | All admin and financial API calls logged with actor, timestamp, IP |

### 10.5 Secrets Management

- All GDS API credentials, database passwords, JWT signing keys stored in AWS Secrets Manager
- Secrets injected as environment variables at container startup via ECS task role
- Secret rotation enforced: GDS credentials rotated every 90 days; DB passwords every 30 days
- Never logged, never in API responses, never in URLs

### 10.6 SOC 2 Type II Readiness

Not a regulation, but the control set corporate procurement actually gates on. Evidence collection
begins in Phase 1 rather than being retrofitted before the first enterprise deal.

| Trust criterion | Phase 1 evidence source |
|-----------------|------------------------|
| Security | Access logs (§10.4), MFA enforcement, Secrets Manager rotation records, Snyk scan history |
| Availability | Health checks (§11.5), SLO dashboards, incident records |
| Processing integrity | The §17 financial invariants, enforced in CI on every build — the strongest artefact available |
| Confidentiality | PII pointer model (§10.3), encryption at rest via KMS, tenant isolation tests |
| Privacy | GDPR erasure path (§10.3), data minimisation, retention schedule |

**Out of scope, explicitly:** HIPAA. No medical or accommodation-needs data is accepted or stored.

---

## 11. OBSERVABILITY

### 11.1 Correlation ID Propagation

The `correlation_id` flows through every layer:

```
Client Request
  → API Gateway (generates if absent)
  → Deployable A module (extracts from header, attaches to all log lines)
  → Deployable B via REST (X-Correlation-ID header, mTLS)
  → outbox row (correlation_id column, carried in the event envelope)
  → outbox dispatcher → consumers (extract from the envelope)
  → GDS Adapter outbound call (X-Correlation-ID header)
  → financial_event.correlation_id (persisted — added in v1.1)
  → Database query (pg_audit logs include correlation_id from app context)
```

> The chain now terminates in a persisted column. In v1.0 `financial_event` had no
> `correlation_id`, so the trail broke at exactly the record auditors ask about (finding C5/S5).

### 11.2 Structured Logging

All log lines are JSON with mandatory fields:

```json
{
  "timestamp": "2026-09-04T10:30:00.123Z",
  "level": "INFO",
  "service": "travelplatform-experience",
  "module": "experience",
  "correlation_id": "01J7KQZM...",
  "tenant_id": "tenant_abc",
  "booking_id": "bkg_01J...",
  "event": "BookingHeld",
  "duration_ms": 342,
  "supplier": "SABRE"
}
```

Fields `tenant_id`, `correlation_id` are mandatory on every log line. PII fields (traveler name, email) never logged.

### 11.3 Key Metrics

| Metric | Type | Alert Threshold |
|--------|------|----------------|
| `booking.hold.duration_ms` | Histogram | p99 > 3000ms |
| `booking.confirm.duration_ms` | Histogram | p99 > 5000ms |
| `gds.adapter.error_rate` | Counter by supplier | > 1% of calls |
| `gds.adapter.timeout_rate` | Counter by supplier | > 0.5% of calls |
| `policy.evaluate.duration_ms` | Histogram | p99 > 200ms |
| `financial_event.write.error_rate` | Counter | Any error |
| `booking.expired.count` | Counter | Spike > 10/min |
| `outbox.undispatched.age_seconds` | Gauge | p99 > 60s (replaces Kafka consumer lag in Phase 1) |
| `outbox.dlq.count` | Counter | Any row |
| `idempotency.pending_unresolved.count` | Gauge | > 0 for more than 5 min — unknown supplier outcome |
| `booking.confirm_exception.count` | Counter | **Any occurrence — page** |
| `reconciliation.exception.count` | Counter by type | Any `ORPHAN_TICKET` — page |
| `reconciliation.run.age_seconds` | Gauge | > 2× the scheduled interval (the job itself has stalled) |
| `refund.awaiting_settlement.age_days` | Gauge | p95 > 14 days |
| `booking.pending_issue.age_seconds` | Gauge | p95 > 1800s (30 min) — ADR-009: ticket queued but not confirmed; missed webhook or failed queue entry |

### 11.4 Distributed Tracing

- OpenTelemetry SDK in all services
- Traces exported to Datadog APM (or AWS X-Ray)
- Every incoming request creates a root span; downstream calls create child spans
- GDS adapter calls create spans with `supplier`, `operation`, `idempotency_key` attributes
- `correlation_id` propagated as trace attribute for cross-system correlation

### 11.5 Health Checks

```
GET /health/live    → 200 if process is running
GET /health/ready   → 200 if DB and Redis connections are healthy, and (Deployable B)
                      the outbox dispatcher has completed a cycle within its interval
```

---

## 12. INFRASTRUCTURE & DEPLOYMENT

### 12.1 Cloud Architecture (AWS)

```
Route 53 (DNS)
    │
    ▼
CloudFront (CDN + WAF)
    │
    ▼
API Gateway (Kong on ECS or AWS API Gateway)
    │
    ├── ECS Fargate — travelplatform-experience  (TypeScript)
    │      modules: experience · content · policy · notification
    │
    └── ECS Fargate — travelplatform-core        (Java 21)
           modules: data (spine) · payment & expense · servicing
           sidecar workers: outbox dispatcher · reconciler · expiry scheduler

Data Layer:
    ├── Aurora PostgreSQL (Multi-AZ) — ONE database, schema-per-module
    │      spine · payment · policy · pii (separate schema, separate KMS key)
    │      + outbox, idempotency_record, reconciliation exceptions
    ├── ElastiCache Redis (session, availability cache, idempotency read-through)
    └── S3 (raw GDS payloads, webhook archives, audit)

Supporting:
    ├── AWS Secrets Manager (credentials)
    ├── EventBridge Scheduler (hold expiry, approval expiry, reconciliation runs)
    ├── AWS CloudWatch + OpenTelemetry Collector
    ├── AWS KMS (encryption at rest; separate key for the PII schema)
    └── VPC with private subnets (neither deployable is internet-reachable directly)
```

**What changed from v1.0 and why.** Six Fargate services, MSK and per-service databases were a
steady-state topology applied to a one-supplier, one-tenant, air-only pilot. The domain boundaries
are unchanged — they are enforced as module boundaries with separate schemas and no cross-module
table access — but Phase 1 operates two deployables and no broker. See ADR-013 for the split
triggers.

**Schema-per-module is the discipline that keeps the split cheap.** A module may only read and
write its own schema; cross-module data is reached through the owning module's interface, never by
joining across schemas. A CI check fails any migration that grants cross-schema access.

### 12.2 Multi-Tenancy

- Each tenant has a `tenant_id` scoped to all data
- Phase 1: shared infrastructure, logical tenant isolation (row-level security on PostgreSQL)
- Phase 2 (if required): dedicated schema or dedicated cluster per enterprise tenant
- Cross-tenant queries impossible: all repository methods accept `tenant_id` as mandatory first argument; query planner validated by CI test suite

### 12.3 Deployment Strategy

| Stage | Strategy | Detail |
|-------|----------|--------|
| Development | Direct deploy | Feature branch → dev environment |
| Staging | Blue-green | Zero-downtime deploy; smoke tests before traffic switch |
| Production | Canary (Phase 2) | Phase 1: blue-green; Phase 2: canary at 5%/25%/100% |
| Rollback | Automated | If health check fails post-deploy: auto-rollback to previous version |

### 12.4 Infrastructure as Code

All infrastructure defined in Terraform:
- Modules: `vpc`, `ecs-service`, `aurora`, `elasticache`, `api-gateway`, `secrets`, `scheduler`
  (`msk` added in Phase 2 when the broker is introduced — ADR-013)
- Separate workspaces: `dev`, `staging`, `prod`
- No manual AWS console changes to infrastructure
- `terraform plan` output reviewed as part of PR for infrastructure changes

### 12.5 CI/CD Pipeline (GitHub Actions)

```
PR opened
    │
    ├── Lint (ESLint / Checkstyle)
    ├── Unit tests (Jest / JUnit)
    ├── Integration tests (Testcontainers — Postgres, Redis; stubbed GDS)
    ├── Contract tests (Pact — Deployable A ↔ Deployable B)
    ├── GDS adapter conformance suite (recorded fixtures — every adapter, same suite)
    ├── Financial invariant tests — GUARDRAIL-F1, F2a, F2b, F5, refund arithmetic
    ├── State machine tests — every illegal transition in §5.3 must be rejected
    ├── Tenant isolation test (no repository method reachable without tenant_id)
    ├── Append-only check (no UPDATE/DELETE against the immutable tables)
    ├── Security scan (Snyk / OWASP Dependency Check)
    └── OpenAPI spec validation

Merge to main
    │
    ├── Build Docker image (ECR)
    ├── Deploy to dev (auto)
    ├── Smoke tests
    └── Promote to staging (manual approval)

Staging
    │
    ├── Full integration test suite
    ├── Load test (k6 — baseline targets)
    └── Promote to prod (manual approval — Owner/Release authority)
```

---

## 13. DEFERRED TO LATER PHASES

These items were confirmed as non-blocking for Phase 1 and are deferred to architecture/development of subsequent phases:

| Item | Phase | Notes |
|------|-------|-------|
| **Second GDS adapter (Amadeus)** | Phase 2 | Interface, factory and capability matrix built in Phase 1; the second adapter is the proof the abstraction holds (ADR-008) |
| **ARC/BSP debit memo (ADM) handling** | Phase 2 | **The actual dispute surface in travel** — we never charge a card directly, so there are no consumer chargebacks. Memo → match by ticket number → accept (post as cost) or contest (contingent liability). `DEBIT_MEMO` is already a valid `financial_event.event_type` so Phase 1 data needs no migration. Ownership depends on the ADR-009 accreditation model |
| **ARC/BSP settlement file ingest & reconciliation** | Phase 2 | Phase 1 confirms refunds via webhook/API. File-based settlement reconciliation is the Phase 2 source of truth for money |
| Exchanges, add-collect, downgrade, partial refunds | Phase 2 | `coupon`, `refund` and `financial_leg` schemas already accommodate them — no migration required (ADR-010) |
| Approval workflow (chain, escalation, delegation, UI) | Phase 2 | Phase 1: API-only, single approver, snapshotted at request time |
| Notification channels (SMS, Slack, Teams, push) | Phase 2 | Phase 1: email + in-app, event-driven off the outbox. **Open item:** retention and forwarding policy for itinerary PII in notification content needs an owner |
| Hotel / Car / Rail supplier adapters | Phase 2+ | Segment envelope + typed payload already extensible (§5.2) |
| Policy authoring UI | Phase 2 | Rules as data in Phase 1; constrained UI (thresholds, lists, date windows) once ~10 tenants have shown the real rule vocabulary |
| Kafka / MSK event streaming | Phase 2 | Outbox in Phase 1; same channel names, same envelope (ADR-013) |
| Canary deployment | Phase 2 | Blue-green sufficient for Phase 1 |
| Dedicated tenant infrastructure | Phase 2+ | Shared infra with logical isolation in Phase 1 |
| ERP / GL outbound posting | Phase 1 Sprint 2 | Stub in Sprint 1; implement in Sprint 2 |
| Reporting mart pipeline | Phase 2 | **Dimensions are captured from day one (P5); only the mart defers.** What is not stamped at booking cannot be reconstructed |
| Multi-currency operation | Phase 2 | Structure present from Phase 1 (three currency roles, FX at write time); Phase 1 transacts USD only |
| PSD2/SCA enforcement | As needed | Required only if EU card payments go live |
| NDC adapter support | Phase 2+ | NDC ordering model differs from the PNR/ticket model; the `NDC_ORDER_ID` reference type already exists |
| Consent tracking | Phase 2 | `consent_version` field reserved in the PII store |

**Resolved in v1.1, no longer deferred:** the webhook consumer spec is now specified in §8.7 rather
than deferred, because two of its four constraints (out-of-order handling and the reconciliation
fallback) change the data model and the consumer contract, and cannot be added later without
reworking every consumer.

---

## 14. ARCHITECTURE DECISION RECORDS (ADRs)

### ADR-001: Internal Identifiers (ULID / UUIDv7)

- **Decision:** All entity IDs are system-generated ULIDs (or UUIDv7), tenant-scoped. Supplier IDs (PNRs, ticket numbers) are never primary keys.
- **Rationale:** GDS record locators recycle within supplier + time window. Ticket numbers change on exchange. Using supplier IDs as keys breaks within months of production use.
- **Consequences:** Supplier mapping table maintained as append-only reference set with `valid_from`/`valid_to`.

### ADR-002: Append-Only Financial Ledger

- **Decision:** `financial_event`, `supplier_mapping`, `policy_decision_snapshot` and
  `policy_override` are append-only. Financial facts are superseded (new record inserted, old marked
  SUPERSEDED), never updated.
- **Rationale:** Immutable audit trail required for SOX-style controls. GDPR erasure only deletes PII pointer records, not financial events.
- **Consequences:** All queries for "current" financial state must filter `status = ACTIVE` or use the latest event per aggregate. Anything that looks like a mutation of an immutable record — an override, a correction — must be modelled as a **new** record that references the original (see ADR-014).

### ADR-003: Cost Allocation at Passenger × Ticket Granularity — *revised v1.1*

- **Decision:** Attribution unit is passenger × ticket. Allocations are **declared** per passenger
  at the API and **stored** expanded across every financial leg of that passenger's ticket.
- **Rationale:** ARC/BSP settle and report at passenger × ticket granularity, so attribution coarser
  than that breaks reconciliation. Storage at leg level is required because taxes and fees have
  independent refundability and must reverse independently.
- **Consequences:** Two invariants hold simultaneously — `Σ allocations = leg amount` (F2a) and
  `Σ allocations across a ticket's legs = ticket total` (F2b). v1.0 asserted only the leg-level
  invariant while ADR-003 asserted the ticket-level one, and the API declared at traveler level,
  giving three inconsistent granularities. Reconciled in §5.2.

### ADR-004: Policy Evaluation is Synchronous at Booking Time

- **Decision:** Policy is evaluated synchronously during the booking hold flow and the result is snapshotted immutably onto the booking.
- **Rationale:** Traveler must receive policy decision before confirming. Policy changes after booking must not alter historical decisions.
- **Consequences:** Policy evaluator must be fast (p99 < 200ms). Rule store is loaded at service startup and hot-reloaded on rule version change.

### ADR-005: No Raw PAN Storage (PCI-DSS SAQ-A)

- **Decision:** TravelPlatform never stores, processes, or transmits raw card numbers. Settlement via central lodge card with reference token only.
- **Rationale:** Reduces PCI-DSS scope to SAQ-A. Eliminates cardholder data breach risk.
- **Consequences:** No payment gateway integration in Phase 1. Lodge card reference stored as non-sensitive text token.

### ADR-006: FX Rate Captured at Transaction Time

- **Decision:** FX rates for sale-to-settlement and sale-to-reporting are stored on the financial event at write time. Never recomputed at read time.
- **Rationale:** FX rates change continuously. Retroactive recomputation would change historical financial records.
- **Consequences:** Reporting uses fixed per-period FX rate (set by finance team). Transaction-level rate and reporting-period rate both stored.

### ADR-007: Ancillaries as First-Class Entities

- **Decision:** Ancillaries are independent entities attached to (passenger, segment) with their own EMD, refundability flag, tax breakdown, and financial leg.
- **Rationale:** If folded into fare, ancillaries cannot be independently serviced, refunded, or allocated. This is an unrecoverable schema design error.
- **Consequences:** Ancillary refunds, voids, and cost allocations are processed independently of the base ticket.

### ADR-008: One GDS Adapter in Phase 1, Behind a Multi-Adapter Interface — *revised v1.1*

- **Decision:** The `GdsAdapter` interface, `GdsAdapterFactory` and capability matrix are built as
  designed, but **Phase 1 implements, contracts and certifies exactly one adapter: Sabre.** Amadeus
  moves to Phase 2. **Cross-GDS failover is removed.**
- **Rationale:**
  1. The US/RoW split in v1.0 is a market-share convention, not a content boundary — Sabre and
     Amadeus are both global with heavily overlapping carrier coverage. One GDS covers a
     single-market pilot completely.
  2. Phase 1 is a one-market, air-only pilot. A second adapter adds a second commercial contract, a
     second certification and a second ticketing model to the critical path without extending
     Phase 1 coverage. Certification lead time is already the longest pole.
  3. **Failover between GDSs is not implementable.** The PNR lives in one GDS; pricing, fare
     filings and settlement differ. A booking cannot fail over mid-flow. v1.0's §16.1 fallback was
     architecturally wrong, not merely over-scoped.
- **Consequences:** `GDS_UNAVAILABLE` behind a circuit breaker is the only correct behaviour when
  the supplier is down — there is no alternate path. The Phase 2 Amadeus adapter is the deliberate
  test that the abstraction holds; if adding it requires changes outside the Content module, the
  abstraction has failed and that is worth knowing early.

### ADR-009: Ticketing Authority and Accreditation — **DECIDED: Model B**

- **Status:** CLOSED. Decision recorded 2026-09-10.
- **Decision:** **Model B — Host agency / accredited partner as agent of record.**
- **Rationale:** Model B ships materially sooner than Model A. ARC accreditation, agent bonding,
  financial guarantee requirements, and Sabre office-ID certification under our own entity are the
  longest lead times in the programme. Moving these to an accredited host partner eliminates them
  from the Phase 1 critical path entirely. The trade-offs are accepted:
  - Per-transaction cost to the host (to be agreed in the host contract)
  - ARC debit memo (ADM) exposure sits with the host, not TravelPlatform (deferred to Phase 2 — see §13)
  - Servicing (involuntary changes, exchanges) must be coordinated through the host's agent desk until Phase 2 own-accreditation is re-evaluated
- **Issuance model consequence:** The host partner's office ID (PCC) is the Sabre authentication
  credential. The adapter's `issuanceModel = TICKETING_QUEUE`. The booking is placed on the host's
  ticketing queue; the ticket number arrives asynchronously by webhook or reconciliation. The
  `HELD → CONFIRMED` guard in §5.3.1 is therefore reached on the ticketing confirmation event (via
  webhook §8.7 or reconciliation §8.8), **not** on the queue placement. The booking sits in
  `PENDING_ISSUE` between queue placement and ticket confirmation.
- **Sabre contract:** Negotiated and signed with the host partner. TravelPlatform does not hold a
  direct Sabre commercial agreement in Phase 1. The host's PCC is stored in AWS Secrets Manager
  under the GDS credential path; rotation coordinates with the host.
- **Debit memos:** ADM receipts, matching, acceptance and contestation are the host's
  responsibility in Phase 1. TravelPlatform receives ADM notifications as informational events
  only. Own ADM handling is re-evaluated when Phase 2 own-accreditation is considered.
- **Consequences for implementation:**
  1. `booking.supplier_code` is always `SABRE`; the host PCC is an operational credential, not a domain concept
  2. A new booking status path is required: `HELD → PENDING_ISSUE → CONFIRMED` (queue placed, awaiting ticket number)
  3. `void_window_expires_at` is set by the host's ticketing rules, not directly from the carrier — must be received in the issuance confirmation message or reconciliation response
  4. `BookingConfirmed` is emitted only after the ticket number is received and persisted, not at queue placement
  5. Reconciliation job (§8.8) is elevated to a critical operational dependency in Phase 1 because `TICKETING_QUEUE` means there is always a window where the booking is queued but unconfirmed

### ADR-010: Ticket → Coupon → Segment

- **Decision:** A ticket belongs to a **booking and a passenger**, and carries 1..4 coupons, each
  referencing exactly one segment. Conjunction tickets link via `conjunction_of` for itineraries
  exceeding four coupons. **Coupon status**, not ticket status, drives usage and refundability.
- **Rationale:** v1.0 modelled `ticket.segment_id` as a single non-null column. A round trip is one
  ticket document covering two or more segments, so that model cannot represent an ordinary booking
  — and it makes partial usage, partial refund and exchange unrepresentable. This is the same
  unrecoverable-schema-error class that ADR-007 correctly protects ancillaries from.
- **Consequences:** Phase 1 refunds only tickets whose coupons are **all** `OPEN`, enforced as a
  guard in §5.3.2. The schema is nonetheless complete, so Phase 2 partial refunds and exchanges
  require no migration. Every read path that previously joined ticket→segment now goes through
  `coupon`.

### ADR-011: Idempotency Store is Durable (PostgreSQL), Not a Cache

- **Decision:** The authoritative idempotency record lives in PostgreSQL (`idempotency_record`),
  written and committed **before** the outbound supplier call. Redis is a read-through cache only.
- **Rationale:** v1.0 placed this store in Redis. Redis evicts under memory pressure, loses writes
  on failover, and starts cold after a restart — and this record is the only thing preventing a
  retry from issuing a second ticket. Losing it costs real money, twice, with no record linking the
  two issuances.
- **Consequences:** A durable write and commit precede every supplier call, adding latency to the
  confirm path. This is accepted. A `PENDING` record on retry means the supplier outcome is
  **unknown** and must be resolved by querying the supplier — never by re-issuing.

### ADR-012: Partial Failure is an Explicit State

- **Decision:** Any condition where supplier state and platform state disagree resolves to an
  explicit status (`CONFIRM_EXCEPTION`) plus a `supplier_reconciliation_exception` row and an ops
  queue item. It never silently reverts to the prior state.
- **Rationale:** v1.0's §16.2 specified that a ledger write failure leaves the booking `HELD`.
  If the supplier has already issued the ticket, `HELD` is false — the money is committed and the
  reservation record says otherwise. In travel these conditions are routine, not edge cases.
- **Consequences:** The reservation status enum carries a state that is neither success nor failure.
  Ops tooling must exist from Phase 1 — an exception queue with the supplier reference and the
  available compensations. `booking.confirm_exception.count` pages on any occurrence.

### ADR-013: Two Deployables in Phase 1, Outbox Instead of a Broker

- **Decision:** The six bounded contexts are packaged as **two deployables** split on the language
  boundary (§3.2), with a PostgreSQL transactional outbox replacing Kafka/MSK in Phase 1.
- **Rationale:** Six independently deployed services, MSK, per-service databases and inter-service
  Pact tests are a steady-state topology. Applied to a one-supplier, one-tenant, air-only pilot
  they dominate the schedule without buying anything the pilot needs. The outbox additionally
  removes the dual-write failure mode that v1.0's "write to DB then publish to Kafka" flow had
  (P2). The language split is retained per the Inception decision and now defines the deployable
  boundary rather than cutting across it.
- **Consequences:** Domain boundaries are enforced as module boundaries with schema-per-module and
  a CI check against cross-schema access — the discipline that keeps a later split cheap. Channel
  names and the event envelope are Kafka-shaped already, so Phase 2 swaps the dispatcher without
  touching producers or consumers.
- **Split triggers (any one justifies revisiting):** a bounded context needs independent scaling;
  a separate team takes ownership of a context; an external consumer needs a real event stream;
  or the outbox dispatcher becomes a throughput bottleneck.

### ADR-014: Immutable Records are Superseded, Never Amended

- **Decision:** No append-only table is ever mutated to record a later fact. Overrides,
  corrections and reversals are **new rows referencing the original** —
  `policy_override.snapshot_id`, `cost_allocation.reverses_allocation_id`,
  `financial_leg.superseded_by`.
- **Rationale:** v1.0 carried `override_reason` and `override_actor` as columns on
  `policy_decision_snapshot`, a table GUARDRAIL-D1 forbids updating, while the override is by
  definition decided after the snapshot exists. The document contradicted its own guardrail. This
  ADR generalises the fix so the same mistake is not reintroduced elsewhere.
- **Consequences:** Reads that need the "effective" view compose the original with its subsequent
  records. That cost is deliberate — it is what makes the audit trail a true history rather than a
  current-state table with an audit-shaped name.

---

## 15. ERROR HANDLING & FAULT TAXONOMY

### 15.1 Error Response Format (RFC 7807 Problem Details)

All API errors return `application/problem+json`:

```json
{
  "type": "https://api.travelplatform.io/errors/gds-hold-failed",
  "title": "GDS Hold Failed",
  "status": 502,
  "detail": "Supplier returned UNABLE_TO_PROCESS for PNR creation. Retry eligible.",
  "instance": "/v1/bookings/bkg_01J...",
  "correlation_id": "01J7KQZM...",
  "error_code": "GDS_HOLD_FAILED",
  "retry_eligible": true
}
```

Mandatory fields on every error: `type`, `title`, `status`, `error_code`, `correlation_id`.  
`retry_eligible` present on all integration errors.  
Stack traces **never** included in responses (logged server-side only).

### 15.2 Canonical Error Taxonomy

| Error Code | HTTP Status | Retry | Description | Recovery |
|-----------|-------------|-------|-------------|----------|
| `VALIDATION_ERROR` | 400 | No | Request payload fails schema or business rule validation | Fix request |
| `AUTHENTICATION_FAILED` | 401 | No | Invalid or expired JWT | Re-authenticate |
| `AUTHORIZATION_DENIED` | 403 | No | Caller lacks permission for this tenant/resource | Check role/scope |
| `RESOURCE_NOT_FOUND` | 404 | No | Trip, Booking, Ticket ID not found for this tenant | Verify ID |
| `CONFLICT_DUPLICATE` | 409 | No | Idempotency key already processed; cached response returned | Use cached result |
| `BOOKING_STATE_INVALID` | 409 | No | Transition not valid for current booking state | Check current state |
| `POLICY_BLOCKED` | 422 | No | Policy evaluation returned BLOCK | Not overridable — review policy / request a rule change |
| `INVARIANT_VIOLATED` | 422 | No | Financial invariant check failed (Σ taxes+fees ≠ total, or splits ≠ 100%) | Fix amounts |
| `CONFIRM_EXCEPTION` | 409 | **No** | Ticket issued at supplier but a downstream write failed. Booking frozen, ops item raised | **Never retry.** Resolve via the ops queue — complete the ledger write or void the ticket (§5.3.1) |
| `REFUND_NOT_ELIGIBLE` | 422 | No | Fare non-refundable, or coupons not all `OPEN` (partial use is Phase 2) | Surface the fare rule to the user |
| `VOID_WINDOW_EXPIRED` | 422 | No | Void attempted after `ticket.void_window_expires_at` | Use the refund path instead |
| `GDS_CAPABILITY_UNSUPPORTED` | 422 | No | The adapter's capability matrix does not declare this verb | Explicit degradation — no supplier call attempted |
| `SUPPLIER_OUTCOME_UNKNOWN` | 409 | **No** | Idempotency record is `PENDING`; the prior attempt's result is unknown | **Never re-issue.** Query the supplier and reconcile (§8.6 step 6b) |
| `GDS_HOLD_FAILED` | 502 | Yes | GDS rejected hold request | Retry with backoff |
| `GDS_TIMEOUT` | 504 | Yes | GDS did not respond within SLO | Retry with backoff |
| `GDS_UNAVAILABLE` | 503 | Yes | GDS returned service unavailable | Retry with backoff; alert if sustained |
| `GDS_NON_RETRYABLE` | 502 | No | GDS returned structured error (e.g. invalid fare) | Surface to user |
| `DOWNSTREAM_UNAVAILABLE` | 503 | Yes | Internal downstream service unavailable | Circuit breaker open; retry |
| `IDEMPOTENCY_KEY_MISSING` | 400 | No | Mutating request missing `Idempotency-Key` header | Add header |
| `RATE_LIMIT_EXCEEDED` | 429 | Yes | Tenant or supplier rate limit hit | Respect `Retry-After` header |
| `INTERNAL_ERROR` | 500 | No | Unexpected server error | Alert; investigate via correlation_id |

### 15.3 Resilience Patterns Per Integration

| Integration | Pattern | Config |
|------------|---------|--------|
| Sabre — read calls (search, retrieve) | Retry (3x) + exponential backoff + jitter | Backoff: 500ms, 1s, 2s; jitter ±10% |
| Sabre — **write calls (hold, issue, void, refund)** | Retry **only** under the durable idempotency key; never blind retry | A timeout is an *unknown* outcome, not a failure. Exhausted retries raise a reconciliation exception rather than reporting clean failure (§8.6) |
| Policy module | Fail-fast (no retry) | Must return within 200ms; timeout = booking blocked |
| Payment ledger write | In-process transaction (Deployable B) | Same transaction as the spine write — no retry semantics needed, it commits or rolls back |
| Outbox dispatch | Retry with backoff + DLQ table | At-least-once; consumers idempotent on `event_id`; DLQ alerts for manual replay |
| PostgreSQL | Connection pool + retry on transient errors | HikariCP; max pool 20; retry on `connection reset` |

### 15.4 Circuit Breaker Configuration

Applied to all GDS adapter outbound calls:

```
Closed → [failure rate > 50% in 10-call window] → Open
Open   → [after 30s cool-off] → Half-Open
Half-Open → [1 probe call succeeds] → Closed
Half-Open → [probe fails] → Open (reset timer)
```

When circuit is Open: return `GDS_UNAVAILABLE` immediately without calling supplier. Alert fired at circuit open.

---

## 16. DEPENDENCY INVENTORY

### 16.1 External Service Dependencies

| Dependency | Type | Used By | Criticality | Fallback |
|-----------|------|---------|-------------|----------|
| Sabre Dev Studio API | GDS REST | Content module | **Critical — no fallback exists** | Circuit breaker → `GDS_UNAVAILABLE`. **There is no alternate GDS path** (ADR-008) |
| **ARC (or host agency)** | Accreditation + settlement | Ticketing, Servicing, Payment | **Critical — Phase 1 blocker** | None. Without an agent of record no ticket can be issued. See ADR-009 |
| Lodge / virtual card provider | Form of payment | Payment | Critical | Booking cannot confirm without a provisioned instrument; hold retained until expiry |
| Auth0 / AWS Cognito | Identity | API Gateway, both deployables | Critical | Cached token validation (short window) |
| AWS Secrets Manager | Secret store | Both deployables (startup) | Critical | Container fails to start if unavailable |
| HR / Identity Platform | Profile data | Experience, Data | High | Cached profile (TTL 15 min); booking proceeds on the cached snapshot |
| Org Hierarchy Service | Reporting dimensions | Data, Payment | High | **Cached snapshot, 24 h staleness bound** (§2.3). Confirmation proceeds and stamps `dimension_source=CACHED`; blocked only if no snapshot exists or it exceeds 24 h |
| ERP / GL System | Financial posting | Payment | Medium | Outbox retry; DLQ; manual reconciliation |
| Email provider (SES) | Notification | Notification module | Medium | Queue; retry; degraded mode (in-app only) |

> **v1.0's cross-GDS fallback is removed** (review finding B2). It was not implementable: the PNR
> lives in one GDS, and pricing, fare filings and settlement differ, so a booking cannot fail over
> mid-flow. Stating a fallback that cannot work is worse than stating none, because it suppresses
> the availability conversation that a single critical dependency deserves.

### 16.2 Internal Service Dependencies (Phase 1)

| Consumer | Depends On | Call Type | Failure Mode |
|----------|-----------|-----------|--------------|
| Experience | Content (GDS adapter) | In-process (Deployable A) | `GDS_UNAVAILABLE` returned to client |
| Experience | Policy evaluator | In-process (Deployable A) | Booking blocked — policy is mandatory, fail-fast |
| Experience | Data / spine | Sync REST → Deployable B, mTLS | Before ticketing: booking fails, nothing persisted. **After ticketing: `CONFIRM_EXCEPTION`** |
| Experience | Payment (ledger write) | Sync REST → Deployable B | **`CONFIRM_EXCEPTION`, not `HELD`** — if the ticket is issued, the reservation is no longer holdable (ADR-012) |
| Payment | Data (spine + financial event) | In-process, same transaction (Deployable B) | Atomic — commits together or rolls back together |
| Servicing | Content (supplier calls) | Sync REST → Deployable A | Retry under idempotency key; unresolved → reconciliation exception |
| Notification | All domains | Async (outbox events) | Non-critical; degraded mode acceptable |
| Reconciler | Content (`retrieveBooking`) | In-process (Deployable A), scheduled | Job failure alerts on `reconciliation.run.age_seconds` |

> The `Confirm fails; booking stays HELD` row in v1.0 was the specific statement that made the
> partial-failure gap concrete — it is false in exactly the case that matters most (review finding
> B6). Corrected above and in §5.3.1.

### 16.3 Runtime Library Dependencies

| Library | Language | Purpose | Justification |
|---------|----------|---------|---------------|
| `express` / `fastify` | TypeScript | HTTP server | Lightweight, mature REST framework |
| `spring-boot-starter-web` | Java | HTTP server | Standard Spring Boot REST |
| `pg` / `hibernate` | Both | PostgreSQL client | Standard DB clients; outbox and idempotency store live here |
| `ioredis` | TypeScript | Redis client | Session and availability cache; **read-through only, never authoritative** |
| `opentelemetry-sdk` | Both | Distributed tracing | OTEL standard; no vendor lock-in |
| `zod` | TypeScript | Runtime schema validation | Type-safe validation at API boundaries |
| `ulid` | Both | ID generation | Sortable, opaque identifiers |
| `pact` | Both | Contract testing | Consumer-driven contracts across the A ↔ B boundary |
| `testcontainers` | Both | Integration testing | Spin up Postgres and Redis in CI |
| `resilience4j` | Java | Circuit breaker, retry | §15.3 / §15.4 patterns |
| `wiremock` | Both | Stubbed supplier mode | Recorded GDS fixtures — the adapter conformance suite and CI both run against it, never against the live sandbox |

> **Stubbed supplier mode is a Phase 1 deliverable, not a testing convenience.** A GDS sandbox
> behaves differently from production, has its own rate limits, and — where real card issuance or
> ticketing is involved — has real-world caps and side effects. CI must never depend on it.

All dependencies pinned to exact versions in `package.json` / `pom.xml`. No open ranges.  
Dependency security scan (Snyk) runs on every PR.

---

## 17. ARCHITECTURE GUARDRAILS

These guardrails are binding on all developers, reviewers, and automated checks. Violations block PR merge.

### Financial Integrity (CI-enforced)
- `GUARDRAIL-F1` — `Σ ticket_tax.amount + Σ ticket_fee.amount + base_fare_amount = ticket.total_amount` — tested on every build
- `GUARDRAIL-F2a` — `Σ cost_allocation.allocated_amount = financial_leg.amount` for every leg
- `GUARDRAIL-F2b` — `Σ cost_allocation.allocated_amount` across a ticket's legs `= ticket.total_amount`
- `GUARDRAIL-F3` — Monetary amounts are always `BIGINT` (minor units). No `FLOAT`, `DOUBLE`, or `DECIMAL` for money
- `GUARDRAIL-F4` — FX rates stored at transaction write time. No rate recomputation at read time
- `GUARDRAIL-F5` — Refund allocation reverses original split proportions exactly, via `reverses_allocation_id`. No fresh split computation on refund or exchange
- `GUARDRAIL-F6` — `refund.refund_amount = gross_amount − penalty_amount − non_refundable_amount`, and never negative
- `GUARDRAIL-F7` — Every monetary column has an adjacent currency column. No amount is ever stored or transmitted without its currency
- `GUARDRAIL-F8` — Ledger movement occurs **only** on `RefundConfirmed`, never on `RefundRequested`

### Data Integrity
- `GUARDRAIL-D1` — `supplier_mapping`, `financial_event`, `policy_decision_snapshot`, `policy_override`: no `UPDATE` or `DELETE` SQL ever issued. Enforced by database role, not by convention
- `GUARDRAIL-D2` — `tenant_id` is the first argument of every repository method. No cross-tenant query possible
- `GUARDRAIL-D3` — PII fields (name, email, passport, DOB) never stored on spine entities. PII pointer model only
- `GUARDRAIL-D4` — All entity IDs are ULID or UUIDv7. Auto-increment integers not used for business entity keys
- `GUARDRAIL-D5` — Supplier identifiers (PNR, ticket number, locator) never used as primary keys
- `GUARDRAIL-D6` — A later fact about an immutable record is a **new row referencing it**, never a column update on it (ADR-014)
- `GUARDRAIL-D7` — A module may only read and write its own schema. No cross-schema joins; CI fails any migration granting cross-schema access
- `GUARDRAIL-D8` — Every state transition writes a `domain_event` and an `outbox` row **in the same transaction** as the state change. No dual writes

### API & Integration
- `GUARDRAIL-A1` — Every mutating API endpoint requires `Idempotency-Key` header (validated at API Gateway)
- `GUARDRAIL-A2` — Every API request, event **and `financial_event` row** carries `correlation_id` and `tenant_id`
- `GUARDRAIL-A3` — API responses never include stack traces, internal IDs of other tenants, or raw PII
- `GUARDRAIL-A4` — GDS credentials never hardcoded; always retrieved from Secrets Manager at runtime
- `GUARDRAIL-A5` — Outbound GDS calls write a **durable** idempotency record (PostgreSQL) and commit **before** the call. Retry uses the same key. Redis is never the authority
- `GUARDRAIL-A6` — A `PENDING` idempotency record is an *unknown* outcome. Never re-issue; query the supplier and reconcile
- `GUARDRAIL-A7` — Every event consumer is idempotent on `event_id` and version-aware. Never overwrite newer state with an older event
- `GUARDRAIL-A8` — Webhook handlers enqueue only. No spine mutation from an HTTP handler
- `GUARDRAIL-A9` — An adapter verb not declared in the capability matrix returns `GDS_CAPABILITY_UNSUPPORTED` before any supplier call

### State Machine
- `GUARDRAIL-M1` — Illegal transitions are rejected with `BOOKING_STATE_INVALID`, never silently ignored. Every illegal transition in §5.3 has a test
- `GUARDRAIL-M2` — A partially applied transition lands in an explicit exception state and an ops queue. It never reverts to the prior state (ADR-012)
- `GUARDRAIL-M3` — `CONFIRMED → CANCELLED` requires every ticket on the booking to be `VOIDED` or `REFUNDED`

### Security
- `GUARDRAIL-S1` — No raw PAN, CVV, or card number stored, logged, or transmitted by any service
- `GUARDRAIL-S2` — JWT tenant claim validated on every request. Service rejects token with missing/mismatched tenant claim
- `GUARDRAIL-S3` — Secrets never logged. Log sanitizer strips known secret patterns in CI test
- `GUARDRAIL-S4` — Webhook inbound calls rejected without a valid HMAC-SHA256 signature **and** a signed timestamp inside the ±5 minute replay window
- `GUARDRAIL-S5` — All inter-deployable calls use mTLS. No plaintext HTTP in any environment
- `GUARDRAIL-S6` — MFA enforced for `ADMIN` and `APPROVER` roles from Phase 1

### Observability
- `GUARDRAIL-O1` — Every log line includes `correlation_id` and `tenant_id`
- `GUARDRAIL-O2` — Every outbound supplier call creates an OpenTelemetry span with `supplier`, `operation`, `idempotency_key`
- `GUARDRAIL-O3` — Health endpoints (`/health/live`, `/health/ready`) implemented by every deployable before release
- `GUARDRAIL-O4` — The reconciliation job's own liveness is monitored. A stalled reconciler is a silent failure of P12

### Policy
- `GUARDRAIL-P1` — Policy evaluation result is always snapshotted immutably onto the booking before confirmation proceeds
- `GUARDRAIL-P2` — `BLOCK` outcome always prevents booking confirmation. `override_allowed` is `false` for every `BLOCK` rule and no code path bypasses it
- `GUARDRAIL-P3` — Policy rule changes deployed via PR + review. No direct rule store edits in production
- `GUARDRAIL-P4` — Every override writes a `policy_override` row with a mandatory reason code and an actor. An override with no reason code is rejected
- `GUARDRAIL-P5` — Conflict resolution is deterministic and reproducible: outcome severity first, then `specificity`, then `effective_from`, then `rule_id`

---

## 18. ARCHITECTURE-TO-REQUIREMENT MAPPING

This table maps each architecture component to its source requirement and the stories it will satisfy.

| Architecture Component | Source Requirement | Epic (placeholder) | Stories (placeholder) |
|----------------------|-------------------|--------------------|-----------------------|
| Experience Service — Search | "continuous experience from travel discovery and booking" | EPIC-EXP-01 | STORY-EXP-01 (search availability), STORY-EXP-02 (display fares) |
| Experience Service — Book/Hold | "Bookings shall remain fully serviceable throughout lifecycle" | EPIC-EXP-01 | STORY-EXP-03 (create booking), STORY-EXP-04 (hold with GDS) |
| Experience Service — Confirm | "Payment...processes shall be integrated with the travel lifecycle" | EPIC-EXP-01 | STORY-EXP-05 (confirm + issue ticket), STORY-EXP-06 (cost allocation) |
| Experience Service — Cancel | "including voluntary changes, cancellations...refunds" | EPIC-SVC-01 | STORY-SVC-01 (cancel booking), STORY-SVC-02 (void ticket) |
| Content — GDS Adapter (Sabre) | "connect directly or indirectly with travel suppliers and normalize" | EPIC-CNT-01 | STORY-CNT-01 (adapter interface + factory + capability matrix), STORY-CNT-02 (Sabre adapter), STORY-CNT-07 (conformance suite + stubbed supplier mode) |
| Content — Supplier reconciliation | "controlled recovery from partial failures" | EPIC-CNT-01 | STORY-CNT-05 (reconciler job), STORY-CNT-06 (exception queue) |
| Ticketing authority / accreditation | "Payment, settlement...integrated with the travel lifecycle" | EPIC-CNT-01 | **Blocked on ADR-009 — no stories until the accreditation model is chosen** |
| Content Service — Normalization | "normalize heterogeneous supplier capabilities into consistent models" | EPIC-CNT-01 | STORY-CNT-03 (fare normalization), STORY-CNT-04 (segment mapping) |
| Policy Evaluator | "Organizational policies shall be evaluated at the point of travel decision-making" | EPIC-POL-01 | STORY-POL-01 (evaluate rules), STORY-POL-02 (decision snapshot), STORY-POL-03 (override records), STORY-POL-08 (specificity + conflict resolution) |
| Policy Rule Store | "configuration-driven policy" | EPIC-POL-01 | STORY-POL-04 (rule schema), STORY-POL-05 (rule versioning) |
| Transaction Spine (Data) | "All platform interactions shall contribute to a trusted Travel Context" | EPIC-DAT-01 | STORY-DAT-01 (Trip), STORY-DAT-02 (Booking + Passenger), STORY-DAT-03 (Segment), STORY-DAT-07 (Ticket + Coupon) |
| Booking state machines | "Bookings shall remain fully serviceable throughout lifecycle" | EPIC-DAT-01 | STORY-DAT-08 (reservation SM), STORY-DAT-09 (ticket SM), STORY-DAT-10 (illegal-transition tests) |
| Transactional outbox | "event-driven integration...without loss of context" | EPIC-INFRA-01 | STORY-INFRA-07 (outbox table + dispatcher), STORY-INFRA-08 (DLQ + replay) |
| Financial Ledger | "Payment, settlement, refund...processes shall be integrated" | EPIC-PAY-01 | STORY-PAY-01 (financial event), STORY-PAY-02 (cost allocation expansion) |
| Refund State Machine | "refunds and rebooking, without loss of...financial context" | EPIC-PAY-01 | STORY-PAY-03 (void), STORY-PAY-04 (refund requested → confirmed), STORY-PAY-05 (allocation reversal) |
| Partial-failure handling | "controlled recovery from partial failures" | EPIC-INFRA-01 | STORY-INFRA-09 (CONFIRM_EXCEPTION state), STORY-INFRA-10 (ops exception queue) |
| Approval Workflow | "required approvals...before transactions are completed" | EPIC-POL-01 | STORY-POL-06 (approval states), STORY-POL-07 (expiry + release) |
| Supplier Mapping (append-only) | "without loss of...supplier...context" | EPIC-DAT-01 | STORY-DAT-04 (supplier reference mapping) |
| Idempotency Layer | "must support idempotency, retries...controlled recovery from partial failures" | EPIC-INFRA-01 | STORY-INFRA-01 (idempotency key store), STORY-INFRA-02 (retry strategy) |
| PII Pointer Model | "security, privacy...and governed data" | EPIC-SEC-01 | STORY-SEC-01 (PII store), STORY-SEC-02 (GDPR erasure) |
| Financial Event (21 dimensions) | "All platform interactions shall contribute to...relevant audit information" | EPIC-DAT-01 | STORY-DAT-05 (reporting dimensions), STORY-DAT-06 (event emission) |
| Correlation ID infrastructure | "distributed observability" | EPIC-INFRA-01 | STORY-INFRA-03 (correlation propagation) |
| Multi-tenant isolation | "extensible ecosystem...enterprise" | EPIC-INFRA-01 | STORY-INFRA-04 (tenant scoping) |
| Circuit Breaker / Resilience | "resilience...recoverability and transaction integrity" | EPIC-INFRA-01 | STORY-INFRA-05 (circuit breaker), STORY-INFRA-06 (DLQ handling) |
| Immutable Audit Trail | "SOX-style controls, immutable audit trail" | EPIC-SEC-01 | STORY-SEC-03 (append-only ledger), STORY-SEC-04 (audit log) |

> **Note:** Epic and Story IDs are placeholders per AGENTS.md output discipline. Real IDs assigned when Jira/Zephyr project is created in the User Stories phase.

---

## APPROVAL GATE

**Status:** DRAFT v1.2 — requires sign-off before implementation planning proceeds.

> **Gate condition updated.** ADR-009 is closed (Model B — host agency, 2026-09-10). No hard blockers remain. Three supporting open items (host partner contract, notification PII policy, ASC 606 revenue treatment) are non-blocking for user story authoring but must be resolved before Sprint 2 planning and before notifications carry itinerary content. Architecture is ready for Architect + PO sign-off.

| # | Item | Owner | Status |
|---|------|-------|--------|
| 1 | **ADR-009 — ticketing authority** | Business / Legal / Product | ✅ **DECIDED — Model B (host agency)** 2026-09-10 |
| 2 | Sabre commercial terms and certification slot | Business | 🟡 Open — host partner selection and contract negotiation in progress |
| 3 | Notification content retention / forwarding policy (itinerary PII) | Compliance / Legal | 🟡 Open — needed before notifications carry itinerary detail (§13) |
| 4 | Gross vs. net agency revenue treatment (ASC 606 / IFRS 15) | Finance | 🟡 Open — needed before Sprint 2 ERP posting |

### Review remediation status (v1.0 → v1.1)

| Finding | Resolution |
|---------|-----------|
| B1 Two GDS adapters in Phase 1 | §2.2, §8.1, §8.4, ADR-008 — reduced to Sabre only |
| B2 Cross-GDS failover not implementable | §16.1, ADR-008 — removed |
| B3 ARC/IATA accreditation absent; ticketing a TBD | §8.3, ADR-009 — **DECIDED: Model B (host agency) 2026-09-10**; `PENDING_ISSUE` state added; `TICKETING_QUEUE` issuance model |
| B4 Ticket ↔ segment modelled one-to-one | §5.1, §5.2, ADR-010 — `TICKET → COUPON → SEGMENT` |
| B5 Redis as idempotency authority | §3.1, §5.4, §8.6, ADR-011 — moved to PostgreSQL |
| B6 Partial failure not a state | §5.3.1, §16.2, ADR-012 — `CONFIRM_EXCEPTION` + ops queue |
| S1 No refund entity | §5.2 — `refund` table added |
| S2 No penalty field | §5.2, §6.1, §6.4 — persisted and exposed; the example now reconciles |
| S3 Form of payment not stored | §5.2 — `booking.payment_reference`, carried onto `refund` |
| S4 Financial event currency ambiguity | §5.2 — three denominated amounts + FX rates + period |
| S5 No `correlation_id` on financial event | §5.2, §11.1 — added |
| S6 Missing hold / void expiry columns | §5.2 — `hold_expires_at`, `void_window_expires_at` |
| M1 Booking state machine missing | §5.3 — three machines with guards, side effects, compensations |
| M2 No reconciliation job | §8.8, §5.4, §11.3 — drift detection with exception queue |
| M3 Webhook spec incomplete | §8.7 — all four constraints; no longer deferred |
| M4 No transactional outbox | P2, §5.4, §7.1, ADR-013 |
| M5 Debit memo handling absent | §13 — explicit Phase 2 item; `DEBIT_MEMO` event type reserved |
| M6 No specificity ranking in rule schema | §9.2, §9.3, §6.7 — `scope_level` + resolution algorithm |
| C1 Override mutates an immutable table | §5.2, §9.5, ADR-014 — `policy_override` append-only |
| C2 Three allocation granularities | §5.2, ADR-003 — attribution / declaration / storage separated |
| C3 No link from reversal to original allocation | §5.2 — `reverses_allocation_id` |
| C4 Org hierarchy hard dependency | §2.3, §16.1 — cached with 24 h bound + provenance stamped |
| C5 "20 dimensions", 21 listed, one nullable | §5.2 — corrected and enumerated D1–D22 |
| C6 MFA contradiction | §3.1, §10.1 — mandatory for ADMIN/APPROVER |
| C7 GBP example against a USD-only Phase 1 | §6, §7.3 — corrected |
| Scope: 6 services + MSK | §2.1, §3, §4, §12, ADR-013 — two deployables + outbox |
| Scope: TS + Java split | Retained per Inception decision; now defines the deployable boundary (§3.2, ADR-013) |

### Sign-off

| Role | Name | Decision | Date |
|------|------|----------|------|
| Architect | _pending_ | ☐ APPROVE / ☐ APPROVE_WITH_MODIFICATION / ☐ REJECT | |
| Product Owner | _pending_ | ☐ APPROVE / ☐ APPROVE_WITH_MODIFICATION / ☐ REJECT | |

Per AGENTS.md: Architect and PO approval required before implementation planning (User Stories phase) begins.

> **Recommended gate condition:** approval is conditional on open item #1 (ADR-009). Every other
> review finding is resolved in this revision; ticketing authority is the one decision the
> architecture cannot make on the programme's behalf.
