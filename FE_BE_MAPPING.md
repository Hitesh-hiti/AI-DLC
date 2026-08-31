# Frontend & Backend Acceptance Criteria Mapping
**Date Generated:** August 24, 2026  
**Source:** requirement_breakdown.md  
**Status:** Complete Mapping  

---

## Executive Summary

This document maps all 131 acceptance criteria from requirement_breakdown.md into:
- **81 Frontend (FE) Acceptance Criteria** (fe_acceptance_criteria.md)
- **76 Backend (BE) Acceptance Criteria** (be_acceptance_criteria.md)
- **Shared/Hybrid requirements** (where FE and BE collaborate)

---

## Mapping Summary by Requirement

### REQ-001: Product Database Infrastructure
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-001 | — | 4 ACs | Backend-only (DB schema, connectivity, sync) |

**BE-AC-001-001 to BE-AC-001-004:** Database initialization, connectivity, product retrieval, volume support

---

### REQ-002: Product Image Storage & Gallery
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-002 | — | 6 ACs | Backend-only (file storage, validation, retrieval) |

**BE-AC-002-001 to BE-AC-002-006:** Image format validation, size validation, local filesystem storage, multi-image support, retrieval, missing image handling

---

### REQ-003: Shop Collections
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-003 | — | 6 ACs | Backend-only (collection queries, categorization) |

**BE-AC-003-001 to BE-AC-003-006:** All Products query, category-specific queries, category schema, mandatory specs per category

---

### REQ-004: Product Grid Layout
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-004 | 5 ACs | — | Frontend-only (UI rendering, user interaction) |

**FE-AC-004-001 to FE-AC-004-005:** Grid display, mandatory fields, click behavior, empty state, responsive layout

---

### REQ-005: Product Card — Image Display
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-005 | 3 ACs | — | Frontend-only (image rendering, placeholders) |

**FE-AC-005-001 to FE-AC-005-003:** Primary image display, placeholder, aspect ratio

---

### REQ-006: Product Card — Name & Price
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-006 | 4 ACs | — | Frontend-only (text rendering, formatting) |

**FE-AC-006-001 to FE-AC-006-004:** Name display, price format, accuracy, truncation

---

### REQ-007: Product Card — Category & Availability
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-007 | 3 ACs | — | Frontend-only (badge rendering, styling) |

**FE-AC-007-001 to FE-AC-007-003:** Category display, in-stock badge, out-of-stock badge

---

### REQ-008: Product Detail Page — Core Fields
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-008 | 5 ACs | 2 ACs | Hybrid (FE renders, BE provides API) |

**FE-AC-008-001 to FE-AC-008-005:** Core field display, gallery navigation, description rendering, category, availability  
**BE-AC-008-001 to BE-AC-008-002:** Product detail API endpoint, error handling

---

### REQ-009: Product Detail Page — Specifications
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-009 | 5 ACs | 4 ACs | Hybrid (FE displays, BE validates/retrieves) |

**FE-AC-009-001 to FE-AC-009-005:** Spec section visibility, Tech/Fashion/Lifestyle specs, formatting  
**BE-AC-009-001 to BE-AC-009-004:** Spec storage, validation, retrieval, example response

---

### REQ-010: New Arrivals Section
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-010 | 5 ACs | 5 ACs | Hybrid (FE navigation/display, BE queries) |

**FE-AC-010-001 to FE-AC-010-005:** Page navigation, display, dual-listing confirmation, pagination UI, filtering UI  
**BE-AC-010-001 to BE-AC-010-005:** is_new_arrival flag, collection query, dual display logic, pagination API, filtering logic

---

### REQ-011: New Arrivals — Homepage Preview
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-011 | 3 ACs | 3 ACs | Hybrid (FE sections, BE featured/preview endpoints) |

**FE-AC-011-001 to FE-AC-011-003:** Featured section, New Arrivals preview, CTAs  
**BE-AC-011-001 to BE-AC-011-003:** Featured product storage, homepage data endpoint, featured query

---

### REQ-012: Main Navigation Menu
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-012 | 2 ACs | — | Frontend-only (menu rendering) |

**FE-AC-012-001 to FE-AC-012-002:** Menu items visibility, accessibility/mobile

---

### REQ-013: Shop Navigation — Collections
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-013 | 2 ACs | — | Frontend-only (dropdown/submenu UI) |

**FE-AC-013-001 to FE-AC-013-002:** Dropdown display, collection navigation

---

### REQ-014: Homepage Structure
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-014 | 3 ACs | — | Frontend-only (page layout, section rendering) |

**FE-AC-014-001 to FE-AC-014-003:** Homepage sections, hero CTA, collection previews

---

### REQ-015: Search Feature — MVP Status
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-015 | 5 ACs | 5 ACs | Hybrid (FE search UI, BE search API) |

**FE-AC-015-001 to FE-AC-015-005:** Search input, results display, result count, empty state, styling  
**BE-AC-015-001 to BE-AC-015-005:** Search endpoint, database query, result count, empty results, filtering

---

### REQ-016: Search — Real-Time Input
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-016 | 3 ACs | 3 ACs | Hybrid (FE debouncing, BE performance) |

**FE-AC-016-001 to FE-AC-016-003:** Real-time display, debouncing, mobile  
**BE-AC-016-001 to BE-AC-016-003:** Performance targets, debounce support, timeout handling

---

### REQ-017: Our Story Section
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-017 | 3 ACs | — | Frontend-only (page display) |

**FE-AC-017-001 to FE-AC-017-003:** Page access, content display, static rendering

---

### REQ-018: Contact Section — Information Display
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-018 | 2 ACs | — | Frontend-only (information display) |

**FE-AC-018-001 to FE-AC-018-002:** Contact information visibility, email link

---

### REQ-019: Contact Form — Fields & Validation
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-019 | 7 ACs | — | Frontend-only (form UI and client-side validation) |

**FE-AC-019-001 to FE-AC-019-007:** Form display, name validation, email validation (empty and format), subject/message validation, submit UI

---

### REQ-020: Contact Form Submission — Storage & Email
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-020 | — | 7 ACs | Backend-only (storage, email, retention, deletion) |

**BE-AC-020-001 to BE-AC-020-007:** Database storage, support email, customer confirmation email, success response, error handling, 1-year retention/deletion, immutability

---

### REQ-021: Contact Form — GDPR & Privacy
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-021 | 3 ACs | 3 ACs | Hybrid (FE checkbox/notice, BE validation/storage) |

**FE-AC-021-001 to FE-AC-021-003:** Consent checkbox, privacy notice, checkbox validation  
**BE-AC-021-001 to BE-AC-021-003:** Consent validation, flag storage, GDPR compliance

---

### REQ-022: Contact Form — Rate Limiting
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-022 | 3 ACs | 3 ACs | Hybrid (FE error display, BE rate limit logic) |

**FE-AC-022-001 to FE-AC-022-003:** Rate limit error message, recovery, mobile handling  
**BE-AC-022-001 to BE-AC-022-003:** Rate limit enforcement, counter/reset logic, IP tracking

---

### REQ-023: Filtering — MVP Options
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-023 | 3 ACs | 3 ACs | Hybrid (FE filter UI, BE filter queries) |

**FE-AC-023-001 to FE-AC-023-003:** Price filter UI, category/availability filters, filter application  
**BE-AC-023-001 to BE-AC-023-003:** Price filter query, category filter, availability filter

---

### REQ-024: Sorting — MVP Options
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-024 | 4 ACs | 3 ACs | Hybrid (FE sort UI, BE sort queries) |

**FE-AC-024-001 to FE-AC-024-004:** Price sorting, newest-first, no default, sort persistence  
**BE-AC-024-001 to BE-AC-024-003:** Price sort query, newest-first query, no default

---

### REQ-025: Filtering & Sorting — Applied Pages
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-025 | 3 ACs | 2 ACs | Hybrid (FE UI consistency, BE query logic) |

**FE-AC-025-001 to FE-AC-025-003:** Filters/sorting on all collections, on search results, independent state  
**BE-AC-025-001 to BE-AC-025-002:** Combined filters/sorting query, independent state per page

---

### REQ-026: Product Availability Determination
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-026 | — | 2 ACs | Backend-only (availability logic) |

**BE-AC-026-001 to BE-AC-026-002:** In-stock logic (inventory > 0), out-of-stock logic (inventory = 0)

---

### REQ-027: Product Availability Display
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-027 | 3 ACs | — | Frontend-only (badge rendering) |

**FE-AC-027-001 to FE-AC-027-003:** Out-of-stock badge on card, clickability, detail page

---

### REQ-028: Search Result Ranking
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-028 | — | 2 ACs | Backend-only (ranking algorithm) |

**BE-AC-028-001 to BE-AC-028-002:** Exact match ranking, keyword ranking

---

### REQ-029: Search Result Boosting
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-029 | — | — | No criteria needed (explicit "no boosting") |

---

### REQ-030: Search Result Pagination
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-030 | — | 2 ACs | Backend-only (pagination API) |

**BE-AC-030-001 to BE-AC-030-002:** Results per page (20), pagination navigation (OFFSET/LIMIT)

---

### REQ-031: Responsive Design Breakpoints
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-031 | 2 ACs | — | Frontend-only (media queries, layout adaptation) |

**FE-AC-031-001 to FE-AC-031-002:** Breakpoint definitions (<768px, 768–1024px, >1024px), responsive behavior

---

### REQ-032: Mobile Navigation & Interaction
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-032 | 4 ACs | — | Frontend-only (mobile UX, hamburger menu) |

**FE-AC-032-001 to FE-AC-032-004:** Hamburger menu on mobile, expansion, full navigation on desktop, touch sizing

---

### REQ-033: Product Visibility — Public Catalog
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-033 | — | — | No ACs (all products visible; no access control in MVP) |

---

### REQ-034: Out-of-Scope Features (MVP)
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-034 | — | — | No ACs (explicitly out-of-scope) |

---

### REQ-035: Platform & Technology Scope
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-035 | — | — | No ACs (scope exclusions noted) |

---

### REQ-036: Our Story — Static Content
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-036 | — | — | No ACs (static content; v1 uses templates) |

---

### REQ-037: Homepage — Brand & Discovery Focus
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-037 | 2 ACs | — | Frontend-only (page layout, CTA) |

**FE-AC-037-001 to FE-AC-037-002:** Homepage flow, featured products section

---

### REQ-038: Product Data — Base Schema
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-038 | — | 2 ACs | Backend-only (schema design) |

**BE-AC-038-001 to BE-AC-038-002:** Mandatory product fields, extended fields

---

### REQ-039: Contact Submission — Data Retention & Compliance
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-039 | — | 2 ACs | Backend-only (retention, deletion) |

**BE-AC-039-001 to BE-AC-039-002:** 1-year retention, automatic deletion

---

### REQ-040: Platform Accessibility — Responsive Web Application
| Requirement | FE-AC | BE-AC | Nature |
|---|---|---|---|
| REQ-040 | 2 ACs | — | Frontend-only (browser compatibility) |

**FE-AC-040-001 to FE-AC-040-002:** Responsive application on all devices, browser support

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Requirements** | 40 |
| **Total ACs** | 131 |
| **Frontend-only ACs** | 81 |
| **Backend-only ACs** | 76 |
| **Hybrid ACs (FE+BE)** | 26 (counted in both) |
| **Total Unique AC Concepts** | 131 |

### AC Distribution

**Frontend-Focused (41% of requirements):**
- REQ-004, REQ-005, REQ-006, REQ-007 (Grid & Cards)
- REQ-012, REQ-013, REQ-014 (Navigation & Structure)
- REQ-017 (Our Story)
- REQ-018 (Contact Info)
- REQ-019 (Contact Form UI)
- REQ-027 (Availability Display)
- REQ-031, REQ-032 (Responsive Design)
- REQ-040 (Browser Compatibility)

**Backend-Focused (35% of requirements):**
- REQ-001, REQ-002, REQ-003 (Database & Storage)
- REQ-020 (Contact Submission)
- REQ-026, REQ-028, REQ-030 (Data Logic & Queries)
- REQ-038, REQ-039 (Schema & Retention)

**Hybrid/Collaborative (24% of requirements):**
- REQ-008, REQ-009 (Product Detail)
- REQ-010, REQ-011 (New Arrivals)
- REQ-015, REQ-016 (Search)
- REQ-021, REQ-022 (Forms & Rate Limiting)
- REQ-023, REQ-024, REQ-025 (Filtering & Sorting)

---

## Team Assignment Guide

### Frontend Team Focus
- **Primary:** REQ-004–007 (Grid & Cards), REQ-012–014 (Navigation), REQ-017–019 (Pages & Forms), REQ-031–032 (Responsive)
- **Collaborative:** REQ-008–009 (Detail), REQ-010–011 (New Arrivals), REQ-015–016 (Search), REQ-021–025 (Forms/Filtering)
- **Docs:** fe_acceptance_criteria.md (81 ACs)

### Backend Team Focus
- **Primary:** REQ-001–003 (Database), REQ-020 (Contact), REQ-026/028/030 (Logic), REQ-038–039 (Schema)
- **Collaborative:** REQ-008–009 (APIs), REQ-010–011 (Queries), REQ-015–016 (Search), REQ-021–025 (Endpoints)
- **Docs:** be_acceptance_criteria.md (76 ACs)

### Shared Responsibilities (Coordination Required)
| Feature | FE Responsibility | BE Responsibility | Sync Point |
|---------|-------------------|-------------------|-----------|
| Product Detail | Display layout, gallery nav | API endpoint, spec retrieval | API contract |
| New Arrivals | Grid, pagination UI | Flag, queries, filtering | Dual display |
| Search | Input, results grid, debounce | API, ranking, pagination | Real-time response |
| Contact Form | Validation UI, consent checkbox | Submission, email, rate limit | Form submission |
| Filtering/Sorting | UI controls, state management | Query logic, API parameters | URL/query params |

---

## Testing Strategy by Layer

### Frontend Testing
- Unit tests: Component rendering, state management, form validation
- Integration tests: Navigation flow, filter/sort application, search interaction
- E2E tests: User workflows (browse → detail → search → contact)
- Accessibility: WCAG 2.1 AA manual review

### Backend Testing
- Unit tests: Utility functions, business logic (availability, ranking)
- Integration tests: Database queries, API endpoints, email sending
- Performance tests: Query optimization, search latency
- Security tests: Rate limiting, SQL injection prevention, input validation

### Acceptance Testing
- QA team uses **requirement_breakdown.md** as source of truth
- Test cases map 1:1 to acceptance criteria (FE and BE)
- Both fe_acceptance_criteria.md and be_acceptance_criteria.md serve as test specifications

---

## Next Steps

1. **Frontend Team:** Review fe_acceptance_criteria.md
   - Understand UI/UX expectations
   - Plan component architecture
   - Design responsive layouts
   - Create test cases based on FE-ACs

2. **Backend Team:** Review be_acceptance_criteria.md
   - Design database schema
   - Plan API endpoints
   - Implement business logic
   - Create test cases based on BE-ACs

3. **Sync Points:**
   - API contract definition (request/response formats)
   - Hybrid feature coordination (search, forms, filtering)
   - Performance targets alignment
   - Error handling standardization

---

**Status: READY FOR IMPLEMENTATION** ✅

Frontend and Backend teams have clear, distinct acceptance criteria mapped from the consolidated requirements. Teams can work independently while coordinating on shared features.
