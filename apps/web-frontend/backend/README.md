# TravelPlatform API

A zero-dependency Node.js REST API for the existing frontend. It uses a persistent JSON database at `backend/data/db.json`, so no external database server is required for local development.

## Run

From `backend/`:

```bash
npm start
```

The API is available at `http://localhost:8080/api` and health check at `http://localhost:8080/health`.

## Production database

The JSON store is intentionally a local/demo persistence layer. For production, replace it with PostgreSQL/MySQL and add authentication, authorization, transactions, locking, and real airline/GDS/payment integrations.
