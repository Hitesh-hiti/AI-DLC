# 🚀 Frontend Developer Starter Guide — Northstar E-commerce

**Status:** Ready for Week 2 Frontend Development  
**Date:** August 26, 2026  
**Version:** 1.0  
**Audience:** Frontend developers starting on the Northstar project

---

## 📖 Quick Navigation

- **[Getting Started](#getting-started)** — Setup & first steps (10 min)
- **[Project Overview](#project-overview)** — What you're building
- **[Pages & Layouts](#pages--layouts)** — 8 pages with wireframes
- **[API Reference](#api-reference)** — All 9 endpoints with examples
- **[React Component Structure](#react-component-structure)** — Recommended patterns
- **[Integration Examples](#integration-examples)** — Code samples
- **[Design System](#design-system)** — Colors, typography, spacing
- **[Responsive Design](#responsive-design)** — Mobile/tablet/desktop
- **[Collections](#collections)** — 6 product categories
- **[Common Tasks](#common-tasks)** — How to...
- **[Troubleshooting](#troubleshooting)** — FAQ

---

## Getting Started

### Prerequisites
- Node.js 16+ LTS
- npm or yarn
- React 18+
- Code editor (VS Code recommended)
- Postman (for API testing)

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone [repo-url]
cd northstar

# 2. Create frontend directory
mkdir frontend
cd frontend

# 3. Create React app (using Vite for speed)
npm create vite@latest . -- --template react
npm install

# 4. Install dependencies
npm install axios react-router-dom zustand

# 5. Start dev server
npm run dev
```

**Frontend will run at:** `http://localhost:5173`  
**Backend API:** `http://localhost:3000/api/v1`

### Environment Setup

Create `.env.local` in frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
```

---

## Project Overview

### What You're Building

**Northstar** is a modern e-commerce application for product discovery and browsing.

**Key Features:**
- ✅ Product discovery across 6 collections
- ✅ Advanced filtering (price, category, availability)
- ✅ Real-time search (as-you-type)
- ✅ Product detail pages with image gallery (5 images)
- ✅ New arrivals showcase
- ✅ Contact form with rate limiting
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Our Story page (about brand)

**Out of Scope (Phase 2+):**
- ❌ Shopping cart / checkout
- ❌ User registration / login
- ❌ Payments
- ❌ Order management

### Collections (6 Total)

| ID | Slug | Name | Example Products |
|---|------|------|-------------------|
| 1 | all-products | All Products | All available products |
| 2 | tech-gadget | Tech & Gadget | Headphones, smartwatches, chargers |
| 3 | fashion | Fashion | Clothing, bags, accessories, footwear |
| 4 | lifestyle | Lifestyle | Yoga mats, water bottles, travel gear |
| 5 | home-living | Home & Living | Lamps, sheets, wall art |
| 6 | games-play | Games & Play | Board games, puzzles, STEM kits |

---

## Pages & Layouts

### Page Overview

**Total Pages:** 8

| Page | Route | Purpose | Features |
|------|-------|---------|----------|
| Homepage | `/` | Landing page | Hero, featured products, collections preview, new arrivals |
| Shop/Collections | `/shop`, `/shop/:slug` | Browse products | Product grid, filters, sorting, pagination |
| Product Detail | `/products/:id` | Single product | Image gallery, specs, description, availability |
| New Arrivals | `/new-arrivals` | New products | Curated new items, sorting, pagination |
| Search Results | `/search?q=keyword` | Search results | Filtered results, pagination |
| Our Story | `/story` | Brand page | Static content about Northstar |
| Contact | `/contact` | Contact form | Form fields, submission, GDPR consent |
| 404 Error | `*` | Not found | Error message, navigation links |

### 1️⃣ Homepage (`/`)

**Components Needed:**
```
HomePage
├── Header (Navigation)
├── HeroSection
│   ├── HeroText
│   └── HeroImage
├── FeaturedProducts
│   └── ProductCard (×4)
├── CollectionsPreview
│   └── CollectionCard (×3: Tech, Fashion, Lifestyle)
├── NewArrivalsPreview
│   ├── SectionHeader
│   └── ProductCard (×4)
├── OurStoryPreview
│   ├── StoryText
│   └── StoryImage
└── Footer
```

**Layout Notes:**
- Desktop: Side-by-side sections, 4-column product grid
- Tablet: Stacked sections, 2-column grid
- Mobile: Single column, full-width sections, hamburger menu

**API Calls:**
```javascript
// Get featured products
GET /api/v1/products?limit=4

// Get all collections
GET /api/v1/collections

// Get new arrivals
GET /api/v1/new-arrivals?limit=4

// Get our story content
GET /api/v1/content/our_story
```

---

### 2️⃣ Shop / Collections Page (`/shop/:slug?`)

**Components Needed:**
```
ShopPage
├── Header (Navigation)
├── CollectionHeader
│   └── CollectionTitle
├── MainContent
│   ├── FilterSidebar
│   │   ├── PriceFilter
│   │   ├── CategoryFilter
│   │   ├── AvailabilityFilter
│   │   └── ApplyButton
│   └── ProductsGrid
│       ├── SortDropdown
│       ├── ProductCard (×20)
│       └── Pagination
└── Footer
```

**Filter Options:**
- **Price:** Min/Max slider ($0–$500+)
- **Category:** Checkboxes (all 6 collections)
- **Availability:** In Stock / Out of Stock / All

**Sort Options:**
- Newest (default)
- Price: Low to High
- Price: High to Low
- Most Popular

**Pagination:**
- 20 products per page
- Show page numbers (1, 2, 3...)
- Previous/Next buttons

**Layout Notes:**
- Desktop: Sidebar filters (30% width) + grid (70%)
- Tablet: Collapsible filters above grid, 2-column grid
- Mobile: Filters in drawer, full-width grid

**API Call:**
```javascript
GET /api/v1/products?collection=tech-gadget&sort=newest&price_min=0&price_max=500&availability=in-stock&page=1&limit=20
```

---

### 3️⃣ Product Detail Page (`/products/:id`)

**Components Needed:**
```
ProductDetailPage
├── Header (Navigation)
├── MainContent
│   ├── ImageGallery
│   │   ├── MainImage
│   │   └── ThumbnailCarousel
│   └── ProductInfo
│       ├── ProductName
│       ├── Price
│       ├── Category
│       ├── AvailabilityBadge
│       ├── Description
│       ├── Specifications
│       └── RelatedProducts
└── Footer
```

**Image Gallery:**
- Main image (large, clickable for zoom on desktop)
- Thumbnail carousel (5 images max)
- Mobile: Swipeable carousel
- Desktop: Click thumbnails to change main image

**Specifications** (by collection):
- **Tech:** Processor, RAM, Storage, Battery, Connectivity
- **Fashion:** Size, Material, Color, Fit
- **Lifestyle:** Dimensions, Weight, Material, Color
- **Home:** Dimensions, Weight, Material, Color
- **Games:** Age Range, Player Count, Duration

**Availability Indicator:**
- ✅ In Stock → Green badge "In Stock"
- ❌ Out of Stock → Red badge "Out of Stock" (still clickable/viewable)

**Layout Notes:**
- Desktop: 50% image gallery (left) + 50% product info (right)
- Tablet: Image gallery (top), product info (bottom)
- Mobile: Full-width, stacked layout

**API Call:**
```javascript
GET /api/v1/products/:id
// Response includes: images (array), specifications (object), related products
```

---

### 4️⃣ New Arrivals Page (`/new-arrivals`)

**Components Needed:**
```
NewArrivalsPage
├── Header (Navigation)
├── PageTitle
├── MainContent
│   ├── SortDropdown
│   ├── ProductGrid
│   │   └── ProductCard (×20)
│   └── Pagination
└── Footer
```

**Features:**
- Display only products with `is_new_arrival = true`
- Same sorting/pagination as shop page
- No filters (new arrivals are pre-curated)

**Sort Options:**
- Newest (default)
- Price: Low to High
- Price: High to Low
- Most Popular

**API Call:**
```javascript
GET /api/v1/new-arrivals?sort=newest&page=1&limit=20
```

---

### 5️⃣ Search Results Page (`/search?q=keyword`)

**Components Needed:**
```
SearchResultsPage
├── Header (Navigation + Search Bar)
├── PageTitle ("Search results for: {keyword}")
├── MainContent
│   ├── ResultsCount ("Found X results")
│   ├── SortDropdown
│   ├── ProductGrid
│   │   └── ProductCard (×20)
│   └── Pagination
└── EmptyState (if no results)
    └── "No products found. Try different keywords."
└── Footer
```

**Features:**
- Real-time search (debounced 300ms)
- Full-text search on: name, description, keywords
- Pagination (20 per page)
- Display result count

**API Call:**
```javascript
GET /api/v1/search?q=headphones&page=1&limit=20
```

---

### 6️⃣ Our Story Page (`/story`)

**Components Needed:**
```
OurStoryPage
├── Header (Navigation)
├── PageTitle ("Our Story")
├── MainContent
│   ├── Section 1: Who We Are
│   ├── Section 2: Our Mission
│   ├── Section 3: Our Values
│   ├── Section 4: Our Difference
│   └── StoryImage
└── Footer
```

**Features:**
- Static content (no dynamic data initially)
- Can be updated later with CMS

**Content Sections:**
```javascript
{
  title: "Our Story",
  mission: "To bring quality products at affordable prices...",
  vision: "To be the go-to e-commerce platform...",
  values: "Quality, Integrity, Innovation, Customer Focus"
}
```

**API Call:**
```javascript
GET /api/v1/content/our_story
```

---

### 7️⃣ Contact Page (`/contact`)

**Components Needed:**
```
ContactPage
├── Header (Navigation)
├── PageTitle ("Get in Touch")
├── TwoColumnLayout
│   ├── ContactForm
│   │   ├── NameInput
│   │   ├── EmailInput
│   │   ├── SubjectInput
│   │   ├── MessageTextarea
│   │   ├── ConsentCheckbox (GDPR)
│   │   ├── SubmitButton
│   │   └── SuccessMessage
│   └── ContactInfo
│       ├── Email
│       ├── Phone
│       ├── Address
│       └── HoursOfOperation
└── Footer
```

**Form Validation:**
- Name: Required, max 255 chars
- Email: Required, valid email format
- Subject: Required, max 255 chars
- Message: Required, min 10, max 5000 chars
- Consent: Must be checked (GDPR)

**Rate Limiting:**
- Max 5 submissions per IP per 24 hours
- Show error if exceeded: "You've reached the maximum submissions. Please try again tomorrow."

**Success State:**
- Show confirmation message: "Thank you! We've received your message."
- Send confirmation email to user
- Send notification to support@northstar.com

**API Call:**
```javascript
POST /api/v1/contact
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I have a question about...",
  "consent_given": true
}

// Response: 
// Success (201): { success: true, message: "...", data: { submission_id, email } }
// Rate Limited (429): { success: false, message: "Too many submissions..." }
```

---

### 8️⃣ Navigation Header (All Pages)

**Components Needed:**
```
Header
├── Logo (clickable → home)
├── DesktopNav
│   ├── Shop (dropdown with 6 collections)
│   ├── New Arrivals
│   ├── Our Story
│   ├── Contact
│   └── Search Input
└── MobileNav (Hamburger Menu)
    ├── Menu Toggle Button
    └── Drawer/Sidebar
        ├── Shop Collections (×6)
        ├── New Arrivals
        ├── Our Story
        ├── Contact
        └── Search Input
```

**Desktop Navigation (1024px+):**
- Horizontal menu bar
- Shop dropdown showing all 6 collections
- Search bar on right
- Persistent across all pages

**Mobile Navigation (<768px):**
- Hamburger menu icon (top left)
- Logo (center)
- Search icon (top right)
- Slide-out drawer menu when hamburger clicked
- Collections in expandable submenu

---

## API Reference

### Base URL
```
http://localhost:3000/api/v1
```

### 9 Endpoints (All Endpoints)

#### 1. GET `/health`
**Health Check** — Server status

```javascript
// Request
GET http://localhost:3000/health

// Response (200 OK)
{
  "status": "OK",
  "timestamp": "2026-08-26T12:55:00.000Z"
}
```

---

#### 2. GET `/products`
**List Products** — Browse with filters, sorting, pagination

**Query Parameters:**
```
collection: all-products | tech-gadget | fashion | lifestyle | home-living | games-play
sort: newest | price-asc | price-desc | popular
price_min: number (optional)
price_max: number (optional)
availability: in-stock | out-of-stock | all
page: number (default: 1)
limit: number (default: 20, max: 100)
```

**Example Request:**
```javascript
GET /products?collection=tech-gadget&sort=price-asc&price_max=200&availability=in-stock&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "price": 79.99,
      "category": "tech-gadget",
      "image_path": "/images/products/headphones-1.jpg",
      "is_new_arrival": true,
      "inventory_count": 5,
      "availability": "In Stock"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "total_pages": 15
  }
}
```

---

#### 3. GET `/products/:id`
**Product Details** — Single product with images, specs, description

**Example Request:**
```javascript
GET /products/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones...",
    "price": 79.99,
    "category": "tech-gadget",
    "sku": "WH-001",
    "inventory_count": 5,
    "availability": "In Stock",
    "images": [
      {
        "id": 1,
        "product_id": 1,
        "image_path": "/images/products/headphones-1.jpg",
        "order": 1,
        "alt_text": "Front view of wireless headphones"
      },
      {
        "id": 2,
        "product_id": 1,
        "image_path": "/images/products/headphones-2.jpg",
        "order": 2,
        "alt_text": "Side view of wireless headphones"
      }
    ],
    "specifications": {
      "driver_size": "40mm",
      "frequency_response": "20Hz - 20kHz",
      "battery_life": "30 hours",
      "connectivity": "Bluetooth 5.0",
      "weight": "250g"
    },
    "related_products": [
      { "id": 2, "name": "...", "price": "..." }
    ]
  }
}
```

---

#### 4. GET `/search`
**Full-Text Search** — Real-time product search

**Query Parameters:**
```
q: string (required, 1-100 chars)
page: number (default: 1)
limit: number (default: 20, max: 100)
```

**Example Request:**
```javascript
GET /search?q=headphones&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "price": 79.99,
      "image_path": "/images/products/headphones-1.jpg",
      "category": "tech-gadget",
      "match_score": 0.95,
      "matched_fields": ["name", "keywords"]
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

**Empty State (200 OK - No Results):**
```json
{
  "success": true,
  "data": [],
  "pagination": { "total": 0, "page": 1, "limit": 20, "total_pages": 0 }
}
```

---

#### 5. GET `/new-arrivals`
**New Products** — Manually curated new items

**Query Parameters:**
```
sort: newest | price-asc | price-desc | popular
page: number (default: 1)
limit: number (default: 20, max: 100)
```

**Example Request:**
```javascript
GET /new-arrivals?sort=newest&page=1&limit=20
```

**Response:** Same as `/products` endpoint

---

#### 6. GET `/collections`
**All Collections** — 6 product categories

**Example Request:**
```javascript
GET /collections
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "All Products",
      "slug": "all-products",
      "description": "Browse our entire collection"
    },
    {
      "id": 2,
      "name": "Tech & Gadget",
      "slug": "tech-gadget",
      "description": "Electronics and gadgets"
    },
    // ... 4 more collections
  ]
}
```

---

#### 7. GET `/collections/:slug/products`
**Collection Products** — Products filtered by collection

**Query Parameters:** Same as `/products` endpoint

**Example Request:**
```javascript
GET /collections/fashion/products?sort=price-asc&page=1&limit=20
```

**Response:** Same as `/products` endpoint

---

#### 8. POST `/contact`
**Submit Contact Form** — Rate limited (5 per IP per 24h)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Product Inquiry",
  "message": "I have a question about your wireless headphones.",
  "consent_given": true
}
```

**Validation Rules:**
- `name`: Required, max 255 chars
- `email`: Required, valid email
- `subject`: Required, max 255 chars
- `message`: Required, min 10, max 5000 chars
- `consent_given`: Must be `true` (GDPR)

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for contacting us!",
  "data": {
    "submission_id": "sub_12345",
    "email": "john@example.com",
    "confirmation_email_sent": true
  }
}
```

**Rate Limit Error (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many submission attempts",
  "error": "Maximum 5 submissions per 24 hours per IP address"
}
```

**Validation Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "consent_given", "message": "Must accept privacy policy" }
  ]
}
```

---

#### 9. GET `/content/:page`
**Static Content** — Our Story, Contact Info

**Path Parameters:**
```
page: our_story | contact_information
```

**Example Request - Our Story:**
```javascript
GET /content/our_story
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "page": "our_story",
    "sections": {
      "title": "Our Story",
      "mission": "To bring quality products at affordable prices...",
      "vision": "To be the go-to e-commerce platform...",
      "values": "Quality, Integrity, Innovation, Customer Focus"
    }
  }
}
```

**Example Request - Contact Info:**
```javascript
GET /content/contact_information
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "page": "contact_information",
    "sections": {
      "email": "support@northstar.com",
      "phone": "+1 (555) 123-4567",
      "address": "123 Main St, City, State 12345",
      "hours": "Monday-Friday: 9AM-6PM EST"
    }
  }
}
```

---

### Error Handling

**Common Error Responses:**

| Status | Scenario | Response |
|--------|----------|----------|
| **400** | Bad Request (invalid params) | `{ "success": false, "errors": [...] }` |
| **404** | Not Found (invalid product ID) | `{ "success": false, "message": "Product not found" }` |
| **429** | Rate Limited (contact form) | `{ "success": false, "message": "Too many requests" }` |
| **500** | Server Error | `{ "success": false, "message": "Internal server error" }` |

---

## React Component Structure

### Recommended Folder Structure

```
frontend/src/
├── components/
│   ├── common/
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── Navigation.jsx
│   │   ├── ProductCard.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Pagination.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── ShopPage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── NewArrivalsPage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── OurStoryPage.jsx
│   │   ├── ContactPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── sections/
│   │   ├── HeroSection.jsx
│   │   ├── FeaturedProducts.jsx
│   │   ├── CollectionsPreview.jsx
│   │   ├── ImageGallery.jsx
│   │   ├── ProductSpecs.jsx
│   │   ├── ContactForm.jsx
│   │   └── FilterSidebar.jsx
│   └── layout/
│       ├── MainLayout.jsx
│       └── PageLayout.jsx
├── services/
│   ├── api.js          # Axios instance
│   ├── productService.js
│   ├── searchService.js
│   ├── collectionService.js
│   └── contactService.js
├── store/
│   ├── useProductStore.js   # Zustand store
│   ├── useFilterStore.js
│   └── useSearchStore.js
├── styles/
│   ├── global.css
│   ├── variables.css
│   ├── responsive.css
│   └── components/
│       ├── ProductCard.css
│       ├── Header.css
│       └── ...
├── hooks/
│   ├── useApi.js
│   ├── usePagination.js
│   ├── useFilters.js
│   └── useDebounce.js
├── utils/
│   ├── constants.js
│   ├── formatters.js
│   └── validators.js
├── App.jsx
└── main.jsx
```

### API Service Pattern

**`services/api.js`:**
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

**`services/productService.js`:**
```javascript
import api from './api';

export const productService = {
  // Get all products
  getProducts: (params) =>
    api.get('/products', { params }),

  // Get single product
  getProduct: (id) =>
    api.get(`/products/${id}`),

  // Get collections
  getCollections: () =>
    api.get('/collections'),

  // Get collection products
  getCollectionProducts: (slug, params) =>
    api.get(`/collections/${slug}/products`, { params }),

  // Get new arrivals
  getNewArrivals: (params) =>
    api.get('/new-arrivals', { params }),

  // Search products
  searchProducts: (query, params) =>
    api.get('/search', { params: { q: query, ...params } }),

  // Get static content
  getContent: (page) =>
    api.get(`/content/${page}`),

  // Submit contact form
  submitContact: (data) =>
    api.post('/contact', data),
};
```

### State Management with Zustand

**`store/useProductStore.js`:**
```javascript
import { create } from 'zustand';

export const useProductStore = create((set) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,

  setProducts: (products) => set({ products }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
```

### Custom Hooks

**`hooks/useApi.js`:**
```javascript
import { useEffect, useState } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await apiFunction();
        setData(result.data);
      } catch (err) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};
```

**`hooks/useDebounce.js`:**
```javascript
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

---

## Integration Examples

### Example 1: Fetch Products with Filters

```javascript
import { useEffect, useState } from 'react';
import { productService } from '../services/productService';

function ShopPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    collection: 'all-products',
    sort: 'newest',
    price_min: 0,
    price_max: 500,
    availability: 'all',
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productService.getProducts(filters);
        setProducts(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="shop-page">
      <FilterSidebar onChange={handleFilterChange} />
      <ProductGrid products={products} />
      <Pagination 
        current={pagination?.page} 
        total={pagination?.total_pages}
        onChange={handlePageChange}
      />
    </div>
  );
}
```

---

### Example 2: Real-Time Search

```javascript
import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { productService } from '../services/productService';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const response = await productService.searchProducts(debouncedQuery);
        setResults(response.data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      {loading && <span>Searching...</span>}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((product) => (
            <li key={product.id}>
              <a href={`/products/${product.id}`}>{product.name}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

### Example 3: Product Detail Page

```javascript
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { productService } from '../services/productService';

function ProductDetailPage() {
  const { id } = useParams();
  
  const { data: product, loading, error } = useApi(
    () => productService.getProduct(id),
    [id]
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-detail">
      <ImageGallery images={product.images} />
      <div className="product-info">
        <h1>{product.name}</h1>
        <p className="price">${product.price}</p>
        <p className={`availability ${product.inventory_count > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.inventory_count > 0 ? 'In Stock' : 'Out of Stock'}
        </p>
        <p className="description">{product.description}</p>
        
        {product.specifications && (
          <div className="specifications">
            <h3>Specifications</h3>
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="spec-item">
                <span className="spec-label">{key}:</span>
                <span className="spec-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Example 4: Contact Form Submission

```javascript
import { useState } from 'react';
import { productService } from '../services/productService';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    consent_given: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await productService.submitContact(formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        consent_given: false,
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      {success && <div className="success-message">Thank you for contacting us!</div>}
      {error && <div className="error-message">{error}</div>}

      <input
        type="text"
        name="name"
        placeholder="Your Name"
        value={formData.name}
        onChange={handleChange}
        required
        maxLength="255"
      />

      <input
        type="email"
        name="email"
        placeholder="Your Email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <input
        type="text"
        name="subject"
        placeholder="Subject"
        value={formData.subject}
        onChange={handleChange}
        required
        maxLength="255"
      />

      <textarea
        name="message"
        placeholder="Your Message"
        value={formData.message}
        onChange={handleChange}
        required
        minLength="10"
        maxLength="5000"
      />

      <label className="consent-checkbox">
        <input
          type="checkbox"
          name="consent_given"
          checked={formData.consent_given}
          onChange={handleChange}
          required
        />
        I agree to the privacy policy and consent to contact
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

---

## Design System

### Colors

```css
/* Primary */
--color-primary: #007AFF;         /* Blue */
--color-primary-light: #E8F4FF;

/* Neutral */
--color-text-dark: #1F2937;       /* Dark gray */
--color-text-light: #6B7280;      /* Medium gray */
--color-text-muted: #9CA3AF;      /* Light gray */
--color-bg: #FFFFFF;              /* White */
--color-bg-light: #F9FAFB;        /* Off-white */

/* States */
--color-success: #10B981;         /* Green */
--color-error: #EF4444;           /* Red */
--color-warning: #F59E0B;         /* Orange */
--color-info: #3B82F6;            /* Light blue */

/* Badges */
--color-badge-new: #10B981;       /* Green */
--color-badge-out: #EF4444;       /* Red */
```

### Typography

```css
/* Font Family */
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;

/* Font Sizes */
--font-xs: 0.75rem;     /* 12px */
--font-sm: 0.875rem;    /* 14px */
--font-base: 1rem;      /* 16px */
--font-lg: 1.125rem;    /* 18px */
--font-xl: 1.25rem;     /* 20px */
--font-2xl: 1.5rem;     /* 24px */
--font-3xl: 1.875rem;   /* 30px */
--font-4xl: 2.25rem;    /* 36px */

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Spacing

```css
/* Spacing Scale (8px base) */
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### Border Radius

```css
--radius-sm: 0.25rem;    /* 4px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 1rem;       /* 16px */
--radius-full: 9999px;   /* Fully rounded */
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
--breakpoint-xs: 0px;       /* Default */
--breakpoint-sm: 640px;     /* Small phones */
--breakpoint-md: 768px;     /* Tablets */
--breakpoint-lg: 1024px;    /* Desktops */
--breakpoint-xl: 1280px;    /* Large desktops */
```

### Media Queries

```css
/* Mobile (< 768px) - DEFAULT */
.product-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Layout Patterns

**Product Grid:**
- Mobile: 1 column
- Tablet: 2-3 columns
- Desktop: 4 columns

**Navigation:**
- Mobile: Hamburger menu (drawer)
- Tablet: Hamburger + search bar
- Desktop: Full horizontal menu

**Shop Page:**
- Mobile: Filters in collapsible drawer
- Tablet: Filters above/below grid
- Desktop: Sidebar filters (30% width)

---

## Collections

### 6 Product Collections

| #  | Slug | Name | Icon | Description |
|---|------|------|------|-------------|
| 1 | all-products | All Products | 📦 | Browse all available products |
| 2 | tech-gadget | Tech & Gadget | ⚙️ | Electronics, headphones, smartwatches, chargers |
| 3 | fashion | Fashion | 👔 | Clothing, bags, accessories, shoes |
| 4 | lifestyle | Lifestyle | 🧘 | Yoga mats, water bottles, travel gear |
| 5 | home-living | Home & Living | 🏠 | Lamps, bed sheets, wall art |
| 6 | games-play | Games & Play | 🎮 | Board games, puzzles, STEM kits |

### Collection-Specific Specifications

**Tech & Gadget:**
- Driver Size
- Frequency Response
- Battery Life
- Connectivity
- Weight

**Fashion:**
- Size
- Material
- Color
- Fit
- Care Instructions

**Lifestyle:**
- Dimensions
- Weight
- Material
- Color
- Warranty

**Home & Living:**
- Dimensions
- Weight
- Material
- Color
- Assembly Required

**Games & Play:**
- Age Range
- Player Count
- Game Duration
- Box Dimensions
- Components

---

## Common Tasks

### How to Fetch Products

```javascript
// Get all products
const response = await productService.getProducts({
  page: 1,
  limit: 20,
});

// Get filtered products
const response = await productService.getProducts({
  collection: 'tech-gadget',
  sort: 'price-asc',
  price_max: 200,
  availability: 'in-stock',
  page: 1,
  limit: 20,
});
```

### How to Implement Image Gallery

```javascript
const [mainImage, setMainImage] = useState(product.images[0]);

return (
  <div className="image-gallery">
    <img src={mainImage.image_path} alt={mainImage.alt_text} />
    <div className="thumbnails">
      {product.images.map((img) => (
        <img
          key={img.id}
          src={img.image_path}
          alt={img.alt_text}
          onClick={() => setMainImage(img)}
          className={mainImage.id === img.id ? 'active' : ''}
        />
      ))}
    </div>
  </div>
);
```

### How to Implement Pagination

```javascript
const [page, setPage] = useState(1);
const limit = 20;

const handlePageChange = (newPage) => {
  setPage(newPage);
  // Re-fetch with new page
};

return (
  <div className="pagination">
    {Array.from({ length: pagination.total_pages }).map((_, i) => (
      <button
        key={i + 1}
        onClick={() => handlePageChange(i + 1)}
        className={page === i + 1 ? 'active' : ''}
      >
        {i + 1}
      </button>
    ))}
  </div>
);
```

### How to Format Price

```javascript
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

// Usage: ${formatPrice(product.price)} → $79.99
```

### How to Show Availability Badge

```javascript
function AvailabilityBadge({ inventory }) {
  const isInStock = inventory > 0;
  
  return (
    <span className={`badge ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
      {isInStock ? 'In Stock' : 'Out of Stock'}
    </span>
  );
}
```

---

## Troubleshooting

### Q: "Cannot connect to API"
**A:** Check that backend is running:
```bash
curl http://localhost:3000/health
```

If not running, start it:
```bash
cd backend
npm run dev
```

---

### Q: "CORS error"
**A:** Backend should have CORS enabled. If still getting errors, check:
1. `http://localhost:3000` is accessible
2. CORS headers are configured in backend
3. No proxy issues in dev server

---

### Q: "Search is too slow"
**A:** Check debounce delay. Default is 300ms. Adjust in `useDebounce`:
```javascript
const debouncedQuery = useDebounce(query, 500); // Increase delay
```

---

### Q: "Images not loading"
**A:** Check image paths:
1. Backend should serve images from `/images/products/`
2. Check browser console for 404 errors
3. Verify image files exist on backend

---

### Q: "Rate limit on contact form"
**A:** Max 5 submissions per IP per 24 hours. This is intentional for spam protection.

---

### Q: "Pagination not working"
**A:** Ensure `page` and `limit` query params are passed correctly:
```javascript
// Correct
GET /products?page=2&limit=20

// Wrong
GET /products?page=2  // Missing limit
```

---

## Resources

### Documentation Files
- **API-SUMMARY.md** — Quick API reference
- **design-specification.md** — Complete design specs
- **wireframes.md** — Wireframes and user flows
- **technical-specification.md** — Technical details

### Postman Collection
- **Northstar_API.postman_collection.json** — Import in Postman for testing

### OpenAPI Spec
- **backend/openapi.yaml** — View in Swagger editor

---

## Next Steps

1. ✅ **Read this guide** (10 min)
2. ✅ **Review wireframes** (`wireframes.md`)
3. ✅ **Review design specs** (`design-specification.md`)
4. ✅ **Set up React project** (5 min)
5. ✅ **Create folder structure** (5 min)
6. ✅ **Build API service layer** (30 min)
7. ✅ **Build components** (Week 2)
8. ✅ **Integrate with API** (Week 2)
9. ✅ **Test thoroughly** (Week 3)
10. ✅ **Deploy** (Week 4)

---

## Questions?

Refer to:
1. `design-specification.md` — Design questions
2. `wireframes.md` — Layout questions
3. `API-SUMMARY.md` or `technical-specification.md` — API questions
4. This guide — Integration questions

---

**Status:** ✅ Ready for Week 2 Frontend Development

**Created:** August 26, 2026  
**Last Updated:** August 26, 2026  
**Version:** 1.0

Happy coding! 🚀
