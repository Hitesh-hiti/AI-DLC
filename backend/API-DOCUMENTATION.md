# 📚 Northstar API - Complete Documentation

**Last Updated:** August 26, 2026  
**API Version:** 1.0  
**Status:** ✅ Production Ready

---

## 🎯 Quick Navigation

- **For Quick Reference:** See `/API-SUMMARY.md` (root directory)
- **For Detailed Examples:** See `API-ENDPOINTS.md` (this directory)
- **For Postman:** Import `Northstar_API.postman_collection.json`
- **For Swagger/OpenAPI:** Use `openapi.yaml`

---

## 📊 All 9 Endpoints

### Health & Status
1. **GET /health** - Server status check

### Products (4 endpoints)
2. **GET /api/v1/products** - List all products with filters/sorting
3. **GET /api/v1/products/:id** - Get product details
4. **GET /api/v1/search** - Search products
5. **GET /api/v1/new-arrivals** - Get new products

### Collections (2 endpoints)
6. **GET /api/v1/collections** - List all collections
7. **GET /api/v1/collections/:slug/products** - Get collection products

### Contact & Content (2 endpoints)
8. **POST /api/v1/contact** - Submit contact form
9. **GET /api/v1/content/:page** - Get static content

---

## 📖 Documentation Format Comparison

| Format | File | Best For | Access |
|--------|------|----------|--------|
| **Text Reference** | `API-ENDPOINTS.md` | Detailed examples, parameter docs | Read directly in IDE/browser |
| **Postman** | `Northstar_API.postman_collection.json` | Interactive testing, rapid prototyping | Import into Postman app |
| **OpenAPI/Swagger** | `openapi.yaml` | API spec, visualization, code generation | https://editor.swagger.io/ |
| **Summary** | `/API-SUMMARY.md` | Quick reference, overview | Read directly |

---

## 🚀 Start Here

### Option 1: Quick Test with Curl
```bash
# Test health
curl http://localhost:3000/health

# Get products
curl http://localhost:3000/api/v1/products?limit=5

# Search
curl "http://localhost:3000/api/v1/search?q=tech"
```

### Option 2: Use Postman
1. Download Postman from https://www.postman.com/
2. Open Postman
3. File → Import → Choose `Northstar_API.postman_collection.json`
4. Select `base_url` variable and set to `http://localhost:3000`
5. Click "Send" on any request

### Option 3: Use Swagger UI
1. Go to https://editor.swagger.io/
2. File → Import File → Select `openapi.yaml`
3. View interactive documentation
4. Try requests directly from UI

---

## 🔗 Complete Endpoint List with Curl

### 1️⃣ Health Check
```bash
curl -X GET http://localhost:3000/health

# Response:
# { "status": "OK", "timestamp": "2026-08-26T18:30:00Z" }
```

### 2️⃣ Get All Products
```bash
curl -X GET "http://localhost:3000/api/v1/products"

# With filters:
curl -X GET "http://localhost:3000/api/v1/products?collection=tech-gadget&sort=price-asc&availability=in-stock&page=1&limit=10"

# With price filter:
curl -X GET "http://localhost:3000/api/v1/products?price_min=50&price_max=200"
```

### 3️⃣ Get Product Details (with images & specs)
```bash
curl -X GET "http://localhost:3000/api/v1/products/1"
curl -X GET "http://localhost:3000/api/v1/products/5"
```

### 4️⃣ Search Products (Full-Text)
```bash
curl -X GET "http://localhost:3000/api/v1/search?q=headphones"

# With pagination:
curl -X GET "http://localhost:3000/api/v1/search?q=wireless&page=2&limit=15"

# URL encoded search:
curl -X GET "http://localhost:3000/api/v1/search?q=smart%20watch"
```

### 5️⃣ Get New Arrivals
```bash
curl -X GET "http://localhost:3000/api/v1/new-arrivals"

# Sorted by price:
curl -X GET "http://localhost:3000/api/v1/new-arrivals?sort=price-asc"

# Page 2, 10 items per page:
curl -X GET "http://localhost:3000/api/v1/new-arrivals?page=2&limit=10"
```

### 6️⃣ Get All Collections
```bash
curl -X GET "http://localhost:3000/api/v1/collections"

# Returns: All Products, Tech & Gadget, Fashion, Lifestyle, Home & Living, Games & Play
```

### 7️⃣ Get Collection-Specific Products
```bash
# Tech products:
curl -X GET "http://localhost:3000/api/v1/collections/tech-gadget/products"

# Fashion products sorted by price:
curl -X GET "http://localhost:3000/api/v1/collections/fashion/products?sort=price-desc"

# Home & Living in-stock only:
curl -X GET "http://localhost:3000/api/v1/collections/home-living/products?availability=in-stock"

# Games & Play with price filter:
curl -X GET "http://localhost:3000/api/v1/collections/games-play/products?price_min=20&price_max=60"

# Lifestyle products, page 2:
curl -X GET "http://localhost:3000/api/v1/collections/lifestyle/products?page=2&limit=20"
```

### 8️⃣ Submit Contact Form (with rate limiting)
```bash
curl -X POST "http://localhost:3000/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Product Inquiry",
    "message": "I am interested in your wireless headphones product line.",
    "consent_given": true
  }'

# Another example:
curl -X POST "http://localhost:3000/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@company.com",
    "subject": "Question about Fashion Collection",
    "message": "Do you have size XL available in the denim jeans? What is the return policy?",
    "consent_given": true
  }'

# Response (201 Created):
# { "success": true, "message": "Thank you for contacting us!", "data": { "submission_id": 1, "email": "...", "confirmation_email_sent": true } }

# Rate limit exceeded (429):
# { "success": false, "message": "Too many submission attempts. Please try again later." }
```

### 9️⃣ Get Static Content Pages
```bash
# Get Our Story:
curl -X GET "http://localhost:3000/api/v1/content/our_story"

# Get Contact Information:
curl -X GET "http://localhost:3000/api/v1/content/contact_information"

# Response includes sections like: title, mission, vision, values, email, phone, address, hours
```

---

## 📤 Response Formats

### Success Response (GET)
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Wireless Headphones Pro",
      "price": 199.99,
      "category": "tech",
      "inventory_count": 50,
      "is_new_arrival": true
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

### Success Response (POST)
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

### Error Response
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email"
    }
  ]
}
```

---

## 🎛️ Filter & Sort Options

### Collections (6 Available)
- `all-products` - All products
- `tech-gadget` - Technology & gadgets
- `fashion` - Fashion items
- `lifestyle` - Lifestyle products
- `home-living` - Home & living products
- `games-play` - Games & play products

### Sort Options
- `newest` - Newest products first
- `price-asc` - Price: low to high
- `price-desc` - Price: high to low
- `popular` - Most popular first

### Availability
- `in-stock` - Inventory count > 0
- `out-of-stock` - Inventory count = 0
- `all` - All products

### Pagination
- `page` - Page number (default 1)
- `limit` - Items per page (default 20, max 100)

---

## ⚡ Rate Limiting

Only the contact form endpoint is rate limited:

**POST /api/v1/contact**
- **Limit:** 5 submissions per IP address per 24 hours
- **Response when exceeded:** HTTP 429
- **Error message:** "Too many submission attempts. Please try again later."

All other endpoints have no rate limiting.

---

## 🔐 Data Validation

### Contact Form Required Fields
- `name` - Max 255 characters
- `email` - Valid email format
- `subject` - Max 255 characters
- `message` - Min 10, Max 5000 characters
- `consent_given` - Must be `true` (GDPR)

### Search Query
- `q` - Min 1, Max 100 characters

---

## 📍 Collections by Slug

| Slug | Name | Description |
|------|------|-------------|
| `all-products` | All Products | All available products |
| `tech-gadget` | Tech & Gadget | Wireless headphones, smart watches, speakers, chargers |
| `fashion` | Fashion | Clothing, bags, accessories, footwear |
| `lifestyle` | Lifestyle | Yoga mats, water bottles, travel backpacks |
| `home-living` | Home & Living | Desk lamps, bed sheets, wall art |
| `games-play` | Games & Play | Board games, puzzles, STEM kits |

---

## 🔄 Common Workflows

### Browse by Category
```bash
# Get Fashion products sorted by price
curl "http://localhost:3000/api/v1/collections/fashion/products?sort=price-asc&limit=20"

# Get Tech gadgets that are in-stock
curl "http://localhost:3000/api/v1/collections/tech-gadget/products?availability=in-stock"

# Get New Arrivals sorted by newest
curl "http://localhost:3000/api/v1/new-arrivals?sort=newest&page=1&limit=10"
```

### Search and Filter
```bash
# Search for "headphones" and get second page
curl "http://localhost:3000/api/v1/search?q=headphones&page=2&limit=20"

# Get products in price range $50-$200
curl "http://localhost:3000/api/v1/products?price_min=50&price_max=200"

# Get all in-stock Fashion items under $100
curl "http://localhost:3000/api/v1/collections/fashion/products?availability=in-stock&price_max=100"
```

### Get Details
```bash
# Get specific product with images and specs
curl "http://localhost:3000/api/v1/products/1"

# Get all collections available
curl "http://localhost:3000/api/v1/collections"

# Get company information
curl "http://localhost:3000/api/v1/content/our_story"
```

### Customer Interaction
```bash
# Submit contact inquiry
curl -X POST "http://localhost:3000/api/v1/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","subject":"Question","message":"Can you tell me more about your products?","consent_given":true}'

# Get contact information
curl "http://localhost:3000/api/v1/content/contact_information"
```

---

## 📁 Files Included

### This Directory (`backend/`)
- **API-ENDPOINTS.md** - Detailed endpoint reference (50+ examples)
- **API-DOCUMENTATION.md** - This file
- **Northstar_API.postman_collection.json** - Postman import file
- **openapi.yaml** - OpenAPI 3.0 specification

### Root Directory (`/`)
- **API-SUMMARY.md** - Quick API summary and reference

---

## 🧪 Testing Script

**Bash script to test all endpoints:**

Save as `test-api.sh`:

```bash
#!/bin/bash
BASE_URL="http://localhost:3000"

echo "Testing all Northstar API endpoints..."

echo -e "\n1. Health Check:"
curl "$BASE_URL/health"

echo -e "\n\n2. Get Products:"
curl "$BASE_URL/api/v1/products?limit=5"

echo -e "\n\n3. Search:"
curl "$BASE_URL/api/v1/search?q=tech"

echo -e "\n\n4. Collections:"
curl "$BASE_URL/api/v1/collections"

echo -e "\n\n5. New Arrivals:"
curl "$BASE_URL/api/v1/new-arrivals"

echo -e "\n\n✅ All tests completed!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 💡 Tips & Best Practices

1. **Start Simple** - Begin with `/health` to verify connectivity
2. **Use Postman** - Easier than curl for complex requests
3. **Check Pagination** - Always paginate for large result sets
4. **URL Encode** - Encode special characters in query parameters
5. **Error Handling** - Always check `success` field and handle errors
6. **Rate Limiting** - Remember contact form is limited to 5/IP/24h
7. **GDPR Compliance** - Always send `consent_given: true` for contact form

---

## 📞 Support

For issues or questions:
1. Check documentation in `API-ENDPOINTS.md`
2. Review error response in the API response
3. Test with Postman collection
4. Check OpenAPI spec at https://editor.swagger.io/

---

## ✅ Status

- ✅ All 9 endpoints implemented
- ✅ All endpoints tested
- ✅ All endpoints documented
- ✅ Rate limiting active
- ✅ Input validation enabled
- ✅ Error handling configured
- ✅ GDPR compliance implemented
- ✅ Production ready

**API is fully functional and ready for frontend integration! 🚀**
