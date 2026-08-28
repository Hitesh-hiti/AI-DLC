# Gap Analysis: Northstar E-commerce Requirements
**Generated:** August 24, 2026  
**Framework:** Expertise Guardrails — Human-in-the-Loop  
**Status:** AWAITING HUMAN INPUT

---

## 1. Requirements Summary

### Current State
Northstar is an e-commerce web application focused on **product discovery and browsing** (MVP scope). The requirements document specifies:

- **Primary Goal:** Allow customers to discover and browse products across multiple collections
- **Scope:** Product discovery only; purchasing, checkout, payment, orders are future capabilities
- **Navigation:** Shop, New Arrivals, Our Story, Contact
- **Shop Structure:** All Products, Tech & Gadget, Fashion, Lifestyle, (Home & Living, Games & Play mentioned but not detailed)
- **Core Features:**
  - Product listing with grid display, images, names, prices, categories, availability
  - Product detail pages
  - New Arrivals showcase
  - Our Story (brand information)
  - Contact section with form
  - Search (recommended, MVP decision pending)
  - Filtering and sorting (candidates, needs prioritization)
- **Platform:** Responsive web application (desktop, tablet, mobile)
- **Users:** Anonymous customers (primary); future roles deferred

### Key Status Markers
- **Version:** 1.0 (Initial/Inception)
- **Scope Status:** MVP defined but incomplete
- **Purchasing:** Explicitly deferred
- **Content Management:** Static for v1; CMS future capability

---

## 2. Top 5 Critical Gaps (Unresolved)

### Gap #1: Product Data Source & Management
**Category:** Infrastructure / Data Integration  
**Expertise:** L3 (Integration design)  
**Risk:** High (impacts all product-facing features)  
**Confidence:** 85% ✅ RESOLVED

**Decision Made:**
- **Data Storage:** Build custom database (schema design required)
- **Database Type:** TBD (PostgreSQL/MongoDB to be determined)
- **Product Fields:** Base 7 + extended fields (SKU, inventory count, ratings, tags, dimensions, weight)
- **Images:** Local filesystem, multi-image gallery support per product
- **Update Frequency:** Daily sync/refresh
- **Data Volume:** ~100–999 products
- **Access Control:** Public catalog (all users see all products; guest + registered supported)

**Next Steps:**
- Design product data schema
- Define daily sync/update mechanism
- Specify image storage directory structure and naming conventions
- Define image file formats and size constraints

---

### Gap #2: "New Arrivals" Definition & Logic
**Category:** Business Rules  
**Expertise:** L2 (Product Owner decision)  
**Risk:** High (core feature now defined)  
**Confidence:** 95% ✅ RESOLVED

**Decision Made:**
- **Selection Method:** Database flag (`is_new_arrival: boolean`)
- **Curation:** Manual selection by staff/admin
- **Display Quantity:** Paginated (no limit; show all new arrivals across pages)
- **Dual Display:** Products appear in BOTH their category collection AND New Arrivals section
- **Removal:** Products manually deselected to exit "New Arrivals" status
- **Homepage Preview:** Shows featured new arrivals (quantity TBD in design phase)

**Implementation Impact:**
- Product schema requires `is_new_arrival` boolean field
- Admin interface needed to toggle this flag (future MVP or initial?)
- New Arrivals page queries `WHERE is_new_arrival = true`
- No automatic expiration logic needed

---

### Gap #3: Missing Collections (Home & Living, Games & Play)
**Category:** Scope Clarity  
**Expertise:** L2 (Product Owner decision)  
**Risk:** Medium (scope now clarified)  
**Confidence:** 95% ✅ RESOLVED

**Decision Made:**
- **MVP Scope:** All 6 collections included
- **Collection Definitions:**
  1. All Products — All products across all categories
  2. Tech & Gadget — Technology and gadget-related products
  3. Fashion — Fashion-related products
  4. Lifestyle — Lifestyle and everyday-use products
  5. Home & Living — Furniture, decor, kitchen items
  6. Games & Play — Board games, toys, puzzles

**Implementation Impact:**
- Product schema requires category field mapping to these 6 collections
- Navigation menu displays all 6 Shop subcategories
- Product listing pages needed for each collection

---

### Gap #4: Contact Form Submission & Delivery
**Category:** Integration / Infrastructure  
**Expertise:** L2 (Backend integration)  
**Risk:** High (now clearly defined)  
**Confidence:** 95% ✅ RESOLVED

**Decision Made:**
- **Submission Handling:** Store in database AND send email
- **Email Recipient:** TBD (provide email address)
- **Customer Confirmation:** Both email confirmation + on-screen success message
- **Data Retention:** 1 year (automatic deletion after 1 year)
- **User Deletion:** NOT allowed (submissions are permanent records)
- **Error Handling:** Show error message to user (no automatic retry; user can resubmit)
- **Privacy/GDPR:** Submissions stored for 1 year; no explicit consent checkbox specified (TBD if required by policy)

**Implementation Impact:**
- Contact submissions table in database with timestamp
- Background job/task for 1-year deletion
- Email service integration (SMTP or API)
- Success/error page states
- Audit trail for compliance

---

### Gap #5: Search Feature Scope & Status
**Category:** Feature Scope  
**Expertise:** L1 (Now clearly specified)  
**Risk:** Medium (now defined)  
**Confidence:** 95% ✅ RESOLVED

**Decision Made:**
- **MVP Status:** Search is REQUIRED for MVP launch
- **Search Scope:** Product name + category + keywords
- **Interaction Pattern:** Real-time as-you-type (live results as user types)
- **Empty State:** Display appropriate message when no results found
- **Results Display:** Search results shown in same grid format as collections

**Implementation Impact:**
- Search input component in header/navigation (always accessible)
- Real-time search endpoint with debouncing
- Results filtered by: product name, category, keywords
- Performance requirement: Results within reasonable time (suggest <300ms)
- Mobile UX: Search accessible on mobile/tablet

---

## 3. Top 5 Human Decisions Required — STATUS UPDATE

| # | Decision | Answer | Status |
|---|----------|--------|--------|
| 1 | **Product Data Source** | Build custom DB; daily sync; ~100-999 products; public access; multi-image gallery | ✅ RESOLVED |
| 2 | **"New Arrivals" Definition** | Database flag; manual curation; paginated; dual display; manual removal | ✅ RESOLVED |
| 3 | **Collections Scope** | All 6 collections in MVP (H&L: furniture/decor/kitchen; G&P: games/toys/puzzles) | ✅ RESOLVED |
| 4 | **Contact Form Backend** | Store + email; confirm both ways; 1-year retention; show errors to user | ✅ RESOLVED |
| 5 | **Search Feature** | Required for MVP; real-time as-you-type; by name/category/keywords | ✅ RESOLVED |

---

## 4. Detailed Gap Classification

### Infrastructure & Integration Gaps
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| Product data source & ingestion | L3 | High | 35% | ❌ UNRESOLVED |
| Product image storage/delivery | L3 | High | 40% | ❌ UNRESOLVED |
| Contact form backend integration | L3 | High | 30% | ❌ UNRESOLVED |
| Database/CMS selection | L3 | High | 25% | ❌ UNRESOLVED |
| API specifications (if applicable) | L3 | High | 20% | ❌ UNRESOLVED |

### Business Rules & Workflows
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| "New Arrivals" definition | L3 | High | 25% | ❌ UNRESOLVED |
| Product availability logic | L2 | Medium | 50% | ⚠️ PARTIALLY SPECIFIED |
| Collections scope (H&L, G&P) | L2 | Medium | 40% | ❌ UNRESOLVED |
| Product categorization rules | L2 | Medium | 45% | ⚠️ PARTIALLY SPECIFIED |
| Search ranking criteria | L2 | Medium | 35% | ❌ UNRESOLVED |

### Feature Scope
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| Search: MVP or future? | L2 | Medium | 50% | ❌ UNRESOLVED |
| Filtering & sorting: MVP scope | L2 | Medium | 55% | ⚠️ CANDIDATES LISTED, NOT DECIDED |
| Contact form error handling | L2 | Medium | 60% | ⚠️ PARTIALLY SPECIFIED |
| Form submission confirmation | L1 | Low | 70% | ⚠️ ASSUMED, NOT SPECIFIED |

### Security & Privacy
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| GDPR/privacy for contact data | L3 | High | 20% | ❌ NOT ADDRESSED |
| Contact form rate limiting | L3 | High | 25% | ❌ NOT ADDRESSED |
| Spam protection strategy | L3 | High | 20% | ❌ NOT ADDRESSED |
| Data retention policy | L3 | High | 15% | ❌ NOT ADDRESSED |
| Payment data handling (deferred) | L3 | High | N/A | ⏸️ OUT OF SCOPE |

### Data & Content
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| Product data schema | L3 | High | 30% | ❌ UNRESOLVED |
| Minimum product fields required | L2 | Medium | 60% | ⚠️ PARTIALLY SPECIFIED |
| "Our Story" content source | L2 | Medium | 65% | ⚠️ ASSUMED STATIC |
| Contact information completeness | L2 | Medium | 70% | ⚠️ "IF APPLICABLE" AMBIGUOUS |
| Product image dimensions/formats | L2 | Medium | 40% | ❌ UNRESOLVED |

### Non-Functional & Performance
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| Performance targets (page load, search) | L2 | Medium | 35% | ❌ UNRESOLVED |
| Accessibility requirements (WCAG level?) | L2 | Medium | 50% | ❌ NOT SPECIFIED |
| Browser/device support matrix | L2 | Medium | 55% | ⚠️ "RESPONSIVE" VAGUE |
| Localization/internationalization | L1 | Low | 45% | ❌ NOT ADDRESSED |
| SEO requirements | L1 | Low | 50% | ❌ NOT ADDRESSED |

### UX & Interaction
| Gap | Expertise | Risk | Confidence | Status |
|-----|-----------|------|------------|--------|
| Empty state messaging (beyond example) | L1 | Low | 70% | ⚠️ EXAMPLE GIVEN, NOT STANDARDIZED |
| Product selection flow details | L1 | Low | 75% | ⚠️ BASIC, NEEDS INTERACTION DESIGN |
| Navigation consistency specs | L1 | Low | 65% | ⚠️ "CONSISTENTLY AVAILABLE" VAGUE |
| Hero section CTA specifics | L1 | Low | 60% | ⚠️ MENTIONED, NOT DETAILED |
| Mobile navigation pattern | L1 | Low | 55% | ⚠️ "RESPONSIVE" INSUFFICIENT |

---

## 5. Summary of Critical Issues

### Blocking Implementation
1. ❌ **Product data integration** — Cannot build without knowing data source
2. ❌ **"New Arrivals" rules** — Core feature undefined
3. ❌ **Collection scope** — Ambiguous which collections to build
4. ❌ **Contact form backend** — Integration path unclear
5. ❌ **Search status** — MVP scope undefined

### Compliance & Security Risks
1. ❌ **GDPR/Privacy** — Contact form data handling not specified
2. ❌ **Spam protection** — No anti-spam mechanism defined
3. ❌ **Data retention** — No policy specified

### Architectural Ambiguities
1. ❌ **Technology stack** — Not specified (frontend? backend? database?)
2. ❌ **API design** — No specifications provided
3. ❌ **Performance targets** — No SLOs defined

### Incomplete Specifications
1. ⚠️ **Filtering/sorting** — Candidates listed, not prioritized
2. ⚠️ **Product specifications** — "Where applicable" is vague
3. ⚠️ **Mobile UX** — "Responsive" lacks device/breakpoint details

---

## 6. What IS Clear & Implementable

✓ **Product listing grid layout** — Requirements clear  
✓ **Product detail page structure** — Requirements specified  
✓ **Navigation menu structure** — Four main sections defined  
✓ **Homepage sections** — Clearly outlined  
✓ **Our Story section** — Can use static content (v1)  
✓ **Contact form fields** — Required fields and validation rules specified  
✓ **New Arrivals preview on homepage** — Display pattern clear (logic undefined)  

---

## 7. Remaining Secondary Gaps (After Q1–Q5 Resolved)

### ⚠️ HIGH PRIORITY — Must Resolve Before Development

**Gap #6: Contact Form Email Address**
- **Issue:** Q4 resolved that contact submissions should be emailed, but the recipient email is TBD
- **Expertise:** L1 (Simple clarification)
- **Risk:** High (cannot send emails without this)
- **Confidence:** N/A
- **Status:** ❌ UNRESOLVED
- **Question:** What email address should contact form submissions be sent to?

---

**Gap #7: GDPR/Privacy Consent for Contact Data**
- **Issue:** Contact form collects personal data (name, email, message); 1-year retention specified
- **Expertise:** L3 (Legal/Compliance)
- **Risk:** High (privacy regulation violation risk)
- **Confidence:** 40%
- **Status:** ❌ UNRESOLVED
- **Questions:**
  - Does your business need a GDPR consent checkbox on the contact form?
  - Does the contact submission page need a privacy notice/terms?
  - Which jurisdictions apply? (GDPR, CCPA, etc.)

---

**Gap #8: Spam Protection & Rate Limiting**
- **Issue:** Contact form has no defined spam protection (e.g., reCAPTCHA, rate limiting)
- **Expertise:** L2 (Security consideration)
- **Risk:** High (contact form abuse potential)
- **Confidence:** 45%
- **Status:** ❌ UNRESOLVED
- **Questions:**
  - Should contact form have CAPTCHA or rate limiting?
  - Max submissions per IP/email per day?

---

**Gap #9: Database Technology Selection**
- **Issue:** Q1a decided to "build custom database" but type not specified
- **Expertise:** L3 (Architecture decision)
- **Risk:** High (foundational choice)
- **Confidence:** 30%
- **Status:** ❌ UNRESOLVED
- **Questions:**
  - SQL (PostgreSQL, MySQL) or NoSQL (MongoDB)?
  - Hosted (Cloud) or self-managed?
  - Any specific constraints/preferences?

---

**Gap #10: Product Image Storage Details**
- **Issue:** Q1c specified "local filesystem" but lacks specifics
- **Expertise:** L2 (Implementation detail)
- **Risk:** Medium
- **Confidence:** 50%
- **Status:** ⚠️ NEEDS CLARIFICATION
- **Questions:**
  - Image file types supported? (JPG, PNG, WebP?)
  - Max file size per image?
  - Max total images per product?
  - Image resizing/optimization required?
  - Directory structure/naming convention?

---

### 🟡 MEDIUM PRIORITY — Should Resolve Before Development

**Gap #11: Filtering & Sorting Feature Set**
- **Issue:** Section 15 lists candidates (price filter, category filter, availability filter, price sort, newest-first sort) but not prioritized
- **Expertise:** L2 (Product decision)
- **Risk:** Medium (scope definition)
- **Confidence:** 55%
- **Status:** ⚠️ CANDIDATES LISTED, NOT DECIDED
- **Questions:**
  - Which filtering/sorting options are MVP vs. future?
  - Price range slider or discrete steps?

---

**Gap #12: Product Specifications — "Where Applicable"**
- **Issue:** Section 9 states product specs "where applicable" but no rules defined
- **Expertise:** L2 (Business rules)
- **Risk:** Low-Medium (spec completeness)
- **Confidence:** 50%
- **Status:** ⚠️ AMBIGUOUS
- **Questions:**
  - What constitutes "applicable"? (By category? By product type?)
  - Spec format? (Key-value pairs? Structured fields?)
  - Examples for each category?

---

**Gap #13: Product Availability Logic**
- **Issue:** "Availability" shown on product cards but logic not defined
- **Expertise:** L2 (Business rules)
- **Risk:** Medium (affects UX/messaging)
- **Confidence:** 50%
- **Status:** ⚠️ PARTIALLY SPECIFIED
- **Questions:**
  - What determines availability? (Inventory > 0? Manual flag?)
  - UX: Disable product card? Show "Out of Stock" badge?
  - Can out-of-stock products still be viewed?

---

**Gap #14: Search Result Ranking & Relevance**
- **Issue:** Q5b specified search scope but not ranking algorithm
- **Expertise:** L2 (UX/business decision)
- **Risk:** Medium (search quality)
- **Confidence:** 45%
- **Status:** ⚠️ UNRESOLVED
- **Questions:**
  - Ranking priority: Exact match > partial > keyword match?
  - Boost by popularity? Category relevance?
  - Max results per search (pagination)?

---

**Gap #15: Mobile/Responsive Design Breakpoints**
- **Issue:** "Responsive" specified but device breakpoints not defined
- **Expertise:** L1 (Design/UX)
- **Risk:** Low (standard practice)
- **Confidence:** 65%
- **Status:** ⚠️ VAGUE
- **Questions:**
  - Mobile (< 768px)? Tablet (768–1024px)? Desktop (> 1024px)?
  - Any device-specific features? (e.g., touch vs. hover interactions)

---

### 🟢 LOW PRIORITY — May Be Deferred

**Gap #16: SEO Requirements**
- **Issue:** Not addressed in requirements
- **Expertise:** L1 (General knowledge)
- **Risk:** Low (can be added later)
- **Status:** ⚠️ NOT SPECIFIED
- **Questions:**
  - Meta tags, structured data (Schema.org)?
  - URL structure for products/collections?
  - Sitemap/robots.txt?

---

**Gap #17: Accessibility (WCAG) Requirements**
- **Issue:** Not specified (no WCAG level mentioned)
- **Expertise:** L2 (Accessibility)
- **Risk:** Low-Medium (future compliance risk)
- **Status:** ⚠️ NOT SPECIFIED
- **Questions:**
  - WCAG 2.1 AA compliance target?
  - Keyboard navigation required?
  - Screen reader support required?

---

**Gap #18: Localization/Internationalization**
- **Issue:** Not addressed; assumed English-only
- **Expertise:** L1 (Clarification)
- **Risk:** Low (can be added in future release)
- **Status:** ⚠️ ASSUMED ENGLISH-ONLY
- **Questions:**
  - Single language (English) for MVP?
  - Future multi-language support needed?

---

**Gap #19: Analytics & Tracking**
- **Issue:** No user analytics, tracking, or telemetry requirements specified
- **Expertise:** L1 (Business decision)
- **Risk:** Low (can be added)
- **Status:** ⚠️ NOT SPECIFIED
- **Questions:**
  - Google Analytics or similar?
  - Track page views, product views, search queries?

---

**Gap #20: Admin/CMS Interface**
- **Issue:** No admin panel specified for managing products, New Arrivals flag, contact submissions
- **Expertise:** L2 (Future phase)
- **Risk:** Low (can be MVP extension)
- **Status:** ⚠️ NOT SPECIFIED
- **Questions:**
  - Should admin interface be in MVP or Phase 2?
  - Minimal MVP: toggle New Arrivals, view contacts?

---

## 8. Gap Prioritization Matrix

| Gap | Category | Expertise | Risk | Priority | Status |
|-----|----------|-----------|------|----------|--------|
| Q1: Product Data Source | Data | L3 | High | CRITICAL | ✅ RESOLVED |
| Q2: New Arrivals Logic | Business | L3 | High | CRITICAL | ✅ RESOLVED |
| Q3: Collections Scope | Scope | L2 | Medium | CRITICAL | ✅ RESOLVED |
| Q4: Contact Form Backend | Integration | L2 | High | CRITICAL | ✅ RESOLVED |
| Q5: Search Status | Feature | L1 | Medium | CRITICAL | ✅ RESOLVED |
| Gap #6: Contact Email | Integration | L1 | High | **HIGH** | ❌ NEEDED |
| Gap #7: GDPR/Privacy | Compliance | L3 | High | **HIGH** | ❌ NEEDED |
| Gap #8: Spam Protection | Security | L2 | High | **HIGH** | ❌ NEEDED |
| Gap #9: Database Type | Architecture | L3 | High | **HIGH** | ❌ NEEDED |
| Gap #10: Image Storage | Implementation | L2 | Medium | **HIGH** | ⚠️ NEEDS DETAIL |
| Gap #11: Filter/Sort Options | Product | L2 | Medium | **MEDIUM** | ⚠️ CANDIDATES LISTED |
| Gap #12: Product Specs | Business | L2 | Low | **MEDIUM** | ⚠️ AMBIGUOUS |
| Gap #13: Availability Logic | Business | L2 | Medium | **MEDIUM** | ⚠️ AMBIGUOUS |
| Gap #14: Search Ranking | UX | L2 | Medium | **MEDIUM** | ⚠️ UNRESOLVED |
| Gap #15: Responsive Design | UX | L1 | Low | MEDIUM | ⚠️ VAGUE |
| Gap #16: SEO | Marketing | L1 | Low | LOW | ⚠️ NOT SPECIFIED |
| Gap #17: Accessibility | Compliance | L2 | Medium | LOW | ⚠️ NOT SPECIFIED |
| Gap #18: i18n/Localization | Feature | L1 | Low | LOW | ⚠️ ASSUMED |
| Gap #19: Analytics | Business | L1 | Low | LOW | ⚠️ NOT SPECIFIED |
| Gap #20: Admin Interface | Feature | L2 | Low | LOW | ⚠️ FUTURE PHASE |


## 9. Implementation-Ready Assessment

### ✅ CRITICAL GAPS RESOLVED
All 5 critical gaps from inception are now **RESOLVED**:
1. ✅ Product data source & structure defined
2. ✅ New Arrivals business logic defined
3. ✅ Collections scope confirmed (6 collections, MVP)
4. ✅ Contact form backend architecture specified
5. ✅ Search feature confirmed as MVP requirement

### ⚠️ BLOCKING GAPS REMAIN (Must Resolve Before Code)
The following gaps **MUST** be resolved before development can begin:

1. **Gap #6: Contact Form Email Address** ✅ RESOLVED
   - Recipient email: `support@northstar.com`

2. **Gap #7: GDPR/Privacy Compliance** ✅ RESOLVED
   - Jurisdiction: EU/UK (GDPR applies)
   - Consent checkbox: **Required** (explicit data processing consent)
   - Privacy notice: **Required** (must be displayed on contact form)

3. **Gap #8: Spam Protection Strategy** ✅ RESOLVED
   - Method: Rate limiting (no CAPTCHA)
   - Rule: **Max 5 submissions per IP per day**

4. **Gap #9: Database Technology** ✅ RESOLVED
   - Type: **PostgreSQL** (SQL)
   - Hosting: **Self-managed** (Docker/own server)

5. **Gap #10: Product Image Storage Specifications** ✅ RESOLVED
   - File types: **JPG, PNG, WebP** (all supported)
   - Max file size: **10MB per image**
   - Max images per product: **5 images**
   - Optimization: **Not required** (store as-is)

### ⚠️ CLARIFICATIONS NEEDED (Should Resolve Before Code)
These gaps have medium priority and should be clarified before development:

- Gap #11: Filtering/sorting MVP feature set
- Gap #12: Product specifications rules
- Gap #13: Product availability logic
- Gap #14: Search result ranking algorithm
- Gap #15: Responsive design breakpoints

### 🟢 LOW PRIORITY (Can Be Added Post-MVP)
These can be deferred to later phases:
- Gap #16: SEO (can be added in Phase 2)
- Gap #17: WCAG accessibility (can be added in Phase 2)
- Gap #18: i18n/Localization (future release)
- Gap #19: Analytics (future release)
- Gap #20: Admin interface (future release)

---

## 10. Current Status

| Status | Count |
|--------|-------|
| ✅ **Resolved** | 5 critical gaps |
| ❌ **Blocking (MUST resolve)** | 5 gaps |
| ⚠️ **Clarifications needed** | 5 gaps |
| 🟢 **Can defer** | 5 gaps |

### Recommendation

**Status: NOT IMPLEMENTATION-READY**

Before proceeding with development, resolve:
1. Contact form email address (Q6)
2. Database technology decision (Q9)
3. GDPR/privacy requirements (Q7)
4. Spam protection strategy (Q8)
5. Product image storage specs (Q10)
6. Search ranking algorithm (Q14)
7. Product availability logic (Q13)
8. Filtering/sorting MVP feature set (Q11)

Once these 8 gaps are resolved, the requirements will be **implementation-ready**.

---

## 11. Next Steps

### Immediate (Blocking)
**Please provide answers to the following 8 HIGH PRIORITY questions:**

**Q6: Contact Form Email Address**
- What email address should receive contact form submissions?

**Q7: GDPR/Privacy Compliance (3 parts)**
- Does your business operate in GDPR jurisdictions (EU/UK)?
- Should contact form include an explicit consent checkbox?
- Do you need a privacy notice or terms displayed on the contact form?

**Q8: Spam Protection (2 parts)**
- Should the contact form include CAPTCHA (e.g., reCAPTCHA) or rate limiting?
- If yes: Max submissions per IP address per day?

**Q9: Database Technology (2 parts)**
- SQL (PostgreSQL/MySQL) or NoSQL (MongoDB)?
- Hosted cloud (AWS RDS, Supabase, MongoDB Atlas) or self-managed?

**Q10: Product Image Storage Details (4 parts)**
- Supported file types? (JPG, PNG, WebP, etc.)
- Max file size per image?
- Max images per product? (e.g., 5, 10, unlimited?)
- Should images be automatically resized/optimized?

### Secondary (Should Resolve)
After the blocking gaps, we'll address:
- Q11: Filtering & sorting MVP feature set
- Q12: Product specifications rules by category
- Q13: Product availability determination logic
- Q14: Search result ranking criteria
- Q15: Responsive design breakpoints

---

## 12. Document Control

| Attribute | Value |
|-----------|-------|
| **Status** | NOT IMPLEMENTATION-READY (5 blocking gaps remain) |
| **Last Updated** | August 24, 2026 |
| **Blocking Gaps** | 5 (Q6, Q7, Q8, Q9, Q10) |
| **Critical Gaps Resolved** | 5 (Q1, Q2, Q3, Q4, Q5) ✅ |
| **Framework Used** | Expertise Guardrails — Human-in-the-Loop |
| **Next Review** | After Q6–Q10 responses


---

## 9. PHASE 2 COMPLETE: 10 BLOCKING GAPS RESOLVED ✅

### Phase 2 Resolution Summary

| Gap | Decision | Status |
|-----|----------|--------|
| Q6: Contact Email | support@northstar.com | ✅ |
| Q7a: GDPR Jurisdiction | Yes (EU/UK applies) | ✅ |
| Q7b: Consent Checkbox | Yes, required | ✅ |
| Q7c: Privacy Notice | Yes, required on form | ✅ |
| Q8: Spam Protection | Rate limiting (no CAPTCHA) | ✅ |
| Q8b: Rate Limit | Max 5 submissions per IP per day | ✅ |
| Q9a: Database Type | PostgreSQL | ✅ |
| Q9b: Database Hosting | Self-managed (Docker/own server) | ✅ |
| Q10a: Image File Types | JPG, PNG, WebP (all supported) | ✅ |
| Q10b: Max Image Size | 10MB per image | ✅ |
| Q10c: Max Images Per Product | 5 images | ✅ |
| Q10d: Image Optimization | No, store as-is | ✅ |

### Implementation Impact from Phase 2

**Contact Form:**
- Form submission endpoint: POST to backend
- Store in PostgreSQL table
- Email to support@northstar.com
- Include GDPR consent checkbox
- Display privacy notice on form
- Implement rate limiting: max 5 submissions per IP per 24 hours

**Database:**
- PostgreSQL (self-managed)
- Schema design required for: products, images, contact_submissions, new_arrivals flag

**Product Images:**
- Storage: Local filesystem
- Formats: JPG, PNG, WebP
- Max: 5 images per product, 10MB each
- No automatic optimization

---

## 10. PHASE 3: 5 MEDIUM-PRIORITY CLARIFICATIONS (Should Resolve Before Code)

These gaps have medium priority and should be clarified before development begins:

### Gap #11: Filtering & Sorting MVP Feature Set
- **Expertise:** L2 (Product decision)
- **Risk:** Medium (scope definition)
- **Confidence:** 55%
- **Issue:** Section 15 lists candidates but doesn't prioritize which for MVP

**Q11a:** Which filtering options should be in MVP?
- Price range filtering (e.g., $0–$50, $50–$100)?
- Category filtering (note: already navigable via top-level collections)?
- Availability filtering (in stock / out of stock)?
- Or none of the above?

**Q11b:** Which sorting options should be in MVP?
- Price sorting (low-to-high, high-to-low)?
- Newest-first sorting (by date added or by `is_new_arrival` flag)?
- Popularity/bestsellers sorting (if product views tracked)?
- Or none of the above?

**Q11c:** On which pages should filters/sorting appear?
- All Products collection only?
- All collections (Tech & Gadget, Fashion, etc.)?
- Also on search results?

---

### Gap #12: Product Specifications Rules
- **Expertise:** L2 (Business rules)
- **Risk:** Low-Medium
- **Confidence:** 50%
- **Issue:** Section 9 states specs "where applicable" but no rules defined

**Q12a:** What determines "applicable"? 
- By category (all Tech & Gadget products have specs, all Fashion products have specs)?
- By product type (optional per product)?
- Or all products optional?

**Q12b:** Provide example specifications for each collection:
- **Tech & Gadget:** e.g., processor, RAM, storage, battery life, connectivity?
- **Fashion:** e.g., size, material, colors, fit?
- **Lifestyle:** e.g., dimensions, weight, material, color?
- **Home & Living:** e.g., dimensions, material, weight, color?
- **Games & Play:** e.g., age range, player count, game time, dimensions?

---

### Gap #13: Product Availability Logic
- **Expertise:** L2 (Business rules)
- **Risk:** Medium (affects UX/messaging)
- **Confidence:** 50%
- **Issue:** "Availability" shown on product cards but determination logic not defined

**Q13a:** What determines if a product is "available"?
- Inventory count > 0?
- Manual "in stock" flag set by admin?
- Supplier-dependent status?
- Always available (no inventory tracking)?

**Q13b:** How should out-of-stock products be displayed?
- **Option A:** Disable product card (greyed out, not clickable)
- **Option B:** Show "Out of Stock" badge but still clickable for details
- **Option C:** Hide out-of-stock products from collection entirely
- **Option D:** Show availability status but allow wishlist/pre-order?
- **Option E:** Other?

---

### Gap #14: Search Result Ranking & Relevance
- **Expertise:** L2 (UX/business decision)
- **Risk:** Medium (search quality)
- **Confidence:** 45%
- **Issue:** Search scope specified but ranking algorithm not defined

**Q14a:** Search ranking priority (first match wins):
- Exact product name match?
- Partial product name match?
- Product keyword/tag match?
- Category match?

**Q14b:** Should search boost (prioritize) results by:
- Product popularity (most viewed)?
- Recent additions (newest first)?
- New Arrivals flag?
- None of the above (simple relevance ranking)?

**Q14c:** Max results per search?
- Show first 20 with pagination?
- Show first 50?
- Show all matches (no limit)?

---

### Gap #15: Responsive Design Breakpoints
- **Expertise:** L1 (Design/UX)
- **Risk:** Low (standard practice)
- **Confidence:** 65%
- **Issue:** "Responsive" specified but exact breakpoints not defined

**Q15a:** Device breakpoints for responsive design:
- **Mobile:** < 768px
- **Tablet:** 768px–1024px
- **Desktop:** > 1024px

(Are these breakpoints acceptable or do you prefer different ranges?)

**Q15b:** Device-specific interaction patterns:
- Touch-optimized buttons on mobile (larger hit areas)?
- Hamburger menu on mobile vs. full navigation on desktop?
- Sidebar layout on desktop vs. bottom navigation on mobile?
- Swipeable product galleries on mobile?

---

## 11. Current Status After Phase 2

| Status | Count |
|--------|-------|
| ✅ **Resolved (Phase 1)** | 5 critical gaps |
| ✅ **Resolved (Phase 2)** | 5 blocking gaps |
| ⚠️ **Phase 3 (clarifications)** | 5 medium-priority gaps |
| 🟢 **Can defer** | 5 low-priority gaps |
| **TOTAL** | **20 gaps analyzed** |

### Recommendation

**Status: NEARLY IMPLEMENTATION-READY**

Phase 2 is complete. Phase 3 clarifications should be resolved before starting detailed design/development.

Priority for Phase 3:
1. **HIGH:** Gap #11 (Filtering/sorting scope) & Gap #13 (Availability logic)
2. **MEDIUM:** Gap #12 (Product specs) & Gap #14 (Search ranking)
3. **MEDIUM:** Gap #15 (Responsive breakpoints)

Once Phase 3 is answered, requirements will be **FULLY IMPLEMENTATION-READY**.

---

## 12. PHASE 4 COMPLETE: 5 AMBIGUITIES RESOLVED VIA HITL ✅

### Phase 4 HITL Ambiguity Resolution

| Ambiguity | Decision | Status |
|-----------|----------|--------|
| A1: Product Specifications Applicability | Option A: Mandatory for all products in category; missing values show "Not specified" | ✅ |
| A2: Featured Products Definition | Option A: Manually curated by admin (separate from New Arrivals) | ✅ |
| A3: Collection Preview Scope | Option B: All 6 collections previewed on homepage | ✅ |
| A4: Default Sort Order | Option C: No default sort applied; user selects explicitly | ✅ |
| A5: New Arrivals Page Filtering | Option A: Full filtering and sorting controls on New Arrivals page | ✅ |

### Implementation Impact from Phase 4

**Product Specifications:**
- All products require all category-specific specs (Tech: 5 specs, Fashion: 4 specs, etc.)
- Missing specs display as "Not specified" (no hidden fields)
- Product data validation enforces mandatory spec fields per category
- Admin interface must validate all specs on product creation/edit

**Homepage Structure:**
- Featured products section: Separate from New Arrivals, manually curated by admin
- Collection previews: All 6 collections displayed on homepage (not just 3)
- Preview quantity: TBD in design phase

**Sorting & Filtering:**
- Default sort: None (neutral state); user must select sort order
- New Arrivals page: Full filtering (price, category, availability) and sorting (price, newest) available
- Same filter/sort behavior as other collection pages

**Acceptance Criteria Updates:**
- REQ-009: 5 ACs (was 4)
- REQ-011: 3 ACs (was 2)
- REQ-014: 3 ACs (was 2)
- REQ-024: 4 ACs (was 3)
- REQ-025: 3 ACs (was 2)
- **Total ACs:** 131 (was 126)

---

## 13. Overall Resolution Status

### Phase Completion Summary

| Phase | Status | Resolutions |
|-------|--------|-------------|
| Phase 1 (Inception) | ✅ COMPLETE | Q1–Q5 (5 critical gaps) |
| Phase 2 (Blocking Gaps) | ✅ COMPLETE | Q6–Q10 (5 blocking gaps) |
| Phase 3 (Clarifications) | ✅ COMPLETE | Q11–Q15 (5 medium-priority gaps) |
| Phase 4 (HITL Ambiguities) | ✅ COMPLETE | A1–A5 (5 ambiguities) |
| **TOTAL** | **✅ ALL RESOLVED** | **20 Decisions + 5 HITL Decisions = 25 Total** |

### Implementation Readiness

| Metric | Status |
|--------|--------|
| Requirements | ✅ 40 unique, fully specified |
| Acceptance Criteria | ✅ 131 testable criteria |
| Source Traceability | ✅ All requirements traced to PRD + Q decisions |
| Contradictions | ✅ 5 identified and resolved |
| Ambiguities | ✅ 5 identified and resolved via HITL |
| HIL Blockers | ✅ 0 remaining |
| **Overall Status** | **✅ READY FOR DEVELOPMENT** |

---

**Status: READY FOR DEVELOPMENT** ✅

All requirements are fully specified, all ambiguities resolved, and all contradictions addressed. Development of Technical Specification and implementation can proceed. Summary

| Gap | Decision | Status |
|-----|----------|--------|
| Q11a: Filtering Options | Price, Category, Availability | ✅ |
| Q11b: Sorting Options | Price, Newest-first, Popularity | ✅ |
| Q11c: Filter/Sort Scope | All collections | ✅ |
| Q12a: Product Specs | Optional per product | ✅ |
| Q12b: Example Specs | By collection (see below) | ✅ |
| Q13a: Availability Logic | Inventory count > 0 | ✅ |
| Q13b: Out-of-Stock UX | "Out of Stock" badge, still clickable | ✅ |
| Q14a: Search Ranking | Keyword/tag match priority | ✅ |
| Q14b: Search Boosting | None (simple relevance) | ✅ |
| Q14c: Max Search Results | 20 per page with pagination | ✅ |
| Q15a: Responsive Breakpoints | Standard breakpoints (accepted) | ✅ |
| Q15b: Mobile UX | Hamburger menu on mobile | ✅ |

### Example Product Specifications by Collection

**Tech & Gadget:**
- Processor
- RAM
- Storage
- Battery life
- Connectivity

**Fashion:**
- Size
- Material
- Color
- Fit

**Lifestyle:**
- Dimensions
- Weight
- Material
- Color

**Home & Living:**
- Dimensions
- Material
- Weight
- Color

**Games & Play:**
- Age range
- Player count
- Game duration

---

## 13. FINAL STATUS: REQUIREMENTS ARE IMPLEMENTATION-READY ✅

### All 20 Gaps Resolved

| Phase | Gaps | Status |
|-------|------|--------|
| **Phase 1 (Critical)** | 5 gaps | ✅ RESOLVED |
| **Phase 2 (Blocking)** | 5 gaps | ✅ RESOLVED |
| **Phase 3 (Clarifications)** | 5 gaps | ✅ RESOLVED |
| **Phase 4 (Low-Priority)** | 5 gaps | 🟢 DEFERRED TO FUTURE |
| **TOTAL** | **20 gaps analyzed** | ✅ **15 RESOLVED** |

---

## 14. Complete Decision Register

### Phase 1: Inception Decisions
1. ✅ **Product Data Architecture**
   - Build custom PostgreSQL database
   - Daily data refresh/sync
   - ~100–999 products (hundreds)
   - Public access (guest + registered users)
   - Multi-image gallery (5 max per product)

2. ✅ **New Arrivals Business Logic**
   - Selection: Database `is_new_arrival` boolean flag
   - Curation: Manual staff selection
   - Display: Paginated (all new arrivals across pages)
   - Dual presence: Appears in BOTH category AND New Arrivals section
   - Removal: Manual deselection to exit status

3. ✅ **Collections Scope**
   - All 6 collections in MVP
   - Home & Living: furniture, decor, kitchen items
   - Games & Play: board games, toys, puzzles

4. ✅ **Contact Form Backend**
   - Dual delivery: Store in DB + email to support@northstar.com
   - Customer confirmation: Email + on-screen success message
   - Data retention: 1 year (auto-delete after)
   - User deletion: NOT allowed
   - Error handling: Show error message to user

5. ✅ **Search Feature**
   - Status: Required for MVP
   - Interaction: Real-time as-you-type
   - Scope: Product name + category + keywords

### Phase 2: Infrastructure & Compliance Decisions
6. ✅ **Contact Form Email**
   - Recipient: support@northstar.com

7. ✅ **GDPR/Privacy Compliance**
   - Jurisdiction: EU/UK (GDPR applies)
   - Consent checkbox: Required on contact form
   - Privacy notice: Required on contact form

8. ✅ **Spam Protection**
   - Method: Rate limiting (no CAPTCHA)
   - Rule: Max 5 submissions per IP per day

9. ✅ **Database Technology**
   - Type: PostgreSQL (SQL)
   - Hosting: Self-managed (Docker/own server)

10. ✅ **Product Image Storage**
    - File types: JPG, PNG, WebP (all supported)
    - Max size: 10MB per image
    - Max per product: 5 images
    - Optimization: Not required (store as-is)

### Phase 3: Feature & UX Decisions
11. ✅ **Filtering & Sorting**
    - Filters: Price range, Category, Availability
    - Sorts: Price (↑↓), Newest-first, Popularity
    - Scope: All collections (and search results)

12. ✅ **Product Specifications**
    - Approach: Optional per product
    - Examples provided by collection (see Section 14 below)

13. ✅ **Product Availability**
    - Determination: Inventory count > 0
    - Out-of-stock UX: "Out of Stock" badge, still clickable for details

14. ✅ **Search Result Ranking**
    - Primary ranking: Keyword/tag match
    - Boosting: None (simple relevance)
    - Results per page: 20 with pagination

15. ✅ **Responsive Design**
    - Breakpoints: Mobile (<768px), Tablet (768–1024px), Desktop (>1024px)
    - Mobile UX: Hamburger menu on mobile

### Phase 4: Low-Priority Items (Deferred to Future Releases)
- 🟢 SEO & structured data
- 🟢 WCAG accessibility compliance
- 🟢 i18n/Localization
- 🟢 Analytics & tracking
- 🟢 Admin/CMS interface

---

## 15. Implementation-Ready Specification Summary

### In Scope — MVP Ready

**Core Features (All Defined & Approved)**
- ✅ Product discovery across 6 collections
- ✅ Product listing grid with filtering & sorting
- ✅ Product detail pages with specifications
- ✅ New Arrivals section (manual curation via DB flag)
- ✅ Real-time search (keyword/tag matching)
- ✅ Contact form with GDPR compliance
- ✅ Our Story section (static content)
- ✅ Responsive design (mobile, tablet, desktop)

**Data & Infrastructure (All Defined)**
- ✅ PostgreSQL database (self-managed)
- ✅ Local filesystem image storage
- ✅ Product image gallery (5 images max, 10MB each)
- ✅ Daily data sync mechanism
- ✅ Rate limiting (5 submissions/IP/day)

**User Experience (All Defined)**
- ✅ Homepage with collections preview
- ✅ Collection pages with filters/sorting
- ✅ Product detail pages with specs
- ✅ Search results (20 per page)
- ✅ Out-of-stock product handling
- ✅ Mobile hamburger navigation

**Compliance (All Defined)**
- ✅ GDPR consent checkbox on contact form
- ✅ Privacy notice on contact form
- ✅ 1-year contact data retention + auto-delete
- ✅ Spam protection (rate limiting)

### Out of Scope — Future Releases
- 🔄 User accounts & registration
- 🔄 Shopping cart & checkout
- 🔄 Payments
- 🔄 Order management
- 🔄 Admin interface
- 🔄 SEO optimization
- 🔄 WCAG accessibility
- 🔄 Multi-language support
- 🔄 Analytics

---

## 16. Document Status

| Attribute | Value |
|-----------|-------|
| **Status** | ✅ **IMPLEMENTATION-READY** |
| **Framework** | Expertise Guardrails — Human-in-the-Loop |
| **Total Gaps Analyzed** | 20 |
| **Gaps Resolved** | 15 |
| **Gaps Deferred** | 5 (low-priority, Phase 4) |
| **Critical Decisions** | 15 (all approved) |
| **Last Updated** | August 24, 2026 |
| **Ready for Development** | ✅ YES |
| **Ready for Design** | ✅ YES |
| **Ready for Tech Spec** | ✅ YES |

---

## 17. Next Actions

### For Product/Design Team
1. Create wireframes & mockups based on resolved specifications
2. Define visual design system (colors, typography, spacing)
3. Create user flows for key journeys (search, filter, contact)
4. Prepare content for "Our Story" section

### For Engineering Team
1. Design PostgreSQL schema (products, images, collections, contact_submissions, new_arrivals)
2. Plan API endpoints (products, collections, search, contact)
3. Set up local filesystem image storage structure
4. Implement rate limiting middleware

### For Compliance/Legal
1. Draft privacy notice for contact form
2. Confirm GDPR consent checkbox language
3. Review 1-year data retention policy

### For DevOps/Infrastructure
1. Plan PostgreSQL deployment (self-managed Docker)
2. Plan local filesystem backup strategy
3. Configure email service (support@northstar.com)
4. Plan rate limiting implementation

---

## 18. Appendix: Resolved Gaps Index

| Gap ID | Gap Title | Phase | Status |
|--------|-----------|-------|--------|
| Q1 | Product Data Source | 1 | ✅ |
| Q2 | New Arrivals Definition | 1 | ✅ |
| Q3 | Collections Scope | 1 | ✅ |
| Q4 | Contact Form Backend | 1 | ✅ |
| Q5 | Search Feature | 1 | ✅ |
| Q6 | Contact Email Address | 2 | ✅ |
| Q7 | GDPR/Privacy Compliance | 2 | ✅ |
| Q8 | Spam Protection | 2 | ✅ |
| Q9 | Database Technology | 2 | ✅ |
| Q10 | Image Storage Specs | 2 | ✅ |
| Q11 | Filtering & Sorting | 3 | ✅ |
| Q12 | Product Specifications | 3 | ✅ |
| Q13 | Availability Logic | 3 | ✅ |
| Q14 | Search Ranking | 3 | ✅ |
| Q15 | Responsive Design | 3 | ✅ |
| — | SEO Requirements | 4 | 🟢 DEFERRED |
| — | WCAG Accessibility | 4 | 🟢 DEFERRED |
| — | i18n/Localization | 4 | 🟢 DEFERRED |
| — | Analytics & Tracking | 4 | 🟢 DEFERRED |
| — | Admin Interface | 4 | 🟢 DEFERRED |

---

## 🎉 **REQUIREMENTS ANALYSIS COMPLETE**

**The Northstar requirements document is now IMPLEMENTATION-READY.**

All critical gaps have been resolved through structured human-in-the-loop analysis. The document can now proceed to:
- **Design Phase** (UX/UI mockups, wireframes)
- **Technical Specification** (API design, database schema, architecture)
- **Development** (frontend, backend, database implementation)

---

**Gap Analysis Document:** `/gap-analysis.md`  
**Original Requirements:** `/steering/Requirement_docs/Northstar_Product_Requirements_Document.md`  
**Framework Used:** `/steering/HNTL.md`
