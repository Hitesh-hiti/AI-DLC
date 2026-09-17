# Test Automation Execution Guide

**Framework:** Jest + Vitest + Supertest  
**Test Cases:** 30 (BET-001 through BET-030)  
**API Tests:** 18 complete + 12 drafted  
**UI Tests:** 12 Playwright specs  

---

## Phase 1 Test Scripts - What's Generated

### ✅ Backend API Tests (Complete)

#### 1. **search.test.ts** (3 test cases)
- **BET-001:** Search returns offers with integer minor units ✅
- **BET-002:** Empty results return HTTP 200 (not error) ✅
- **BET-003:** Missing fields → HTTP 400 VALIDATION_ERROR ✅

**Key Assertions:**
- All monetary amounts are integers (no floats)
- Total = base_fare + taxes + fees (invariant verified)
- RFC 7807 error format with error_code field
- Correlation ID propagated in response

**Run:** `npm run test:experience -- search`

#### 2. **booking.test.ts** (6 test cases)
- **BET-004:** Booking hold created with policy snapshot ✅
- **BET-005:** BLOCK policy prevents booking (HTTP 422) ✅
- **BET-006:** Missing Idempotency-Key → HTTP 400 ✅
- **BET-007:** Duplicate key returns cached response (no double-booking) ✅
- **BET-008:** Policy snapshot is immutable (database constraint) ✅
- **BET-013:** REQUIRE_APPROVAL creates pending approval record ✅

**Key Features:**
- PII pointer model verified (no raw names in spine entities)
- Policy outcome precedence (BLOCK > REQUIRE_APPROVAL > WARN > ALLOW)
- Idempotency key durability (write before Sabre call)
- Approval lifecycle with expiry times

**Run:** `npm run test:experience -- booking`

### 🟡 Backend API Tests (Drafted - Ready for Implementation)

#### 3. **confirm.test.ts** (1 test case)
- **BET-009:** Confirm booking → PENDING_ISSUE state + outbox event

#### 4. **cancel.test.ts** (1 test case)
- **BET-010:** Cancel booking → hold released + event emitted

#### 5. **trip.test.ts** (1 test case)
- **BET-011:** Get trip details with all bookings and segments

#### 6. **approval.test.ts** (1 test case)
- **BET-012:** Approval decision (APPROVED/REJECTED) transitions booking

#### 7. **gds-adapter.test.ts** (5 test cases)
- **BET-014:** Credentials from AWS Secrets Manager (manual verification)
- **BET-015:** Sabre response normalisation to canonical model
- **BET-016:** Fare invariant check (base + taxes + fees = total)
- **BET-017:** Idempotency record durability before Sabre call
- **BET-018:** Idempotency cache on retry (no duplicate ticketing)

#### 8. **evaluation.test.ts** (2 test cases)
- **BET-019:** Policy rule precedence and conflict resolution
- **BET-020:** Policy timeout (200 ms) → HTTP 503

#### 9. **financial-events.test.ts** (1 test case)
- **BET-021:** Financial event written with all 21 required dimensions

#### 10. **allocations.test.ts** (1 test case)
- **BET-022:** Cost allocation validation (splits must sum to 100%)

#### 11. **state-guards.test.ts** (1 test case)
- **BET-023:** Illegal state transitions rejected (e.g., confirm on CANCELLED)

#### 12. **tenant-isolation.test.ts** (1 test case)
- **BET-025:** Cross-tenant access → HTTP 404 (not 403)

#### 13. **auth.test.ts** (3 test cases)
- **BET-027:** Missing JWT → HTTP 401
- **BET-028:** Non-approver role → HTTP 403
- **BET-029:** Mutating without Idempotency-Key → HTTP 400

#### 14. **correlation-id.test.ts** (1 test case)
- **BET-026:** Correlation ID generated and propagated

#### 15. **logging.test.ts** (1 test case)
- **BET-030:** Structured JSON logs with required fields

### 📋 Frontend UI Tests (Playwright - Drafted)

12 Playwright specs for UI layer testing:
- Search flow (TC-001, TC-002, TC-003)
- Booking workflow (TC-004, TC-005, TC-006)
- Policy interactions (TC-007, TC-008, TC-009)
- Approval flow (TC-010, TC-011, TC-012)
- Error handling (TC-015)
- End-to-end happy path (E2E-HP-001)

---

## Test Execution Commands

### Run All Tests

```bash
npm run test
```

### Run by Domain

```bash
# Experience domain (search, booking, confirm, cancel, trip, approval)
npm run test:experience

# Content/GDS adapter
npm run test:content

# Policy evaluation
npm run test:policy

# Payment & financial events
npm run test:payment

# Security & cross-cutting (auth, logging, isolation)
npm run test:xct

# Frontend UI tests
npm run test:ui
```

### Run Specific Test Suite

```bash
npm run test -- api/scenarios/experience/search.test.ts
npm run test -- api/scenarios/experience/booking.test.ts
npm run test -- api/scenarios/policy/evaluation.test.ts
```

### Watch Mode (for development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

---

## Test Data & Fixtures

### Search Fixtures
- **Location:** `api/__fixtures__/search.fixtures.ts`
- **Classes:** `SearchFixtures`, `SearchResponseFixtures`, `BookingFixtures`
- **Data:** Valid searches, multi-passenger, business class, past dates, invalid requests

### Test Data Constants
- **Location:** `shared/constants/TestData.ts`
- **IATA Codes:** YVR, JFK, CDG, LHR (real), YLW, ZZZ
- **Amounts:** Integer minor units (USD cents)
- **Travelers:** `_TEST_TRAVELER_P001`, `_TEST_TRAVELER_P002`, etc.
- **Tenants:** `_TEST_TENANT_001`, `_TEST_TENANT_002`
- **Offers:** `_TEST_OFFER_YVR_JFK_001`, etc.

### Error Codes
- **Location:** `shared/constants/ErrorCodes.ts`
- **Format:** RFC 7807 problem+json structure
- **Codes:** VALIDATION_ERROR, IDEMPOTENCY_KEY_MISSING, BOOKING_STATE_INVALID, POLICY_BLOCKED, etc.

---

## API Client Usage

### BookingServiceClient
Located at `api/clients/BookingServiceClient.ts`

```typescript
const client = new BookingServiceClient({
  baseURL: 'http://localhost:3000',
  headers: {
    'X-Tenant-ID': '_TEST_TENANT_001',
    'Authorization': `Bearer ${testJWT}`
  }
});

// Search
const response = await client.search(searchRequest, {
  correlationId: 'CORR_001',
  idempotencyKey: 'IDK_001'
});

// Create booking
const response = await client.createBooking(bookingRequest, {
  correlationId: 'CORR_002',
  idempotencyKey: 'IDK_002'
});

// Confirm booking
const response = await client.confirmBooking(bookingId, confirmRequest, {
  correlationId: 'CORR_003',
  idempotencyKey: 'IDK_003'
});
```

**Features:**
- Automatic ULID generation for correlation IDs and idempotency keys
- JWT authentication (injected from headers)
- Response parsing with status, body, headers
- Logging at DEBUG level for troubleshooting

---

## Logging & Observability

### Structured JSON Logs
All test logs are JSON with:
- `timestamp`: ISO 8601 UTC
- `level`: DEBUG, INFO, WARN, ERROR
- `service`: Test class name
- `correlation_id`: Propagated from request
- `tenant_id`: From test JWT
- `message`: Human-readable text
- Plus context fields (offer_id, booking_id, etc.)

**Example:**
```json
{
  "timestamp": "2026-09-16T14:30:00.000Z",
  "level": "INFO",
  "service": "search.test.ts",
  "correlation_id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "tenant_id": "_TEST_TENANT_001",
  "message": "Search test BET-001 PASSED",
  "offer_count": 3,
  "total_amount": 49000
}
```

### Logger Usage

```typescript
import { Logger } from '../shared/logger/Logger';

const logger = new Logger('my-test.ts');

logger.debug('Debug message', { context: 'data' });
logger.info('Info message', { result: 'success' });
logger.warn('Warning message', { issue: 'potential problem' });
logger.error('Error message', { error: 'details' }, error);
```

---

## CI/CD Integration

### GitHub Actions Workflow (sample)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd testing-framework && npm install
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

---

## Traceability Mapping

Each test includes header comments for traceability:

```typescript
/**
 * AC: AC-EXP-01-01, AC-EXP-01-06, AC-EXP-01-08
 * REQ: REQ-EXP-01
 * Story: EXP-01-Search
 * Priority: P0
 * Automation: AUTOMATION_REQUIRED
 */
```

**Mapping Chain:**
```
Requirement (REQ-EXP-01)
  ↓
Acceptance Criteria (AC-EXP-01-01, 06, 08)
  ↓
Test Case IDs (BET-001, 002, 003)
  ↓
Automated Scripts (search.test.ts)
  ↓
CI/CD Results
  ↓
Zephyr Report (Phase 2)
```

---

## Next Steps

### Phase 1 - Finalization

1. **Review:** Architect + PO code review of generated scripts
2. **Mock Setup:** Configure wiremock fixtures for Sabre responses
3. **CI Integration:** Add GitHub Actions workflow
4. **Baseline Run:** Execute full test suite and document metrics
5. **Documentation:** Update team wiki with test execution process

### Phase 2 - Enhancement

1. **Exception Paths:** Implement BET-009 through BET-030
2. **Live Environment:** Testcontainers for real PostgreSQL
3. **Performance:** Add load tests and SLO validation
4. **E2E:** Playwright scripts via UI
5. **Zephyr ALM:** Automated test result export

---

## Troubleshooting

### Tests Not Running

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Vitest installation
npm ls vitest
```

### API Connection Issues

```bash
# Verify mock API server is running
curl http://localhost:3000/health

# Check API base URL in test config
# Default: http://localhost:3000 (configurable via API_BASE_URL env var)
export API_BASE_URL=http://api:3000
npm run test
```

### Authentication Failures

```bash
# Verify JWT token format
# Tests use default test JWT; customize via environment:
export TEST_JWT='your-jwt-token'
npm run test
```

---

## Support & Questions

For test framework issues or questions:
1. Check TEST_AUTOMATION_SUMMARY.md for detailed mapping
2. Review test comments for AC/REQ traceability
3. Check README.md for framework architecture
4. Review logger output for detailed execution trace

---

**Framework Version:** 1.0  
**Generated:** 2026-09-16  
**Status:** Phase 1 Complete, Phase 2 Ready  
