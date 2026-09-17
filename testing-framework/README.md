# TravelPlatform Test Automation Framework

**Framework Version:** 1.0  
**Date:** 2026-09-16  
**Test Technology Stack:** Jest + Supertest (API), Vitest + React Testing Library (UI)  
**Based on:** be_testcase.md v1.0  

---

## Overview

This directory contains automated test suites for TravelPlatform Phase 1 happy-path scenarios.

### Structure

```
testing-framework/
├── README.md                    # This file
├── api/                         # Backend API automation tests
│   ├── __fixtures__/           # Test data fixtures
│   ├── clients/                # API client services
│   ├── scenarios/              # Test suites organized by domain
│   └── utils/                  # Helper utilities
├── ui/                          # Frontend UI automation tests
│   ├── pages/                  # Page Object Models
│   ├── components/             # Component test utilities
│   ├── scenarios/              # Test suites
│   └── utils/                  # UI helpers (locators, waits)
└── shared/                      # Cross-layer shared utilities
    ├── fixtures/               # Shared test data
    ├── constants/              # Configuration, error codes
    └── logger/                 # Logging utilities
```

---

## Test Pyramid

### Phase 1 Focus

- **Unit Tests (40%)** — Component-level, service logic (Jest)
- **Integration Tests (45%)** — API + database mocks (Jest + Supertest)
- **E2E Tests (15%)** — Critical user journeys via UI (React Testing Library)
- **Contract Tests (5%)** — API request/response schema validation

### Deferr to Phase 2

- Load tests (k6)
- Performance tests (p99 SLO validation)
- Full E2E (Playwright/Selenium via multiple environments)

---

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm run test
```

### Run Tests by Domain

```bash
# API tests (Experience domain)
npm run test -- api/scenarios/experience

# UI tests (Booking flow)
npm run test -- ui/scenarios/booking

# Policy tests
npm run test -- api/scenarios/policy
```

### Coverage Report

```bash
npm run test:coverage
```

---

## Test Case Mapping

Each test file maps directly to be_testcase.md:

| BET ID | Test File | Scenario |
|--------|-----------|----------|
| BET-001 | api/scenarios/experience/search.test.ts | Search returns offers |
| BET-004 | api/scenarios/experience/booking.test.ts | Create booking hold |
| BET-009 | api/scenarios/experience/confirm.test.ts | Confirm booking |
| BET-012 | api/scenarios/experience/approval.test.ts | Approval workflow |
| ... | ... | ... |

---

## Conventions

### API Tests

- **Client:** `src/api/clients/BookingServiceClient.ts` (thin wrapper over Supertest)
- **Fixtures:** `src/api/__fixtures__/offers.json`, `bookings.json`, etc.
- **Assertions:** Jest matchers + custom helpers for invariant validation
- **Error Handling:** Canonical error codes from `shared/constants/ErrorCodes.ts`

### UI Tests

- **Pages:** `src/ui/pages/SearchPage.ts` (locators + action methods)
- **Components:** `src/ui/components/BookingForm.test.tsx` (Vitest + RTL)
- **Queries:** Prefer `getByRole`, `getByLabelText`; avoid `getByTestId`

### Shared

- **Test Data:** Stable ULIDs, real IATA codes (YVR, JFK, CDG), USD only
- **Traceability:** Each test includes `// AC-XXX-XX` comment header
- **Logging:** Structured JSON logs with correlation_id

---

## Authentication & Test Setup

### Mock Authentication

```typescript
const testJWT = {
  tenant_id: "_TEST_TENANT_001",
  traveler_id: "_TEST_TRAVELER_P001",
  role: "TRAVELER"
};

// Automatically injected into headers by API client
```

### Database Fixtures

Tests use Testcontainers (Phase 2) or in-memory mocks (Phase 1):

```typescript
// Phase 1: Mock database via fixtures
const mockBooking = require('../__fixtures__/bookings.json')[0];

// Phase 2: Real PostgreSQL via Testcontainers
```

---

## Traceability

Every test file includes a traceability block:

```typescript
/**
 * AC: AC-EXP-01-01, AC-EXP-01-06
 * REQ: REQ-EXP-01
 * Story: EXP-01-Search
 * Priority: P0
 * Automation: AUTOMATION_REQUIRED
 */

describe('Travel Search - Happy Path', () => {
  // test cases
});
```

---

## Phase 1 Constraints

### Known Limitations

- ✅ Wiremock fixtures used for Sabre adapter (no live PCC yet)
- ✅ In-memory or mock database (no live PostgreSQL in CI yet)
- ✅ No real AWS Secrets Manager (uses test constants)
- ✅ No real notification delivery (mock consumers)
- ✅ Happy-path only (exception paths in Phase 2)

### HITL Blockers

- **HITL-REQ-01:** Notification PII content (interim constraint: no raw names)
- **HITL-REQ-02:** ERP posting logic (Phase 2 stub only)
- **HITL-REQ-03:** Sabre PCC availability (wiremock in Phase 1)

---

## Next Steps

1. **Review:** Architect + PO review of test cases
2. **Implementation:** Generate automation scripts per domain
3. **CI Integration:** Add test execution to GitHub Actions
4. **Zephyr Mapping:** Upload results to Zephyr for ALM integration
5. **Phase 2:** Add exception paths, load tests, E2E

---

*See be_testcase.md for detailed test case specifications.*
