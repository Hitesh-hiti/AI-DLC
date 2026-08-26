# Northstar E-commerce Backend API

Node.js/Express REST API for the Northstar e-commerce platform.

## Setup

### Prerequisites
- Node.js 18+ LTS
- Docker & Docker Compose
- PostgreSQL 16

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Database Setup

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Run migrations
npm run db:migrate

# Seed initial data (collections, static content)
npm run db:seed
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Test
npm test

# Test with coverage
npm run test:coverage
```

Server runs on `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/v1/products` - Get all products (with filters, sorting, pagination)
- `GET /api/v1/products/:id` - Get single product details
- `GET /api/v1/new-arrivals` - Get new arrivals
- `GET /api/v1/search?q=query` - Search products

### Collections
- `GET /api/v1/collections` - Get all collections
- `GET /api/v1/collections/:slug/products` - Get products in a collection

### Contact
- `POST /api/v1/contact` - Submit contact form (with rate limiting: 5/IP/day)

### Static Content
- `GET /api/v1/content/:page` - Get static content (our_story, contact_information)

### Health
- `GET /health` - Health check

## Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Express middleware
│   │   └── routes/            # Route definitions
│   ├── config/                # Configuration files
│   ├── database/              # Database setup & seeding
│   ├── services/              # Business logic
│   ├── utils/                 # Helper utilities
│   ├── app.js                 # Express app setup
│   └── index.js               # Server entry point
├── tests/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── public/                    # Static files
│   └── images/products/       # Product images
├── docker-compose.yml         # Docker Compose config
├── jest.config.js             # Jest test config
└── package.json               # Dependencies & scripts
```

## Configuration

See `.env` file for configuration options:
- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database config
- `SENDGRID_API_KEY` - SendGrid API key for email
- `CONTACT_EMAIL` - Contact form recipient email
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window (default: 24 hours)
- `RATE_LIMIT_MAX` - Max requests per window (default: 5)

## Database Schema

### Tables
- `products` - Product catalog
- `product_images` - Product images (max 5 per product)
- `product_specifications` - Optional product specs
- `collections` - Product collections
- `contact_submissions` - Contact form submissions (1-year retention)
- `static_content` - Static pages (Our Story, Contact Info)

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## API Response Format

All endpoints return JSON with this structure:

```json
{
  "success": true/false,
  "message": "Description",
  "data": {},
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

## Error Handling

- `400` - Bad Request (validation error)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Email Service

Contact form submissions automatically send:
1. Admin notification to `support@northstar.com`
2. Confirmation email to customer

Supports SendGrid or local SMTP.

## Development Notes

- All database queries use parameterized statements (SQL injection safe)
- Input validation via Joi schema
- Rate limiting per IP address for contact form
- Logging via Winston
- Full-text search via PostgreSQL

## Deployment

See `docker-compose.yml` for Docker setup. For production deployment:

```bash
docker-compose -f docker-compose.yml up -d
```

Production should use:
- Environment variables for secrets
- SSL/TLS termination (via Nginx proxy)
- Monitoring & logging aggregation
- Database backups
