# Implementation Roadmap — Frontend & Backend
**Date Generated:** August 24, 2026  
**Source Documents:**
- requirement_breakdown.md (131 ACs, consolidated requirements)
- fe_acceptance_criteria.md (81 FE-specific ACs)
- be_acceptance_criteria.md (76 BE-specific ACs)
- FE_BE_MAPPING.md (mapping and team assignments)

**Status:** READY FOR DEVELOPMENT ✅

---

## Executive Summary

The Northstar MVP requirements have been fully decomposed into implementation-ready acceptance criteria for Frontend and Backend teams:

- **131 Total Acceptance Criteria** across 40 consolidated requirements
- **81 Frontend Acceptance Criteria** in 25 requirements (UI/UX, responsiveness, user interaction)
- **76 Backend Acceptance Criteria** in 17 requirements (API, database, business logic)
- **26 Hybrid Features** requiring FE/BE coordination (search, forms, filtering, etc.)

Both teams have clear, distinct responsibilities with explicit sync points for collaborative work.

---

## Frontend Implementation Roadmap

### Phase 1: Foundation (Week 1–2)

#### 1.1 Project Setup
- [ ] Create React/Vue/Angular project
- [ ] Set up build tools (Webpack, Vite, or framework default)
- [ ] Configure ESLint, Prettier, TypeScript
- [ ] Set up testing framework (Jest, Vitest)
- [ ] Establish component library structure

**Related ACs:** REQ-040 (browser compatibility setup)

#### 1.2 Responsive Design & Breakpoints
- [ ] Implement CSS media queries for breakpoints:
  - Mobile: < 768px
  - Tablet: 768–1024px
  - Desktop: > 1024px
- [ ] Create responsive utility classes
- [ ] Design mobile-first layout approach

**Related ACs:** FE-AC-031-001, FE-AC-031-002

#### 1.3 Navigation & Header
- [ ] Build main header component
- [ ] Implement hamburger menu (mobile < 768px)
- [ ] Create navigation menu (Shop, New Arrivals, Our Story, Contact)
- [ ] Implement Shop dropdown with 6 collections
- [ ] Add search input to header

**Related ACs:** FE-AC-012-001, FE-AC-012-002, FE-AC-013-001, FE-AC-013-002, FE-AC-032-001, FE-AC-032-002, FE-AC-032-003, FE-AC-032-004

---

### Phase 2: Product Display (Week 3–4)

#### 2.1 Product Grid Component
- [ ] Build product grid layout (responsive)
- [ ] Create product card component
- [ ] Implement product image display with fallback placeholder
- [ ] Add product name, price, category, availability badges
- [ ] Implement click-to-detail navigation
- [ ] Add empty state message

**Related ACs:** FE-AC-004-001 through FE-AC-004-005, FE-AC-005-001 through FE-AC-005-003, FE-AC-006-001 through FE-AC-006-004, FE-AC-007-001 through FE-AC-007-003

#### 2.2 Product Detail Page
- [ ] Build detail page layout
- [ ] Display core fields (image gallery, name, price, category, description, availability)
- [ ] Implement image gallery navigation (thumbnails, prev/next)
- [ ] Display category-specific specifications (Tech, Fashion, Lifestyle, etc.)
- [ ] Implement responsive detail layout

**Related ACs:** FE-AC-008-001 through FE-AC-008-005, FE-AC-009-001 through FE-AC-009-005

#### 2.3 Availability Display
- [ ] Show "In Stock" badge (green/positive)
- [ ] Show "Out of Stock" badge (red/negative, still clickable)
- [ ] Implement availability logic based on backend data

**Related ACs:** FE-AC-027-001 through FE-AC-027-003

---

### Phase 3: Search & Discovery (Week 5–6)

#### 3.1 Search Feature
- [ ] Build search input component in header
- [ ] Implement real-time search (as-you-type)
- [ ] Add debouncing (~300ms)
- [ ] Display search results in grid format
- [ ] Show result count
- [ ] Implement empty state for no results

**Related ACs:** FE-AC-015-001 through FE-AC-015-005, FE-AC-016-001 through FE-AC-016-003

#### 3.2 Filtering & Sorting
- [ ] Build filter component (price, category, availability)
- [ ] Build sort dropdown (price, newest-first)
- [ ] Implement filter state management
- [ ] Apply filters to collections, search results, New Arrivals
- [ ] Update URL query parameters for filter/sort state
- [ ] Persist filter state during page navigation

**Related ACs:** FE-AC-023-001 through FE-AC-023-003, FE-AC-024-001 through FE-AC-024-004, FE-AC-025-001 through FE-AC-025-003

---

### Phase 4: Collections & Homepage (Week 7–8)

#### 4.1 Collections Pages
- [ ] Build individual collection pages (All Products, Tech & Gadget, Fashion, Lifestyle, Home & Living, Games & Play)
- [ ] Implement pagination (20 products per page)
- [ ] Implement collection-specific filters and sorts
- [ ] Display "No products" message when applicable

**Related ACs:** REQ-003 (collections organization)

#### 4.2 New Arrivals Page
- [ ] Build New Arrivals collection page
- [ ] Apply filtering and sorting controls
- [ ] Implement pagination for New Arrivals

**Related ACs:** FE-AC-010-001 through FE-AC-010-005

#### 4.3 Homepage
- [ ] Build hero section with Shop CTA
- [ ] Implement featured products preview
- [ ] Implement New Arrivals preview
- [ ] Implement all 6 collection previews
- [ ] Add Our Story preview section
- [ ] Add footer

**Related ACs:** FE-AC-011-001 through FE-AC-011-003, FE-AC-014-001 through FE-AC-014-003

---

### Phase 5: Static Pages (Week 9)

#### 5.1 Our Story Page
- [ ] Build Our Story page layout
- [ ] Display static brand content
- [ ] Style for readability and accessibility

**Related ACs:** FE-AC-017-001 through FE-AC-017-003

#### 5.2 Contact Page
- [ ] Build contact information section (email, phone, address, social)
- [ ] Make email clickable (mailto link)

**Related ACs:** FE-AC-018-001, FE-AC-018-002

---

### Phase 6: Contact Form (Week 10)

#### 6.1 Contact Form UI & Validation
- [ ] Build contact form with fields (Name, Email, Subject, Message)
- [ ] Implement client-side validation
- [ ] Display validation error messages
- [ ] Add consent checkbox with privacy notice
- [ ] Add submit button with loading state
- [ ] Disable form during submission (prevent double-submit)

**Related ACs:** FE-AC-019-001 through FE-AC-019-007, FE-AC-021-001 through FE-AC-021-003

#### 6.2 Contact Form Success/Error Handling
- [ ] Display success message after submission
- [ ] Display error message if submission fails
- [ ] Handle rate limit error (5 submissions per IP per 24h)
- [ ] Reset form on success

**Related ACs:** FE-AC-022-001 through FE-AC-022-003

---

### Phase 7: Testing & QA (Week 11–12)

#### 7.1 Unit & Component Tests
- [ ] Write tests for all major components
- [ ] Test product grid rendering
- [ ] Test form validation
- [ ] Test search/filter/sort logic
- [ ] Aim for 70%+ code coverage

**Related ACs:** All FE-ACs (referenced in test suites)

#### 7.2 Integration Tests
- [ ] Test user workflows (browse → detail → search → contact)
- [ ] Test filter/sort application
- [ ] Test navigation flows
- [ ] Test form submission

#### 7.3 E2E Tests
- [ ] Test complete user journeys in production-like environment
- [ ] Test responsive behavior on multiple devices
- [ ] Test browser compatibility (Chrome, Firefox, Safari, Edge)

#### 7.4 Accessibility Review
- [ ] Manual WCAG 2.1 AA review (keyboard navigation, screen readers)
- [ ] Check color contrast ratios
- [ ] Verify alt text on images
- [ ] Test form accessibility

---

## Backend Implementation Roadmap

### Phase 1: Database & Schema (Week 1–2)

#### 1.1 PostgreSQL Setup
- [ ] Configure PostgreSQL database
- [ ] Set up connection pooling
- [ ] Enable backups

**Related ACs:** BE-AC-001-001

#### 1.2 Database Schema Design
- [ ] Create products table with fields:
  - id, name, price, category, description, image_url, inventory_count, sku
  - is_new_arrival (boolean), is_featured (boolean)
  - created_at, updated_at timestamps
- [ ] Create product_images table (for multi-image gallery)
- [ ] Create product_specs table (or JSON column for category specs)
- [ ] Create contact_submissions table
- [ ] Add indexes on frequently queried columns (category, is_new_arrival, price, name)

**Related ACs:** BE-AC-001-001, BE-AC-001-002, BE-AC-002-003, BE-AC-002-004, BE-AC-038-001, BE-AC-038-002

#### 1.3 Product Data Import
- [ ] Design data import process (CSV, JSON, or API)
- [ ] Implement data validation (mandatory fields, spec validation)
- [ ] Create daily sync process (cron job or scheduled worker)
- [ ] Test with 100–999 products volume

**Related ACs:** BE-AC-001-003, BE-AC-001-004, BE-AC-009-002

---

### Phase 2: Image Storage (Week 2–3)

#### 2.1 Image Upload Handler
- [ ] Implement image upload endpoint
- [ ] Validate file format (JPG, PNG, WebP)
- [ ] Validate file size (max 10MB)
- [ ] Store images to local filesystem
- [ ] Generate image paths and store in database

**Related ACs:** BE-AC-002-001 through BE-AC-002-006

#### 2.2 Image Retrieval
- [ ] Implement image serving endpoint (if needed)
- [ ] Support multiple images per product (up to 5)
- [ ] Handle missing image gracefully (NULL/empty array)

---

### Phase 3: API Endpoints — Collections & Products (Week 4–5)

#### 3.1 Product Retrieval Endpoints
- [ ] GET /api/products — List all products with pagination
- [ ] GET /api/products/:id — Get product detail with specs
- [ ] GET /api/shop/:collection — Get collection by name
  - /api/shop/all-products
  - /api/shop/tech-gadget
  - /api/shop/fashion
  - /api/shop/lifestyle
  - /api/shop/home-living
  - /api/shop/games-play

**Related ACs:** BE-AC-001-002, BE-AC-008-001, BE-AC-008-002, BE-AC-003-001 through BE-AC-003-006

#### 3.2 New Arrivals Endpoint
- [ ] GET /api/shop/new-arrivals — Get New Arrivals collection
- [ ] Support pagination (20 per page)

**Related ACs:** BE-AC-010-002, BE-AC-010-004

#### 3.3 Homepage Data Endpoint
- [ ] GET /api/homepage — Get combined homepage data
  - Featured products
  - New Arrivals preview
  - Collection previews (all 6)
  - Our Story preview

**Related ACs:** BE-AC-011-002

---

### Phase 4: Filtering & Sorting (Week 6–7)

#### 4.1 Filter Parameters & Query Logic
- [ ] Implement query parameters: price_min, price_max, category, in_stock
- [ ] Build WHERE clause logic dynamically
- [ ] Handle multiple filters (AND logic)

**Related ACs:** BE-AC-023-001 through BE-AC-023-003

#### 4.2 Sorting Parameters & Query Logic
- [ ] Implement query parameters: sort=price_asc, sort=price_desc, sort=newest
- [ ] Build ORDER BY clause dynamically
- [ ] Ensure no default sort applied (natural database order)

**Related ACs:** BE-AC-024-001 through BE-AC-024-003

#### 4.3 Combined Filter/Sort Queries
- [ ] Test complex queries combining filters and sorts
- [ ] Optimize queries with indexes
- [ ] Performance test (< 100ms for typical queries)

**Related ACs:** BE-AC-025-001, BE-AC-025-002

---

### Phase 5: Search Functionality (Week 8)

#### 5.1 Search API Endpoint
- [ ] GET /api/search?q=query — Search products
- [ ] Search across: product name, category, keywords/tags
- [ ] Implement ranking: exact > partial > keyword
- [ ] Support pagination (20 results per page)

**Related ACs:** BE-AC-015-001 through BE-AC-015-005, BE-AC-028-001, BE-AC-028-002

#### 5.2 Search Optimization
- [ ] Consider full-text search (PostgreSQL FTS)
- [ ] Add indexes on searchable columns
- [ ] Performance test (< 500ms for typical search)
- [ ] Handle timeout for complex queries

**Related ACs:** BE-AC-016-001 through BE-AC-016-003

#### 5.3 Search Edge Cases
- [ ] Empty search (no results)
- [ ] Special characters in search query
- [ ] Case-insensitive search
- [ ] Partial word matching

---

### Phase 6: Availability & Data Logic (Week 9)

#### 6.1 Availability Calculation
- [ ] Implement availability logic: inventory_count > 0 → "In Stock"
- [ ] Implement availability logic: inventory_count = 0 → "Out of Stock"
- [ ] Return availability status in product endpoints

**Related ACs:** BE-AC-026-001, BE-AC-026-002

#### 6.2 Specification Management
- [ ] Implement spec validation for each category
- [ ] Enforce mandatory specs on product creation/update
- [ ] Return "Not specified" for missing spec values
- [ ] Support JSON or normalized table storage

**Related ACs:** BE-AC-009-001 through BE-AC-009-004

---

### Phase 7: Contact Form & Email (Week 10–11)

#### 7.1 Contact Form Submission Endpoint
- [ ] POST /api/contact — Accept contact form submission
- [ ] Validate input (name, email, subject, message, consent)
- [ ] Store submission in database
- [ ] Return success response

**Related ACs:** BE-AC-020-001, BE-AC-020-004

#### 7.2 Email Integration
- [ ] Configure email service (SMTP or third-party)
- [ ] Send email to support@northstar.com with submission details
- [ ] Send confirmation email to customer
- [ ] Implement retry logic (up to 3 retries)
- [ ] Log email sends

**Related ACs:** BE-AC-020-002, BE-AC-020-003

#### 7.3 Consent & Privacy
- [ ] Validate consent checkbox is checked
- [ ] Store consent_given flag
- [ ] Implement GDPR compliance checks

**Related ACs:** BE-AC-021-001 through BE-AC-021-003

#### 7.4 Rate Limiting
- [ ] Implement rate limiting: 5 submissions per IP per 24 hours
- [ ] Track IP addresses
- [ ] Return 429 Too Many Requests error
- [ ] Implement counter reset at midnight UTC

**Related ACs:** BE-AC-022-001 through BE-AC-022-003

#### 7.5 Data Retention & Cleanup
- [ ] Implement automatic deletion of submissions > 1 year old
- [ ] Create scheduled job (daily)
- [ ] Log deletion events

**Related ACs:** BE-AC-020-006, BE-AC-039-001, BE-AC-039-002

---

### Phase 8: Error Handling & Security (Week 12)

#### 8.1 Error Handling
- [ ] Implement consistent error response format
- [ ] 400 Bad Request: Invalid input
- [ ] 404 Not Found: Resource not found
- [ ] 429 Too Many Requests: Rate limit
- [ ] 500 Internal Server Error: Server error
- [ ] No stack traces exposed to frontend

**Related ACs:** BE-AC-008-002 (and implicit in all BE-ACs)

#### 8.2 Input Validation & Security
- [ ] Validate all input (type, length, format)
- [ ] Prevent SQL injection (parameterized queries)
- [ ] Sanitize file uploads
- [ ] Implement CORS if needed

#### 8.3 Performance & Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor query performance
- [ ] Set up application metrics
- [ ] Configure logging

---

### Phase 9: Testing & Optimization (Week 13–14)

#### 9.1 Unit Tests
- [ ] Test business logic functions
- [ ] Test availability calculation
- [ ] Test search ranking
- [ ] Test rate limiting logic
- [ ] Aim for 80%+ code coverage

#### 9.2 Integration Tests
- [ ] Test API endpoints
- [ ] Test database queries
- [ ] Test email sending
- [ ] Test data retention job

#### 9.3 Load & Performance Tests
- [ ] Load test search endpoint (100+ concurrent requests)
- [ ] Test query performance (< 100ms target)
- [ ] Monitor memory usage
- [ ] Optimize slow queries

#### 9.4 Security Audit
- [ ] Review SQL injection prevention
- [ ] Verify rate limiting works
- [ ] Test GDPR compliance
- [ ] Review error handling

---

## Hybrid Features — Coordination Points

### Feature 1: Product Display (REQ-008, REQ-009)
| Task | FE | BE | Sync |
|------|-----|-----|------|
| Display core fields | ✅ Layout & rendering | ✅ API endpoint | JSON format |
| Display specs | ✅ Spec table layout | ✅ Spec validation & retrieval | Spec object structure |
| Gallery navigation | ✅ Gallery UI | ✅ Multi-image support | Image URL format |

**Sync Point:** `/api/products/:id` response format

### Feature 2: Search (REQ-015, REQ-016)
| Task | FE | BE | Sync |
|------|-----|-----|------|
| Search input | ✅ UI, debouncing | — | Query param |
| Search results | ✅ Grid display | ✅ API search, ranking | Query string `?q=` |
| Real-time updates | ✅ FE debounce | ✅ BE performance target | < 300ms response |

**Sync Point:** GET /api/search?q=query&page=X response format

### Feature 3: Filtering & Sorting (REQ-023, REQ-024, REQ-025)
| Task | FE | BE | Sync |
|------|-----|-----|------|
| Filter UI | ✅ Checkboxes/buttons | — | Query params |
| Sort dropdown | ✅ Dropdown UI | — | Query param `sort=` |
| Apply filters | ✅ URL update | ✅ Query WHERE clauses | URL query string |

**Sync Point:** Query parameters (price_min, price_max, category, in_stock, sort)

### Feature 4: Contact Form (REQ-020, REQ-021, REQ-022)
| Task | FE | BE | Sync |
|------|-----|-----|------|
| Form UI & validation | ✅ Input fields, client validation | ✅ Server validation | JSON POST body |
| Consent checkbox | ✅ Checkbox display | ✅ Consent flag validation | Consent boolean |
| Rate limiting | ✅ Error display | ✅ Rate limit enforcement | 429 response |
| Success/error messages | ✅ Message display | ✅ Response body messages | JSON response |

**Sync Point:** POST /api/contact request/response format

### Feature 5: New Arrivals (REQ-010, REQ-011)
| Task | FE | BE | Sync |
|------|-----|-----|------|
| Navigation | ✅ Menu item | — | Route /shop/new-arrivals |
| Display | ✅ Grid & pagination UI | ✅ New Arrivals query | API endpoint |
| Filters/sorting | ✅ UI controls | ✅ WHERE clauses | Query params |

**Sync Point:** GET /api/shop/new-arrivals?filters&sort response

---

## API Contract Specification

### GET /api/products
```json
{
  "products": [
    {
      "id": 123,
      "name": "Wireless Headphones",
      "price": 99.99,
      "category": "Tech & Gadget",
      "image_url": "/images/products/123/primary.jpg",
      "inventory_count": 5,
      "is_new_arrival": true,
      "availability": "In Stock"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### GET /api/products/:id
```json
{
  "id": 123,
  "name": "Wireless Headphones",
  "price": 99.99,
  "category": "Tech & Gadget",
  "description": "High-quality wireless headphones...",
  "image_url": "/images/products/123/primary.jpg",
  "images": [
    "/images/products/123/primary.jpg",
    "/images/products/123/secondary.jpg"
  ],
  "inventory_count": 5,
  "availability": "In Stock",
  "specs": {
    "processor": "Qualcomm Snapdragon",
    "ram": "Not specified",
    "storage": "Not specified",
    "battery_life": "30 hours",
    "connectivity": "Bluetooth 5.0, WiFi"
  }
}
```

### POST /api/contact
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I have a question about...",
  "consent_given": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Thank you for contacting us. We'll respond shortly.",
  "submission_id": 12345
}
```

**Response (Rate Limit):**
```json
{
  "success": false,
  "message": "You have reached the maximum submissions (5) per day. Please try again tomorrow.",
  "error_code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Timeline & Milestones

| Week | Frontend | Backend | Deliverable |
|------|----------|---------|-------------|
| 1–2 | Foundation, responsive design | Database setup, schema | Project infrastructure |
| 3–4 | Product display (grid, detail) | Image storage, product API | Product catalog |
| 5–6 | Search, filters, sorting | Search API, filter queries | Discovery features |
| 7–8 | Collections, homepage, New Arrivals | Collection queries, homepage API | Complete product discovery |
| 9 | Static pages (Our Story, Contact) | Availability logic | Information pages |
| 10–11 | Contact form | Contact submission, email, rate limiting | User engagement |
| 12–14 | Testing, optimization | Testing, security audit | Production-ready |

**Total Duration:** 14 weeks (production-ready MVP)

---

## Definition of Done

### Frontend
- [ ] All 81 FE-ACs implemented and passing
- [ ] 70%+ code coverage (unit & integration tests)
- [ ] Responsive on all breakpoints (verified manually on devices)
- [ ] WCAG 2.1 AA compliance (manual accessibility review)
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Performance: Page load < 3s on 4G
- [ ] No console errors or security warnings

### Backend
- [ ] All 76 BE-ACs implemented and passing
- [ ] 80%+ code coverage (unit & integration tests)
- [ ] All API endpoints documented and tested
- [ ] Performance targets met (queries < 100ms)
- [ ] Rate limiting functional and tested
- [ ] Email sending working (production & test)
- [ ] Security audit passed (SQL injection, input validation, CORS)
- [ ] Error handling consistent and no stack traces exposed

### Hybrid/Integration
- [ ] API contracts finalized and honored
- [ ] FE/BE coordination points tested
- [ ] End-to-end workflows tested (browse → detail → search → contact)
- [ ] Rate limiting tested from FE (error handling)
- [ ] All features work across browsers and devices

---

## Deployment Readiness

### Pre-Deployment Checklist
- [ ] All ACs verified as complete
- [ ] Full test suite passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Staging environment mirrors production
- [ ] Database backups configured
- [ ] Error tracking (Sentry, LogRocket) configured
- [ ] Monitoring/alerting in place
- [ ] Runbook created for common issues
- [ ] Team trained on deployment process

### Post-Deployment Verification
- [ ] Health checks passing (API, database, search)
- [ ] Error rate normal
- [ ] Performance metrics normal
- [ ] User-facing features functional
- [ ] Contact form emails working
- [ ] Rate limiting working

---

**Status: READY FOR IMPLEMENTATION** ✅

Both Frontend and Backend teams have clear, detailed roadmaps derived from the 131 acceptance criteria. Teams should follow these timelines while maintaining close coordination on hybrid features.
