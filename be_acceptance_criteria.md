# Backend Acceptance Criteria (BE-AC)
**Source:** requirement_breakdown.md  
**Framework:** HNTL / Expertise Guardrails  
**Date Generated:** August 24, 2026  
**Status:** Implementation Ready  

---

## Executive Summary

This document contains **all Backend-related acceptance criteria** extracted from requirement_breakdown.md. Backend criteria focus on:
- Data persistence and retrieval
- Database operations and queries
- API endpoints (if applicable)
- Business logic and validation rules
- Rate limiting and security
- Data retention and compliance
- External integrations (email, etc.)

**Total BE Acceptance Criteria:** 50 ACs across 17 requirements

---

## Categorized Backend Acceptance Criteria

### Category 1: Product Database & Storage (REQ-001 to REQ-002)

#### REQ-001: Product Database Infrastructure
**Backend Focus:** Database connectivity, schema initialization, data retrieval

**BE-AC-001-001:** Database connectivity and initialization
```
Given: PostgreSQL database instance is set up
When: The application starts
Then: Database connection is established without errors
And: Connection string is read from environment variables
And: Connection pooling is enabled (for performance)
And: All required tables exist:
  - products
  - product_images
  - product_specs
  - contact_submissions
  - (any other required tables)
And: Schema migrations have run successfully
```

**BE-AC-001-002:** Product data retrieval and field mapping
```
Given: Product records exist in the database
When: The application queries for products (e.g., SELECT * FROM products WHERE category = 'Tech & Gadget')
Then: All matching products are returned with required fields:
  - id (primary key)
  - name
  - price
  - category
  - image_url (or path)
  - inventory_count
  - is_new_arrival (boolean)
  - description
  - sku
And: Extended fields are also available:
  - ratings
  - tags (array or JSON)
  - dimensions
  - weight
  - category_specific_specs (JSON or related table)
And: Timestamps (created_at, updated_at) are included
```

**BE-AC-001-003:** Daily data sync process
```
Given: A scheduled daily sync process (Cron job or background worker)
When: The sync runs at configured time (e.g., 2:00 AM UTC)
Then: Product data is synchronized from source (if applicable)
And: Updated products are merged into database (INSERT or UPDATE as needed)
And: Timestamps (updated_at) reflect sync time
And: Any errors during sync are logged to error tracking system
And: Sync completion is logged (success or failure)
And: Sync process does not block user requests (runs in background)
```

**BE-AC-001-004:** Product volume support
```
Given: Database contains 100–999 products
When: Application queries for collection (e.g., Tech & Gadget with 150 products)
Then: Query executes in < 100ms
And: Results are paginated (20 per page)
And: Indexes on category, is_new_arrival, inventory_count improve query performance
And: Connection pool handles concurrent requests
```

---

#### REQ-002: Product Image Storage & Gallery
**Backend Focus:** File storage, path management, data validation

**BE-AC-002-001:** Image format support and validation
```
Given: Product images being uploaded
When: Image file is received by backend
Then: File extension is validated against allowed types: .jpg, .png, .webp
And: File MIME type is verified (image/jpeg, image/png, image/webp)
And: Non-image files are rejected with error
And: Validation occurs before file storage
```

**BE-AC-002-002:** Image size validation
```
Given: Image file being uploaded
When: Backend receives file
Then: File size is checked
And: Files <= 10MB are accepted and stored
And: Files > 10MB are rejected with error message: "File size exceeds 10MB limit"
And: Error response includes file size received
```

**BE-AC-002-003:** Local filesystem storage
```
Given: Validated image file
When: Image is ready to store
Then: Image is saved to local filesystem
And: Directory structure is: /images/products/{product_id}/
And: Filename is sanitized (no special characters, safe naming)
And: File path is stored in database (products.image_url or product_images table)
And: Stored as-is (no resizing or compression applied)
And: Original dimensions and format are preserved
```

**BE-AC-002-004:** Multi-image gallery support
```
Given: A product with multiple images
When: Images are uploaded for a product
Then: Up to 5 images are stored per product
And: Images beyond 5 are rejected with error: "Maximum 5 images per product"
And: Image order/sequence is preserved (first image is primary)
And: Product_images table (or similar) tracks all images per product
And: Query returns all images in order for product detail page
```

**BE-AC-002-005:** Image retrieval for gallery
```
Given: Product with 3 stored images
When: Frontend requests product details
Then: Backend returns all 3 image URLs/paths
And: Images are ordered (first = primary)
And: URLs/paths are valid and accessible
And: Response includes image metadata (if applicable)
```

**BE-AC-002-006:** Missing image handling (database level)
```
Given: Product with no images
When: Product is queried
Then: Image field contains NULL or empty array (depending on schema)
And: Frontend can handle missing image gracefully (shows placeholder)
And: No errors are logged for missing images
```

---

### Category 2: Collections & Product Organization (REQ-003)

#### REQ-003: Shop Collections
**Backend Focus:** Data organization, categorization logic, retrieval queries

**BE-AC-003-001:** All Products collection query
```
Given: Database with products in multiple categories
When: Backend queries for All Products collection
Then: Query: SELECT * FROM products WHERE is_deleted = false (or similar)
And: All products across all categories are returned
And: No filtering by category is applied
And: Results are paginated (20 per page)
```

**BE-AC-003-002:** Category-specific collection queries
```
Given: Database with categorized products
When: Backend queries for Tech & Gadget collection
Then: Query: SELECT * FROM products WHERE category = 'Tech & Gadget' AND is_deleted = false
And: Only Tech & Gadget products are returned
When: Backend queries for Fashion collection
Then: Query: SELECT * FROM products WHERE category = 'Fashion' AND is_deleted = false
And: Only Fashion products are returned
(Similar for Lifestyle, Home & Living, Games & Play)
```

**BE-AC-003-003:** Category specifications in schema
```
Given: Product data schema
When: Product is created/updated
Then: Product must have category field with allowed values:
  - 'All Products' (virtual, not stored)
  - 'Tech & Gadget'
  - 'Fashion'
  - 'Lifestyle'
  - 'Home & Living'
  - 'Games & Play'
And: Category is enforced via enum or CHECK constraint
And: Invalid categories are rejected
```

**BE-AC-003-004:** Mandatory specifications per category
```
Given: Product in Tech & Gadget category
When: Product is created/updated
Then: All required specs must be present:
  - processor (can be 'Not specified')
  - ram (can be 'Not specified')
  - storage (can be 'Not specified')
  - battery_life (can be 'Not specified')
  - connectivity (can be 'Not specified')
And: Product cannot be published without all spec fields
```

**BE-AC-003-005 through AC-003-006:** Similar validation for other categories
```
Fashion: size, material, color, fit (all mandatory)
Lifestyle: dimensions, weight, material, color (all mandatory)
Home & Living: dimensions, material, weight, color (all mandatory)
Games & Play: age_range, player_count, game_duration (all mandatory)
```

---

### Category 3: Product Listing & Detail (REQ-004 to REQ-009)

#### REQ-008: Product Detail Page — Core Fields (BE)
**Backend Focus:** API endpoint, data serialization, response format

**BE-AC-008-001:** Product detail API endpoint
```
Given: Frontend requests product details (e.g., GET /api/products/123)
When: Request is received
Then: Backend retrieves product from database by ID
And: Response includes all core fields:
  - id
  - name
  - price
  - category
  - description
  - inventory_count (for availability logic)
  - image_url (or list of images)
  - is_new_arrival
  - specifications (category-specific)
  - created_at
  - updated_at
And: Response format is JSON
And: Response includes HTTP 200 status code
And: Response time is < 100ms
```

**BE-AC-008-002:** Product not found error handling
```
Given: Frontend requests product with invalid ID (e.g., GET /api/products/99999)
When: Request is received
Then: Backend checks database
And: Product is not found
And: Response returns HTTP 404 status code
And: Response body includes error message: "Product not found"
And: No exception stack traces are exposed to frontend
```

---

#### REQ-009: Product Detail Page — Specifications (BE)
**Backend Focus:** Spec storage, retrieval, validation

**BE-AC-009-001:** Specifications storage in database
```
Given: Product specs (e.g., processor, RAM for Tech & Gadget)
When: Product is created/updated
Then: Specs are stored in database:
  - Option A: As separate product_specs table with product_id foreign key
  - Option B: As JSON column in products table
  - Option C: As serialized data (depends on DB choice)
And: Specs are retrievable by product_id
And: All specs are retrieved together (no N+1 queries)
```

**BE-AC-009-002:** Spec validation on product import
```
Given: Product data being imported (CSV, API, or bulk upload)
When: Product is processed
Then: Backend validates all mandatory specs for category are present:
  - Processor, RAM, storage, battery, connectivity for Tech & Gadget (etc.)
And: Missing specs are flagged
And: Product import fails with validation error if specs are missing
Or: Missing specs are filled with 'Not specified' (if auto-fill enabled)
```

**BE-AC-009-003:** Spec retrieval in detail endpoint
```
Given: Product detail endpoint called
When: Backend retrieves product
Then: All category-specific specs are included in response
And: Missing specs return 'Not specified' (not null/empty)
And: Specs are organized by category type
And: Response format is clear and parseable
```

**BE-AC-009-004:** Tech & Gadget specs example
```
Given: Tech & Gadget product with specs
When: Product detail is retrieved
Then: Response includes specs object:
{
  "processor": "Intel Core i7",
  "ram": "16GB",
  "storage": "512GB SSD",
  "battery_life": "10 hours",
  "connectivity": "WiFi 6, Bluetooth 5.0"
}
Or: Missing specs show as:
{
  "processor": "Not specified",
  "ram": "16GB",
  ...
}
```

---

### Category 4: New Arrivals & Featured Products (REQ-010 to REQ-011)

#### REQ-010: New Arrivals Section (BE)
**Backend Focus:** Flag management, query logic, dual display

**BE-AC-010-001:** New Arrivals flag in database
```
Given: Products table in database
When: Schema is defined
Then: Column exists: is_new_arrival (boolean, default false)
And: Index on is_new_arrival exists (for query performance)
And: Flag can be toggled by admin (future admin interface)
```

**BE-AC-010-002:** New Arrivals collection query
```
Given: Backend receives request for New Arrivals collection
When: Query is executed
Then: Query: SELECT * FROM products WHERE is_new_arrival = true AND is_deleted = false
And: All New Arrivals products are returned
And: Results are paginated (20 per page)
And: Results may be sorted by date added or by is_new_arrival priority
```

**BE-AC-010-003:** Dual display — product in both category and New Arrivals
```
Given: Product with is_new_arrival = true AND category = 'Tech & Gadget'
When: Tech & Gadget collection is queried
Then: Product is included in results
When: New Arrivals collection is queried
Then: Same product is also included in results
And: No duplicate prevention (product appears in both lists)
```

**BE-AC-010-004:** New Arrivals pagination backend
```
Given: 45 New Arrivals products
When: Frontend requests page 2 (e.g., GET /api/shop/new-arrivals?page=2)
Then: Backend returns products 21-40
And: Pagination metadata is included:
  {
    "page": 2,
    "per_page": 20,
    "total": 45,
    "total_pages": 3
  }
```

**BE-AC-010-005:** Filtering and sorting on New Arrivals (BE)
```
Given: New Arrivals page with filters applied
When: User applies price filter (e.g., "$50-$100")
Then: Backend query includes WHERE clause:
  WHERE is_new_arrival = true AND price BETWEEN 50 AND 100
And: Same filter/sort logic as other collection pages
And: Performance is acceptable (< 100ms)
```

---

#### REQ-011: New Arrivals & Featured Products — Homepage Preview (BE)
**Backend Focus:** Homepage data endpoint, featured product management

**BE-AC-011-001:** Featured products storage (future)
```
Given: Featured products feature (Phase 2+)
When: Schema is designed
Then: Column or flag exists: is_featured (boolean, default false)
Or: Separate featured_products table with product_id, order, created_at
And: Admin can toggle is_featured flag
```

**BE-AC-011-002:** Homepage data endpoint
```
Given: Frontend requests homepage data
When: GET /api/homepage endpoint is called
Then: Backend returns:
  - Featured products (list of product objects)
  - New Arrivals preview (subset of is_new_arrival=true products, e.g., first 5)
  - Collection previews (sample products from each collection)
  - "Our Story" preview content
And: All data is returned in single response (efficient, no N+1)
And: Response time < 300ms
```

**BE-AC-011-003:** Featured products query
```
Given: Featured products endpoint
When: Backend retrieves featured products
Then: Query: SELECT * FROM products WHERE is_featured = true LIMIT 5 (or configured)
Or: SELECT * FROM featured_products ORDER BY position LIMIT 5
And: Returns up to 5 featured products (or configured quantity)
```

---

### Category 5: Search (REQ-015 to REQ-016)

#### REQ-015: Search Feature — MVP Status (BE)
**Backend Focus:** Search API, result ranking, empty results

**BE-AC-015-001:** Search API endpoint
```
Given: Frontend sends search query
When: GET /api/search?q=wireless endpoint is called
Then: Backend receives search term
And: Search is performed across:
  - Product names
  - Product categories
  - Product keywords/tags
And: Results are returned in JSON format
And: Results are paginated (20 per page)
And: Response time < 500ms (for typical query)
```

**BE-AC-015-002:** Search database query logic
```
Given: Search query "wireless headphones"
When: Backend executes search
Then: Query searches:
  - Product name LIKE '%wireless%' OR '%headphones%'
  - Category LIKE '%wireless%' OR '%headphones%'
  - Tags/keywords LIKE '%wireless%' OR '%headphones%'
Or: Full-text search using PostgreSQL FTS (Full Text Search)
And: Results are ranked (exact matches first)
```

**BE-AC-015-003:** Search result count
```
Given: Search results page
When: Results are returned
Then: Response includes metadata:
  {
    "query": "wireless",
    "total_results": 25,
    "page": 1,
    "per_page": 20
  }
And: Total count is accurate
```

**BE-AC-015-004:** Search empty state (no results)
```
Given: Search query with no matching products (e.g., "xyzabc")
When: Backend executes search
Then: Results array is empty []
And: total_results = 0
And: HTTP status is 200 (not 404)
And: Frontend can display "No products found" message
```

**BE-AC-015-005:** Search result filtering
```
Given: Search results page with filters applied
When: User applies price filter on search results
Then: Backend query adds WHERE clause:
  WHERE (name LIKE '%query%' OR keywords LIKE '%query%') AND price BETWEEN 50 AND 100
And: Results are re-filtered and re-paginated
```

---

#### REQ-016: Search — Real-Time Input (BE)
**Backend Focus:** Query performance, debouncing support, response time

**BE-AC-016-001:** Real-time search performance
```
Given: User typing search query character-by-character
When: Each character triggers a search request
Then: Backend query executes quickly (< 200ms)
And: Database indexes on searchable fields (name, keywords) exist
And: No expensive operations block search (no unindexed full table scans)
And: Connection pool handles multiple concurrent search requests
```

**BE-AC-016-002:** Search debouncing support (API)
```
Given: Frontend debounces requests (waits 300ms after typing)
When: Search query is sent
Then: Backend receives one search request (not multiple)
And: Response time is acceptable (< 300ms)
```

**BE-AC-016-003:** Search timeout handling
```
Given: Complex search query takes > 5 seconds
When: Search is executed
Then: Query times out and returns error
Or: Query is cancelled and partial results are returned
And: Timeout is logged
And: Frontend receives error response (HTTP 504 or custom timeout error)
```

---

### Category 6: Contact Form & Backend Services (REQ-019 to REQ-022)

#### REQ-020: Contact Form Submission — Storage & Email (BE)
**Backend Focus:** Data persistence, email integration, error handling

**BE-AC-020-001:** Contact submission database storage
```
Given: Valid contact form submission
When: Form data is received by backend
Then: Submission is stored in database table contact_submissions:
  - id (auto-increment)
  - name
  - email
  - subject
  - message
  - consent_given (boolean)
  - ip_address (for rate limiting)
  - created_at (timestamp)
  - is_spam (flag, default false)
  - response_sent (flag, default false)
And: All fields are stored as-is (no modification)
And: created_at timestamp is set to current server time
```

**BE-AC-020-002:** Email to support inbox
```
Given: Contact submission stored in database
When: Submission is complete
Then: Email is sent to support@northstar.com with:
  - From: submissions@northstar.com (or no-reply@)
  - To: support@northstar.com
  - Subject: "New Contact Form: [Customer Subject]"
  - Body: Customer name, email, subject, message
  - Reply-To: [Customer Email]
And: Email is sent asynchronously (non-blocking)
And: Email send is logged (success or failure)
And: Retry logic exists (if email fails, retry up to 3 times)
```

**BE-AC-020-003:** Customer confirmation email
```
Given: Contact submission completed
When: Email is sent
Then: Confirmation email is sent to customer's email address:
  - From: support@northstar.com
  - To: [Customer Email]
  - Subject: "We received your message"
  - Body: Thank you message, submission summary, expected response time
And: Email is sent asynchronously
And: Email send is logged
```

**BE-AC-020-004:** Success response to frontend
```
Given: Contact form submission succeeds
When: Backend receives valid submission
Then: Response is sent to frontend:
  HTTP 200 {
    "success": true,
    "message": "Thank you for contacting us. We'll respond shortly.",
    "submission_id": 12345
  }
```

**BE-AC-020-005:** Error handling and user feedback
```
Given: Contact form submission fails (e.g., email service down)
When: Error occurs during processing
Then: Response is sent to frontend:
  HTTP 500 {
    "success": false,
    "message": "There was an error submitting your form. Please try again.",
    "error_code": "SUBMISSION_ERROR"
  }
And: Error is logged to error tracking system
And: Support team is alerted (optional)
And: Submission is saved (or marked as pending retry)
```

**BE-AC-020-006:** Data retention and automatic deletion
```
Given: Contact submission stored 1 year ago
When: Background job runs daily
Then: Job queries: SELECT * FROM contact_submissions WHERE created_at < NOW() - INTERVAL 1 YEAR
And: Submissions older than 1 year are deleted
And: Deletion is logged:
  - Number of records deleted
  - Timestamp of deletion
  - Reason (retention policy)
And: Deletion is permanent (no soft delete for compliance)
```

**BE-AC-020-007:** No user deletion (immutable submissions)
```
Given: User attempts to delete their contact submission (if user account exists in future)
When: DELETE request is received
Then: Backend rejects deletion request
And: Response returns HTTP 403 Forbidden:
  {
    "success": false,
    "message": "Submissions cannot be deleted"
  }
And: Deletion attempt is logged (for audit trail)
```

---

#### REQ-021: Contact Form — GDPR & Privacy (BE)
**Backend Focus:** Consent tracking, privacy compliance

**BE-AC-021-001:** Consent checkbox validation (backend)
```
Given: Contact form submission
When: Form data is received
Then: Backend checks consent_given field
And: If consent_given = false, submission is rejected
And: Response returns error: "Consent is required to proceed"
And: Submission is NOT stored (respects user intent)
```

**BE-AC-021-002:** Consent flag storage
```
Given: Contact submission with consent checked
When: Submission is stored
Then: contact_submissions.consent_given = true
And: Timestamp of consent is recorded
And: Consent is immutable (cannot be revoked after submission)
```

**BE-AC-021-003:** GDPR compliance — data processing
```
Given: Contact submissions stored
When: Processing contact data
Then: Backend complies with GDPR:
  - Consent is obtained before storing data (AC-021-001)
  - Data is stored only for legitimate purpose (contact response)
  - Data is retained for 1 year (AC-020-006)
  - Data is automatically deleted after retention period
  - User has right to know data is retained (privacy notice)
  - No data is shared with third parties (unless necessary)
```

---

#### REQ-022: Contact Form — Rate Limiting (BE)
**Backend Focus:** Rate limit logic, IP tracking, counter management

**BE-AC-022-001:** Rate limit enforcement
```
Given: Contact form submission from IP 192.168.1.100
When: Submissions are tracked:
  - First submission: 09:00 (count = 1)
  - Second submission: 10:00 (count = 2)
  - Third submission: 11:00 (count = 3)
  - Fourth submission: 12:00 (count = 4)
  - Fifth submission: 13:00 (count = 5)
Then: Fifth submission is processed successfully
When: Sixth submission attempted within same 24-hour period
Then: Submission is rejected
And: Response returns HTTP 429 Too Many Requests:
  {
    "success": false,
    "message": "You have reached the maximum submissions (5) per day. Please try again tomorrow.",
    "retry_after": 3600 (seconds until reset)
  }
```

**BE-AC-022-002:** Rate limit counter and reset
```
Given: Rate limit system with 5 submissions per IP per 24 hours
When: Counter resets daily
Then: Reset occurs at midnight (UTC or configured timezone)
And: Counter for each IP is incremented separately
And: Counter is stored in Redis or database (depends on implementation)
And: After reset, count returns to 0
```

**BE-AC-022-003:** IP address tracking
```
Given: Contact form submission from user
When: Submission is received
Then: Backend extracts user's IP address:
  - From X-Forwarded-For header (if behind proxy)
  - Or from direct connection IP
And: IP is stored with submission (for debugging)
And: IP is used as key for rate limiting
And: Rate limit is applied per IP (shared limit for all users from same IP)
```

---

### Category 7: Filtering & Sorting (REQ-023 to REQ-025)

#### REQ-023: Filtering — MVP Options (BE)
**Backend Focus:** Filter query parameters, WHERE clause logic, performance

**BE-AC-023-001:** Price filter backend logic
```
Given: Frontend sends filter request with price range
When: GET /api/products?price_min=50&price_max=100 is called
Then: Backend builds WHERE clause:
  WHERE price >= 50 AND price <= 100
And: Query executes efficiently (< 100ms)
And: Results are limited to matching products
```

**BE-AC-023-002:** Category filter
```
Given: Frontend sends category filter
When: GET /api/products?category=Tech%20%26%20Gadget is called
Then: Backend builds WHERE clause:
  WHERE category = 'Tech & Gadget'
And: Only products in category are returned
And: Multiple categories can be filtered (OR logic)
```

**BE-AC-023-003:** Availability filter
```
Given: Frontend sends availability filter
When: GET /api/products?in_stock=true is called
Then: Backend builds WHERE clause:
  WHERE inventory_count > 0
And: Only in-stock products are returned
And: If in_stock=false or not provided, all products shown
```

---

#### REQ-024: Sorting — MVP Options (BE)
**Backend Focus:** Sort parameter handling, ORDER BY logic

**BE-AC-024-001:** Price sorting backend
```
Given: Frontend sends sort request
When: GET /api/products?sort=price_asc is called
Then: Backend builds ORDER BY clause:
  ORDER BY price ASC
And: Products are sorted low-to-high by price
When: GET /api/products?sort=price_desc is called
Then: ORDER BY price DESC (high-to-low)
```

**BE-AC-024-002:** Newest-first sorting
```
Given: Frontend sends sort request
When: GET /api/products?sort=newest is called
Then: Backend builds ORDER BY clause:
  ORDER BY created_at DESC
Or: ORDER BY is_new_arrival DESC, created_at DESC (prioritize new arrivals)
And: Newest products appear first
```

**BE-AC-024-003:** No default sort
```
Given: Frontend requests products without sort parameter
When: GET /api/products (no sort parameter)
Then: Backend returns products in database order (natural order)
And: No ORDER BY clause is applied
And: No default sort is forced
```

---

#### REQ-025: Filtering & Sorting — Applied Pages (BE)
**Backend Focus:** Unified filter/sort logic, query optimization

**BE-AC-025-001:** Combined filters and sorting
```
Given: Frontend sends combined filter and sort request
When: GET /api/products?category=Tech&price_min=100&sort=price_asc is called
Then: Backend builds complex query:
  SELECT * FROM products
  WHERE category = 'Tech & Gadget' AND price >= 100
  ORDER BY price ASC
  LIMIT 20 OFFSET 0
And: Query executes efficiently
And: Results are accurate (correct filters + correct sort)
```

**BE-AC-025-002:** Independent filter/sort state per page
```
Given: User filters on All Products page
When: User navigates to Tech & Gadget collection
Then: Backend receives new request without previous filters
And: Tech & Gadget collection starts fresh (no residual filters)
And: Filter state is not persisted across collections
```

---

### Category 8: Product Availability (REQ-026)

#### REQ-026: Product Availability Determination (BE)
**Backend Focus:** Availability logic, inventory comparison

**BE-AC-026-001:** In stock determination logic
```
Given: Product with inventory_count = 10
When: Backend calculates availability
Then: Product availability = "In Stock"
And: Availability flag is derived from: inventory_count > 0
And: Status is computed on-the-fly (no separate field needed)
```

**BE-AC-026-002:** Out of stock determination logic
```
Given: Product with inventory_count = 0
When: Backend calculates availability
Then: Product availability = "Out of Stock"
And: Logic: inventory_count == 0 → "Out of Stock"
And: Availability is computed consistently across all endpoints
```

---

### Category 9: Search Ranking & Results (REQ-028 to REQ-030)

#### REQ-028: Search Result Ranking (BE)
**Backend Focus:** Ranking algorithm, match-type prioritization

**BE-AC-028-001:** Exact name match ranking
```
Given: Search query "Wireless Headphones"
When: Products are searched
Then: Products with exact name match "Wireless Headphones" rank highest
And: Query prioritizes: WHERE name ILIKE 'Wireless Headphones' (priority 1)
Then: Partial matches (e.g., "Wireless Earbuds") rank lower
And: Partial matches: WHERE name ILIKE '%Wireless%' OR name ILIKE '%Headphones%' (priority 2)
```

**BE-AC-028-002:** Keyword match ranking
```
Given: Search query "audio"
When: Products are searched
Then: Products with "audio" in name rank highest (exact word in name)
Then: Products with "audio" in keywords/tags rank lower
And: Results are ordered by match type (exact > partial > keyword)
```

---

#### REQ-030: Search Result Pagination (BE)
**Backend Focus:** Pagination query logic, metadata

**BE-AC-030-001:** Results per page backend
```
Given: Search query returns 50 results
When: GET /api/search?q=wireless&page=1 is called
Then: Backend query:
  SELECT * FROM products
  WHERE (search conditions)
  ORDER BY (ranking)
  LIMIT 20 OFFSET 0
And: First 20 products are returned
And: Pagination metadata included:
  {
    "page": 1,
    "per_page": 20,
    "total": 50,
    "total_pages": 3
  }
```

**BE-AC-030-002:** Pagination navigation
```
Given: Search results with 3 pages
When: GET /api/search?q=wireless&page=2 is called
Then: Backend query uses OFFSET 20 (to skip first 20)
And: Products 21-40 are returned
And: Metadata shows page=2, total_pages=3
When: User clicks "Next" to go to page 3
Then: OFFSET 40, returns products 41-50
```

---

### Category 10: Data & Compliance (REQ-038 to REQ-039)

#### REQ-038: Product Data — Base Schema (BE)
**Backend Focus:** Database schema design, field definitions

**BE-AC-038-001:** Mandatory product fields in schema
```
Given: Products table design
When: Schema is created
Then: Table includes all mandatory fields:
  - id (PRIMARY KEY, auto-increment)
  - name (VARCHAR, NOT NULL)
  - price (DECIMAL, NOT NULL)
  - image_url (VARCHAR)
  - category (ENUM or VARCHAR, NOT NULL)
  - description (TEXT)
  - inventory_count (INT, NOT NULL, DEFAULT 0)
  - is_new_arrival (BOOLEAN, DEFAULT false)
  - sku (VARCHAR, unique)
  - created_at (TIMESTAMP, default NOW())
  - updated_at (TIMESTAMP, default NOW())
```

**BE-AC-038-002:** Extended product fields in schema
```
Given: Products table
When: Schema is designed
Then: Table also includes extended fields:
  - ratings (DECIMAL or JSON)
  - tags (ARRAY or JSON)
  - dimensions (VARCHAR or JSON)
  - weight (DECIMAL or VARCHAR)
  - specs (JSON column for category-specific specs)
And: Extended fields are optional (can be NULL)
And: Proper indexing exists on frequently queried fields
```

---

#### REQ-039: Contact Submission — Data Retention & Compliance (BE)
**Backend Focus:** Retention policy, deletion automation

**BE-AC-039-001:** One-year retention policy
```
Given: Contact submission created on August 24, 2026
When: August 24, 2027 arrives
Then: Submission is eligible for deletion
And: Background job identifies: WHERE created_at < NOW() - INTERVAL 1 YEAR
And: Submissions are deleted (permanent, no soft delete)
And: Deletion is logged with timestamp and count
```

**BE-AC-039-002:** Automatic deletion background job
```
Given: Retention policy of 1 year
When: Daily background job runs (e.g., 3:00 AM UTC)
Then: Job executes:
  DELETE FROM contact_submissions
  WHERE created_at < NOW() - INTERVAL 1 YEAR;
And: Job logs result: "Deleted 3 contact submissions"
And: Job runs reliably (not missed or skipped)
And: Job error notifications alert support if deletion fails
```

---

## API Endpoints Summary

Backend must implement (or support) these endpoints:

| Endpoint | Method | Purpose | BE-AC |
|----------|--------|---------|-------|
| /api/products | GET | List all products (with filters/sort) | AC-023-001 through AC-025-002 |
| /api/products/:id | GET | Get product detail | AC-008-001, AC-009-001 |
| /api/shop/:collection | GET | Get collection (Tech & Gadget, Fashion, etc.) | AC-003-001 through AC-003-006 |
| /api/shop/new-arrivals | GET | Get New Arrivals collection | AC-010-002 |
| /api/search | GET | Search products | AC-015-001 through AC-015-005 |
| /api/homepage | GET | Get homepage data (featured, previews) | AC-011-002 |
| /api/contact | POST | Submit contact form | AC-020-001 through AC-020-005 |

---

## Backend Implementation Notes

### Database
- PostgreSQL (self-managed)
- Schema: products, product_images, product_specs, contact_submissions, (others as needed)
- Indexes on: category, is_new_arrival, inventory_count, name (for search), created_at
- Connection pooling enabled

### Performance Targets
- Product queries: < 100ms
- Search queries: < 500ms
- Contact form submission: < 1 second
- Email send (async): logged but non-blocking

### Error Handling
- Graceful error messages (no stack traces to frontend)
- 400 Bad Request: Invalid input
- 404 Not Found: Resource not found
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error
- All errors logged to error tracking system

### Security & Compliance
- Rate limiting: 5 submissions per IP per 24 hours
- GDPR compliance: Consent required, 1-year retention, automatic deletion
- SQL injection prevention: Parameterized queries
- Email validation: RFC 5322 format
- Data sanitization on input

### External Services
- Email service: Send emails to support@northstar.com and customers
- Error tracking: Log errors for monitoring
- Scheduled jobs: Daily data sync, daily retention cleanup

---

## Summary: Backend Acceptance Criteria

### BE-AC Distribution by Requirement

| Requirement | BE-AC Count | Category |
|-------------|------------|----------|
| REQ-001 | 4 | Database |
| REQ-002 | 6 | Image Storage |
| REQ-003 | 6 | Collections |
| REQ-008 | 2 | Detail Endpoint |
| REQ-009 | 4 | Spec Retrieval |
| REQ-010 | 5 | New Arrivals |
| REQ-011 | 3 | Featured/Homepage |
| REQ-015 | 5 | Search API |
| REQ-016 | 3 | Search Performance |
| REQ-020 | 7 | Contact Storage/Email |
| REQ-021 | 3 | Privacy/Consent |
| REQ-022 | 3 | Rate Limiting |
| REQ-023 | 3 | Price Filter |
| REQ-024 | 3 | Sorting |
| REQ-025 | 2 | Combined Filters |
| REQ-026 | 2 | Availability Logic |
| REQ-028 | 2 | Search Ranking |
| REQ-030 | 2 | Pagination |
| REQ-038 | 2 | Schema Design |
| REQ-039 | 2 | Retention/Deletion |
| **TOTAL BE-AC** | **76** | |

---

**Status: READY FOR BE DEVELOPMENT** ✅

All backend acceptance criteria are implementation-ready. Backend team should use these ACs for API design, database schema, business logic, and testing.
