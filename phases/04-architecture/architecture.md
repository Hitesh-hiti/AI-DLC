# TravelPlatform — Phase 1 Architecture Design

**Document Version:** 1.0  
**Date:** 2026-09-04  
**Status:** DRAFT — Pending Architect + PO Approval  
**Source:** gap-analysis.md v0.3 (all critical and minor gaps resolved)  
**Phase:** Architecture Design (SDLC Phase 4)

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

---

## 1. ARCHITECTURAL PRINCIPLES

These principles are non-negotiable and apply to every service, schema, and integration decision.

| # | Principle | Rationale |
|---|-----------|-----------|
| P1 | **API-first** — every capability is exposed via a versioned REST API before any UI is built | Enables parallel development, testability, and future channel extension |
| P2 | **Event-driven integration** — services communicate state changes via events, not synchronous coupling | Decouples domains; enables audit trail, replay, and async processing |
| P3 | **Transaction spine is append-only** — Trip/Booking/Ticket records are never updated, only superseded | Financial integrity, GDPR-safe erasure, audit immutability |
| P4 | **Identifiers are internal and opaque** — ULID/UUIDv7, tenant-scoped; supplier IDs never used as keys | GDS record locators recycle; ticket numbers change on exchange |
| P5 | **Dimensions captured at write time** — all 20 reporting dimensions stamped on the financial event at booking | Cannot be reconstructed retroactively after org restructuring |
| P6 | **Idempotency on every outbound call** — one idempotency key per supplier call, stored and checked | Prevents double-booking and double-issuance on retries |
| P7 | **Policy evaluated synchronously at booking** — policy decision snapshotted onto booking immutably | Ensures reproducible audit; policy changes don't alter historical decisions |
| P8 | **PII by pointer** — raw PII never embedded in transactions; stored in a separate PII store referenced by ID | GDPR right-to-erasure without breaking the financial ledger |
| P9 | **Multi-tenancy enforced at repository layer** — tenant_id on every entity; cross-tenant resolution impossible by construction | Prevents data leakage; enables SaaS model |
| P10 | **Ancillaries are first-class** — never folded into fare; independent EMD, refundability, tax breakdown, financial leg | Independent servicing, refunding, allocation; unrecoverable if merged into fare |

---

## 2. DOMAIN BOUNDARIES

### 2.1 Phase 1 Capability Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TravelPlatform                               │
│                                                                     │
│  ┌──────────────────────────────────────┐                           │
│  │         EXPERIENCE (FULL)            │  ← Phase 1 primary        │
│  │  Shop · Book · Hold · Confirm ·      │                           │
│  │  Cancel · Ticket · Trip Management  │                           │
│  └──────────────┬───────────────────────┘                           │
│                 │ calls                                             │
│   ┌─────────────▼──────────┐  ┌──────────────────────────────────┐ │
│   │   POLICY  (thin)       │  │   PAYMENT & EXPENSE (thin)       │ │
│   │  Evaluate · Snapshot   │  │  Ledger · Refund state machine   │ │
│   └────────────────────────┘  └──────────────────────────────────┘ │
│   ┌────────────────────────┐  ┌──────────────────────────────────┐ │
│   │   CONTENT  (thin)      │  │   SERVICING  (thin)              │ │
│   │  GDS normalisation     │  │  Cancel · Void · Refund request  │ │
│   └────────────────────────┘  └──────────────────────────────────┘ │
│   ┌────────────────────────────────────────────────────────────┐   │
│   │                   DATA  (spine)                            │   │
│   │  Trip · Booking · Segment · Ticket · FinancialLeg ·        │   │
│   │  Allocation · SupplierMapping · PolicySnapshot · Event     │   │
│   └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Bounded Context Definitions

#### EXPERIENCE
- **Responsibility:** End-to-end traveler journey — search, shop, select, book, hold, confirm, view, cancel
- **Owns:** Booking orchestration, traveler session, search context
- **Consumes:** Content (normalized fares/availability), Policy (evaluation result), Payment (authorization token), Data (Trip/Booking write)
- **Phase 1 scope:** Full implementation
- **API prefix:** `/v1/trips`, `/v1/bookings`, `/v1/search`

#### CONTENT
- **Responsibility:** Normalize heterogeneous GDS responses to canonical platform models
- **Owns:** GDS adapter implementations (Amadeus, Sabre), fare normalization, availability caching
- **Phase 1 scope:** Thin layer — air only; Amadeus (RoW) + Sabre (US)
- **API prefix:** `/v1/content/availability`, `/v1/content/fares`

#### POLICY
- **Responsibility:** Evaluate declarative policy rules at booking decision points; produce immutable decision snapshots
- **Owns:** Rule store, evaluator engine, decision audit log, override workflow
- **Phase 1 scope:** Thin layer — synchronous evaluation; rules authored as data by engineering
- **API prefix:** `/v1/policy/evaluate`

#### PAYMENT & EXPENSE
- **Responsibility:** Financial ledger, settlement events, refund state machine, cost allocation, expense reversal
- **Owns:** Financial event ledger (append-only), refund lifecycle, cost allocation splits
- **Phase 1 scope:** Thin layer — ledger writes, refund requested/confirmed states; no gateway integration
- **API prefix:** `/v1/ledger`, `/v1/refunds`

#### SERVICING
- **Responsibility:** Post-booking lifecycle — voluntary cancel, void, refund request, disruption intake
- **Owns:** Servicing request workflow, supplier cancel/void calls, refund initiation
- **Phase 1 scope:** Thin layer — cancel and void operations only
- **API prefix:** `/v1/service`

#### DATA
- **Responsibility:** Transaction spine storage, event sourcing, query APIs for Trip/Booking/Ticket state
- **Owns:** Canonical entity schemas (Trip, Booking, Segment, Ticket, Financial Leg, Allocation, Supplier Mapping)
- **Phase 1 scope:** Full implementation (core spine required by all other domains)
- **API prefix:** `/v1/data/trips`, `/v1/data/bookings`

### 2.3 Federated Reference Data (Not Owned by Spine)

| Domain | System | Integration |
|--------|--------|-------------|
| Traveler Profile | HR / Identity Platform | Read via Profile Service API; PII stored by pointer |
| Policy Definitions | Policy Config Store | Versioned YAML/JSON rule files; loaded at evaluator startup |
| Org Hierarchy | HR / Identity Platform | Queried synchronously at booking confirmation to snapshot dimensions |
| ERP / GL | Financial System | Outbound posting event only; no read-back in Phase 1 |
| Reporting Mart | Analytics Platform | Derived from event stream; no write-back to spine |

---

## 3. TECHNOLOGY STACK

### 3.1 Recommended Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API Gateway** | Kong or AWS API Gateway | Rate limiting, auth, routing, per-tenant config |
| **Backend Services** | Node.js (TypeScript) or Java 21 (Spring Boot 3) | Strong ecosystem for REST + event streaming; TypeScript preferred for Experience/Content; Java for financial domains |
| **Event Streaming** | Apache Kafka (managed: Confluent Cloud or MSK) | Ordered, durable, replayable events; idempotent consumers |
| **Primary Database** | PostgreSQL 16 (RDS/Aurora) | ACID, JSON columns for typed segment payloads, append-only patterns |
| **Event Store** | PostgreSQL (append-only events table) or EventStoreDB | Event sourcing for spine entities; PostgreSQL preferred to minimize ops overhead in Phase 1 |
| **Cache** | Redis (ElastiCache) | Session state, fare availability cache, idempotency key store |
| **Search / Availability** | GDS APIs (Amadeus REST, Sabre REST) | Real-time availability — no local fare cache in Phase 1 |
| **Identity / Auth** | Auth0 or AWS Cognito | OIDC/OAuth 2.0; tenant-scoped JWT; MFA for admin roles |
| **PII Store** | Separate PostgreSQL schema, encrypted at rest | PII pointer model; isolated for GDPR erasure |
| **Secret Management** | AWS Secrets Manager or HashiCorp Vault | GDS credentials, API keys; never in environment variables or code |
| **Infrastructure** | AWS (primary cloud) | ECS Fargate (containers), RDS Aurora, MSK, ElastiCache, S3, CloudWatch |
| **IaC** | Terraform | All infrastructure as code; no manual cloud console provisioning |
| **CI/CD** | GitHub Actions | PR validation, test gates, deploy pipelines |
| **Observability** | OpenTelemetry + Datadog (or CloudWatch) | Traces, metrics, logs; correlation ID propagation |
| **API Docs** | OpenAPI 3.1 (Swagger UI) | Machine-readable contracts; auto-generated from code annotations |

### 3.2 Language Decision

- **TypeScript (Node.js)** — Experience, Content, Policy, Notification services
  - Fast iteration, strong typing, excellent HTTP client ecosystem
- **Java 21 (Spring Boot 3)** — Payment & Expense, Data/Spine service
  - Stronger transactional guarantees, mature financial processing libraries
- **Both** follow the same API contract standards and event schema conventions

### 3.3 Coding Conventions (enforced via linter/CI)

- All monetary amounts: `integer` (minor units), never `float` or `decimal`
- All identifiers: `ULID` (sortable) or `UUIDv7`
- All timestamps: `ISO 8601` UTC (`2026-09-04T10:30:00Z`)
- All currency codes: `ISO 4217` 3-letter (`USD`, `EUR`, `GBP`)
- All IATA codes: uppercase string, no normalization at runtime
- Secrets: never logged, never in response bodies, never in URLs
- Tenant ID: first-class field on every entity, validated in every repository query

---

## 4. SYSTEM CONTEXT DIAGRAM

```
                         ┌─────────────────────────────┐
                         │        TRAVELER / UI         │
                         │  (Web App / Mobile / API)    │
                         └──────────────┬──────────────┘
                                        │ HTTPS
                         ┌──────────────▼──────────────┐
                         │        API GATEWAY           │
                         │  Auth · Rate limit · Route   │
                         └──┬───────┬──────┬───────────┘
                            │       │      │
               ┌────────────▼─┐  ┌──▼───┐ ┌▼──────────────┐
               │  EXPERIENCE  │  │POLICY│ │   CONTENT      │
               │   Service    │  │  Svc │ │  (GDS Adapter) │
               └──────┬───────┘  └──┬───┘ └──────┬─────────┘
                      │             │             │ REST
                      │        ┌────▼────┐   ┌───▼──────────────┐
                      │        │ Policy  │   │  Amadeus API      │
                      │        │  Store  │   │  Sabre API        │
                      │        └─────────┘   └──────────────────┘
                      │
          ┌───────────▼──────────────────────┐
          │          DATA SERVICE             │
          │  (Transaction Spine — Postgres)  │
          └───────────┬──────────────────────┘
                      │ Events (Kafka)
          ┌───────────▼──────────────────────┐
          │    PAYMENT & EXPENSE SERVICE     │
          │   (Ledger · Refund SM · Alloc)   │
          └───────────┬──────────────────────┘
                      │
          ┌───────────▼──────────────────────┐
          │         SERVICING SERVICE        │
          │   (Cancel · Void · Refund req)   │
          └──────────────────────────────────┘

External:
  ─ HR/Identity Platform  (traveler profile, org hierarchy)
  ─ ERP / GL System       (financial posting — outbound only)
  ─ Reporting Mart        (event stream consumer — outbound only)
  ─ Notification Service  (email, in-app — event-driven)
```

---

## 5. DATA MODEL

### 5.1 Transaction Spine Entity Relationship

```
TENANT
  └─► TRIP (1..n per tenant/traveler)
        └─► BOOKING (1..n per trip)
              ├─► SUPPLIER_MAPPING (append-only, 1..n per booking)
              ├─► APPROVAL (0..1 per booking)
              ├─► POLICY_DECISION_SNAPSHOT (1 per booking, immutable)
              └─► SEGMENT (1..n per booking)
                    ├─► TICKET (1..n per segment/passenger)
                    │     ├─► FINANCIAL_LEG (1..n per ticket)
                    │     │     └─► COST_ALLOCATION (1..n per financial leg)
                    │     └─► ANCILLARY (0..n per passenger+segment)
                    │           ├─► FINANCIAL_LEG (1 per ancillary)
                    │           └─► COST_ALLOCATION (1..n per ancillary leg)
                    └─► TYPED_SEGMENT_PAYLOAD (1 per segment, versioned)
```

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
  traveler_id     TEXT        NOT NULL,          -- PII pointer
  status          TEXT        NOT NULL,          -- DRAFT|HELD|CONFIRMED|COMPLETED|CANCELLED|EXPIRED
  correlation_id  TEXT        NOT NULL,          -- Spans shop→ticket→settlement
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, booking_id),
  FOREIGN KEY (tenant_id, trip_id) REFERENCES trip(tenant_id, trip_id)
);
```

#### SUPPLIER_MAPPING (append-only — never update or delete)
```sql
CREATE TABLE supplier_mapping (
  id              BIGSERIAL   PRIMARY KEY,
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  supplier_code   TEXT        NOT NULL,          -- e.g. AMADEUS, SABRE
  reference_type  TEXT        NOT NULL,          -- GDS_LOCATOR|AIRLINE_LOCATOR|TICKET_NUMBER|NDC_ORDER_ID|SETTLEMENT_REF
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

#### TICKET
```sql
CREATE TABLE ticket (
  ticket_id           TEXT        NOT NULL,      -- ULID
  tenant_id           TEXT        NOT NULL,
  booking_id          TEXT        NOT NULL,
  segment_id          TEXT        NOT NULL,
  traveler_id         TEXT        NOT NULL,      -- PII pointer
  status              TEXT        NOT NULL,      -- PENDING_ISSUE|ISSUED|VOIDED|REFUND_REQUESTED|REFUNDED
  base_fare_amount    BIGINT      NOT NULL,      -- Integer minor units
  base_fare_currency  TEXT        NOT NULL,      -- ISO 4217
  total_amount        BIGINT      NOT NULL,      -- base fare + Σ taxes + Σ fees (invariant enforced)
  total_currency      TEXT        NOT NULL,
  sale_currency       TEXT        NOT NULL,
  settlement_currency TEXT        NOT NULL,
  reporting_currency  TEXT        NOT NULL,
  fx_rate_sale_to_settlement NUMERIC(18,8),
  fx_rate_sale_to_reporting  NUMERIC(18,8),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, ticket_id)
);

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
  cost_object     TEXT        NOT NULL,          -- WBS/project/department/GL
  cost_object_type TEXT       NOT NULL,          -- WBS|PROJECT|DEPARTMENT|GL
  split_basis     TEXT        NOT NULL,          -- PERCENTAGE|FIXED_AMOUNT
  split_value     NUMERIC(10,4) NOT NULL,        -- % (0–100) or fixed minor units
  allocated_amount BIGINT     NOT NULL,          -- Computed, integer minor units (largest-remainder)
  priority        INTEGER     NOT NULL,          -- Lowest priority absorbs rounding remainder
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, allocation_id)
);
```

> **Invariant (test-enforced):** `Σ cost_allocation.allocated_amount = financial_leg.amount` for each leg (minor units, no silent rounding).

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

#### POLICY_DECISION_SNAPSHOT (immutable once written)
```sql
CREATE TABLE policy_decision_snapshot (
  snapshot_id     TEXT        NOT NULL,          -- ULID
  tenant_id       TEXT        NOT NULL,
  booking_id      TEXT        NOT NULL,
  evaluated_at    TIMESTAMPTZ NOT NULL,
  outcome         TEXT        NOT NULL,          -- BLOCK|REQUIRE_APPROVAL|WARN|ALLOW
  matched_rules   JSONB       NOT NULL,          -- Array of {rule_id, rule_version, enforcement_level, rationale}
  override_reason TEXT,                          -- Populated if outcome overridden by approver
  override_actor  TEXT,                          -- PII pointer to approver
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, snapshot_id)
  -- No UPDATE or DELETE ever issued on this table
);
```

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
  tenant_id             TEXT        NOT NULL,
  legal_entity          TEXT        NOT NULL,
  traveler_id           TEXT        NOT NULL,    -- PII pointer
  department            TEXT        NOT NULL,
  cost_centre           TEXT        NOT NULL,
  cost_object           TEXT        NOT NULL,
  trip_purpose          TEXT        NOT NULL,
  policy_outcome        TEXT        NOT NULL,
  override_reason_code  TEXT,
  supplier_code         TEXT        NOT NULL,
  carrier_code          TEXT        NOT NULL,
  market_origin         TEXT        NOT NULL,
  market_destination    TEXT        NOT NULL,
  cabin_class           TEXT        NOT NULL,    -- Y|W|C|F
  fare_class            TEXT        NOT NULL,
  booking_channel       TEXT        NOT NULL,
  advance_purchase_days INTEGER     NOT NULL,    -- Computed at booking time
  sale_currency         TEXT        NOT NULL,
  settlement_currency   TEXT        NOT NULL,
  reporting_currency    TEXT        NOT NULL,
  booking_date          DATE        NOT NULL,
  travel_date           DATE        NOT NULL,
  amount                BIGINT      NOT NULL,    -- Minor units
  event_type            TEXT        NOT NULL,    -- TICKET_ISSUED|VOID|REFUND_REQUESTED|REFUNDED|ANCILLARY_ISSUED
  reference_id          TEXT        NOT NULL,    -- ticket_id or ancillary_id
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, event_id)
);
```

> All 20 required reporting dimensions are non-nullable on this table. Profile, policy, and org hierarchy services are queried synchronously during booking confirmation to populate these values. Values are immutable once written.

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
      "supplier_code": "AMADEUS",
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
  "supplier_references": [
    {
      "supplier_code": "AMADEUS",
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
  "cost_allocations": [
    {
      "traveler_id": "tvl_01J...",
      "cost_object": "WBS-2026-PROJ-042",
      "cost_object_type": "WBS",
      "split_basis": "PERCENTAGE",
      "split_value": 100,
      "priority": 1
    }
  ]
}
```

**Response 200:**
```json
{
  "booking_id": "bkg_01J...",
  "status": "CONFIRMED",
  "tickets": [
    {
      "ticket_id": "tkt_01J...",
      "traveler_id": "tvl_01J...",
      "status": "ISSUED",
      "supplier_references": [
        {
          "reference_type": "TICKET_NUMBER",
          "reference_value": "0012345678901"
        }
      ],
      "total": { "amount": 36310, "currency": "USD" }
    }
  ],
  "policy_decision_snapshot_id": "pds_01J...",
  "confirmed_at": "2026-09-04T10:35:00Z"
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
    "refundable_amount": { "amount": 27810, "currency": "USD" },
    "non_refundable_amount": { "amount": 8500, "currency": "USD" },
    "tax_breakdown": [
      { "tax_code": "US", "amount": 3750, "is_refundable": true },
      { "tax_code": "AY", "amount": 560, "is_refundable": false }
    ]
  },
  "cancelled_at": "2026-09-04T18:00:00Z"
}
```

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
  "status": "REFUND_REQUESTED",
  "refund_amount": { "amount": 27810, "currency": "USD" },
  "return_to": "ORIGINAL_FORM_OF_PAYMENT",
  "created_at": "2026-09-04T18:05:00Z"
}
```

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
    "supplier_code": "AMADEUS",
    "route": "LHR-JFK"
  }
}
```

**Response 200:**
```json
{
  "outcome": "WARN",
  "matched_rules": [
    {
      "rule_id": "rule_cost_cap_01",
      "rule_version": "1.2.0",
      "enforcement_level": "WARN",
      "rationale": "Total fare USD 363.10 exceeds preferred cap of USD 315.00 by 15%"
    }
  ],
  "requires_approval": false,
  "blocking_rules": []
}
```

---

## 7. EVENT CATALOG

All events are published to Kafka. Schema format: JSON with Avro schema registry for production; JSON Schema for Phase 1.

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

| Event | Topic | Producer | Consumers | Trigger |
|-------|-------|----------|-----------|---------|
| `BookingCreated` | `travel.bookings` | Experience | Data, Policy, Notification | Booking record created (DRAFT) |
| `BookingHeld` | `travel.bookings` | Experience | Data, Payment, Notification | GDS hold confirmed (HELD) |
| `PolicyDecisionRecorded` | `travel.policy` | Policy | Data, Notification | Policy evaluated at booking time |
| `ApprovalRequested` | `travel.approvals` | Experience | Notification, Approval Workflow | Policy outcome = REQUIRE_APPROVAL |
| `ApprovalDecided` | `travel.approvals` | Approval | Experience, Notification | Approver APPROVED/REJECTED/EXPIRED |
| `BookingConfirmed` | `travel.bookings` | Experience | Data, Payment, Reporting | Ticket issued (CONFIRMED) |
| `TicketIssued` | `travel.tickets` | Experience | Data, Payment, Reporting | GDS ticket issued (ISSUED) |
| `FinancialEventRecorded` | `travel.financial` | Payment | Reporting, ERP Posting | Ticket issued, all 20 dimensions stamped |
| `BookingCancelled` | `travel.bookings` | Servicing | Data, Payment, Notification | Booking cancelled |
| `TicketVoided` | `travel.tickets` | Servicing | Data, Payment, Notification | Void within ARC same-day window |
| `RefundRequested` | `travel.refunds` | Servicing | Data, Payment, Notification | Refund requested outside void window |
| `RefundConfirmed` | `travel.refunds` | Payment | Data, Expense Reversal, Reporting, Notification | Refund confirmed by settlement |
| `BookingExpired` | `travel.bookings` | Scheduler | Data, Notification, GDS Release | Hold or approval timer expired |
| `SupplierWebhookReceived` | `travel.supplier-events` | Content (webhook consumer) | Experience, Servicing | Async GDS push notification |
| `CostAllocationRecorded` | `travel.allocation` | Payment | Reporting, ERP Posting | Cost allocation written at confirm |

### 7.3 Key Event Payloads

#### BookingConfirmed (financial dimensions stamped here)
```json
{
  "booking_id": "bkg_01J...",
  "trip_id": "trip_01J...",
  "tenant_id": "tenant_abc",
  "legal_entity": "ACME_CORP_UK",
  "traveler_id": "tvl_01J...",
  "department": "ENGINEERING",
  "cost_centre": "CC-ENG-042",
  "cost_object": "WBS-2026-PROJ-042",
  "trip_purpose": "CLIENT_MEETING",
  "policy_outcome": "WARN",
  "override_reason_code": null,
  "supplier_code": "AMADEUS",
  "carrier_code": "BA",
  "market_origin": "LHR",
  "market_destination": "JFK",
  "cabin_class": "Y",
  "fare_class": "Q",
  "booking_channel": "WEB",
  "advance_purchase_days": 41,
  "sale_currency": "USD",
  "settlement_currency": "USD",
  "reporting_currency": "GBP",
  "booking_date": "2026-09-04",
  "travel_date": "2026-10-15",
  "total_amount": 36310,
  "tickets": ["tkt_01J..."]
}
```

#### RefundConfirmed
```json
{
  "refund_id": "rfnd_01J...",
  "ticket_id": "tkt_01J...",
  "booking_id": "bkg_01J...",
  "refund_amount": 27810,
  "currency": "USD",
  "return_to": "ORIGINAL_FORM_OF_PAYMENT",
  "original_allocations": [
    { "cost_object": "WBS-2026-PROJ-042", "reversed_amount": 27810 }
  ],
  "confirmed_at": "2026-09-05T09:00:00Z"
}
```

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
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐   ┌────────┐
│Amadeus │   │ Sabre  │
│Adapter │   │Adapter │
└───┬────┘   └───┬────┘
    │             │
    ▼             ▼
Amadeus      Sabre Dev
for Devs     Studio API
REST API     REST API
```

### 8.2 GdsAdapter Interface Contract

```typescript
interface GdsAdapter {
  // Shop availability
  searchAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse>;

  // Create booking hold
  createHold(request: HoldRequest): Promise<HoldResponse>;

  // Issue ticket (confirm booking)
  issueTicket(request: IssueRequest): Promise<IssueResponse>;

  // Cancel / void
  cancelBooking(request: CancelRequest): Promise<CancelResponse>;
  voidTicket(request: VoidRequest): Promise<VoidResponse>;

  // Retrieve existing booking
  retrieveBooking(request: RetrieveRequest): Promise<RetrieveResponse>;

  // Supplier identity
  getSupplierCode(): string;          // "AMADEUS" | "SABRE"
  getCapabilityMatrix(): CapabilityMatrix;
}
```

### 8.3 Amadeus Adapter

| Aspect | Detail |
|--------|--------|
| API | Amadeus for Developers (REST/JSON) |
| Auth | OAuth 2.0 client credentials (`/v1/security/oauth2/token`) |
| Token TTL | 30 minutes; refresh proactively at 25 min |
| Availability | `GET /v2/shopping/flight-offers` |
| Hold (Order) | `POST /v1/booking/flight-orders` with `queuingOfficeId` |
| Issue | Amadeus does not issue tickets directly via REST in all markets — ticketing via GDS queue or separate BSP/ARC integration (document per capability matrix) |
| Cancel | `DELETE /v1/booking/flight-orders/{orderId}` |
| Retrieve | `GET /v1/booking/flight-orders/{orderId}` |
| Error mapping | HTTP 4xx/5xx → canonical `GdsAdapterException` with `error_code`, `retry_eligible` flag |
| Rate limits | Per client_id; configured in adapter independently; exponential backoff with jitter |
| Idempotency | Store idempotency key before call; check on retry before re-issuing |

### 8.4 Sabre Adapter

| Aspect | Detail |
|--------|--------|
| API | Sabre Dev Studio REST APIs |
| Auth | REST Token (ATH) flow: `POST /v2/auth/token` with base64 credentials |
| Token TTL | ATH tokens valid 7 days; refresh checked before each call |
| Availability | `POST /v1/shop/flights` (Bargain Finder Max) |
| Hold (PNR) | `POST /v1/passenger/records` |
| Issue | `POST /v1/air/filings` or via Sabre Ticketing queue |
| Cancel | `DELETE /v1/passenger/records/{confirmationId}` |
| Retrieve | `GET /v1/passenger/records/{confirmationId}` |
| Error mapping | Same canonical `GdsAdapterException` contract as Amadeus |
| Rate limits | Independent budget; configured per adapter |
| Idempotency | Same pattern as Amadeus |

### 8.5 Normalization Layer

All GDS responses are normalized to the platform canonical model before leaving the Content domain:

```
GDS Response (Amadeus/Sabre native JSON)
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
2. Store {idempotency_key, supplier_code, call_type, request_hash, status=PENDING} in idempotency store (Redis)
3. Issue supplier call
4. On success: update status=COMPLETE, store response
5. On failure:
   a. If supplier returns 4xx (non-retryable): mark FAILED, surface to caller
   b. If timeout / 5xx (retryable): exponential backoff with jitter, max 3 retries
   c. If still failed after retries: mark FAILED, raise alert
6. On retry of same idempotency_key: check store first — if COMPLETE, return cached response
```

### 8.7 Webhook Consumer

Async GDS notifications (push updates from Amadeus/Sabre):

```
GDS → POST /webhooks/gds-events (authenticated, HMAC-SHA256 signature)
    │
    ▼
WebhookIngestionService
    │  1. Validate HMAC signature
    │  2. Store raw payload (idempotency check on message_id)
    │  3. Publish SupplierWebhookReceived to Kafka
    ▼
Experience / Servicing consumers
    (handle booking updates, disruptions, price changes)
```

Event types to handle in architecture/Phase 2:
- Booking cancellation by supplier
- Schedule change / disruption notification
- Price change on held booking
- Ticket issuance confirmation

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
rules:
  - rule_id: rule_cost_cap_economy_intl
    rule_version: "1.0.0"
    description: "Warn if international economy fare exceeds USD 400"
    enforcement_level: WARN          # BLOCK | REQUIRE_APPROVAL | WARN | ALLOW
    scope:
      cabin_class: [Y]
      route_type: INTERNATIONAL
    condition:
      field: total_amount_usd
      operator: GREATER_THAN
      value: 40000                   # Minor units (USD 400.00)
    effective_from: "2026-01-01"
    effective_to: null               # null = no expiry

  - rule_id: rule_blocked_country_01
    rule_version: "1.0.0"
    description: "Block bookings to OFAC-sanctioned destinations"
    enforcement_level: BLOCK
    scope:
      destination_countries: [CU, IR, KP, SY]
    condition:
      field: destination_country
      operator: IN
      value: [CU, IR, KP, SY]
    effective_from: "2026-01-01"
    effective_to: null
```

### 9.3 PolicyDecision Object (returned + snapshotted)

```typescript
interface PolicyDecision {
  outcome: "BLOCK" | "REQUIRE_APPROVAL" | "WARN" | "ALLOW";
  matched_rules: Array<{
    rule_id: string;
    rule_version: string;
    enforcement_level: string;
    rationale: string;
  }>;
  blocking_rules: MatchedRule[];      // Non-empty when outcome = BLOCK
  approval_required_rules: MatchedRule[];
  warnings: MatchedRule[];
  evaluated_at: string;               // ISO 8601
}
```

### 9.4 Override Workflow

```
PolicyDecision.outcome = REQUIRE_APPROVAL
    │
    ▼
ApprovalRequested event published
    │
    ▼
Approver notified (email + in-app)
    │
    ▼
Approver action (Phase 1: API call; Phase 2: UI)
    │
    ├── APPROVED → BookingConfirmed flow continues; override recorded in snapshot
    ├── REJECTED → Booking status → CANCELLED; hold released to GDS
    └── EXPIRED  → Booking status → EXPIRED; hold released; traveler notified (never auto-approve)
```

---

## 10. SECURITY ARCHITECTURE

### 10.1 Authentication & Authorization

| Layer | Mechanism | Detail |
|-------|-----------|--------|
| Traveler / UI | OIDC (Auth0 / Cognito) | JWT; tenant claim in token; MFA optional Phase 1, required Phase 2 |
| Service-to-Service | mTLS + service account JWTs | API Gateway validates; services validate tenant claim |
| Admin / Approver | OIDC + role claim | `role: APPROVER`, `role: ADMIN`; enforced at API Gateway and service layer |
| GDS API credentials | AWS Secrets Manager | Rotated; never in code or environment variables; injected at runtime |
| Webhook inbound | HMAC-SHA256 signature validation | Shared secret per GDS; reject without valid signature |

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
| Immutable audit trail | `financial_event` table is append-only; no UPDATE/DELETE; database role enforced |
| Change management | All config/rule changes via PR + review; no direct production DB changes |
| Access logging | All admin and financial API calls logged with actor, timestamp, IP |

### 10.5 Secrets Management

- All GDS API credentials, database passwords, JWT signing keys stored in AWS Secrets Manager
- Secrets injected as environment variables at container startup via ECS task role
- Secret rotation enforced: GDS credentials rotated every 90 days; DB passwords every 30 days
- Never logged, never in API responses, never in URLs

---

## 11. OBSERVABILITY

### 11.1 Correlation ID Propagation

The `correlation_id` flows through every layer:

```
Client Request
  → API Gateway (generates if absent)
  → Service (extracts from header, attaches to all log lines)
  → Kafka Event (field in event envelope)
  → Downstream Service (extracts from event envelope)
  → GDS Adapter outbound call (X-Correlation-ID header)
  → Database query (pg_audit logs include correlation_id from app context)
```

### 11.2 Structured Logging

All log lines are JSON with mandatory fields:

```json
{
  "timestamp": "2026-09-04T10:30:00.123Z",
  "level": "INFO",
  "service": "experience-service",
  "correlation_id": "01J7KQZM...",
  "tenant_id": "tenant_abc",
  "booking_id": "bkg_01J...",
  "event": "BookingHeld",
  "duration_ms": 342,
  "supplier": "AMADEUS"
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
| `kafka.consumer.lag` | Gauge by topic | > 1000 messages |

### 11.4 Distributed Tracing

- OpenTelemetry SDK in all services
- Traces exported to Datadog APM (or AWS X-Ray)
- Every incoming request creates a root span; downstream calls create child spans
- GDS adapter calls create spans with `supplier`, `operation`, `idempotency_key` attributes
- `correlation_id` propagated as trace attribute for cross-system correlation

### 11.5 Health Checks

```
GET /health/live    → 200 if process is running
GET /health/ready   → 200 if DB, Kafka, and Redis connections are healthy
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
    ├── ECS Fargate — Experience Service
    ├── ECS Fargate — Content Service (GDS Adapters)
    ├── ECS Fargate — Policy Service
    ├── ECS Fargate — Payment & Expense Service
    ├── ECS Fargate — Servicing Service
    └── ECS Fargate — Data Service

Data Layer:
    ├── Aurora PostgreSQL (Multi-AZ, per-service database)
    ├── Amazon MSK (Kafka — 3 broker, multi-AZ)
    ├── ElastiCache Redis (cluster mode, idempotency + cache)
    └── S3 (raw GDS payloads, audit archives)

Supporting:
    ├── AWS Secrets Manager (credentials)
    ├── AWS CloudWatch + OpenTelemetry Collector
    ├── AWS KMS (encryption at rest)
    └── VPC with private subnets (services not internet-reachable)
```

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
- Modules: `vpc`, `ecs-service`, `aurora`, `msk`, `elasticache`, `api-gateway`, `secrets`
- Separate workspaces: `dev`, `staging`, `prod`
- No manual AWS console changes to infrastructure
- `terraform plan` output reviewed as part of PR for infrastructure changes

### 12.5 CI/CD Pipeline (GitHub Actions)

```
PR opened
    │
    ├── Lint (ESLint / Checkstyle)
    ├── Unit tests (Jest / JUnit)
    ├── Integration tests (Testcontainers — Postgres, Kafka, Redis)
    ├── Contract tests (Pact — between services)
    ├── Financial invariant tests (Σ allocation == amount, Σ taxes+fees+fare == total)
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
| Webhook consumer spec (event types, retry, DLQ) | Phase 1 — Architecture sub-task | Design in sprint 1 before any GDS webhook goes live |
| Approval workflow implementation (chain, escalation, UI) | Phase 2 | Phase 1: API-only, single approver |
| Notification channels (email + in-app full implementation) | Phase 2 | Phase 1: email stub only |
| Hotel / Car / Rail supplier adapters | Phase 2+ | GDS adapter interface already extensible |
| Phase 2 policy authoring UI | Phase 2 | Rules as data in Phase 1 |
| Canary deployment | Phase 2 | Blue-green sufficient for Phase 1 |
| Dedicated tenant infrastructure | Phase 2+ | Shared infra with logical isolation in Phase 1 |
| ERP / GL outbound posting | Phase 1 Sprint 2 | Stub in Sprint 1; implement in Sprint 2 |
| Reporting mart pipeline | Phase 2 | Financial events emitted from Phase 1; mart built in Phase 2 |
| PSD2/SCA enforcement | As needed | Required if EU card payments go live |
| NDC adapter support | Phase 2+ | Amadeus/Sabre NDC APIs differ from EDIFACT/REST shopping |

---

## 14. ARCHITECTURE DECISION RECORDS (ADRs)

### ADR-001: Internal Identifiers (ULID / UUIDv7)

- **Decision:** All entity IDs are system-generated ULIDs (or UUIDv7), tenant-scoped. Supplier IDs (PNRs, ticket numbers) are never primary keys.
- **Rationale:** GDS record locators recycle within supplier + time window. Ticket numbers change on exchange. Using supplier IDs as keys breaks within months of production use.
- **Consequences:** Supplier mapping table maintained as append-only reference set with `valid_from`/`valid_to`.

### ADR-002: Append-Only Financial Ledger

- **Decision:** `financial_event` and `supplier_mapping` tables are append-only. Financial facts are superseded (new record inserted, old marked SUPERSEDED), never updated.
- **Rationale:** Immutable audit trail required for SOX-style controls. GDPR erasure only deletes PII pointer records, not financial events.
- **Consequences:** All queries for "current" financial state must filter `status = ACTIVE` or use the latest event per aggregate.

### ADR-003: Cost Allocation at Passenger × Ticket Granularity

- **Decision:** Attribution unit is passenger × ticket, not booking or segment.
- **Rationale:** ARC/BSP settle and report at this granularity. Coarser granularity breaks reconciliation.
- **Consequences:** Every ticket must have at least one cost allocation. Invariant: Σ allocations = ticket amount (enforced in CI).

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

### ADR-008: Two GDS Adapters Behind Common Interface

- **Decision:** Amadeus (RoW) and Sabre (US) are implemented as separate adapters behind a common `GdsAdapter` interface. Routing is by tenant config or geography.
- **Rationale:** Adapter routing must be tenant-configurable. Normalizing at the interface boundary keeps Experience domain supplier-agnostic.
- **Consequences:** Adapter capability matrix must document per-adapter differences (NDC support, ticketing model, rate limits).

---

## 15. ERROR HANDLING & FAULT TAXONOMY

### 15.1 Error Response Format (RFC 7807 Problem Details)

All API errors return `application/problem+json`:

```json
{
  "type": "https://api.travelplatform.io/errors/gds-hold-failed",
  "title": "GDS Hold Failed",
  "status": 502,
  "detail": "Amadeus returned UNABLE_TO_PROCESS for PNR creation. Retry eligible.",
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
| `POLICY_BLOCKED` | 422 | No | Policy evaluation returned BLOCK | Review policy / request exception |
| `INVARIANT_VIOLATED` | 422 | No | Financial invariant check failed (Σ taxes+fees ≠ total) | Fix amounts |
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
| Amadeus API | Retry (3x) + exponential backoff + jitter | Backoff: 500ms, 1s, 2s; jitter ±10% |
| Sabre API | Retry (3x) + exponential backoff + jitter | Same backoff profile as Amadeus |
| Policy Service | Fail-fast (no retry) | Policy must return within 200ms; timeout = booking blocked |
| Payment Ledger | Retry (5x) + idempotency check | Financial write must succeed; DLQ after 5 failures |
| Kafka publish | Retry (3x) + DLQ | Producer acks=all; if DLQ, alert + manual replay |
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
| Amadeus for Developers API | GDS REST | Content Service | Critical (RoW availability) | Circuit breaker; Sabre fallback if tenant config allows |
| Sabre Dev Studio API | GDS REST | Content Service | Critical (US availability) | Circuit breaker; Amadeus fallback if tenant config allows |
| Auth0 / AWS Cognito | Identity | API Gateway, all services | Critical | Cached token validation (short window) |
| AWS Secrets Manager | Secret store | All services (startup) | Critical | Container fails to start if unavailable |
| HR / Identity Platform | Profile data | Experience, Data | High | Cached profile (TTL 15min); booking proceeds with cached snapshot |
| Org Hierarchy Service | Reporting dimensions | Data, Payment | High | Booking confirmation blocked if dimensions unavailable (data loss prevention) |
| ERP / GL System | Financial posting | Payment | Medium | DLQ; retry; manual reconciliation |
| Email provider (SES) | Notification | Notification Service | Medium | Queue; retry; degraded mode (in-app only) |

### 16.2 Internal Service Dependencies (Phase 1)

| Consumer | Depends On | Call Type | Failure Mode |
|----------|-----------|-----------|--------------|
| Experience | Content (GDS Adapter) | Sync REST | GDS_UNAVAILABLE returned to client |
| Experience | Policy Evaluator | Sync REST | Booking blocked (policy required) |
| Experience | Data Service | Sync REST | Booking fails (cannot persist) |
| Experience | Payment Service (ledger write) | Sync REST | Confirm fails; booking stays HELD |
| Servicing | Experience | Async (events) | Decoupled; processes when available |
| Payment | Data (financial events) | Sync REST | Financial write must not fail; retry + DLQ |
| Notification | All domains | Async (Kafka events) | Non-critical; degraded mode acceptable |

### 16.3 Runtime Library Dependencies

| Library | Language | Purpose | Justification |
|---------|----------|---------|---------------|
| `express` / `fastify` | TypeScript | HTTP server | Lightweight, mature REST framework |
| `spring-boot-starter-web` | Java | HTTP server | Standard Spring Boot REST |
| `kafkajs` / `spring-kafka` | Both | Kafka producer/consumer | Official Kafka client libraries |
| `pg` / `hibernate` | Both | PostgreSQL client | Standard DB clients |
| `ioredis` | TypeScript | Redis client | Idempotency store, cache |
| `opentelemetry-sdk` | Both | Distributed tracing | OTEL standard; no vendor lock-in |
| `zod` | TypeScript | Runtime schema validation | Type-safe validation at API boundaries |
| `ulid` | Both | ID generation | Sortable, opaque identifiers |
| `pact` | Both | Contract testing | Consumer-driven contract tests between services |
| `testcontainers` | Both | Integration testing | Spin up Postgres/Kafka/Redis in CI |

All dependencies pinned to exact versions in `package.json` / `pom.xml`. No open ranges.  
Dependency security scan (Snyk) runs on every PR.

---

## 17. ARCHITECTURE GUARDRAILS

These guardrails are binding on all developers, reviewers, and automated checks. Violations block PR merge.

### Financial Integrity (CI-enforced)
- `GUARDRAIL-F1` — `Σ ticket_tax.amount + Σ ticket_fee.amount + base_fare_amount = ticket.total_amount` — tested on every build
- `GUARDRAIL-F2` — `Σ cost_allocation.allocated_amount = financial_leg.amount` — tested on every build
- `GUARDRAIL-F3` — Monetary amounts are always `BIGINT` (minor units). No `FLOAT`, `DOUBLE`, or `DECIMAL` for money
- `GUARDRAIL-F4` — FX rates stored at transaction write time. No rate recomputation at read time
- `GUARDRAIL-F5` — Refund allocation reverses original split proportions exactly. No fresh split computation on refund or exchange

### Data Integrity
- `GUARDRAIL-D1` — `supplier_mapping`, `financial_event`, `policy_decision_snapshot` tables: no `UPDATE` or `DELETE` SQL ever issued
- `GUARDRAIL-D2` — `tenant_id` is the first argument of every repository method. No cross-tenant query possible
- `GUARDRAIL-D3` — PII fields (name, email, passport, DOB) never stored on spine entities. PII pointer model only
- `GUARDRAIL-D4` — All entity IDs are ULID or UUIDv7. Auto-increment integers not used for business entity keys
- `GUARDRAIL-D5` — Supplier identifiers (PNR, ticket number, locator) never used as primary keys

### API & Integration
- `GUARDRAIL-A1` — Every mutating API endpoint requires `Idempotency-Key` header (validated at API Gateway)
- `GUARDRAIL-A2` — Every API request and event carries `correlation_id` and `tenant_id`
- `GUARDRAIL-A3` — API responses never include stack traces, internal IDs of other tenants, or raw PII
- `GUARDRAIL-A4` — GDS credentials never hardcoded; always retrieved from Secrets Manager at runtime
- `GUARDRAIL-A5` — Outbound GDS calls always check idempotency store before issuing. Retry uses same idempotency key

### Security
- `GUARDRAIL-S1` — No raw PAN, CVV, or card number stored, logged, or transmitted by any service
- `GUARDRAIL-S2` — JWT tenant claim validated on every request. Service rejects token with missing/mismatched tenant claim
- `GUARDRAIL-S3` — Secrets never logged. Log sanitizer strips known secret patterns in CI test
- `GUARDRAIL-S4` — Webhook inbound calls rejected without valid HMAC-SHA256 signature
- `GUARDRAIL-S5` — All inter-service calls use mTLS. No plaintext HTTP between services in any environment

### Observability
- `GUARDRAIL-O1` — Every log line includes `correlation_id` and `tenant_id`
- `GUARDRAIL-O2` — Every outbound supplier call creates an OpenTelemetry span with `supplier`, `operation`, `idempotency_key`
- `GUARDRAIL-O3` — Health endpoints (`/health/live`, `/health/ready`) implemented by every service before deployment

### Policy
- `GUARDRAIL-P1` — Policy evaluation result is always snapshotted immutably onto the booking before confirmation proceeds
- `GUARDRAIL-P2` — `BLOCK` outcome from policy evaluator always prevents booking confirmation. No code path bypasses it
- `GUARDRAIL-P3` — Policy rule changes deployed via PR + review. No direct rule store edits in production

---

## 18. ARCHITECTURE-TO-REQUIREMENT MAPPING

This table maps each architecture component to its source requirement and the stories it will satisfy.

| Architecture Component | Source Requirement | Epic (placeholder) | Stories (placeholder) |
|----------------------|-------------------|--------------------|-----------------------|
| Experience Service — Search | "continuous experience from travel discovery and booking" | EPIC-EXP-01 | STORY-EXP-01 (search availability), STORY-EXP-02 (display fares) |
| Experience Service — Book/Hold | "Bookings shall remain fully serviceable throughout lifecycle" | EPIC-EXP-01 | STORY-EXP-03 (create booking), STORY-EXP-04 (hold with GDS) |
| Experience Service — Confirm | "Payment...processes shall be integrated with the travel lifecycle" | EPIC-EXP-01 | STORY-EXP-05 (confirm + issue ticket), STORY-EXP-06 (cost allocation) |
| Experience Service — Cancel | "including voluntary changes, cancellations...refunds" | EPIC-SVC-01 | STORY-SVC-01 (cancel booking), STORY-SVC-02 (void ticket) |
| Content Service — GDS Adapters | "connect directly or indirectly with travel suppliers and normalize" | EPIC-CNT-01 | STORY-CNT-01 (Amadeus adapter), STORY-CNT-02 (Sabre adapter) |
| Content Service — Normalization | "normalize heterogeneous supplier capabilities into consistent models" | EPIC-CNT-01 | STORY-CNT-03 (fare normalization), STORY-CNT-04 (segment mapping) |
| Policy Evaluator | "Organizational policies shall be evaluated at the point of travel decision-making" | EPIC-POL-01 | STORY-POL-01 (evaluate rules), STORY-POL-02 (decision snapshot), STORY-POL-03 (override workflow) |
| Policy Rule Store | "configuration-driven policy" | EPIC-POL-01 | STORY-POL-04 (rule schema), STORY-POL-05 (rule versioning) |
| Transaction Spine (Data Service) | "All platform interactions shall contribute to a trusted Travel Context" | EPIC-DAT-01 | STORY-DAT-01 (Trip entity), STORY-DAT-02 (Booking entity), STORY-DAT-03 (Segment/Ticket entity) |
| Financial Ledger | "Payment, settlement, refund...processes shall be integrated" | EPIC-PAY-01 | STORY-PAY-01 (financial event), STORY-PAY-02 (cost allocation) |
| Refund State Machine | "refunds and rebooking, without loss of...financial context" | EPIC-PAY-01 | STORY-PAY-03 (void), STORY-PAY-04 (refund requested → confirmed) |
| Approval Workflow | "required approvals...before transactions are completed" | EPIC-POL-01 | STORY-POL-06 (approval states), STORY-POL-07 (expiry + release) |
| Supplier Mapping (append-only) | "without loss of...supplier...context" | EPIC-DAT-01 | STORY-DAT-04 (supplier reference mapping) |
| Idempotency Layer | "must support idempotency, retries...controlled recovery from partial failures" | EPIC-INFRA-01 | STORY-INFRA-01 (idempotency key store), STORY-INFRA-02 (retry strategy) |
| PII Pointer Model | "security, privacy...and governed data" | EPIC-SEC-01 | STORY-SEC-01 (PII store), STORY-SEC-02 (GDPR erasure) |
| Financial Event (20 dimensions) | "All platform interactions shall contribute to...relevant audit information" | EPIC-DAT-01 | STORY-DAT-05 (reporting dimensions), STORY-DAT-06 (event emission) |
| Correlation ID infrastructure | "distributed observability" | EPIC-INFRA-01 | STORY-INFRA-03 (correlation propagation) |
| Multi-tenant isolation | "extensible ecosystem...enterprise" | EPIC-INFRA-01 | STORY-INFRA-04 (tenant scoping) |
| Circuit Breaker / Resilience | "resilience...recoverability and transaction integrity" | EPIC-INFRA-01 | STORY-INFRA-05 (circuit breaker), STORY-INFRA-06 (DLQ handling) |
| Immutable Audit Trail | "SOX-style controls, immutable audit trail" | EPIC-SEC-01 | STORY-SEC-03 (append-only ledger), STORY-SEC-04 (audit log) |

> **Note:** Epic and Story IDs are placeholders per AGENTS.md output discipline. Real IDs assigned when Jira/Zephyr project is created in the User Stories phase.

---

## APPROVAL GATE

**Status:** DRAFT — requires sign-off before implementation planning proceeds.

| Role | Name | Decision | Date |
|------|------|----------|------|
| Architect | _pending_ | ☐ APPROVE / ☐ APPROVE_WITH_MODIFICATION / ☐ REJECT | |
| Product Owner | _pending_ | ☐ APPROVE / ☐ APPROVE_WITH_MODIFICATION / ☐ REJECT | |

Per AGENTS.md: Architect and PO approval required before implementation planning (User Stories phase) begins.
