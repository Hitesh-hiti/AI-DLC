# Technical Specification — Northstar E-commerce Web Application
**Version:** 1.0  
**Date:** August 24, 2026  
**Status:** Technical Specification Phase Kickoff  
**Framework:** HNTL-aligned (all decisions from gap-analysis.md)

---

## 1. Executive Summary

This Technical Specification translates **15 resolved requirements** (from gap-analysis.md) and **design specifications** into actionable technical architecture, API design, database schema, and infrastructure requirements.

### Key Technical Decisions

- **Backend:** Node.js/Express (REST API) or Python/FastAPI
- **Database:** PostgreSQL (self-managed, Docker)
- **Frontend:** React/Vue.js (SPA with server-side rendering)
- **Image Storage:** Local filesystem with structured directories
- **Search:** Full-text search in PostgreSQL or Elasticsearch
- **Email:** SMTP or SendGrid API
- **Rate Limiting:** Middleware-based (5 submissions/IP/day for contact form)
- **Deployment:** Docker containers, self-managed infrastructure

---

## 2. Technology Stack Recommendation

### Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Node.js/Express or Python/FastAPI | Rapid development, good ecosystem for REST APIs |
| **Runtime** | Node.js 18+ LTS or Python 3.11+ | Long-term support, stable |
| **Database Driver** | pg (Node) or psycopg2 (Python) | PostgreSQL native drivers, good performance |
| **ORM/Query Builder** | Sequelize/TypeORM (Node) or SQLAlchemy (Python) | Type safety, migrations, relationships |
| **Validation** | Joi/Zod (Node) or Pydantic (Python) | Input validation, schema definition |
| **Rate Limiting** | express-rate-limit (Node) or slowapi (Python) | Built-in rate limiting middleware |
| **Authentication** | JWT (for future user registration) | Stateless, scalable |
| **Logging** | Winston/Pino (Node) or Python logging | Structured logging, monitoring |
| **Testing** | Jest/Mocha (Node) or pytest (Python) | Unit + integration testing |

### Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | React 18+ or Vue.js 3+ | Component-based, reactive UI, large ecosystems |
| **Build Tool** | Vite or webpack | Fast builds, hot module replacement |
| **State Management** | Context API / Zustand or Vuex | Minimal state for MVP (browsing only) |
| **HTTP Client** | fetch API or axios | Making API calls, handling requests |
| **CSS** | Tailwind CSS or CSS Modules | Utility-first or component-scoped styling |
| **Responsive Design** | CSS media queries or Tailwind breakpoints | Mobile-first responsive |
| **Testing** | Vitest/Jest + React Testing Library or Vue Test Utils | Component + E2E testing |
| **SEO** | Next.js or Nuxt.js (optional) | Server-side rendering for SEO (future) |

### Database

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Database** | PostgreSQL 14+ | Robust, ACID, full-text search, JSON support |
| **Deployment** | Docker container (self-managed) | Q9 decision: self-managed, not cloud-hosted |
| **Backup Strategy** | Daily automated backups to external storage | 1-year contact data retention (Q4c) |
| **Scaling** | Connection pooling (pgBouncer or built-in) | Handle concurrent connections |

### Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Containerization** | Docker | Consistent environments (dev, test, prod) |
| **Orchestration** | Docker Compose (simple) or Kubernetes (scale) | For self-managed deployment |
| **Reverse Proxy** | Nginx | API gateway, SSL termination, load balancing |
| **Image Storage** | Local filesystem + structured directories | Q10: local filesystem (JPG/PNG/WebP, 10MB, 5 per product) |
| **Email Service** | SMTP (self-managed) or SendGrid API | Send contact form confirmations + admin notifications |
| **Monitoring** | Prometheus + Grafana (optional) or ELK Stack | Track performance, errors, uptime |

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                   (React/Vue SPA + HTML/CSS/JS)                 │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTPS/HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REVERSE PROXY (Nginx)                      │
│              (SSL termination, load balancing)                  │
└────────────────────────┬──────────────────────────────────────┘
                         │ HTTP
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Node/Python)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                                      │  │
│  │  - GET /api/products (with filters, sorting, pagination) │  │
│  │  - GET /api/products/:id (details + specifications)      │  │
│  │  - GET /api/search (real-time, with results)             │  │
│  │  - GET /api/collections                                  │  │
│  │  - GET /api/new-arrivals (paginated)                     │  │
│  │  - POST /api/contact (with rate limiting, validation)    │  │
│  │  - GET /api/content (Our Story, static pages)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware                                              │  │
│  │  - Authentication (JWT, future user registration)        │  │
│  │  - Rate Limiting (5/IP/day for contact form)             │  │
│  │  - Input Validation (Joi/Zod or Pydantic)               │  │
│  │  - CORS (Cross-origin requests)                          │  │
│  │  - Logging & Monitoring                                  │  │
│  │  - Error Handling                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬──────────────────────────────────────┘
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐   ┌─────────────┐
    │PostgreSQL│    │  Local  │   │    Email    │
    │Database  │    │Filesystem│  │Service(SMTP)│
    │          │    │  Images │   │             │
    └─────────┘     └─────────┘   └─────────────┘
```

### 3.2 Component Interaction Flow

```
User Request (Browser)
    │
    ├─→ [GET /api/products?collection=tech&sort=newest]
    │   └─→ API validates query params
    │   └─→ API queries PostgreSQL (with filters, pagination)
    │   └─→ API returns JSON (products array, pagination meta)
    │   └─→ Browser renders product grid
    │
    ├─→ [GET /api/products/:id]
    │   └─→ API queries PostgreSQL (product + images + specs)
    │   └─→ API returns JSON (full product details)
    │   └─→ Browser renders product detail page
    │   └─→ Images loaded from local filesystem (/images/product-123/)
    │
    ├─→ [GET /api/search?q=wireless]
    │   └─→ API performs full-text search in PostgreSQL
    │   └─→ Returns matching products (keyword/tag ranking)
    │   └─→ Browser shows results in dropdown or results page
    │
    ├─→ [POST /api/contact] (form submission)
    │   └─→ Rate limiter checks IP: 5/day limit
    │   └─→ Input validation (name, email, subject, message)
    │   └─→ Consent checkbox verified
    │   └─→ Data stored in PostgreSQL contact_submissions table
    │   └─→ Email sent to support@northstar.com
    │   └─→ Response: success with confirmation email reference
    │
    └─→ [GET /api/new-arrivals?page=1&limit=20]
        └─→ API queries products WHERE is_new_arrival = true
        └─→ Returns paginated results
        └─→ Browser renders New Arrivals page
```

---

## 4. Database Schema

### 4.1 PostgreSQL Schema Design

#### Table: `products`

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'tech', 'fashion', 'lifestyle', 'home_living', 'games_play', 'all'
    sku VARCHAR(100) UNIQUE,
    inventory_count INT DEFAULT 0,   -- Q13a: determines availability (> 0 = in stock)
    is_new_arrival BOOLEAN DEFAULT FALSE,  -- Q2: manual curation flag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,   -- soft delete
    
    INDEX idx_category (category),
    INDEX idx_is_new_arrival (is_new_arrival),
    INDEX idx_inventory (inventory_count),
    FULLTEXT INDEX idx_search (name, description)  -- For search queries
);
```

**Fields Mapping to Requirements:**
- `name`, `description`, `price`, `category` → Q8 (product listing fields)
- `inventory_count > 0` → Q13a (availability logic)
- `is_new_arrival` flag → Q2 (New Arrivals manual curation)
- `sku` → Q1 (additional field from Q1b)
- `created_at` → Used for "newest" sorting (Q11b)

#### Table: `product_images`

```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,  -- Relative path: /images/products/product-123/image-1.jpg
    image_order INT NOT NULL,           -- 1-5 for gallery order (Q10c: 5 images max)
    alt_text VARCHAR(255),              -- Accessibility
    file_size_bytes INT,                -- Track 10MB limit (Q10b)
    file_type VARCHAR(20),              -- jpg, png, webp (Q10a)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (product_id, image_order),
    INDEX idx_product (product_id),
    CONSTRAINT max_images_per_product CHECK (image_order <= 5)
);
```

**Fields Mapping to Requirements:**
- Q1: Multiple images per product
- Q10a: File types (jpg, png, webp)
- Q10b: 10MB max file size
- Q10c: 5 images per product max
- Q10d: Store as-is (no optimization)

#### Table: `product_specifications`

```sql
CREATE TABLE product_specifications (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_key VARCHAR(100) NOT NULL,    -- e.g., 'processor', 'battery_life', 'material', 'size'
    spec_value VARCHAR(500),           -- e.g., 'Intel i7', '30 hours', 'cotton', '32x24cm'
    display_order INT,
    
    UNIQUE (product_id, spec_key),
    INDEX idx_product (product_id)
);
```

**Fields Mapping to Requirements:**
- Q12: Product specs optional per product
- Q12b: Examples by collection (stored as key-value pairs)
- Example specs:
  - **Tech & Gadget:** processor, RAM, storage, battery_life, connectivity
  - **Fashion:** size, material, color, fit
  - **Lifestyle:** dimensions, weight, material, color
  - **Home & Living:** dimensions, material, weight, color
  - **Games & Play:** age_range, player_count, game_duration

#### Table: `collections`

```sql
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,  -- 'All Products', 'Tech & Gadget', etc.
    slug VARCHAR(100) UNIQUE,           -- URL-friendly name
    description TEXT,
    display_order INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Seed Data (Q3: 6 collections in MVP):**
```sql
INSERT INTO collections (name, slug, display_order) VALUES
('All Products', 'all-products', 1),
('Tech & Gadget', 'tech-gadget', 2),
('Fashion', 'fashion', 3),
('Lifestyle', 'lifestyle', 4),
('Home & Living', 'home-living', 5),
('Games & Play', 'games-play', 6);
```

#### Table: `contact_submissions`

```sql
CREATE TABLE contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45),            -- IPv4 or IPv6 for rate limiting (Q8)
    consent_given BOOLEAN DEFAULT FALSE,  -- Q7: GDPR consent checkbox
    is_replied BOOLEAN DEFAULT FALSE,
    reply_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,              -- Q4c: 1 year retention, then auto-delete
    
    INDEX idx_created (created_at),
    INDEX idx_ip_address (ip_address),
    INDEX idx_expires (expires_at)
);
```

**Fields Mapping to Requirements:**
- Q4: Contact form fields (name, email, subject, message)
- Q4d: Error handling (reply tracking)
- Q4c: 1-year retention (expires_at = created_at + 1 year)
- Q7: Consent checkbox
- Q8: IP address for rate limiting (5/IP/day)

#### Table: `static_content`

```sql
CREATE TABLE static_content (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(100) UNIQUE,  -- 'about', 'story', 'contact_info', etc.
    content_key VARCHAR(100),       -- 'who_we_are', 'mission', 'values', etc.
    content_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Seed Data (Q1: Static content for MVP):**
```sql
INSERT INTO static_content (page_name, content_key, content_value) VALUES
('about', 'who_we_are', 'At Northstar, we believe...'),
('about', 'mission', 'Our mission is to...'),
('about', 'values', 'Quality, Ethics, Community'),
('contact', 'email', 'support@northstar.com'),
('contact', 'phone', '+1 (555) 123-4567'),
('contact', 'address', '123 Commerce Street, San Francisco, CA 94107');
```

### 4.2 Database Relationships

```
collections (1) ──→ (M) products
    ↓
    └──→ product_images (1:M, max 5 images per product)
    ├──→ product_specifications (1:M, optional specs)
    └──→ (implied) in search results

contact_submissions (independent table)
    └──→ Tracks submissions for 1 year (Q4c)
    ├──→ Rate limited by IP (Q8)
    ├──→ Requires consent (Q7)
    └──→ Auto-deleted after 1 year (via cron job)

static_content (independent table)
    └──→ Our Story, contact info (Q1: static for MVP)
```

### 4.3 Indexes for Performance

```sql
-- Product queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_new_arrival ON products(is_new_arrival);
CREATE INDEX idx_products_inventory ON products(inventory_count);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Search queries
CREATE FULLTEXT INDEX idx_products_search ON products(name, description);
CREATE INDEX idx_products_category_active ON products(category, is_active);

-- Image queries
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_order ON product_images(product_id, image_order);

-- Contact form queries
CREATE INDEX idx_contact_submissions_ip ON contact_submissions(ip_address);
CREATE INDEX idx_contact_submissions_created ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_expires ON contact_submissions(expires_at);

-- Specs queries
CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);
```

---

## 5. API Specification

### 5.1 Base URL & Authentication

```
Base URL: https://api.northstar.com/v1
Authentication: None for MVP (public browsing)
Future: JWT for registered users (Phase 2)
Rate Limiting: 5 submissions/IP/day for contact form (Q8)
```

### 5.2 API Endpoints

#### **A. PRODUCTS ENDPOINTS**

##### GET /api/v1/products

**Description:** Get all products with filtering and sorting

**Query Parameters:**
```
?collection=tech-gadget     (optional) — filter by collection
?sort=newest                (optional) — sort: 'newest', 'price-asc', 'price-desc', 'popular'
?price_min=0                (optional) — price range filter (Q11a)
?price_max=500              (optional)
?availability=in-stock      (optional) — filter: 'in-stock', 'out-of-stock', 'all' (Q11a)
?page=1                     (default: 1) — pagination (Q14c: 20 per page)
?limit=20                   (default: 20) — items per page
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "price": 79.99,
      "category": "tech-gadget",
      "availability": "in-stock",
      "image": "/images/products/1/image-1.jpg",
      "is_new_arrival": true
    },
    ...
  ],
  "pagination": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

**Status Codes:**
- 200 OK — Success
- 400 Bad Request — Invalid query parameters
- 500 Internal Server Error — Server error

---

##### GET /api/v1/products/:id

**Description:** Get product details with full information

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation...",
    "price": 79.99,
    "category": "tech-gadget",
    "sku": "WH-001",
    "inventory_count": 45,
    "availability": {
      "in_stock": true,
      "status": "In Stock"
    },
    "is_new_arrival": true,
    "images": [
      {
        "id": 1,
        "path": "/images/products/1/image-1.jpg",
        "alt_text": "Wireless Headphones - Black",
        "order": 1
      },
      ...  (up to 5 images, Q10c)
    ],
    "specifications": {
      "connectivity": "Bluetooth 5.0",
      "battery_life": "30 hours",
      "weight": "250g",
      "color": "Black, Silver"
    },
    "related_products": [
      { "id": 2, "name": "Charging Case", "price": 29.99, ... }
    ]
  }
}
```

**Status Codes:**
- 200 OK — Success
- 404 Not Found — Product not found
- 500 Internal Server Error

---

#### **B. SEARCH ENDPOINTS**

##### GET /api/v1/search

**Description:** Real-time search with keyword/tag matching (Q5, Q14a/b)

**Query Parameters:**
```
?q=wireless                 (required) — search query
?page=1                     (default: 1)
?limit=20                   (default: 20, Q14c)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "price": 79.99,
      "image": "/images/products/1/image-1.jpg",
      "match_score": 95,
      "matched_fields": ["name", "keywords"]
    },
    {
      "id": 5,
      "name": "Wireless Mouse",
      "price": 34.99,
      "image": "/images/products/5/image-1.jpg",
      "match_score": 87,
      "matched_fields": ["name"]
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

**Search Logic (Q14a/b):**
- Keyword/tag match ranking (no popularity boosting, Q14b)
- Full-text search using PostgreSQL or Elasticsearch
- Matches product name, description, category, keywords
- Results ranked by relevance (exact match > partial > tag match)

**Status Codes:**
- 200 OK — Success (empty array if no results)
- 400 Bad Request — Missing query parameter
- 500 Internal Server Error

---

#### **C. COLLECTIONS ENDPOINTS**

##### GET /api/v1/collections

**Description:** Get all collections (Q3: 6 collections)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "All Products",
      "slug": "all-products",
      "description": "All products currently available",
      "product_count": 142
    },
    {
      "id": 2,
      "name": "Tech & Gadget",
      "slug": "tech-gadget",
      "description": "Technology and gadget-related products",
      "product_count": 34
    },
    {
      "id": 3,
      "name": "Fashion",
      "slug": "fashion",
      "product_count": 28
    },
    {
      "id": 4,
      "name": "Lifestyle",
      "slug": "lifestyle",
      "product_count": 22
    },
    {
      "id": 5,
      "name": "Home & Living",
      "slug": "home-living",
      "product_count": 31
    },
    {
      "id": 6,
      "name": "Games & Play",
      "slug": "games-play",
      "product_count": 27
    }
  ]
}
```

**Status Codes:**
- 200 OK — Success
- 500 Internal Server Error

---

##### GET /api/v1/collections/:slug/products

**Description:** Get products for a specific collection (paginated)

**Query Parameters:**
```
?sort=newest
?price_min=0
?price_max=500
?availability=in-stock
?page=1
?limit=20
```

**Response:** (Same as GET /api/v1/products but filtered to collection)

---

#### **D. NEW ARRIVALS ENDPOINTS**

##### GET /api/v1/new-arrivals

**Description:** Get paginated new arrival products (Q2)

**Query Parameters:**
```
?page=1
?limit=20
?sort=newest              (default, can also sort by price)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "price": 79.99,
      "category": "tech-gadget",
      "image": "/images/products/1/image-1.jpg",
      "is_new_arrival": true,
      "badge": "NEW"
    },
    ...
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

**Note (Q2):**
- Only products with `is_new_arrival = true`
- Manual curation (database flag)
- Products appear in BOTH their category AND New Arrivals (dual display)

---

#### **E. CONTACT FORM ENDPOINTS**

##### POST /api/v1/contact

**Description:** Submit contact form (Q4, Q7, Q8)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I have a question about the wireless headphones...",
  "consent_given": true
}
```

**Validation (Q4c, Q7):**
```
- name: required, not empty, max 255 chars
- email: required, valid email format
- subject: required, not empty, max 255 chars
- message: required, not empty
- consent_given: required, must be true
```

**Rate Limiting (Q8):**
```
- Max 5 submissions per IP per 24 hours
- Returns 429 Too Many Requests if exceeded
```

**Response (Success, 201 Created):**
```json
{
  "success": true,
  "message": "Thank you for contacting us! We'll respond within 24 hours.",
  "data": {
    "submission_id": "sub_12345",
    "email": "john@example.com",
    "confirmation_email_sent": true,
    "contact_email": "support@northstar.com"
  }
}
```

**Response (Validation Error, 400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation Error",
  "errors": {
    "email": "Invalid email format",
    "message": "Message must not be empty"
  }
}
```

**Response (Rate Limit Exceeded, 429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Too many submissions",
  "message": "Maximum 5 submissions per day per IP address. Please try again tomorrow."
}
```

**Backend Actions (Q4, Q6):**
1. Validate all fields
2. Check rate limit (5/IP/day)
3. Check consent checkbox (Q7)
4. Store in PostgreSQL `contact_submissions` table with 1-year expiry (Q4c)
5. Send email to support@northstar.com (Q6)
6. Send confirmation email to user (Q4b)
7. Return success response

---

#### **F. CONTENT ENDPOINTS** (Future, for static pages)

##### GET /api/v1/content/:page

**Description:** Get static page content (Our Story, Contact Info)

**Examples:**
```
GET /api/v1/content/about
GET /api/v1/content/contact-info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "page": "about",
    "sections": {
      "who_we_are": "At Northstar, we believe...",
      "mission": "Our mission is to provide...",
      "values": ["Quality", "Ethics", "Community"],
      "differentiator": "What sets us apart..."
    }
  }
}
```

---

### 5.3 HTTP Response Format

**All endpoints follow this format:**

```json
{
  "success": true/false,
  "data": { ... },
  "error": "Error message (if any)",
  "errors": { ... },  (if validation errors)
  "pagination": { ... }  (if applicable)
}
```

---

### 5.4 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — Request successful, data returned |
| 201 | Created — Resource created (POST /contact) |
| 400 | Bad Request — Invalid parameters or validation error |
| 404 | Not Found — Resource not found |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error — Server-side error |

---

### 5.5 Error Handling

**Validation Errors (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "errors": {
    "email": "Invalid email format",
    "name": "Name is required"
  }
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "You have exceeded the maximum number of requests (5) per day for this resource.",
  "retry_after": 86400
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## 6. Image Storage & Management

### 6.1 Local Filesystem Structure (Q10)

```
/images/
├── products/
│   ├── product-1/
│   │   ├── image-1.jpg        (primary image)
│   │   ├── image-2.png        (secondary)
│   │   ├── image-3.webp       (tertiary)
│   │   ├── image-4.jpg
│   │   └── image-5.jpg
│   ├── product-2/
│   │   ├── image-1.jpg
│   │   └── image-2.png
│   └── product-N/
│       └── ...
└── temp/
    └── uploads/               (temporary upload staging)
```

### 6.2 Image Specifications (Q10)

| Specification | Value |
|---------------|-------|
| **File Types** | JPG, PNG, WebP |
| **Max Size per Image** | 10MB |
| **Max Images per Product** | 5 |
| **Optimization** | No (store as-is) |
| **Cleanup** | Manual admin task or cron job |

### 6.3 Image Upload Validation

```
- File type: JPG, PNG, or WebP
- File size: ≤ 10MB
- Dimensions: Min 800x600px (recommended)
- Max 5 images per product
- Reject duplicates
```

### 6.4 Image URL Format

```
Frontend URL: /images/products/product-1/image-1.jpg
Backend path: /var/images/products/product-1/image-1.jpg

API Response: {
  "id": 1,
  "path": "/images/products/1/image-1.jpg",
  "alt_text": "Wireless Headphones - Black",
  "file_size_bytes": 1250000,
  "file_type": "jpg"
}
```

---

## 7. Rate Limiting & Security

### 7.1 Contact Form Rate Limiting (Q8)

**Implementation:**
```
- 5 submissions per IP address per 24 hours (Q8b)
- Tracked in middleware using IP address
- Returns 429 Too Many Requests if exceeded
- IP address stored in contact_submissions for reference
```

**Middleware Logic (Node.js example):**
```javascript
const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,  // 24 hours
  max: 5,                          // 5 requests per windowMs
  keyGenerator: (req) => req.ip,
  message: "Too many submissions from this IP, please try again tomorrow."
});

app.post('/api/v1/contact', contactLimiter, handleContactForm);
```

---

### 7.2 Input Validation & Sanitization

**Contact Form Validation:**
```
Name:
  - Required: yes
  - Type: string
  - Max length: 255
  - Pattern: alphanumeric + spaces, dashes, apostrophes
  - Sanitize: trim whitespace, remove HTML tags

Email:
  - Required: yes
  - Type: string
  - Format: valid email (RFC 5322)
  - Sanitize: lowercase, trim

Subject:
  - Required: yes
  - Type: string
  - Max length: 255
  - Pattern: alphanumeric + common punctuation
  - Sanitize: trim

Message:
  - Required: yes
  - Type: string
  - Min length: 10
  - Max length: 5000
  - Sanitize: trim, remove malicious scripts

Consent:
  - Required: yes
  - Type: boolean
  - Value: must be true
```

**Search Query Validation:**
```
Query (q):
  - Required: yes
  - Type: string
  - Min length: 1
  - Max length: 100
  - Sanitize: trim, escape SQL wildcards
  - Case-insensitive search
```

---

### 7.3 GDPR Compliance (Q7)

**Privacy Implementation:**
```
- Contact form includes consent checkbox: "I consent to my information being stored..."
- Privacy notice displayed: "Your information will be stored for 1 year per GDPR..."
- Data retention: 1 year (expires_at = created_at + 365 days)
- Auto-delete: Cron job deletes rows WHERE expires_at < NOW()
- No deletion allowed by user (Q4c): contact_submissions immutable after creation
```

**Privacy Policy Content:**
```
Your contact information (name, email, subject, message) will be:
- Stored securely in our database
- Retained for 1 year for compliance and customer service
- Only accessible to authorized Northstar staff
- Never shared with third parties
- Automatically deleted after 1 year
- Protected by SSL/TLS encryption in transit
- Not sold or used for marketing without consent
```

---

## 8. Email Service Integration

### 8.1 Contact Form Email Flow (Q4, Q6)

**Admin Notification Email:**
```
To: support@northstar.com
Subject: New Contact Form Submission
From: noreply@northstar.com

Body:
Dear Northstar Team,

You have received a new contact form submission:

Name: John Doe
Email: john@example.com
Subject: Product Inquiry
Message: I have a question about the wireless headphones...

Contact ID: sub_12345
Received: 2026-08-24 10:30:00 UTC
IP Address: 192.168.1.1

Please respond to the customer within 24 hours.

---
This is an automated message. Do not reply to this email.
```

**Customer Confirmation Email:**
```
To: john@example.com
Subject: We've Received Your Message - Northstar
From: support@northstar.com

Body:
Dear John,

Thank you for contacting Northstar! We've received your message and will respond within 24 hours.

Your submission reference: sub_12345

Subject: Product Inquiry

---
Our Privacy Policy explains how we handle your data.
Link: https://northstar.com/privacy
```

### 8.2 Email Service Options

**Option A: SMTP (Self-managed)**
```
Host: smtp.gmail.com (or custom mail server)
Port: 587 (TLS) or 465 (SSL)
Authentication: support@northstar.com + password
Library: nodemailer (Node.js) or smtplib (Python)
```

**Option B: SendGrid API (Managed Service)**
```
API Key: [SENDGRID_API_KEY]
From: support@northstar.com
Library: @sendgrid/mail
Cost: Pay-per-email (free tier available)
```

**Recommendation:** SendGrid for MVP (reliability, no maintenance)

### 8.3 Email Configuration (Environment Variables)

```bash
# .env file
EMAIL_SERVICE=sendgrid              # or 'smtp'
EMAIL_FROM=support@northstar.com
EMAIL_ADMIN_TO=support@northstar.com

# If SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx

# If SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@northstar.com
SMTP_PASSWORD=xxxxxxxxxxxxxxxx
```

---

## 9. Search Implementation

### 9.1 Search Options

**Option A: PostgreSQL Full-Text Search (Recommended for MVP)**
```sql
-- Full-text search query
SELECT *
FROM products
WHERE to_tsvector('english', name || ' ' || description || ' ' || keywords)
      @@ plainto_tsquery('english', 'wireless headphones')
ORDER BY ts_rank(to_tsvector('english', name), plainto_tsquery('english', 'wireless')) DESC
LIMIT 20 OFFSET 0;
```

**Pros:** Built-in, no additional service, fast for small datasets
**Cons:** Limited ranking options, not as powerful as Elasticsearch

**Option B: Elasticsearch (For Scale)**
```
GET /northstar-products/_search
{
  "query": {
    "multi_match": {
      "query": "wireless headphones",
      "fields": ["name^2", "description", "keywords"],
      "type": "best_fields"
    }
  },
  "size": 20,
  "from": 0
}
```

**Pros:** Powerful ranking, faceting, aggregations, scalable
**Cons:** Additional infrastructure, more complex, overkill for MVP

**Recommendation:** PostgreSQL FTS for MVP, migrate to Elasticsearch if needed (Phase 2)

### 9.2 Search Ranking (Q14a/b)

**Ranking Priority (Q14a: keyword/tag match):**
1. Exact product name match (highest relevance)
2. Partial product name match
3. Description/keyword match
4. Category match (lowest)

**No Boosting Applied (Q14b):**
- Popularity not considered
- Recency not boosted
- Simple relevance ranking

---

## 10. Background Jobs & Maintenance

### 10.1 Scheduled Tasks (Cron Jobs)

**Task: Delete Expired Contact Submissions (Q4c: 1-year retention)**

```bash
# Runs daily at 2:00 AM
0 2 * * * /usr/local/bin/delete-expired-contacts.sh
```

**Script Logic:**
```sql
-- Delete contact submissions older than 1 year
DELETE FROM contact_submissions
WHERE expires_at < NOW();
```

**Frequency:** Daily (or weekly)
**Retention:** 1 year (365 days)

### 10.2 Data Integrity & Backups

**Daily Automated Backups:**
```bash
# Backup PostgreSQL database daily
0 3 * * * /usr/local/bin/backup-db.sh

# Backup local filesystem images
0 4 * * * /usr/local/bin/backup-images.sh
```

**Backup Retention:**
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

---

## 11. Performance Optimization

### 11.1 Caching Strategy

**Frontend Caching (Browser):**
```
- Static assets (CSS, JS): 1 year (cache-busting with hash)
- Product images: 30 days
- API responses: 5 minutes (ETags for conditional requests)
```

**Server-Side Caching:**
```
- Collections list: Cache for 1 hour (rarely changes)
- Product list with filters: Cache for 15 minutes
- Search results: No caching (dynamic)
- Static content (Our Story): Cache for 1 day
```

**Implementation:**
```
Cache headers: Cache-Control: public, max-age=300
Cache invalidation: Manual purge when products updated
CDN: Optional (Cloudflare, Akamai)
```

### 11.2 Database Query Optimization

**Indexes (Already Defined in Schema):**
- Product category + availability
- New Arrivals flag
- Full-text search (name, description)
- Image product_id

**Connection Pooling:**
```
Pool size: 20 connections
Idle timeout: 30 seconds
Max queue: 100
```

**Query Pagination:**
- All list endpoints: 20 items per page (Q14c for search)
- Offset-based pagination (simple, works for MVP)
- Future: Cursor-based pagination for scale

---

## 12. Monitoring & Logging

### 12.1 Application Logging

**Log Levels:**
```
- ERROR: Database errors, API errors, exceptions
- WARN: Rate limit hits, validation failures, deprecations
- INFO: API requests, submissions, deployments
- DEBUG: Query details, variable values (dev only)
```

**Structured Logging (JSON format):**
```json
{
  "timestamp": "2026-08-24T10:30:00Z",
  "level": "ERROR",
  "service": "api",
  "endpoint": "POST /api/v1/contact",
  "error": "Database connection failed",
  "stack_trace": "...",
  "user_ip": "192.168.1.1",
  "request_id": "req_12345"
}
```

### 12.2 Monitoring Metrics

**Key Metrics to Track:**
```
- API response time (p50, p95, p99)
- Error rate (5xx, 4xx)
- Rate limit hits
- Database query time
- Image upload success rate
- Contact form submissions
- Contact deletion rate (1-year expiry)
```

**Tools:**
- Prometheus + Grafana (open-source)
- DataDog or New Relic (commercial)
- CloudWatch (AWS)

---

## 13. Deployment Architecture

### 13.1 Docker Containers

**Dockerfile (Backend):**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
```

**Dockerfile (Database):**
```dockerfile
FROM postgres:14-alpine

ENV POSTGRES_DB=northstar
ENV POSTGRES_USER=app_user
ENV POSTGRES_PASSWORD=secure_password

COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: northstar
      DB_USER: app_user
      DB_PASSWORD: secure_password
      NODE_ENV: production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    build: ./database
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      POSTGRES_PASSWORD: secure_password
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./images:/usr/share/nginx/html/images:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

---

### 13.2 Deployment Steps

```
1. Build Docker images
   docker-compose build

2. Pull latest code
   git pull origin main

3. Start services
   docker-compose up -d

4. Run database migrations
   docker-compose exec api npm run migrate

5. Verify health
   curl http://localhost:3000/api/v1/health

6. Monitor logs
   docker-compose logs -f api
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

**Backend (Node.js/Jest):**
```javascript
describe('Contact Form Validation', () => {
  test('should reject invalid email', () => {
    const result = validateContactForm({
      name: 'John',
      email: 'invalid-email',
      subject: 'Test',
      message: 'Hello'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  test('should accept valid submission', () => {
    const result = validateContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Product Inquiry',
      message: 'I have a question...',
      consent_given: true
    });
    expect(result.valid).toBe(true);
  });
});

describe('Search Ranking', () => {
  test('should rank exact name match higher', () => {
    // Test search ranking logic
  });

  test('should not apply popularity boost', () => {
    // Verify no popularity boosting per Q14b
  });
});
```

**Frontend (React/Vitest):**
```javascript
describe('Product Detail Page', () => {
  test('should render all 5 images in gallery', () => {
    const product = { images: [...5 images...] };
    render(<ProductDetail product={product} />);
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(5);
  });

  test('should show out-of-stock badge', () => {
    const product = { inventory_count: 0 };
    render(<ProductCard product={product} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
```

### 14.2 Integration Tests

```javascript
describe('Contact Form API', () => {
  test('should submit contact form and send email', async () => {
    const response = await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Inquiry',
        message: 'Test message',
        consent_given: true
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    
    // Verify email sent
    expect(sendEmailSpy).toHaveBeenCalledWith(
      'support@northstar.com',
      expect.any(String)
    );
  });

  test('should enforce rate limit (5/IP/day)', async () => {
    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/contact').send({...});
    }

    // 6th request should be rate limited
    const response = await request(app)
      .post('/api/v1/contact')
      .send({...});

    expect(response.status).toBe(429);
  });
});
```

---

## 15. Security Checklist

- ☐ **Input Validation:** All user inputs validated (contact form, search query)
- ☐ **SQL Injection Prevention:** Use parameterized queries/ORM
- ☐ **CSRF Protection:** CSRF tokens on forms (if applicable)
- ☐ **XSS Prevention:** Sanitize outputs, escape HTML
- ☐ **Rate Limiting:** 5/IP/day on contact form (Q8)
- ☐ **HTTPS/SSL:** All traffic encrypted in transit
- ☐ **CORS:** Proper CORS headers configured
- ☐ **Authentication:** JWT ready for future user registration
- ☐ **Logging:** No sensitive data logged (passwords, emails, PII)
- ☐ **Secrets Management:** Environment variables for API keys, DB passwords
- ☐ **GDPR Compliance:** Consent checkbox, privacy notice, 1-year retention

---

## 16. Technology Recommendations Summary

| Component | Recommendation | Rationale |
|-----------|-----------------|-----------|
| **Backend** | Node.js + Express | Fast, JavaScript, good ecosystem |
| **Frontend** | React 18 + Vite | Modern, reactive, SPA |
| **Database** | PostgreSQL 14+ (Docker) | Robust, ACID, full-text search, self-managed |
| **Search** | PostgreSQL FTS (MVP) → Elasticsearch (scale) | Simple to start, scalable |
| **Images** | Local filesystem | Q10 requirement, simple for MVP |
| **Email** | SendGrid API | Reliable, low-maintenance |
| **Caching** | Redis (optional) | Session storage, cache layer |
| **Rate Limiting** | express-rate-limit | Simple middleware |
| **Monitoring** | Prometheus + Grafana | Open-source, extensible |
| **Deployment** | Docker + Docker Compose | Reproducible, self-managed |
| **Testing** | Jest + React Testing Library | Standard, comprehensive |
| **Logging** | Winston (Node.js) or Python logging | Structured, searchable |

---

## 17. Next Steps for Development

### Phase 1: Backend Setup (Week 1)
- [ ] Initialize Node.js project with Express
- [ ] Set up PostgreSQL database (Docker)
- [ ] Create database schema (products, images, specs, contact_submissions)
- [ ] Implement API endpoints (products, search, collections, contact)
- [ ] Set up input validation and error handling
- [ ] Implement rate limiting for contact form
- [ ] Set up email service integration

### Phase 2: Frontend Setup (Week 1–2)
- [ ] Initialize React project with Vite
- [ ] Create responsive layouts (homepage, shop, product detail, contact)
- [ ] Implement product grid with filtering/sorting
- [ ] Implement real-time search
- [ ] Implement contact form with validation
- [ ] Integrate with backend API

### Phase 3: Integration & Testing (Week 2–3)
- [ ] API integration testing
- [ ] Frontend component testing
- [ ] End-to-end testing (Cypress/Playwright)
- [ ] Performance testing (page load, search speed)
- [ ] Security testing (input validation, rate limiting)

### Phase 4: Deployment & Launch (Week 3–4)
- [ ] Set up Docker deployment
- [ ] Configure Nginx reverse proxy
- [ ] Set up monitoring & logging
- [ ] Plan database backups
- [ ] Deploy to production
- [ ] Launch publicly

---

## Document Control

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0 (Technical Specification) |
| **Date** | August 24, 2026 |
| **Status** | ✅ **READY FOR DEVELOPMENT** |
| **Framework** | HNTL-aligned (all decisions from gap-analysis.md) |
| **Requirements Covered** | All 15 (Q1–Q15) |
| **Pages Specified** | 8 (all major pages) |
| **API Endpoints** | 8 (products, search, collections, new arrivals, contact, content) |
| **Database Tables** | 6 (products, images, specs, collections, contact, content) |
| **Next Phase** | Development Implementation |

---

**Technical Specification Complete — Ready for Development Team**

All architectural decisions, API specifications, database schemas, and implementation guidelines are documented. Development can begin immediately.

Reference: gap-analysis.md, design-specification.md, wireframes.md for full context.
