---
inclusion: always
---
 
# Kiro Agent Routing Framework — Project Configuration
## Project: TravelPlatform
 
This file is the project-specific configuration layer of the Kiro Agent Routing Framework.
It contains only TravelPlatform-specific context, resources, lifecycle mappings, and optional model overrides.
 
Generic routing logic, phase detection, and model policy live in the framework agents and framework-model-policy.md.
 
To adapt this framework to a different project, replace only this file.
 
---
 
## 1. Project Identity
 
Project Name    : TravelPlatform
Project Type    : Enterprise SaaS — Multi-tenant Travel Management Platform
Lifecycle       : SDLC
Active Phase    : Architecture Design — COMPLETE (pending Architect + PO approval)
Repository      : TBD — assigned at development phase kick-off
 
---
 
## 2. Technology Stack
 
Status: DECIDED — approved in Architecture Design phase (architecture.md v1.0)
 
Backend (Experience/Content/Policy)  : TypeScript — Node.js (Fastify)
Backend (Payment & Expense / Data)   : Java 21 — Spring Boot 3
Event Streaming                      : Apache Kafka (Confluent Cloud or AWS MSK)
Primary Database                     : PostgreSQL 16 (AWS Aurora — per-service schema)
Cache / Idempotency Store            : Redis (AWS ElastiCache — cluster mode)
Identity / Auth                      : Auth0 or AWS Cognito (OIDC / OAuth 2.0)
Secret Management                    : AWS Secrets Manager
Infrastructure                       : AWS (ECS Fargate, Aurora, MSK, ElastiCache, S3, KMS)
IaC                                  : Terraform
CI/CD                                : GitHub Actions
Observability                        : OpenTelemetry + Datadog (or AWS CloudWatch)
API Documentation                    : OpenAPI 3.1 (Swagger UI)
 
---
 
## 3. Project Source Structure
 
Status: NOT YET CREATED — scaffold generated in Development phase.
 
Planned layout (monorepo):
 
  /services
    /experience-service      (TypeScript / Fastify)
    /content-service         (TypeScript / Fastify — GDS adapters)
    /policy-service          (TypeScript / Fastify)
    /payment-service         (Java 21 / Spring Boot 3)
    /data-service            (Java 21 / Spring Boot 3)
    /servicing-service       (TypeScript / Fastify)
  /libs
    /canonical-models        (shared TypeScript types)
    /event-schemas           (Kafka event schemas — JSON Schema)
    /idempotency             (shared idempotency key utilities)
  /infra
    /terraform               (all IaC modules)
  /docs
    /openapi                 (OpenAPI 3.1 specs per service)
  phases/                    (SDLC phase artifacts)
 
---
 
## 4. Database Schema
 
Status: DESIGNED — canonical entity schemas defined in architecture.md §5.
 
Key tables (PostgreSQL, per-service schema, tenant-scoped):
  trip, booking, supplier_mapping (append-only), segment, segment_payload,
  ticket, ticket_tax, ticket_fee, financial_leg, cost_allocation,
  ancillary, ancillary_tax, policy_decision_snapshot, approval, financial_event
 
All monetary amounts: BIGINT (minor units). No FLOAT/DECIMAL for money.
All identifiers: ULID or UUIDv7. tenant_id on every table.
Append-only tables (no UPDATE/DELETE): supplier_mapping, financial_event, policy_decision_snapshot.
 
---
 
## 5. API Endpoints
 
Status: DESIGNED — full contracts defined in architecture.md §6.
 
Key endpoints:
  POST   /v1/search/availability           — Shop GDS availability
  POST   /v1/bookings                      — Create booking (hold)
  POST   /v1/bookings/{id}/confirm         — Confirm booking (issue ticket)
  POST   /v1/bookings/{id}/cancel          — Cancel booking
  POST   /v1/refunds                       — Request refund
  GET    /v1/trips/{id}                    — Get trip with bookings
  POST   /v1/policy/evaluate               — Evaluate policy rules
  GET    /health/live                      — Liveness probe
  GET    /health/ready                     — Readiness probe
 
Conventions: versioned URI (/v1/), Bearer JWT auth, X-Correlation-ID header,
Idempotency-Key header (all mutating requests), RFC 7807 error format,
amounts as integer minor units + ISO 4217 currency.
 
---
 
## 6. Testing Framework
 
Status: DECIDED — defined in architecture.md §12.5.
 
Framework (TypeScript) : Jest + Supertest
Framework (Java)       : JUnit 5 + RestAssured
Integration tests      : Testcontainers (PostgreSQL, Kafka, Redis)
Contract tests         : Pact (consumer-driven contract tests between services)
Load tests             : k6
Config                 : jest.config.ts / pom.xml
Run all (TS)           : npm run test
Run all (Java)         : ./mvnw test
Coverage target        : >80% line coverage
CI gate                : All tests + financial invariant tests must pass on every PR
 
---
 
## 7. Key Coding Conventions
 
Status: DECIDED — see architecture.md §3.3 and Architecture Guardrails §17.
 
- All monetary amounts: integer (minor units), NEVER float or decimal
- All identifiers: ULID or UUIDv7 (never auto-increment integers for business entities)
- All timestamps: ISO 8601 UTC
- All currency codes: ISO 4217 3-letter (USD, EUR, GBP)
- tenant_id: first-class parameter on every repository method — no cross-tenant queries
- Secrets: never logged, never in response bodies, never in URLs
- PII: never on spine entities — PII pointer model only
- Supplier IDs: never used as primary keys — append-only supplier_mapping table
- Append-only tables: no UPDATE or DELETE SQL (supplier_mapping, financial_event, policy_decision_snapshot)
- Idempotency key: required on every outbound GDS call and all mutating API endpoints
 
---
 
## 8. Existing Documentation Files
 
| File | Location | Status |
|------|----------|--------|
| Requirements Intent | .kiro/steering/RequirementDocument.md | COMPLETE |
| Gap Analysis | .kiro/steering/gap-analysis.md | COMPLETE (v0.3) |
| Architecture Design | phases/04-architecture/architecture.md | DRAFT — pending approval |
| Architecture Guardrails | .kiro/steering/architecture-guardrails.md | ACTIVE |
| HITL Guardrails | .kiro/steering/HITL.md | ACTIVE |
| AGENTS.md (root) | AGENTS.md | ACTIVE |
 
---
 
## 9. Known Issues / Failure Patterns
 
Status: NONE YET — update as issues are discovered during development.
 
---
 
## 10. SDLC Phase State
 
Current project state:
 
[✓] REQUIREMENT  — COMPLETE (gap-analysis.md v0.3, all 16 gaps resolved)
[~] DESIGN       — IN PROGRESS (architecture.md v1.0 DRAFT — awaiting Architect + PO approval)
[ ] DEVELOPMENT  — not started
[ ] TESTING      — not started
[ ] CODE_REVIEW  — not started
[ ] DOCUMENTATION — not started
[ ] RELEASE      — not started
 
---
 
## 11. Project Design Artifacts
 
| Artifact | File | Version | Status |
|----------|------|---------|--------|
| Gap Analysis | .kiro/steering/gap-analysis.md | 0.3 | COMPLETE |
| Architecture Design | phases/04-architecture/architecture.md | 1.0 | DRAFT — pending approval |
| Domain Boundaries | architecture.md §2 | 1.0 | DRAFT |
| Technology Stack | architecture.md §3 | 1.0 | DRAFT |
| System Context Diagram | architecture.md §4 | 1.0 | DRAFT |
| Data Model (ERD + schemas) | architecture.md §5 | 1.0 | DRAFT |
| API Contracts | architecture.md §6 | 1.0 | DRAFT |
| Event Catalog (15 events) | architecture.md §7 | 1.0 | DRAFT |
| GDS Adapter Pattern | architecture.md §8 | 1.0 | DRAFT |
| Policy Evaluator Design | architecture.md §9 | 1.0 | DRAFT |
| Security Architecture | architecture.md §10 | 1.0 | DRAFT |
| Observability Design | architecture.md §11 | 1.0 | DRAFT |
| Infrastructure & Deployment | architecture.md §12 | 1.0 | DRAFT |
| Error Handling & Fault Taxonomy | architecture.md §15 | 1.0 | DRAFT |
| Dependency Inventory | architecture.md §16 | 1.0 | DRAFT |
| Architecture Guardrails | architecture.md §17 | 1.0 | DRAFT |
| Architecture-to-Requirement Mapping | architecture.md §18 | 1.0 | DRAFT |
| ADRs (8 records) | architecture.md §14 | 1.0 | DRAFT |
 
---
 
## 12. Model Overrides (Project-Specific)
 
No model overrides. Using global model policy from framework-model-policy.md.
 
---
 
## 13. Project-Specific Lifecycle Terminology Mapping
 
TravelPlatform uses standard SDLC terminology. Mapping to framework routing categories:
 
| SDLC Term           | Framework Routing Category |
|---------------------|---------------------------|
| Requirements        | REQUIREMENT               |
| System Design       | DESIGN                    |
| Architecture        | DESIGN                    |
| Development         | DEVELOPMENT               |
| Coding              | DEVELOPMENT               |
| Testing             | TESTING                   |
| QA                  | TESTING                   |
| Bug Fix             | DEBUGGING                 |
| Code Review         | CODE_REVIEW               |
| Documentation       | DOCUMENTATION             |
| Deployment          | RELEASE                   |
| Release             | RELEASE                   |