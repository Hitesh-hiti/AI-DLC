const { productQuerySchema, searchQuerySchema, contactFormSchema } = require('../../src/utils/validation');

describe('Validation Schemas', () => {
  describe('productQuerySchema', () => {
    it('should validate correct product query parameters', () => {
      const data = {
        collection: 'tech-gadget',
        sort: 'price-asc',
        page: 1,
        limit: 20,
      };

      const { error } = productQuerySchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should reject invalid collection', () => {
      const data = {
        collection: 'invalid-collection',
      };

      const { error } = productQuerySchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should set default pagination values', () => {
      const data = {};
      const { value } = productQuerySchema.validate(data);
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
    });
  });

  describe('searchQuerySchema', () => {
    it('should validate correct search query', () => {
      const data = {
        q: 'wireless headphones',
        page: 1,
        limit: 20,
      };

      const { error } = searchQuerySchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should reject empty search query', () => {
      const data = {
        q: '',
      };

      const { error } = searchQuerySchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('contactFormSchema', () => {
    it('should validate correct contact form', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about products',
        message: 'I have a question about your products.',
        consent_given: true,
      };

      const { error } = contactFormSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const data = {
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Question about products',
        message: 'I have a question about your products.',
        consent_given: true,
      };

      const { error } = contactFormSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject when consent_given is false', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about products',
        message: 'I have a question about your products.',
        consent_given: false,
      };

      const { error } = contactFormSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject short message', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question about products',
        message: 'Short',
        consent_given: true,
      };

      const { error } = contactFormSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});
