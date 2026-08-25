# Design Specification — Northstar E-commerce Web Application
**Version:** 1.0 (Design Phase)  
**Date:** August 24, 2026  
**Status:** Design Phase Kickoff  
**Framework:** HNTL-aligned decision register (gap-analysis.md)

---

## 1. Design Phase Overview

This document translates the **15 resolved requirements decisions** (from gap-analysis.md) into actionable design specifications for:
- Wireframes (low-fidelity, structure & layout)
- Information architecture (page hierarchy, navigation)
- User flows (key journeys: browse, search, filter, contact)
- Interaction patterns (mobile, tablet, desktop)
- Visual design system (foundation for mockups)

**Design Decisions Are Grounded In:**
- ✅ Gap-analysis.md (15 resolved decisions, decision register)
- ✅ HNTL framework (all decisions documented with evidence)
- ✅ Northstar_Product_Requirements_Document.md (original requirements)

---

## 2. Information Architecture & Page Hierarchy

### 2.1 Site Map

```
┌─ Homepage
│
├─ Shop
│  ├─ All Products
│  ├─ Tech & Gadget
│  ├─ Fashion
│  ├─ Lifestyle
│  ├─ Home & Living
│  └─ Games & Play
│
├─ New Arrivals
│
├─ Our Story
│
├─ Contact
│
├─ Product Detail [dynamic]
│
└─ Search Results [dynamic]
```

### 2.2 Navigation Structure

**Primary Navigation (Persistent Header/Hamburger Menu)**
- Shop (dropdown to 6 collections)
- New Arrivals
- Our Story
- Contact
- Search (search bar with real-time results)

**Secondary Navigation (Footer)**
- Links to all collections
- Contact information
- Social media links
- Compliance/Privacy

---

## 3. Page-Level Wireframes & Layouts

### 3.1 Homepage

**Resolved Decisions Applied:**
- ✅ Q1: Product data source → Populated from PostgreSQL
- ✅ Q11a: Filtering not on homepage
- ✅ Q15a/b: Responsive layout (mobile hamburger, desktop full nav)

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │  Navigation (Shop v | New | Story | Contact | Search) │
├─────────────────────────────────────────────┤
│                                             │
│      HERO SECTION                           │
│      "Discover Amazing Products"            │
│      [Primary CTA: "Shop Now"]              │
│                                             │
├─────────────────────────────────────────────┤
│  FEATURED PRODUCTS (Grid: 4 products)       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │Image │ │Image │ │Image │ │Image │      │
│  │Name  │ │Name  │ │Name  │ │Name  │      │
│  │Price │ │Price │ │Price │ │Price │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
├─────────────────────────────────────────────┤
│  COLLECTIONS PREVIEW (3 cards: Tech/Fashion/Lifestyle)
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  │ Tech & Gadget   │ │ Fashion         │ │ Lifestyle       │
│  │ [CTA: Browse]   │ │ [CTA: Browse]   │ │ [CTA: Browse]   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘
├─────────────────────────────────────────────┤
│  NEW ARRIVALS PREVIEW (4–6 products)        │
│  [Grid showing new items]                   │
│  [CTA: "View All New Arrivals"]             │
├─────────────────────────────────────────────┤
│  OUR STORY PREVIEW                          │
│  [Text excerpt + image]                     │
│  [CTA: "Read Our Story"]                    │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
│  © 2026 Northstar | Contact | Privacy | etc │
└─────────────────────────────────────────────┘
```

**Desktop Layout:** Side-by-side sections  
**Tablet Layout:** Stacked sections, 2-column grid for products  
**Mobile Layout:** Single-column, full-width sections, hamburger menu

---

### 3.2 Shop / Collection Pages

**Resolved Decisions Applied:**
- ✅ Q11a: Price, Category, Availability filters visible
- ✅ Q11b: Price, Newest-first, Popularity sorting options
- ✅ Q11c: Filters on all collections
- ✅ Q13b: Out-of-stock products shown with "Out of Stock" badge

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │ Navigation                          │
├─────────────────────────────────────────────┤
│ Collection: [Tech & Gadget ▼]               │
├──────────────────┬──────────────────────────┤
│  FILTERS PANEL   │  PRODUCT GRID            │
│  ┌──────────────┐│  Sorted by: [Newest ▼]  │
│  │ Price        ││                          │
│  │ $0  ————— $500││  ┌──────┐ ┌──────┐     │
│  │              ││  │Image │ │Image │ ... │
│  │ Category     ││  │Name  │ │Name  │     │
│  │ ☑ Tech       ││  │Price │ │Price │     │
│  │ ☐ Fashion    ││  │Avail │ │Out of│     │
│  │ ☐ Lifestyle  ││  └──────┘ │Stock │     │
│  │              ││          │Badge │     │
│  │ Availability ││          └──────┘     │
│  │ ☑ In Stock   ││                        │
│  │ ☐ Out of Stock││  [Pagination: 1 2 3]  │
│  │              ││                        │
│  │ [Apply]      ││                        │
│  └──────────────┘│                        │
├──────────────────┴──────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

**Mobile Layout:**
- Filters in collapsible drawer (hamburger icon)
- Full-width product grid (2 columns on mobile, 3 on tablet)
- Sorting dropdown visible above grid

**Product Card Design:**
```
┌────────────────┐
│   [Image ▼]    │ ← Indicates gallery (5 images)
├────────────────┤
│ Product Name   │
│ $XX.XX         │
│ Category       │
│ [In Stock]     │ or [Out of Stock] (badge)
└────────────────┘
```

---

### 3.3 Product Detail Page

**Resolved Decisions Applied:**
- ✅ Q1: Multi-image gallery (5 images max)
- ✅ Q10: Image specs: JPG/PNG/WebP, 10MB, no optimization
- ✅ Q12b: Product specs by collection (Tech/Fashion/Lifestyle/Home/Games)
- ✅ Q13a/b: Availability logic (inventory > 0) with "Out of Stock" badge
- ✅ Q15a/b: Responsive gallery (swipeable on mobile)

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │ Navigation                          │
├─────────────────────────────────────────────┤
│ [< Back to Collection]                      │
├──────────────────────┬──────────────────────┤
│  IMAGE GALLERY       │  PRODUCT INFO        │
│  ┌────────────────┐  │                      │
│  │   [Main Img]   │  │  Product Name        │
│  │  ◄      ►      │  │  $XX.XX              │
│  │   [Thumb A]    │  │  Category: [Cat]     │
│  │   [Thumb B]    │  │  Stock: [In Stock]   │
│  │   [Thumb C]    │  │                      │
│  │   [Thumb D]    │  │  Description:        │
│  │   [Thumb E]    │  │  [Product text...]   │
│  │                │  │                      │
│  └────────────────┘  │  Specifications:     │
│                      │  ┌──────────────┐    │
│                      │  │ Processor    │    │
│                      │  │ Intel i7     │    │
│                      │  ├──────────────┤    │
│                      │  │ RAM          │    │
│                      │  │ 16GB         │    │
│                      │  └──────────────┘    │
│                      │                      │
│                      │  [Add to Wishlist]   │
├──────────────────────┴──────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

**Mobile Layout:**
- Full-width image gallery with vertical swipe
- Thumbs below (can scroll horizontally)
- Product info below gallery
- Specs in accordion (collapsible sections)

**Image Gallery Interaction:**
- Primary image displayed large
- Thumbnail strip (5 thumbnails visible)
- Left/Right arrows (desktop) or swipe (mobile)
- Click thumbnail to change primary image

**Specifications Section:**
- Rendered as key-value pairs or compact table
- Content varies by collection (Q12b examples):
  - **Tech & Gadget:** Processor, RAM, Storage, Battery life, Connectivity
  - **Fashion:** Size, Material, Color, Fit
  - **Lifestyle:** Dimensions, Weight, Material, Color
  - **Home & Living:** Dimensions, Material, Weight, Color
  - **Games & Play:** Age range, Player count, Game duration

---

### 3.4 New Arrivals Page

**Resolved Decisions Applied:**
- ✅ Q2: `is_new_arrival` database flag, manual curation, paginated, dual display
- ✅ Q11a/b/c: Filters and sorting available
- ✅ Q13b: Out-of-stock items shown with badge

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │ Navigation                          │
├─────────────────────────────────────────────┤
│ New Arrivals                                │
├──────────────────┬──────────────────────────┤
│  FILTERS         │  PRODUCT GRID            │
│  [Same as        │  Sorted by: [Newest ▼]  │
│   Shop page]     │                          │
│                  │  ┌──────┐ ┌──────┐     │
│                  │  │Image │ │Image │ ... │
│                  │  │Name  │ │Name  │     │
│                  │  │Price │ │Price │     │
│                  │  │[NEW] │ │[NEW] │     │
│                  │  └──────┘ └──────┘     │
│                  │                        │
│                  │  [Pagination]          │
├──────────────────┴──────────────────────────┤
│  [1] [2] [3] ... [Next]                     │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

**Key Differences from Collection Pages:**
- Products display with "[NEW]" or similar badge
- Only products with `is_new_arrival = true` shown
- Same filtering/sorting as other collections

---

### 3.5 Search Results Page

**Resolved Decisions Applied:**
- ✅ Q5: Real-time as-you-type search
- ✅ Q14a: Keyword/tag match ranking
- ✅ Q14b: Simple relevance (no boosting)
- ✅ Q14c: 20 results per page with pagination

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │ [Search: "wireless headphones"] [x]│
├─────────────────────────────────────────────┤
│  Results for "wireless headphones" (47)     │
│                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │Image │ │Image │ │Image │ │Image │ ...  │
│  │Name  │ │Name  │ │Name  │ │Name  │      │
│  │Price │ │Price │ │Price │ │Price │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                             │
│  Showing 1–20 of 47 results                 │
│  [1] [2] [3] [Next]                         │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

**Search Input Interaction (Real-Time As-You-Type):**
- Search bar always visible in header
- As user types, results update in real-time (debounced)
- Dropdown shows live results below search input (mobile-friendly)
- User can click result or press Enter to navigate to results page
- Search scope: Product name, category, keywords

**Empty State:**
```
No results found for "xyzzyx"
Try:
- Checking your spelling
- Using different keywords
- Browsing our collections
```

---

### 3.6 Our Story Page

**Resolved Decisions Applied:**
- ✅ Q1: Static content for MVP (no CMS)

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │ Navigation                          │
├─────────────────────────────────────────────┤
│                                             │
│  Our Story                                  │
│                                             │
│  [Hero image or background]                 │
│                                             │
│  Who We Are                                 │
│  [Descriptive text...]                      │
│                                             │
│  Our Mission                                │
│  [Mission statement]                        │
│                                             │
│  Our Values                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │Quality  │ │Ethics   │ │Community│      │
│  └─────────┘ └─────────┘ └─────────┘      │
│                                             │
│  What Makes Us Different                    │
│  [Value proposition text...]                │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

**Content Sections (Static):**
- Who We Are
- Brand Vision
- Brand Mission
- Brand Values (3–5 values with descriptions)
- Product Philosophy
- What Differentiates Northstar

---

### 3.7 Contact Page

**Resolved Decisions Applied:**
- ✅ Q6: Email to support@northstar.com
- ✅ Q7: GDPR consent checkbox required
- ✅ Q7c: Privacy notice required
- ✅ Q8: Rate limiting: 5 submissions/IP/day
- ✅ Q4c: 1-year retention (not deletable by user)

**Wireframe Layout:**

```
┌─────────────────────────────────────────────┐
│  Logo  │ Navigation                          │
├─────────────────────────────────────────────┤
│                                             │
│  Contact Us                                 │
│                                             │
│  CONTACT INFORMATION                        │
│  Email: support@northstar.com               │
│  Phone: [if applicable]                     │
│  Address: [if applicable]                   │
│  Social: [links]                            │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  CONTACT FORM                               │
│                                             │
│  Name: [________________]                   │
│  Email: [________________]                  │
│  Subject: [________________]                │
│  Message: [________________                 │
│            ________________]                │
│                                             │
│  ☐ I consent to my information being        │
│    stored and used to respond to my inquiry │
│                                             │
│  [Send] [Clear]                             │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  PRIVACY NOTICE                             │
│  "Your contact information will be stored   │
│   for up to one year in accordance with     │
│   GDPR regulations. We will only use your   │
│   information to respond to your inquiry.   │
│   See our Privacy Policy for details."      │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER                                     │
└─────────────────────────────────────────────┘
```

**Form Validation (Real-Time):**
- Name: Cannot be empty
- Email: Valid format required (user@domain.com)
- Subject: Cannot be empty
- Message: Cannot be empty
- Consent: Must be checked to submit

**Success State:**
```
✓ Thank you for contacting us!
  
We've received your message and will respond
within 24 hours.

A confirmation email has been sent to:
your-email@domain.com

[Back to Homepage]
```

**Error States:**
- Form validation error: Highlight invalid field(s), show inline error message
- Submission error: "Unable to submit form. Please try again or contact support."
- Rate limit exceeded: "You've reached the maximum submissions for today. Please try again tomorrow."

---

## 4. User Flow Diagrams

### 4.1 Product Discovery Flow

```
┌─ Homepage
│
├─→ [Browse Collections CTA]
│   ├─→ Collection Page (Shop)
│   │   ├─→ [Apply Filters]
│   │   ├─→ [Apply Sorting]
│   │   ├─→ [Click Product Card]
│   │   │   └─→ Product Detail Page
│   │   │       ├─→ [View Image Gallery]
│   │   │       ├─→ [View Specs]
│   │   │       └─→ [Back to Collection]
│   │   └─→ [Pagination: Next/Prev]
│   │
│   └─→ New Arrivals Collection
│       ├─→ [Apply Filters]
│       ├─→ [Apply Sorting]
│       └─→ [Click Product Card]
│
├─→ [Search Bar]
│   ├─→ [Type keyword] → Real-time results dropdown
│   ├─→ [Click result] → Product Detail Page
│   └─→ [Submit search] → Search Results Page
│       ├─→ [Pagination]
│       └─→ [Click result] → Product Detail Page
│
└─→ [Featured Products on Homepage]
    └─→ [Click Product] → Product Detail Page
```

### 4.2 Contact Flow

```
┌─ Any Page
│
├─→ [Navigation: Contact]
│   └─→ Contact Page
│       ├─→ [View Contact Information]
│       ├─→ [Fill Contact Form]
│       │   ├─→ Validate fields (real-time)
│       │   ├─→ Check consent checkbox
│       │   ├─→ [Submit]
│       │   │   ├─→ ✓ Success: Confirmation message + email
│       │   │   ├─→ ✗ Error: Show error message (allow retry)
│       │   │   └─→ ✗ Rate limited: Show limit message
│       │   └─→ [Clear Form]
│       │
│       └─→ [Contact Info Clicked] → Email client / Phone dial
│
└─→ [Homepage CTA: "Contact Us"]
    └─→ Contact Page
```

### 4.3 Search & Filter Flow

```
┌─ Search
│
├─→ [Type in Search Bar]
│   ├─→ Real-time results (debounced, <300ms)
│   ├─→ Show dropdown with results
│   ├─→ [Click result in dropdown] → Product Detail Page
│   └─→ [Press Enter] → Search Results Page
│
└─→ Search Results Page
    ├─→ Show 20 results per page
    ├─→ [Pagination: 1, 2, 3...]
    └─→ [Click result] → Product Detail Page
```

### 4.4 Filter & Sort Flow

```
┌─ Collection Page
│
├─→ [Select Filter: Price Range]
│   ├─→ Drag slider / Select preset range
│   ├─→ [Apply] → Page reloads with filtered results
│   └─→ Show active filters above grid
│
├─→ [Select Filter: Category]
│   ├─→ Check/uncheck categories
│   ├─→ [Apply] → Page reloads with filtered results
│   └─→ Show active filters above grid
│
├─→ [Select Filter: Availability]
│   ├─→ Check/uncheck "In Stock" / "Out of Stock"
│   ├─→ [Apply] → Page reloads with filtered results
│   └─→ Show active filters above grid
│
├─→ [Select Sort: Price (Low→High)]
│   ├─→ Results re-sorted immediately
│   └─→ Show selected sort above grid
│
└─→ [Select Sort: Newest First]
    ├─→ Results re-sorted immediately
    └─→ Show selected sort above grid
```

---

## 5. Interaction Patterns & Micro-Interactions

### 5.1 Search As-You-Type

**Interaction:**
1. User clicks search bar or starts typing
2. For each keystroke (after debounce ~300ms):
   - Query backend search endpoint
   - Display results in dropdown below search bar
   - Show first 5–10 results
3. User clicks result → Navigate to Product Detail Page
4. User presses Enter → Navigate to Search Results Page (all 20+ results)

**Mobile Consideration:**
- Touch-friendly dropdown
- Larger tap targets
- Close button (x) to clear search

### 5.2 Product Image Gallery

**Desktop Interaction:**
1. Primary image displayed large (click to enlarge?)
2. Thumbnail strip below (all 5 visible)
3. Arrow buttons: [◄] [►] to scroll
4. Click thumbnail → Changes primary image
5. Optional: Keyboard arrows to navigate

**Mobile Interaction:**
1. Primary image displayed full-width
2. Swipe left/right to change image
3. Thumbnails below (swipeable if needed)
4. Dots indicator: • ◦ ◦ ◦ ◦ (shows current position)

**Tablet:**
- Hybrid: Arrows for navigation (if more than visible) + thumbnail taps

### 5.3 Filter Controls

**Price Filter:**
- Range slider with min/max handles
- Or discrete buttons: [$0–$50] [$50–$100] [$100+]
- Show selected range
- [Apply] button to apply filters

**Category Filter:**
- Checkboxes (no exclusive selection)
- Allow multi-select
- Show count per category (if data available)

**Availability Filter:**
- Checkboxes: ☑ In Stock, ☑ Out of Stock
- Both can be selected

### 5.4 Sorting Dropdown

**Interaction:**
1. Click "Sort by: [Newest ▼]"
2. Dropdown shows options:
   - Price: Low → High
   - Price: High → Low
   - Newest First
   - Most Popular
3. Select option → Results re-sort instantly (no page reload)

### 5.5 Form Validation

**Contact Form Real-Time Validation:**
- Name: Show error if empty or whitespace-only (on blur)
- Email: Show error if invalid format (on blur)
- Subject: Show error if empty (on blur)
- Message: Show error if empty or <10 characters? (on blur)
- Consent: Highlight checkbox if unchecked on submit attempt

**Inline Error Display:**
```
Name: [________________] ← Error text (red)
                         "Name cannot be empty"
```

---

## 6. Responsive Design Breakpoints & Behavior

### 6.1 Breakpoints

**Resolved Decision (Q15a):** Standard breakpoints accepted

| Device | Breakpoint | Layout | Navigation |
|--------|-----------|--------|------------|
| Mobile | < 768px | Single column, full-width sections | Hamburger menu |
| Tablet | 768px–1024px | 2-column grid (products), sidebar for filters | Top bar with abbreviated menu |
| Desktop | > 1024px | 3–4-column grid (products), full sidebar filters | Full horizontal nav |

### 6.2 Component Scaling

**Product Cards:**
- Mobile: 2 columns, full-width cards
- Tablet: 3 columns, optimized spacing
- Desktop: 4 columns (or more depending on screen size)

**Product Image Gallery:**
- Mobile: Full-width image, horizontal swipe
- Tablet: Larger image, thumbnail strip below
- Desktop: Large image (50% of viewport), thumbnails beside

**Search Results:**
- Mobile: 2 columns, full-width
- Tablet: 3 columns
- Desktop: 4 columns

**Filters Panel:**
- Mobile: Collapsible drawer (hamburger or slide-out)
- Tablet: Collapsible sidebar (or floating panel)
- Desktop: Persistent sidebar

---

## 7. Visual Design System Foundation

### 7.1 Color Palette

(To be finalized in mockup phase; suggested foundation):

| Element | Color | Usage |
|---------|-------|-------|
| Primary Brand | [TBD] | Header, CTA buttons, accents |
| Secondary | [TBD] | Hover states, secondary buttons |
| Neutral Light | #F5F5F5 | Backgrounds, cards |
| Neutral Dark | #2C2C2C | Text, borders |
| Success | #4CAF50 | Confirmation, success states |
| Error | #F44336 | Errors, validation, alerts |
| Warning | #FFC107 | Warnings, info messages |
| Background | #FFFFFF or #F9F9F9 | Page background |

### 7.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 (Page Title) | [TBD] | 32px | 700 (Bold) |
| H2 (Section) | [TBD] | 24px | 600 (Semi-bold) |
| H3 (Subsection) | [TBD] | 18px | 600 |
| Body | [TBD] | 14–16px | 400 (Regular) |
| Small (Meta) | [TBD] | 12px | 400 |
| Button | [TBD] | 14–16px | 600 |

### 7.3 Spacing & Layout

| Element | Size |
|---------|------|
| Page padding | 16px (mobile), 24px (tablet), 32px (desktop) |
| Card padding | 16px |
| Product card gap | 12px (mobile), 16px (tablet/desktop) |
| Section margin | 32px |
| Border radius | 4–8px (to be decided) |

### 7.4 Buttons

**Primary Button:**
- Background: Primary brand color
- Text: White
- Padding: 12px 24px
- Border-radius: 4px
- Hover: Darken by 10%
- Active/Pressed: Darken by 15%

**Secondary Button:**
- Background: Neutral light
- Text: Primary brand color
- Border: 1px solid primary
- Padding: 12px 24px
- Hover: Light background

---

## 8. Accessibility Considerations (Foundation)

**Note:** Full WCAG AA compliance testing/validation to be completed in Phase 2.

### 8.1 Semantic HTML

- Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` elements
- Proper heading hierarchy (h1 → h2 → h3, no skipping)
- Form labels associated with inputs (`<label for="id">`)

### 8.2 Keyboard Navigation

- All interactive elements accessible via Tab key
- Focus states clearly visible (outline or highlight)
- Search dropdown navigable with arrow keys
- Filter controls keyboard-accessible
- Forms submittable via keyboard (Enter key)

### 8.3 Screen Reader Support

- Image alt text describing product/content
- ARIA labels for icon buttons
- Form error messages announced
- Loading states announced (e.g., "Loading results...")

### 8.4 Color Contrast

- Text on background: WCAG AA minimum (4.5:1 for regular text)
- Error messages: Not red alone (include icon/text)

---

## 9. Implementation Guidelines

### 9.1 Design Handoff to Engineering

This design spec should include:
1. **Wireframes** (low-fidelity, structure)
   - Created using: Figma, Excalidraw, or similar
   - Shared as link or exported PDFs
   
2. **Mockups** (high-fidelity, visual design)
   - Created using: Figma, Adobe XD, Sketch
   - Color schemes, typography applied
   - Interactive prototypes if possible

3. **User Flows** (process diagrams)
   - Created using: Lucidchart, Miro, Draw.io
   - Screen-by-screen navigation

4. **Component Library** (Figma design system)
   - Reusable buttons, cards, forms
   - Color/typography tokens
   - States (default, hover, active, disabled, error)

5. **Interaction Specifications**
   - Hover effects
   - Transitions/animations
   - Loading states
   - Error/success states

### 9.2 Design Review Checklist

Before handing off to engineering, verify:
- ☐ All 15 resolved decisions reflected in design
- ☐ Mobile, tablet, desktop layouts designed
- ☐ Search as-you-type interaction specified
- ☐ Filter/sorting interactions defined
- ☐ Product gallery interaction (swipe/arrow) specified
- ☐ Form validation states shown
- ☐ Out-of-stock product handling visible
- ☐ All 6 collections included
- ☐ GDPR consent & privacy notice on contact form
- ☐ Homepage structure matches requirement (hero, featured, collections preview, etc.)
- ☐ Accessibility considerations documented (semantic HTML, keyboard nav, alt text)
- ☐ Responsive breakpoints tested (768px, 1024px)
- ☐ User flows cover: browse, search, filter, contact
- ☐ Empty states shown (no results, no products, form error)

---

## 10. Design Artifacts Checklist

### To Create (Next Steps)

- ☐ Low-fidelity wireframes (8 pages: Homepage, Shop, Product Detail, New Arrivals, Search Results, Our Story, Contact, Mobile variant)
- ☐ High-fidelity mockups (same 8 pages with visual design applied)
- ☐ Figma/design system with:
  - ☐ Color palette
  - ☐ Typography styles
  - ☐ Button components (primary, secondary, states)
  - ☐ Product card component
  - ☐ Filter panel component
  - ☐ Form components (input, checkbox, textarea, error states)
  - ☐ Navigation component (desktop, tablet, mobile)
- ☐ Interactive prototype (click-through prototype showing key flows)
- ☐ User flow diagrams (4 flows: discovery, search/filter, contact, product details)
- ☐ Component interaction spec document
- ☐ Accessibility audit checklist (WCAG AA)
- ☐ Design QA checklist (all requirements verified)

---

## 11. References & Alignment

### Resolved Requirements (From gap-analysis.md)

This design is grounded in all 15 resolved decisions:
- Q1–Q5: Core product features (5 gaps)
- Q6–Q10: Infrastructure & compliance (5 gaps)
- Q11–Q15: Features & UX (5 gaps)

**No assumptions made.** Every design element maps to a resolved decision in gap-analysis.md.

### Framework Alignment (HNTL)

- ✅ All design decisions are L1 (known expertise: visual design, UX patterns)
- ✅ No L3 (outside expertise) decisions made at design phase
- ✅ All wireframes grounded in gap-analysis decisions
- ✅ Design review checklist ensures requirements traceability

---

## 12. Document Control

| Attribute | Value |
|-----------|-------|
| **Version** | 1.0 (Design Phase Kickoff) |
| **Status** | Ready for Wireframe & Mockup Phase |
| **Last Updated** | August 24, 2026 |
| **Owner** | Design Team |
| **Reviewers** | Product Owner, Engineering Lead, UX Lead |
| **Reference Docs** | gap-analysis.md, HNTL.md, Northstar_Product_Requirements_Document.md |
| **Next Phase** | Wireframe creation → Mockup design → Interactive prototype |

---

## Appendix: Design Decision Registry

| Design Element | Resolved Decision | Gap ID | Status |
|----------------|------------------|--------|--------|
| 6 Collections | All included in MVP | Q3 | ✅ |
| Product Cards | Include image, name, price, category, availability | Q1 | ✅ |
| Product Gallery | 5 images, multi-image support | Q1, Q10c | ✅ |
| Filters | Price, Category, Availability | Q11a | ✅ |
| Sorting | Price, Newest-first, Popularity | Q11b | ✅ |
| Search | Real-time as-you-type | Q5 | ✅ |
| Search Ranking | Keyword/tag match, no boosting | Q14a, Q14b | ✅ |
| Search Results | 20 per page, paginated | Q14c | ✅ |
| Product Specs | Optional, by collection | Q12a, Q12b | ✅ |
| Availability Logic | Inventory > 0, "Out of Stock" badge visible | Q13a, Q13b | ✅ |
| Contact Form | Email, name, subject, message + consent + privacy notice | Q4, Q6, Q7 | ✅ |
| Responsive Design | Mobile/tablet/desktop breakpoints | Q15a, Q15b | ✅ |
| New Arrivals | Database flag, manual, paginated, dual display | Q2 | ✅ |
| Rate Limiting | 5 submissions/IP/day | Q8 | ✅ |
| Image Storage | JPG/PNG/WebP, 10MB, 5 per product | Q10a, Q10b, Q10c | ✅ |

---

**Design Specification Document Complete.**

Ready for Design Team to create wireframes and mockups based on this specification.
