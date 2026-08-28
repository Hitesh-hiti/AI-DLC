# HITL Resolutions — Phase 4
**Date:** August 24, 2026  
**Framework:** Expertise Guardrails — Human-in-the-Loop (HNTL)  
**Source Document:** requirement_breakdown.md (5 ambiguities)  
**Status:** ✅ ALL RESOLVED

---

## Overview

This document captures the 5 product owner decisions (HITL resolutions) that clarified ambiguities in the consolidated requirements. These decisions enable the technical specification phase to proceed without architectural or design uncertainty.

---

## HITL Decision A1: Product Specifications Applicability

**Requirement:** REQ-009 (Product Detail Page — Specifications)  
**Question:** For each product category, should specifications be mandatory, optional, or mixed?

### Decision: Option A — Mandatory for All Products

**Selected By:** Product Owner  
**Rationale:** Consistent specification presentation across all products in a category ensures data quality and user expectations.

### Specification Rules

**Tech & Gadget (Mandatory 5 specs):**
- Processor
- RAM
- Storage
- Battery life
- Connectivity

**Fashion (Mandatory 4 specs):**
- Size
- Material
- Color
- Fit

**Lifestyle (Mandatory 4 specs):**
- Dimensions
- Weight
- Material
- Color

**Home & Living (Mandatory 4 specs):**
- Dimensions
- Material
- Weight
- Color

**Games & Play (Mandatory 3 specs):**
- Age range
- Player count
- Game duration

### Implementation

- **Data Validation:** Product import/upload validates all mandatory specs are present for category
- **Missing Handling:** If spec value is missing, field displays "Not specified" (no hidden fields)
- **Product Publishing:** Product cannot be published without all spec fields (even if "Not specified")
- **Admin Interface:** Requires spec fields to be completed during product creation/edit

### Acceptance Criteria Updated
- AC-009-001 through AC-009-005 (5 total)

### Impact
- Product data structure: All products require all category specs
- Admin workflow: Must complete all spec fields
- Frontend: Always displays all specs (never hides them)

---

## HITL Decision A2: Featured Products Definition

**Requirement:** REQ-011 (New Arrivals — Homepage Preview) & REQ-037 (Homepage — Brand & Discovery Focus)  
**Question:** How should "Featured products" on the homepage be curated?

### Decision: Option A — Manually Curated by Admin

**Selected By:** Product Owner  
**Rationale:** Manual curation allows flexible business logic (seasonal products, promotions, inventory management, etc.).

### Curation Strategy

- **Selection Method:** Admin manually selects specific products for homepage "Featured" section
- **Management:** Future admin interface (Phase 2+) allows admin to add/remove featured products
- **Display:** Featured products displayed on homepage in dedicated section (separate from New Arrivals preview)
- **Quantity:** TBD in design phase (recommend 3–5 featured products)
- **Rotation:** Admin controls when featured products change (no automatic expiration)

### Distinction from New Arrivals

- **Featured Products:** Manually curated by admin, business-driven selection
- **New Arrivals:** Manually flagged via `is_new_arrival` boolean, new product showcase
- **Homepage Preview:** Both sections appear on homepage (separate sections)

### Implementation

- **Database:** Add `is_featured` boolean flag to products table (future, not MVP if no admin interface)
- **Admin Interface:** Provide UI to toggle `is_featured` flag (Phase 2+)
- **Homepage Query:** SELECT products WHERE is_featured = true LIMIT 5 (or configured quantity)
- **Fallback:** If no featured products selected, may show top New Arrivals or empty section

### Acceptance Criteria Updated
- AC-011-001 through AC-011-003 (3 total, includes featured products section)
- AC-037-001 through AC-037-002 (homepage brand & discovery)

### Impact
- Homepage content strategy: Allows promotional and strategic product placement
- Admin workflow: Requires featured product management interface (future)
- Curation flexibility: Easy to highlight specific products by season, category, or campaign

---

## HITL Decision A3: Collection Previews on Homepage

**Requirement:** REQ-014 (Homepage Structure)  
**Question:** Should homepage display collection previews for 3 collections or all 6?

### Decision: Option B — All 6 Collections

**Selected By:** Product Owner  
**Rationale:** All 6 collections are in MVP scope; homepage should promote all collections equally for discoverability.

### Collections Displayed on Homepage

1. All Products
2. Tech & Gadget
3. Fashion
4. Lifestyle
5. Home & Living
6. Games & Play

### Preview Structure

- **Format:** Each collection has a preview section on homepage
- **Content:** Each preview shows subset of products from that collection
- **Quantity:** TBD in design phase (recommend 3–5 products per preview)
- **Navigation:** Each preview has header/link to full collection page
- **Interaction:** User can click individual product or collection header to view more

### Layout Implications

- Homepage becomes longer (6 collection sections vs. 3)
- Design must organize sections vertically or in grid layout
- Mobile layout requires attention to scrolling and touch interaction

### Implementation

- **Query per collection:** Retrieve featured products or first N products from each collection
- **Grid layout:** Each preview section displays grid of 3–5 products
- **Links:** Each preview section header links to full collection page (e.g., /shop/tech-gadget)

### Acceptance Criteria Updated
- AC-014-001 through AC-014-003 (3 total, includes all 6 collections)

### Impact
- Homepage content: Significantly expanded from 3 to 6 collection previews
- Design complexity: Longer page, more sections, requires careful layout
- Discoverability: All categories equally visible on homepage
- User flow: Easier for customers to explore all collection categories

---

## HITL Decision A4: Default Sort Order

**Requirement:** REQ-024 (Sorting — MVP Options)  
**Question:** What should be the default sort order when a collection page loads?

### Decision: Option C — No Default Sort Applied

**Selected By:** Product Owner  
**Rationale:** Neutral default (no sort) allows design flexibility and gives user control; database order is predictable; user explicitly selects sort preference.

### Sort Behavior

- **Initial Load:** Products displayed in database order (or per design decision for ordering)
- **Sort Controls:** Sort dropdown displays neutral/unselected state (e.g., "Sort by...")
- **User Action:** When user selects a sort option (e.g., "Price: Low to High"), products are sorted
- **Persistence:** Sort selection persists as user filters or navigates within same page
- **Reset:** Sort resets to default (no sort) when navigating away from current page

### Available Sort Options

- Price: Low to High
- Price: High to Low
- Newest First (by date added or `is_new_arrival` flag)

### UI Considerations

- Sort dropdown label: "Sort by..." or "Sort"
- Unselected state: "Sort by..." (gray or neutral style)
- Selected state: "Price: Low to High" (highlighted, bold, or active style)
- Mobile: Same behavior; sort accessible from filter bar or menu

### Implementation

- **Frontend:** Sort dropdown defaults to unselected; renders products without sorting
- **Backend:** Provide default sort (no sort applied) if no sort parameter in request
- **State Management:** Track selected sort in URL query param or local state
- **Performance:** Avoid unnecessary re-sorting; only sort when user selects

### Acceptance Criteria Updated
- AC-024-001 through AC-024-004 (4 total, includes "no default" criterion)

### Impact
- UX: User has explicit control over sort order; no hidden defaults
- Design: Sort controls visible but neutral; encourages user awareness of sort state
- Performance: Avoids unnecessary sorting on page load
- Consistency: Same behavior across all collection and search pages

---

## HITL Decision A5: Filtering & Sorting on New Arrivals Page

**Requirement:** REQ-025 (Filtering & Sorting — Applied Pages) & REQ-010 (New Arrivals Section)  
**Question:** Should filtering and sorting controls be available on the New Arrivals page?

### Decision: Option A — Yes, Full Filtering & Sorting

**Selected By:** Product Owner  
**Rationale:** New Arrivals is a collection like any other; users expect same discovery tools (filters, sorting) for consistent UX.

### Filtering Available on New Arrivals

- **Price Filter:** Filter by price range (e.g., $0–$50, $50–$100, etc.)
- **Category Filter:** Filter by category (Tech & Gadget, Fashion, Lifestyle, Home & Living, Games & Play)
- **Availability Filter:** Filter by availability (In Stock only, or Include Out of Stock)

### Sorting Available on New Arrivals

- **Price Sort:** Low to High, High to Low
- **Newest First:** By date added or `is_new_arrival` flag

### Behavior

- **Query:** SELECT products WHERE is_new_arrival = true AND [applied filters] ORDER BY [selected sort]
- **Display:** Grid format (same as other collection pages)
- **Pagination:** 20 products per page with pagination controls
- **State:** Filter/sort state maintained as user navigates New Arrivals pages

### Distinction from Other Collections

- **New Arrivals:** Filtered by `is_new_arrival = true` PLUS any user-applied filters
- **Tech & Gadget:** Filtered by category = 'Tech & Gadget' PLUS any user-applied filters
- **Same Controls:** Filters and sorting work identically on all collection pages (including New Arrivals)

### Implementation

- **New Arrivals page:** /shop/new-arrivals
- **Query structure:** Build WHERE clause: `is_new_arrival = true AND [price filters] AND [category filters] AND [availability]`
- **Sort:** Apply selected sort order to results
- **Frontend:** Render same filter/sort UI as other collection pages

### Acceptance Criteria Updated
- AC-025-001 through AC-025-003 (3 total, includes New Arrivals in scope)

### Impact
- Feature scope: New Arrivals treated as full collection with discovery features
- Consistency: Same UX across all collection pages (no special cases)
- Flexibility: Users can discover new arrivals in specific categories, price ranges, etc.
- Implementation: Reuse filter/sort logic across collection pages (DRY principle)

---

## Summary Table

| Decision | Option | Affected Requirements | AC Count | Status |
|----------|--------|----------------------|----------|--------|
| A1: Specs Mandatory | Option A | REQ-009 | 5 ACs | ✅ |
| A2: Featured Manual | Option A | REQ-011, REQ-037 | 3 ACs | ✅ |
| A3: All 6 Collections | Option B | REQ-014 | 3 ACs | ✅ |
| A4: No Default Sort | Option C | REQ-024 | 4 ACs | ✅ |
| A5: New Arrivals Filters | Option A | REQ-025, REQ-010 | 3 ACs | ✅ |
| **TOTAL** | | **40 Requirements** | **131 ACs** | **✅ READY FOR DEVELOPMENT** |

---

## Next Steps

### Immediate (Technical Specification Phase)
1. ✅ Document these 5 HITL decisions in technical specification
2. ✅ Use these decisions to finalize product data schema (specs, featured flag, etc.)
3. ✅ Use these decisions to design admin interface requirements (future phase)
4. ✅ Design homepage layout for 6 collection previews + featured section
5. ✅ Design filter/sort UI for all collection pages (including New Arrivals)

### Design Phase
1. Create wireframes reflecting 6 collection previews on homepage
2. Design featured products curation workflow (future)
3. Design filter/sort controls for consistency across pages
4. Design spec display for mandatory specs (with "Not specified" handling)

### Implementation Phase
1. Build product data schema with all mandatory spec fields
2. Implement filter/sort logic for all collection pages
3. Implement New Arrivals page with full filtering/sorting
4. Implement featured products query (if admin interface in scope)

---

## Document Metadata

| Attribute | Value |
|-----------|-------|
| **Type** | HITL Resolution Record |
| **Date Created** | August 24, 2026 |
| **Decisions** | 5 (A1–A5) |
| **Requirements Updated** | 8 (REQ-009, REQ-010, REQ-011, REQ-014, REQ-024, REQ-025, REQ-037) |
| **Acceptance Criteria Updated** | 21 ACs (from 126 to 131) |
| **Source Document** | requirement_breakdown.md |
| **Framework** | Expertise Guardrails — Human-in-the-Loop (HNTL) |
| **Status** | ✅ ALL RESOLVED |

---

**Status: READY FOR DEVELOPMENT** ✅

All 5 HITL ambiguities resolved. Technical Specification phase can proceed.
