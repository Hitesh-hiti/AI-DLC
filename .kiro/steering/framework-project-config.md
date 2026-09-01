---
inclusion: always
---

# Kiro Agent Routing Framework — Project Configuration
## Project: Northstar E-commerce

This file is the **project-specific configuration layer** of the Kiro Agent Routing Framework.
It contains only Northstar-specific context, resources, lifecycle mappings, and optional model overrides.

Generic routing logic, phase detection, and model policy live in the framework agents and `framework-model-policy.md`.

To adapt this framework to a different project, replace only this file.

---

## 1. Project Identity

```
Project Name    : Northstar E-commerce
Project Type    : Web application — product discovery and browsing
Lifecycle       : AIDLC (AI-assisted Development Lifecycle)
Active Phase    : Week 2 — Frontend Development
Repository      : https://github.com/Hitesh-hiti/AI-DLC
```

---

## 2. Technology Stack

### Backend (Complete — Week 1)
```
Runtime         : Node.js 18+ LTS
Framework       : Express 4.18 (CommonJS — require/module.exports)
Database        : PostgreSQL 16 (Docker, self-managed)
DB Driver       : pg (connection pool via src/config/database.js)
Validation      : Joi 17 (schemas in src/utils/validation.js)
Logging         : Winston (src/config/logger.js)
Rate Limiting   : express-rate-limit (contact form: 5/IP/24h)
Email           : nodemailer + @sendgrid/mail
API Base URL    : http://localhost:3000/api/v1
Server Port     : 3000
```

### Frontend (Pending — Week 2)
```
Framework       : React 18 + Vite
State           : Zustand
HTTP Client     : axios
Styling         : CSS Modules / Tailwind CSS
Dev Port        : 5173
```

### Infrastructure
```
Containerization : Docker + Docker Compose
Database Setup   : docker compose up -d (from backend/)
No CI/CD yet     : GitHub Actions not yet configured
```

---

## 3. Project Source Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/          ← Route definitions
│   │   ├── controllers/     ← Request handlers
│   │   └── middleware/      ← CORS, logging, validation, rate-limit, errors
│   ├── services/            ← Business logic
│   ├── utils/               ← response.js, validation.js, constants.js
│   ├── config/              ← database.js, logger.js
│   └── database/            ← migrate.js, seed.js, sampleData.js
├── tests/
│   ├── unit/                ← 8 unit test files
│   └── integration/         ← 1 integration test file (api.test.js)
├── jest.config.js
├── package.json
└── docker-compose.yml
```

---

## 4. Database Schema (6 Tables)

```
products              — id, name, description, price, category, sku, inventory_count,
                        is_new_arrival, created_at, updated_at, is_active
product_images        — id, product_id, image_path, image_order (max 5), alt_text, file_type
product_specifications — id, product_id, spec_key, spec_value, display_order
collections           — id, name, slug, description, display_order, created_at
contact_submissions   — id, name, email, subject, message, ip_address, consent_given,
                        created_at, expires_at (1-year retention)
static_content        — id, page_name, content_key, content_value, updated_at
```

---

## 5. API Endpoints (9 Total)

```
GET  /health
GET  /api/v1/products                         ?collection, sort, price_min, price_max, availability, page, limit
GET  /api/v1/products/:id
GET  /api/v1/search                           ?q, page, limit
GET  /api/v1/new-arrivals                     ?sort, page, limit
GET  /api/v1/collections
GET  /api/v1/collections/:slug/products       ?sort, price_min, price_max, availability, page, limit
POST /api/v1/contact                          rate-limited: 5/IP/24h; requires consent_given: true
GET  /api/v1/content/:page                   pages: our_story | contact_information
```

---

## 6. Testing Framework

```
Framework   : Jest 29 + Supertest 6
Config      : backend/jest.config.js
Run all     : cd backend && npm test
Coverage    : cd backend && npm run test:coverage
Target      : >80% coverage
```

### Existing Test Files (do not duplicate)
```
tests/unit/validation.test.js
tests/unit/productService.test.js
tests/unit/contactService.test.js
tests/unit/collectionService.test.js
tests/unit/contentService.test.js
tests/unit/constants.test.js
tests/unit/middleware.test.js
tests/unit/responseHandler.test.js
tests/integration/api.test.js
tests/setup.js
```

---

## 7. Key Coding Conventions

```
Module system   : CommonJS (require / module.exports) — NOT ES Modules
Response format : Always use sendSuccess(), sendError(), sendPaginatedSuccess() from src/utils/response.js
Validation      : Always use Joi schemas from src/utils/validation.js
Logging         : Always use Winston logger from src/config/logger.js
DB queries      : Always use parameterized queries — never raw string concatenation
Architecture    : Routes → Controllers → Services → Database (strict layering)
```

### Standardized Response Shape
```json
{ "success": true,  "message": "...", "data": {}, "pagination": { "total", "page", "limit", "total_pages" } }
{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }
```

---

## 8. Existing Documentation Files

```
README.md                                    — project overview
API-SUMMARY.md                               — quick API reference with 10 curl examples
backend/API-ENDPOINTS.md                     — detailed endpoint docs (50+ curl examples)
backend/API-DOCUMENTATION.md                 — complete workflow guide
backend/openapi.yaml                         — OpenAPI 3.0 specification
FRONTEND-STARTER-GUIDE.md                    — frontend developer reference (1,728 lines)
BACKEND-QUICKSTART.md                        — backend setup in 60 seconds
backend/TESTING.md                           — testing guide
backend/SETUP.md                             — database setup options
backend/Northstar_API.postman_collection.json — importable Postman collection
backend/Northstar_API_Environment.postman_environment.json — Postman environment
```

---

## 9. Known Issues / Failure Patterns

```
ECONNREFUSED on startup   : PostgreSQL not running — run: cd backend && docker compose up -d
ERR_ERL_KEY_GEN_IPV6      : Fixed in rateLimiter.js — uses req.ip directly, standardHeaders: false
Jest open handles          : Unclosed pg pool in tests — ensure pool.end() in afterAll
404 on valid endpoint      : Route not registered in src/app.js
403 on git push            : SSH key not added to GitHub — see KIRO-AGENT-POC-REPORT.md
```

---

## 10. AIDLC Phase State

Current project state as of August 31, 2026:

```
✅ REQUIREMENT  — 15 decisions resolved (gap-analysis.md)
✅ DESIGN       — 8 pages wireframed (design-specification.md, wireframes.md)
✅ DEVELOPMENT  — Week 1 backend complete (9 endpoints, 6 tables, 65+ tests)
⏳ DEVELOPMENT  — Week 2 frontend pending (React/Vite, not started)
⏳ TESTING      — Week 3 integration + E2E testing pending
⏳ CODE_REVIEW  — Pending
⏳ DOCUMENTATION — Partially complete (backend docs done, frontend pending)
⏳ RELEASE      — Week 4 deployment pending
```

---

## 11. Project Design Artifacts

```
gap-analysis.md              — 15 resolved requirements (HNTL framework)
design-specification.md      — 8-page design spec with layouts and interaction patterns
wireframes.md                — ASCII wireframes for all pages (desktop + mobile)
technical-specification.md   — API spec, DB schema, system architecture
implementation-roadmap.md    — 4-week sprint plan with daily tasks
design-phase-checklist.md    — 100+ design QA items
```

---

## 12. Model Overrides (Project-Specific)

No model overrides for this project. Using global model policy from `framework-model-policy.md`.

To override a model for this project, add entries here:

```
# Example override format (uncomment and edit to activate):
# TESTING → claude-sonnet-4   (override Haiku with Sonnet for complex test generation)
# DEBUGGING → claude-sonnet-4-5  (override Sonnet 4 with Sonnet 4.5 for harder failures)
```

---

## 13. Project-Specific Lifecycle Terminology Mapping

Northstar uses AIDLC terminology. Mapping to framework routing categories:

| AIDLC Term | Framework Routing Category |
|---|---|
| Inception / Discovery | REQUIREMENT |
| Gap Analysis | REQUIREMENT |
| Design Phase | DESIGN |
| Architecture | DESIGN |
| Week 1 Backend | DEVELOPMENT |
| Week 2 Frontend | DEVELOPMENT |
| Week 3 Testing | TESTING |
| Debugging / Failures | DEBUGGING |
| Pre-launch Review | CODE_REVIEW |
| Docs Update | DOCUMENTATION |
| Week 4 Deployment | RELEASE |

---

## 14. How to Adapt This File for Another Project

Replace the following sections with your project's values:

- Section 1: Project Identity
- Section 2: Technology Stack
- Section 3: Project Source Structure
- Section 4: Database Schema
- Section 5: API Endpoints
- Section 6: Testing Framework
- Section 7: Coding Conventions
- Section 8: Documentation Files
- Section 9: Known Issues
- Section 10: AIDLC Phase State
- Section 11: Design Artifacts
- Section 12: Model Overrides (if any)
- Section 13: Lifecycle Terminology Mapping

The framework agents, router, hook, and model policy file do not need to change.
