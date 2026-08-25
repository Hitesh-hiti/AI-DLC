# Implementation Roadmap — Northstar E-commerce
**Version:** 1.0  
**Date:** August 24, 2026  
**Timeline:** 4 weeks (MVP to launch-ready)  
**Framework:** HNTL-aligned technical specifications

---

## Overview

This roadmap organizes the Technical Specification into actionable development sprints.

**Total Effort:** 4 weeks (20 business days)
- Week 1: Backend API + Database
- Week 2: Frontend UI + Integration
- Week 3: Testing + Refinement
- Week 4: Deployment + Launch

---

## Week 1: Backend & Database Setup

### Sprint 1.1: Project Initialization & Database (Days 1–2)

#### Tasks

1. **Repository Setup**
   - [ ] Initialize Git repository
   - [ ] Set up branch protection (main)
   - [ ] Add .gitignore (node_modules, .env, etc.)
   - [ ] Set up CI/CD pipeline skeleton (GitHub Actions / GitLab CI)

2. **Node.js Project Setup**
   - [ ] Initialize npm project
   - [ ] Install dependencies:
     ```bash
     npm install express cors dotenv joi axios winston
     npm install pg sequelize                    # Database
     npm install express-rate-limit               # Rate limiting
     npm install nodemailer sendgrid/mail         # Email
     npm install jwt-simple                       # JWT (future)
     npm install --save-dev jest supertest        # Testing
     ```
   - [ ] Create project structure:
     ```
     /backend
     ├── src/
     │   ├── api/
     │   │   ├── routes/
     │   │   ├── controllers/
     │   │   └── middleware/
     │   ├── database/
     │   │   ├── models/
     │   │   ├── migrations/
     │   │   └── seeders/
     │   ├── services/
     │   ├── utils/
     │   ├── config/
     │   └── index.js
     ├── .env
     ├── .env.example
     ├── server.js
     └── package.json
     ```

3. **Docker Setup**
   - [ ] Create Dockerfile for backend
   - [ ] Create Dockerfile for PostgreSQL
   - [ ] Create docker-compose.yml
   - [ ] Create init.sql (database initialization)

4. **PostgreSQL Database**
   - [ ] Create Docker PostgreSQL container
   - [ ] Create database schema (6 tables from technical-specification.md §4.1):
     - [ ] products
     - [ ] product_images
     - [ ] product_specifications
     - [ ] collections
     - [ ] contact_submissions
     - [ ] static_content
   - [ ] Create indexes (performance optimization)
   - [ ] Seed collections data (6 collections, Q3)
   - [ ] Seed static content (About, Contact Info)

5. **Documentation**
   - [ ] Document database schema in README
   - [ ] Document setup instructions
   - [ ] Create DATABASE.md (schema reference)

---

### Sprint 1.2: Core API Endpoints (Days 3–4)

#### Tasks

1. **Products API**
   - [ ] Implement GET /api/v1/products
     - Filtering: collection, price range, availability (Q11a)
     - Sorting: newest, price-asc, price-desc, popular (Q11b)
     - Pagination: 20 per page
     - Test with 50+ seed products
   - [ ] Implement GET /api/v1/products/:id
     - Include images (5 max, Q10c)
     - Include specifications (by collection, Q12b)
     - Include related products
   - [ ] Implement database queries with indexes
   - [ ] Write unit tests for endpoints

2. **Collections API**
   - [ ] Implement GET /api/v1/collections
     - Return 6 collections (Q3)
     - Include product_count per collection
   - [ ] Implement GET /api/v1/collections/:slug/products
     - Reuse product filtering logic

3. **Search API** (Q5, Q14)
   - [ ] Implement GET /api/v1/search
     - Full-text search (PostgreSQL FTS)
     - Keyword/tag ranking (Q14a)
     - No popularity boosting (Q14b)
     - 20 per page, paginated (Q14c)
   - [ ] Implement search query validation
   - [ ] Test with various queries

4. **New Arrivals API** (Q2)
   - [ ] Implement GET /api/v1/new-arrivals
     - Query products WHERE is_new_arrival = true
     - Paginated (20 per page)
     - Support sorting

5. **Error Handling & Logging**
   - [ ] Implement global error handler
   - [ ] Set up structured logging (Winston)
   - [ ] Log all API requests and errors
   - [ ] Create error response format

6. **Testing**
   - [ ] Write unit tests for all endpoints
   - [ ] Write integration tests
   - [ ] Target: 80%+ code coverage

---

### Sprint 1.3: Contact Form & Security (Days 5)

#### Tasks

1. **Contact Form Endpoint**
   - [ ] Implement POST /api/v1/contact
     - Input validation (Q4: name, email, subject, message)
     - Consent checkbox validation (Q7)
     - Store in PostgreSQL contact_submissions (Q4)
     - Set expires_at = created_at + 1 year (Q4c)
   - [ ] Create contact_submissions schema

2. **Rate Limiting** (Q8)
   - [ ] Implement express-rate-limit
     - 5 submissions per IP per 24 hours
     - Store IP in contact_submissions
     - Return 429 Too Many Requests

3. **Email Integration** (Q4, Q6)
   - [ ] Set up SendGrid or SMTP
     - Send admin notification to support@northstar.com (Q6)
     - Send confirmation to customer (Q4b)
   - [ ] Create email templates
   - [ ] Test email delivery

4. **GDPR Compliance** (Q7, Q4c)
   - [ ] Add privacy notice to response
   - [ ] Document consent checkbox requirement
   - [ ] Plan auto-deletion cron job (1-year retention)

5. **Testing**
   - [ ] Test form validation
   - [ ] Test rate limiting
   - [ ] Test email sending
   - [ ] Test error handling

---

## Week 2: Frontend UI & Integration

### Sprint 2.1: React Project Setup (Days 1–2)

#### Tasks

1. **React Project Setup**
   - [ ] Initialize React project with Vite
   - [ ] Install dependencies:
     ```bash
     npm install react react-dom react-router-dom
     npm install axios                          # HTTP client
     npm install tailwindcss                    # Styling
     npm install --save-dev vitest @testing-library/react
     ```
   - [ ] Create project structure:
     ```
     /frontend
     ├── src/
     │   ├── components/
     │   │   ├── common/
     │   │   ├── pages/
     │   │   ├── forms/
     │   │   └── products/
     │   ├── pages/
     │   ├── hooks/
     │   ├── services/
     │   ├── styles/
     │   ├── App.jsx
     │   └── main.jsx
     ├── public/
     ├── index.html
     ├── tailwind.config.js
     └── package.json
     ```

2. **Design System & Styling**
   - [ ] Set up Tailwind CSS
   - [ ] Create color palette (from design-specification.md §7.1)
   - [ ] Create typography styles
   - [ ] Create utility classes
   - [ ] Create component baseline (buttons, cards, forms)

3. **Routing Setup**
   - [ ] Configure React Router for 8 pages:
     - / (Homepage)
     - /shop (Shop/Collections)
     - /shop/:collection (Collection page)
     - /products/:id (Product Detail)
     - /new-arrivals (New Arrivals)
     - /our-story (Our Story)
     - /contact (Contact)
     - /search (Search Results)

---

### Sprint 2.2: Page Components (Days 3–4)

#### Tasks

1. **Common Components**
   - [ ] Header / Navigation
     - Responsive hamburger menu on mobile (Q15b)
     - Dropdown for Shop collections
     - Search bar (with real-time input handling)
     - Links to all main pages
   - [ ] Footer
     - Links to collections, about, contact
     - Social media links (if applicable)
     - Copyright info

2. **Homepage (design-specification.md §3.1)**
   - [ ] Hero section with CTA
   - [ ] Featured products section (4 products)
   - [ ] Collections preview (Tech, Fashion, Lifestyle)
   - [ ] New Arrivals preview (4–6 products)
   - [ ] Our Story preview
   - [ ] Mobile responsive layout

3. **Shop / Collection Pages (design-specification.md §3.2)**
   - [ ] Product grid (responsive: 2 cols mobile, 3 tablet, 4 desktop)
   - [ ] Filter sidebar
     - Price range slider (Q11a)
     - Category checkboxes (Q11a)
     - Availability checkboxes (Q11a)
   - [ ] Sort dropdown (Q11b)
   - [ ] Pagination (20 per page, Q14c)
   - [ ] Mobile: Collapsible filter drawer

4. **Product Detail Page (design-specification.md §3.3)**
   - [ ] Image gallery
     - Primary image display
     - Thumbnail strip (5 images, Q10c)
     - Desktop: arrows + click thumbnails
     - Mobile: swipeable with dot indicators
   - [ ] Product information
     - Name, price, category, availability
     - Description
     - Specifications (by collection, Q12b)
   - [ ] Related products carousel
   - [ ] Mobile responsive layout

5. **Search Results Page (design-specification.md §3.5)**
   - [ ] Real-time search input (Q5, Q14)
   - [ ] Results grid
   - [ ] Pagination (20 per page, Q14c)
   - [ ] Empty state (no results message)

---

### Sprint 2.3: Remaining Pages & Forms (Day 5)

#### Tasks

1. **New Arrivals Page (design-specification.md §3.4)**
   - [ ] Display new products (Q2)
   - [ ] Same filters/sorts as Shop
   - [ ] [NEW] badges on products
   - [ ] Pagination

2. **Our Story Page (design-specification.md §3.6)**
   - [ ] Static content sections
     - Who We Are
     - Mission
     - Values
     - Differentiator

3. **Contact Page (design-specification.md §3.7)**
   - [ ] Contact information display
   - [ ] Contact form
     - Fields: name, email, subject, message (Q4)
     - Real-time validation (Q4)
     - Consent checkbox (Q7)
     - Privacy notice (Q7)
   - [ ] Form submission
     - POST to /api/v1/contact
     - Handle rate limit error (429) (Q8)
     - Show success/error messages
   - [ ] Error states (validation errors)
   - [ ] Success state (confirmation message)

4. **Mobile Responsive Design** (Q15)
   - [ ] Test all pages at 3 breakpoints
   - [ ] Hamburger menu functionality
   - [ ] Touch-friendly buttons
   - [ ] Swipeable galleries
   - [ ] Collapsible filters

---

### Sprint 2.4: API Integration (Parallel with 2.2–2.3)

#### Tasks

1. **API Service Layer**
   - [ ] Create API client (axios instance)
   - [ ] Create service functions for each endpoint
   - [ ] Error handling & retry logic
   - [ ] Loading states

2. **Data Fetching**
   - [ ] useEffect hooks for fetching products
   - [ ] State management (useState, useContext)
   - [ ] Loading/error states display
   - [ ] Implement pagination on frontend

3. **Search Implementation** (Q5, Q14)
   - [ ] Real-time search input (debounced, ~300ms, Q5)
   - [ ] Show dropdown results as user types
     - Click result → Product Detail Page
     - Press Enter → Search Results Page
   - [ ] Search results page (20 per page, Q14c)

---

## Week 3: Testing & Refinement

### Sprint 3.1: Functional Testing (Days 1–3)

#### Tasks

1. **Backend Testing**
   - [ ] Unit tests for all endpoints (80%+ coverage)
   - [ ] Integration tests for full flows
   - [ ] Test data validation
   - [ ] Test rate limiting
   - [ ] Test email sending
   - [ ] Test error handling

2. **Frontend Testing**
   - [ ] Component tests (React Testing Library)
   - [ ] Form validation tests
   - [ ] API integration tests
   - [ ] Responsive design tests

3. **End-to-End Testing**
   - [ ] Product browsing flow
   - [ ] Search flow
   - [ ] Filter/sort flow
   - [ ] Contact form submission
   - [ ] Mobile flows

---

### Sprint 3.2: Performance & Accessibility (Days 4–5)

#### Tasks

1. **Performance Testing**
   - [ ] Measure page load time (target: < 3s)
   - [ ] Measure API response time (target: < 300ms)
   - [ ] Test with 100+ products, 500+ images
   - [ ] Load testing (concurrent requests)
   - [ ] Optimize slow queries

2. **Accessibility Testing**
   - [ ] Semantic HTML verification
   - [ ] Keyboard navigation testing
   - [ ] Color contrast verification (WCAG AA)
   - [ ] Screen reader testing (NVDA/JAWS)
   - [ ] Mobile accessibility

3. **Security Testing**
   - [ ] Input validation testing (XSS, SQL injection)
   - [ ] Rate limiting verification
   - [ ] CORS verification
   - [ ] SSL/TLS configuration
   - [ ] Secrets management (.env)

4. **Bug Fixes & Refinements**
   - [ ] Fix failing tests
   - [ ] Optimize performance
   - [ ] Polish UI/UX
   - [ ] Fix accessibility issues

---

## Week 4: Deployment & Launch

### Sprint 4.1: Deployment Setup (Days 1–2)

#### Tasks

1. **Infrastructure Setup**
   - [ ] Set up Docker containers (backend, database, nginx)
   - [ ] Configure nginx (SSL, reverse proxy)
   - [ ] Set up environment variables (.env for prod)
   - [ ] Configure image storage directory
   - [ ] Set up automated backups (daily)

2. **Database Setup (Production)**
   - [ ] Create PostgreSQL database (production)
   - [ ] Run migrations
   - [ ] Seed collections & static content
   - [ ] Configure backups & retention (1 year for contact data, Q4c)

3. **Email Service**
   - [ ] Configure SendGrid (or SMTP)
   - [ ] Test email delivery (admin + customer)
   - [ ] Set up email monitoring

4. **Monitoring & Logging**
   - [ ] Set up structured logging (Winston/ELK)
   - [ ] Set up error monitoring (Sentry or similar)
   - [ ] Configure alerts (high error rate, API down)

---

### Sprint 4.2: Pre-Launch Testing (Day 3)

#### Tasks

1. **Production Smoke Tests**
   - [ ] Test all API endpoints
   - [ ] Test product browsing
   - [ ] Test search
   - [ ] Test contact form
   - [ ] Test rate limiting
   - [ ] Test email sending

2. **Data Validation**
   - [ ] Verify 6 collections seeded (Q3)
   - [ ] Verify sample products loaded
   - [ ] Verify images accessible
   - [ ] Verify static content (Our Story, Contact)

3. **Performance in Production**
   - [ ] Verify page load times
   - [ ] Verify API response times
   - [ ] Monitor database performance

---

### Sprint 4.3: Launch & Monitoring (Days 4–5)

#### Tasks

1. **Launch**
   - [ ] Deploy to production (docker-compose up -d)
   - [ ] Verify all services running
   - [ ] Monitor logs for errors
   - [ ] Perform final smoke tests
   - [ ] Announce launch

2. **Post-Launch Monitoring**
   - [ ] Monitor API uptime & performance
   - [ ] Monitor error rates
   - [ ] Check email delivery
   - [ ] Respond to user issues
   - [ ] Document any production issues

3. **Documentation**
   - [ ] Create deployment runbook
   - [ ] Create incident response procedures
   - [ ] Create scaling guidelines
   - [ ] Create backup/recovery procedures

---

## Parallel Work Streams

### Image & Content Preparation (All Weeks)

- [ ] Prepare 50+ sample products with data
- [ ] Prepare product images (5 per product, JPG/PNG/WebP, Q10)
- [ ] Prepare Our Story static content
- [ ] Prepare contact information

### DevOps & Infrastructure (Weeks 1–4)

- [ ] Set up Git repository & branching strategy
- [ ] Set up CI/CD pipeline (automated tests on push)
- [ ] Set up staging environment
- [ ] Set up production environment
- [ ] Set up monitoring & alerting

### Documentation (All Weeks)

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database documentation
- [ ] Deployment documentation
- [ ] Architecture decision records (ADRs)
- [ ] Setup instructions

---

## Daily Standups

**Format:** 15 minutes, 9:00 AM UTC

**Attendees:** Backend Dev, Frontend Dev, QA, Product Owner (optional)

**Questions:**
1. What did you complete yesterday?
2. What will you complete today?
3. What blockers do you have?

---

## Risk Mitigation

### High-Risk Items

| Risk | Mitigation |
|------|-----------|
| Database performance with 1000s of products | Index all queries; test with 10,000 products early |
| Image handling (5 per product) | Use CDN for images; test upload flow early |
| Email delivery failures | Use SendGrid (managed service); test SMTP early |
| Real-time search performance | PostgreSQL FTS; optimize queries; cache results |
| Rate limiting bugs | Test rate limiting thoroughly; add monitoring |
| Deployment issues | Use Docker locally first; test docker-compose setup |

---

## Success Criteria

| Criterion | Target | Owner |
|-----------|--------|-------|
| All API endpoints tested & working | 100% pass | Backend |
| All pages responsive (mobile/tablet/desktop) | All pages | Frontend |
| API response time | < 300ms (p95) | Backend |
| Page load time | < 3s | Frontend + Backend |
| Test coverage | > 80% | Both |
| Zero security vulnerabilities | 0 | QA |
| GDPR compliance | ✓ Consent + 1-year retention | Backend + Legal |
| Rate limiting working | 5/IP/day enforced | Backend + QA |
| Email delivery tested | ✓ Sent & received | Backend + QA |

---

## Deliverables Checklist

### End of Week 1
- [ ] Database schema created and tested
- [ ] 8 API endpoints working
- [ ] Contact form endpoint with rate limiting
- [ ] Email integration tested
- [ ] Backend unit tests > 80% coverage
- [ ] Docker setup working locally

### End of Week 2
- [ ] React project set up
- [ ] All 8 pages built and responsive
- [ ] API integration working
- [ ] Frontend tests > 60% coverage
- [ ] Mobile navigation working (hamburger menu, Q15b)
- [ ] Image gallery working (Q10)

### End of Week 3
- [ ] All tests passing (unit + integration + E2E)
- [ ] Performance targets met
- [ ] Accessibility verified (WCAG AA baseline)
- [ ] Security testing completed
- [ ] Bug fixes completed
- [ ] Documentation updated

### End of Week 4
- [ ] Production deployment tested
- [ ] Monitoring & alerting configured
- [ ] Backups configured (1-year retention, Q4c)
- [ ] Launch completed
- [ ] Post-launch monitoring active
- [ ] Runbook & documentation complete

---

## Resource Requirements

**Team:**
- 1 Backend Developer (Node.js/Express/PostgreSQL)
- 1 Frontend Developer (React/Vite)
- 1 QA Engineer
- 1 DevOps/Infrastructure (part-time)
- 1 Product Owner (oversight)

**Infrastructure:**
- Local development machines
- Staging server (Docker, similar to prod)
- Production server (Docker, self-managed)
- CI/CD pipeline (GitHub Actions)

**Services:**
- SendGrid (email, free tier available)
- (Optional) Sentry (error tracking)
- (Optional) Prometheus + Grafana (monitoring)

---

## Communication Plan

**Daily:** 9:00 AM UTC Standups (15 min)

**Weekly:** Monday 10:00 AM UTC Sprint Planning & Review (1 hour)

**Bi-weekly:** Product Owner Check-in (30 min)

**As-Needed:** Slack channel for blockers & quick discussions

---

## Document Control

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0 |
| **Date** | August 24, 2026 |
| **Timeline** | 4 weeks (20 business days) |
| **Team Size** | 3–5 people |
| **Status** | Ready for development kickoff |
| **Next Step** | Assign tasks & begin Week 1 |

---

**Implementation Roadmap Complete**

Development can begin immediately. First sprint (Week 1, Days 1–2) starts with database setup and project initialization.

Reference: technical-specification.md for full implementation details.
