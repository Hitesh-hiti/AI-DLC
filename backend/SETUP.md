# Backend Setup Guide

This guide walks through setting up the Northstar backend database and running migrations.

## Prerequisites

### Option A: Docker (Recommended for development)

1. **Install Docker Desktop**
   - Download from https://www.docker.com/products/docker-desktop
   - Run installer and restart your system

2. **Verify Installation**
   ```bash
   docker --version
   docker ps
   ```

### Option B: Local PostgreSQL

1. **Install PostgreSQL 16**
   - Download from https://www.postgresql.org/download/
   - Install with default settings (username: `postgres`, password: `postgres`)
   - Note the installation directory

2. **Verify Installation**
   ```bash
   psql --version
   psql -U postgres -c "SELECT version();"
   ```

## Setup with Docker (Recommended)

### Step 1: Start PostgreSQL Container

```bash
cd backend
docker compose up -d
```

Wait for the container to be healthy (about 10 seconds):
```bash
docker compose ps
# Check that STATUS shows "healthy"
```

### Step 2: Run Database Migrations

```bash
npm run db:migrate
```

This creates all 6 tables with proper indexes:
- `collections`
- `products`
- `product_images`
- `product_specifications`
- `contact_submissions`
- `static_content`

### Step 3: Seed Initial Data

```bash
npm run db:seed
```

This populates:
- 6 collections (All Products, Tech & Gadget, Fashion, Lifestyle, Home & Living, Games & Play)
- Static content (Our Story, Contact Info)

### Step 4: Start the Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Stopping the Container

```bash
docker compose down
# To also remove the database volume:
docker compose down -v
```

---

## Setup with Local PostgreSQL

### Step 1: Create Database

```bash
# Connect as postgres user
psql -U postgres

# In psql shell:
CREATE DATABASE northstar;
\q
```

### Step 2: Update .env

Edit `.env` and ensure these match your PostgreSQL installation:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=northstar
```

### Step 3: Run Migrations & Seed

```bash
npm run db:migrate
npm run db:seed
```

### Step 4: Start the Server

```bash
npm run dev
```

---

## Verify Setup

### Test Database Connection

```bash
npm run db:migrate
# Should output: "Database migrations completed successfully"
```

### Check Tables

```bash
psql -U postgres -d northstar -c "\dt"
# Should show 6 tables
```

### Test API

```bash
# In another terminal:
npm run dev

# In a third terminal, test endpoints:
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/collections
```

Expected response:
```json
{
  "success": true,
  "message": "Collections retrieved successfully",
  "data": [
    {"id": 1, "name": "All Products", "slug": "all-products", ...},
    ...
  ]
}
```

---

## Troubleshooting

### Docker Issues

**Problem:** `docker: command not found`
- **Solution:** Docker is not installed. Download from https://www.docker.com

**Problem:** `Cannot connect to database`
- **Solution:** Check container is running: `docker compose ps`
- Wait 10 seconds for container to start

**Problem:** Port 5432 already in use
- **Solution:** Stop other PostgreSQL instances or change `DB_PORT` in `.env`

### PostgreSQL Issues

**Problem:** `psql: error: FATAL: Ident authentication failed for user "postgres"`
- **Solution:** Update `.env` with correct credentials or check PostgreSQL password

**Problem:** `database "northstar" does not exist`
- **Solution:** Run `npm run db:migrate` to create database and tables

### Node Issues

**Problem:** `npm: command not found`
- **Solution:** Install Node.js 18+ from https://nodejs.org

**Problem:** Port 3000 already in use
- **Solution:** Stop other services or change `PORT` in `.env`

---

## Database Reset

To completely reset the database:

### With Docker
```bash
docker compose down -v
docker compose up -d
npm run db:migrate
npm run db:seed
```

### With Local PostgreSQL
```bash
psql -U postgres -c "DROP DATABASE northstar;"
psql -U postgres -c "CREATE DATABASE northstar;"
npm run db:migrate
npm run db:seed
```

---

## Next Steps

1. Start the server: `npm run dev`
2. Test endpoints: See `README.md` for API documentation
3. Create sample products via SQL or API
4. Run tests: `npm test`

For more information, see `README.md`.
