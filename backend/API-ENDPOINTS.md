# Northstar API Endpoints - Complete Reference

**Base URL:** `http://localhost:3000`  
**API Version:** v1  
**Total Endpoints:** 8

---

## 📋 Quick Reference

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | GET | `/health` | Server health check |
| 2 | GET | `/api/v1/products` | List all products with filters |
| 3 | GET | `/api/v1/products/:id` | Get product details |
| 4 | GET | `/api/v1/search` | Full-text search |
| 5 | GET | `/api/v1/new-arrivals` | Get new products |
| 6 | GET | `/api/v1/collections` | List all collections |
| 7 | GET | `/api/v1/collections/:slug/products` | Get collection products |
| 8 | POST | `/api/v1/contact` | Submit contact form |
| 9 | GET | `/api/v1/content/:page` | Get static content |

---

## 1️⃣ Health Check

**Endpoint:** `GET /health`

### Description
Check if the server is running and healthy.

### Parameters
None

### Request
```bash
curl -X GET http://localhost:3000/health
```

### Response (200 OK)
```json
{
  "status": "OK",
  "timestamp": "2026-08-26T18:30:00.000Z"
}
```

---

## 2️⃣ Get All Products

**Endpoint:** `GET /api/v1/products`

### Description
List all products with optional filtering, sorting, and pagination.

### Query Parameters
| Parameter | Type | Default | Required | Options |
|-----------|------|---------|----------|---------|
| `collection` | string | `all-products` | No | `all-products`, `tech-gadget`, `fashion`, `lifestyle`, `home-living`, `games-play` |
| `sort` | string | `newest` | No | `newest`, `price-asc`, `price-desc`, `popular` |
| `price_min` | number | - | No | Any positive number |
| `price_max` | number | - | No | Any positive number |
| `availability` | string | `all` | No | `in-stock`, `out-of-stock`, `all` |
| `page` | number | 1 | No | >= 1 |
| `limit` | number | 20 | No | 1-100 |

### Examples

**Get all products (default):**
```bash
curl -X GET "http://localhost:3000/api/v1/products"
```

**Get Tech products sorted by price (ascending):**
```bash
curl -X GET "http://localhost:3000/api/v1/products?collection=tech-gadget&sort=price-asc&page=1&limit=10"
```

**Get in-stock products with price range:**
```bash
curl -X GET "http://localhost:3000/api/v1/products?price_min=20&price_max=150&availability=in-stock"
```

**Get Fashion products, sorted by newest, page 2:**
```bash
curl -X GET "http://localhost:3000/api/v1/products?collection=fashion&sort=newest&page=2&limit=20"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones Pro",
      "description": "Premium wireless headphones with active noise cancellation",
      "price": 199.99,
      "category": "tech",
      "sku": "WH-PRO-001",
      "inventory_count": 50,
      "is_new_arrival": true,
      "created_at": "2026-08-26T10:00:00Z",
      "is_active": true
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "collection",
      "message": "must be one of: all-products, tech-gadget, fashion, lifestyle, home-living, games-play"
    }
  ]
}
```

---

## 3️⃣ Get Product Details

**Endpoint:** `GET /api/v1/products/:id`

### Description
Get detailed information about a specific product including images and specifications.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Product ID |

### Examples

**Get product with ID 1:**
```bash
curl -X GET "http://localhost:3000/api/v1/products/1"
```

**Get product with ID 5:**
```bash
curl -X GET "http://localhost:3000/api/v1/products/5"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": 1,
    "name": "Wireless Headphones Pro",
    "description": "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
    "price": 199.99,
    "category": "tech",
    "sku": "WH-PRO-001",
    "inventory_count": 50,
    "is_new_arrival": true,
    "created_at": "2026-08-26T10:00:00Z",
    "is_active": true,
    "images": [
      {
        "id": 1,
        "image_path": "/images/products/1/image-1.jpg",
        "alt_text": "Front view of headphones",
        "image_order": 1
      },
      {
        "id": 2,
        "image_path": "/images/products/1/image-2.jpg",
        "alt_text": "Side view of headphones",
        "image_order": 2
      }
    ],
    "specifications": {
      "processor": "A1 Chip",
      "connectivity": "Bluetooth 5.0",
      "battery": "30 hours",
      "ram": "1GB"
    }
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Product not found"
}
```

---

## 4️⃣ Search Products

**Endpoint:** `GET /api/v1/search`

### Description
Search products using full-text search on name, description, and keywords.

### Query Parameters
| Parameter | Type | Default | Required | Max Length |
|-----------|------|---------|----------|-----------|
| `q` | string | - | **Yes** | 100 |
| `page` | number | 1 | No | >= 1 |
| `limit` | number | 20 | No | 1-100 |

### Examples

**Search for "headphones":**
```bash
curl -X GET "http://localhost:3000/api/v1/search?q=headphones"
```

**Search with pagination:**
```bash
curl -X GET "http://localhost:3000/api/v1/search?q=wireless&page=2&limit=10"
```

**Search for "smart watch":**
```bash
curl -X GET "http://localhost:3000/api/v1/search?q=smart%20watch"
```

**Search for tech products:**
```bash
curl -X GET "http://localhost:3000/api/v1/search?q=tech&page=1&limit=50"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones Pro",
      "description": "Premium wireless headphones with active noise cancellation",
      "price": 199.99,
      "category": "tech",
      "inventory_count": 50,
      "rank": 0.98
    },
    {
      "id": 3,
      "name": "Portable Speaker X",
      "description": "360-degree sound with wireless connectivity",
      "price": 89.99,
      "category": "tech",
      "inventory_count": 100,
      "rank": 0.85
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "total_pages": 2
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "q",
      "message": "search query is required"
    }
  ]
}
```

---

## 5️⃣ Get New Arrivals

**Endpoint:** `GET /api/v1/new-arrivals`

### Description
Get newly added products (manually curated via `is_new_arrival` flag).

### Query Parameters
| Parameter | Type | Default | Required | Options |
|-----------|------|---------|----------|---------|
| `sort` | string | `newest` | No | `newest`, `price-asc`, `price-desc`, `popular` |
| `page` | number | 1 | No | >= 1 |
| `limit` | number | 20 | No | 1-100 |

### Examples

**Get new arrivals (default):**
```bash
curl -X GET "http://localhost:3000/api/v1/new-arrivals"
```

**Get new arrivals sorted by price (ascending):**
```bash
curl -X GET "http://localhost:3000/api/v1/new-arrivals?sort=price-asc"
```

**Get new arrivals with pagination:**
```bash
curl -X GET "http://localhost:3000/api/v1/new-arrivals?page=1&limit=10"
```

**Get new arrivals by popularity:**
```bash
curl -X GET "http://localhost:3000/api/v1/new-arrivals?sort=popular&page=2&limit=15"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "New arrivals retrieved successfully",
  "data": [
    {
      "id": 2,
      "name": "Smart Watch Series 5",
      "description": "Advanced fitness tracking with seamless smartphone integration",
      "price": 349.99,
      "category": "tech",
      "sku": "SW-S5-001",
      "inventory_count": 35,
      "is_new_arrival": true,
      "created_at": "2026-08-25T14:30:00Z",
      "is_active": true
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

---

## 6️⃣ Get All Collections

**Endpoint:** `GET /api/v1/collections`

### Description
Get all available product collections.

### Parameters
None

### Request
```bash
curl -X GET "http://localhost:3000/api/v1/collections"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Collections retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "All Products",
      "slug": "all-products",
      "description": "Browse our All Products collection",
      "display_order": 1
    },
    {
      "id": 2,
      "name": "Tech & Gadget",
      "slug": "tech-gadget",
      "description": "Browse our Tech & Gadget collection",
      "display_order": 2
    },
    {
      "id": 3,
      "name": "Fashion",
      "slug": "fashion",
      "description": "Browse our Fashion collection",
      "display_order": 3
    },
    {
      "id": 4,
      "name": "Lifestyle",
      "slug": "lifestyle",
      "description": "Browse our Lifestyle collection",
      "display_order": 4
    },
    {
      "id": 5,
      "name": "Home & Living",
      "slug": "home-living",
      "description": "Browse our Home & Living collection",
      "display_order": 5
    },
    {
      "id": 6,
      "name": "Games & Play",
      "slug": "games-play",
      "description": "Browse our Games & Play collection",
      "display_order": 6
    }
  ]
}
```

---

## 7️⃣ Get Collection Products

**Endpoint:** `GET /api/v1/collections/:slug/products`

### Description
Get all products in a specific collection with filtering and sorting options (same as `/api/v1/products` endpoint).

### Path Parameters
| Parameter | Type | Required | Options |
|-----------|------|----------|---------|
| `slug` | string | Yes | `all-products`, `tech-gadget`, `fashion`, `lifestyle`, `home-living`, `games-play` |

### Query Parameters
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| `sort` | string | `newest` | `newest`, `price-asc`, `price-desc`, `popular` |
| `price_min` | number | - | Any positive number |
| `price_max` | number | - | Any positive number |
| `availability` | string | `all` | `in-stock`, `out-of-stock`, `all` |
| `page` | number | 1 | >= 1 |
| `limit` | number | 20 | 1-100 |

### Examples

**Get all tech products:**
```bash
curl -X GET "http://localhost:3000/api/v1/collections/tech-gadget/products"
```

**Get fashion products sorted by price (descending):**
```bash
curl -X GET "http://localhost:3000/api/v1/collections/fashion/products?sort=price-desc"
```

**Get lifestyle products with price range:**
```bash
curl -X GET "http://localhost:3000/api/v1/collections/lifestyle/products?price_min=30&price_max=100"
```

**Get home & living in-stock products, page 2:**
```bash
curl -X GET "http://localhost:3000/api/v1/collections/home-living/products?availability=in-stock&page=2&limit=15"
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Collection products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones Pro",
      "description": "Premium wireless headphones with active noise cancellation",
      "price": 199.99,
      "category": "tech",
      "sku": "WH-PRO-001",
      "inventory_count": 50,
      "is_new_arrival": true,
      "created_at": "2026-08-26T10:00:00Z",
      "is_active": true
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

---

## 8️⃣ Submit Contact Form

**Endpoint:** `POST /api/v1/contact`

### Description
Submit a contact form with name, email, subject, message, and GDPR consent. Rate limited to 5 submissions per IP per 24 hours.

### Request Headers
```
Content-Type: application/json
```

### Request Body
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `name` | string | Yes | Max 255 chars |
| `email` | string | Yes | Valid email format |
| `subject` | string | Yes | Max 255 chars |
| `message` | string | Yes | Min 10, Max 5000 chars |
| `consent_given` | boolean | Yes | Must be `true` |

### Examples

**Submit contact form:**
```bash
curl -X POST "http://localhost:3000/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Product Inquiry",
    "message": "I am interested in your wireless headphones. Can you provide more information about the battery life and warranty?",
    "consent_given": true
  }'
```

**With special characters:**
```bash
curl -X POST "http://localhost:3000/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane.smith@company.com",
    "subject": "Question about Fashion Collection",
    "message": "I would like to know if you have size XL available in the denim jeans. Also, what is the return policy?",
    "consent_given": true
  }'
```

### Response (201 Created)
```json
{
  "success": true,
  "message": "Thank you for contacting us!",
  "data": {
    "submission_id": 1,
    "email": "john@example.com",
    "confirmation_email_sent": true
  }
}
```

### Error Response - Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email"
    },
    {
      "field": "message",
      "message": "must be at least 10 characters"
    }
  ]
}
```

### Error Response - Missing Consent (400 Bad Request)
```json
{
  "success": false,
  "message": "You must consent to our privacy policy"
}
```

### Error Response - Rate Limited (429 Too Many Requests)
```json
{
  "success": false,
  "message": "Too many submission attempts. Please try again later."
}
```

---

## 9️⃣ Get Static Content

**Endpoint:** `GET /api/v1/content/:page`

### Description
Get static content pages (Our Story, Contact Information, etc.)

### Path Parameters
| Parameter | Type | Required | Options |
|-----------|------|----------|---------|
| `page` | string | Yes | `our_story`, `contact_information` |

### Examples

**Get Our Story page:**
```bash
curl -X GET "http://localhost:3000/api/v1/content/our_story"
```

**Get Contact Information page:**
```bash
curl -X GET "http://localhost:3000/api/v1/content/contact_information"
```

### Response (200 OK) - Our Story
```json
{
  "success": true,
  "message": "Content retrieved successfully",
  "data": {
    "page": "our_story",
    "sections": {
      "title": "Our Story",
      "mission": "At Northstar, we believe shopping should be simple, enjoyable, and accessible to everyone. Our mission is to bring quality products from around the world right to your fingertips.",
      "vision": "We envision a world where discovering new products is effortless, and every customer finds exactly what they need.",
      "values": "Quality, Integrity, Innovation, Customer-First"
    }
  }
}
```

### Response (200 OK) - Contact Information
```json
{
  "success": true,
  "message": "Content retrieved successfully",
  "data": {
    "page": "contact_information",
    "sections": {
      "email": "support@northstar.com",
      "phone": "+1 (555) 123-4567",
      "address": "123 Commerce Street, Silicon Valley, CA 94025",
      "hours": "Monday - Friday: 9 AM - 6 PM PST"
    }
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Page not found"
}
```

---

## 🔄 Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request (contact form) |
| 400 | Bad Request | Validation error, missing required fields |
| 404 | Not Found | Product not found, invalid endpoint |
| 429 | Too Many Requests | Rate limit exceeded (contact form) |
| 500 | Internal Server Error | Server error |

---

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Descriptive message",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error description"
    }
  ]
}
```

---

## 🔐 Rate Limiting

- **Contact Form:** 5 requests per IP address per 24 hours
- **Other endpoints:** No rate limiting
- **Response when limited:** 429 Too Many Requests

---

## 🚀 Testing All Endpoints

### Quick Test Script
```bash
#!/bin/bash

# Health check
echo "1. Health Check:"
curl -X GET http://localhost:3000/health

# Get collections
echo -e "\n2. Get Collections:"
curl -X GET http://localhost:3000/api/v1/collections

# Get products
echo -e "\n3. Get All Products:"
curl -X GET http://localhost:3000/api/v1/products

# Search
echo -e "\n4. Search Products:"
curl -X GET "http://localhost:3000/api/v1/search?q=headphones"

# New arrivals
echo -e "\n5. Get New Arrivals:"
curl -X GET http://localhost:3000/api/v1/new-arrivals

# Get Tech products
echo -e "\n6. Get Tech Products:"
curl -X GET http://localhost:3000/api/v1/collections/tech-gadget/products

# Get product details
echo -e "\n7. Get Product Details:"
curl -X GET http://localhost:3000/api/v1/products/1

# Get static content
echo -e "\n8. Get Our Story:"
curl -X GET http://localhost:3000/api/v1/content/our_story
```

Save as `test-api.sh` and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## ✅ Summary

**Total Endpoints:** 9 (including health check)
- 1 Health check
- 8 API endpoints

**Supported Methods:**
- GET: 8 endpoints
- POST: 1 endpoint

**Features:**
- ✅ Filtering (price, category, availability)
- ✅ Sorting (newest, price, popularity)
- ✅ Pagination (configurable, max 100 items per page)
- ✅ Full-text search
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ GDPR compliance (contact form)

---

For more details, see:
- `/backend/README.md` - Full backend documentation
- `/technical-specification.md` - API design spec
