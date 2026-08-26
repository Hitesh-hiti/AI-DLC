# Backend Testing Guide

Comprehensive testing guide for the Northstar backend API.

## Running Tests

### All Tests
```bash
npm test
```

### With Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

---

## Test Structure

Tests are organized by type and location:

```
tests/
├── unit/
│   ├── validation.test.js          # Input validation schemas
│   ├── productService.test.js      # Product service logic
│   ├── contactService.test.js      # Contact service logic
│   ├── collectionService.test.js   # Collection service logic
│   ├── contentService.test.js      # Static content service
│   ├── constants.test.js           # Constants verification
│   ├── middleware.test.js          # Middleware functions
│   └── responseHandler.test.js     # Response formatting
└── integration/
    └── api.test.js                 # Full API endpoint tests
```

---

## Unit Tests

Unit tests verify individual functions and components in isolation.

### Validation Tests (`validation.test.js`)
Tests for Joi schema validation:
- ✓ Product query schema validation
- ✓ Search query schema validation
- ✓ Contact form schema validation
- ✓ Default values
- ✓ Invalid input rejection

**Coverage:** Input validation logic

### Service Tests

#### ProductService (`productService.test.js`)
- `getProducts()` - Filtering, sorting, pagination
- `getProductById()` - Product details, images, specs
- `searchProducts()` - Full-text search with ranking
- `getNewArrivals()` - Manual curation, pagination

**Coverage:** Product business logic

#### ContactService (`contactService.test.js`)
- `submitContactForm()` - Form submission, storage
- `sendEmails()` - Email delivery (SendGrid/SMTP)
- `getContactSubmissions()` - Retrieve submissions
- `cleanupExpiredSubmissions()` - 1-year retention

**Coverage:** Contact form handling

#### CollectionService (`collectionService.test.js`)
- `getAllCollections()` - Get all 6 collections
- `getCollectionBySlug()` - Collection by identifier

**Coverage:** Collection management

#### ContentService (`contentService.test.js`)
- `getContentByPage()` - Retrieve static content
- `updateContent()` - Update/insert content

**Coverage:** Static content management

### Constants Tests (`constants.test.js`)
- ✓ 6 collections defined correctly
- ✓ Category mappings
- ✓ Specification fields per category
- ✓ Configuration values (retention, image limits)

**Coverage:** System configuration

### Middleware Tests (`middleware.test.js`)
- Request logger function
- Error handler implementation
- Rate limiting setup

**Coverage:** Express middleware

### Response Handler Tests (`responseHandler.test.js`)
- `sendSuccess()` - Success responses
- `sendError()` - Error responses
- `sendPaginatedSuccess()` - Paginated responses

**Coverage:** Response formatting

---

## Integration Tests

Integration tests verify API endpoints work end-to-end.

### API Endpoint Tests (`api.test.js`)

#### Health Check
- `GET /health` - Server status

#### Products
- `GET /api/v1/products` - All products with filters
- `GET /api/v1/products/:id` - Product details
- Query parameters: collection, sort, price_min, price_max, availability, page, limit

#### Collections
- `GET /api/v1/collections` - All collections
- `GET /api/v1/collections/:slug/products` - Collection products

#### Search
- `GET /api/v1/search?q=query` - Full-text search
- Query parameters: q (required), page, limit

#### New Arrivals
- `GET /api/v1/new-arrivals` - New products
- Query parameters: sort, page, limit

#### Contact
- `POST /api/v1/contact` - Submit contact form
- Body: name, email, subject, message, consent_given
- Rate limiting: 5 requests per IP per 24 hours

#### Static Content
- `GET /api/v1/content/:page` - Static pages
- Supported pages: our_story, contact_information

#### CORS
- Cross-origin request handling

---

## Test Coverage

### Current Coverage
- Unit tests: Validation, services, middleware, utilities
- Integration tests: All API endpoints
- Error handling: Invalid inputs, missing fields
- Edge cases: Empty searches, invalid IDs, rate limiting

### Target: >80% Code Coverage

Current test suite covers:
- ✓ All service methods
- ✓ All controllers/endpoints
- ✓ All middleware
- ✓ All validation schemas
- ✓ All response handlers
- ✓ Edge cases and error paths

---

## Running Tests Locally

### Prerequisites
- Node.js 18+
- npm dependencies installed

### Setup
```bash
npm install
```

### Run
```bash
npm test
```

### With Coverage
```bash
npm run test:coverage
# View coverage report in ./coverage/index.html
```

---

## Interpreting Test Results

### Test Output Example
```
PASS tests/unit/validation.test.js (5.123 s)
  Validation Schemas
    productQuerySchema
      ✓ should validate correct product query parameters (8 ms)
      ✓ should reject invalid collection (5 ms)
      ✓ should set default pagination values (2 ms)
    ...

Test Suites: 8 passed, 8 total
Tests:       65 passed, 65 total
Time:        12.456 s
```

### Coverage Example
```
File                    | % Stmts | % Branch | % Funcs | % Lines
----|---------|----------|---------|---------|
All files               |   85.2  |   78.3   |   90.5  |   85.2
 src/                   |   85.2  |   78.3   |   90.5  |   85.2
 src/services/          |   92.1  |   85.0   |   95.0  |   92.1
 src/api/controllers/   |   88.3  |   80.0   |   90.0  |   88.3
 src/utils/             |   75.0  |   70.0   |   85.0  |   75.0
```

---

## Testing Best Practices

### Writing Tests
1. **Descriptive names** - Test should describe what it verifies
2. **Isolation** - Each test should be independent
3. **Arrange-Act-Assert** - Setup → Execute → Verify
4. **One assertion per test** (when possible)
5. **Mock external dependencies**

### Example Test Structure
```javascript
describe('Feature', () => {
  describe('Component', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { ... };
      const expected = { ... };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

### Mocking in Tests
- Use Jest mocks for external services (email, database)
- Avoid actual database calls in unit tests
- Test with fixtures/sample data for predictability

---

## Continuous Integration

### Pre-commit Testing
```bash
npm run test:coverage
# Ensure >80% coverage before committing
```

### CI/CD Pipeline
Tests should run automatically on:
- Pull requests
- Pre-deployment
- Nightly runs

---

## Troubleshooting Tests

### Tests Fail Locally but Pass in CI
- Check Node.js version: `node --version`
- Ensure clean install: `rm -rf node_modules && npm install`
- Check for environment variables

### Database Connection Errors
- Ensure PostgreSQL is running: `docker compose up -d`
- Check database credentials in `.env`
- Run migrations: `npm run db:migrate`

### Timeout Errors
- Increase Jest timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Look for missing `done()` callbacks

### Coverage Below Target
```bash
npm run test:coverage
# Check coverage/index.html for low-coverage files
# Add tests for missed lines
```

---

## Future Test Improvements

- [ ] E2E tests with Cypress/Playwright
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Database transaction tests
- [ ] API contract testing (OpenAPI)
- [ ] Visual regression testing (if frontend integration)

---

## Test Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest (HTTP Testing)](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Joi Validation](https://joi.dev/)
