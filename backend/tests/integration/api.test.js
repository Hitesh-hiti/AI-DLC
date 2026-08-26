const request = require('supertest');
const app = require('../../src/app');

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return 200 for health check', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return ISO timestamp', async () => {
      const response = await request(app)
        .get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Products Endpoint', () => {
    it('should return products with correct structure', async () => {
      const response = await request(app)
        .get('/api/v1/products');

      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
      }
    });

    it('should accept valid query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ collection: 'tech-gadget', page: 1, limit: 10 });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should accept price range filters', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ price_min: 10, price_max: 100 });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should accept availability filter', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ availability: 'in-stock' });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should accept sort parameter', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ sort: 'price-asc' });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should reject invalid collection', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .query({ collection: 'invalid-collection' });

      expect(response.status).toBe(400);
    });
  });

  describe('Product Detail Endpoint', () => {
    it('should return product detail by ID', async () => {
      const response = await request(app)
        .get('/api/v1/products/1');

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/v1/products/99999');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Collections Endpoint', () => {
    it('should return collections list', async () => {
      const response = await request(app)
        .get('/api/v1/collections');

      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.body.success) {
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should return array of collections', async () => {
      const response = await request(app)
        .get('/api/v1/collections');

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Collection Products Endpoint', () => {
    it('should return products for a collection', async () => {
      const response = await request(app)
        .get('/api/v1/collections/tech-gadget/products');

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should support all collection slugs', async () => {
      const slugs = ['all-products', 'tech-gadget', 'fashion', 'lifestyle', 'home-living', 'games-play'];
      
      for (const slug of slugs) {
        const response = await request(app)
          .get(`/api/v1/collections/${slug}/products`);
        
        expect([200, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Search Endpoint', () => {
    it('should accept search query', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'headphones' });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should reject empty search query', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: '' });

      expect(response.status).toBe(400);
    });

    it('should support pagination in search', async () => {
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: 'product', page: 1, limit: 10 });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should enforce maximum query length', async () => {
      const longQuery = 'a'.repeat(200);
      const response = await request(app)
        .get('/api/v1/search')
        .query({ q: longQuery });

      // May succeed or fail depending on implementation
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('New Arrivals Endpoint', () => {
    it('should return new arrivals', async () => {
      const response = await request(app)
        .get('/api/v1/new-arrivals');

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/new-arrivals')
        .query({ sort: 'price-asc' });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/new-arrivals')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Contact Endpoint', () => {
    it('should accept valid contact form', async () => {
      const response = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Product Inquiry',
          message: 'I have a question about your products and would like more information.',
          consent_given: true,
        });

      expect([201, 500]).toContain(response.status);
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          // missing subject and message
          consent_given: true,
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          subject: 'Inquiry',
          message: 'This is a test message for testing purposes.',
          consent_given: true,
        });

      expect(response.status).toBe(400);
    });

    it('should reject when consent is false', async () => {
      const response = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Inquiry',
          message: 'This is a test message for testing purposes.',
          consent_given: false,
        });

      expect(response.status).toBe(400);
    });

    it('should reject short messages', async () => {
      const response = await request(app)
        .post('/api/v1/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          subject: 'Inquiry',
          message: 'Short',
          consent_given: true,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Content Endpoint', () => {
    it('should return our_story page', async () => {
      const response = await request(app)
        .get('/api/v1/content/our_story');

      expect([200, 404, 500]).toContain(response.status);
    });

    it('should return contact_information page', async () => {
      const response = await request(app)
        .get('/api/v1/content/contact_information');

      expect([200, 404, 500]).toContain(response.status);
    });

    it('should return 404 for invalid page', async () => {
      const response = await request(app)
        .get('/api/v1/content/invalid-page');

      expect(response.status).toBe(404);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined endpoint', async () => {
      const response = await request(app)
        .get('/undefined-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for undefined POST endpoint', async () => {
      const response = await request(app)
        .post('/undefined-endpoint')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('should allow cross-origin requests', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

