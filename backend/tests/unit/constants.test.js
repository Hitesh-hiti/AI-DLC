const {
  COLLECTIONS,
  COLLECTION_CATEGORIES,
  PRODUCT_CATEGORIES,
  SPEC_FIELDS_BY_CATEGORY,
  CONTACT_RETENTION_DAYS,
  MAX_IMAGES_PER_PRODUCT,
  ALLOWED_IMAGE_TYPES,
} = require('../../src/utils/constants');

describe('Constants', () => {
  describe('COLLECTIONS', () => {
    it('should have 6 collections', () => {
      expect(COLLECTIONS).toHaveLength(6);
    });

    it('should include all required collections', () => {
      const names = COLLECTIONS.map(c => c.name);
      expect(names).toContain('All Products');
      expect(names).toContain('Tech & Gadget');
      expect(names).toContain('Fashion');
      expect(names).toContain('Lifestyle');
      expect(names).toContain('Home & Living');
      expect(names).toContain('Games & Play');
    });

    it('should have unique slugs', () => {
      const slugs = COLLECTIONS.map(c => c.slug);
      expect(new Set(slugs).size).toBe(6);
    });

    it('should have display order', () => {
      COLLECTIONS.forEach(collection => {
        expect(collection.display_order).toBeDefined();
      });
    });
  });

  describe('COLLECTION_CATEGORIES', () => {
    it('should map slugs to categories', () => {
      expect(COLLECTION_CATEGORIES['tech-gadget']).toBe('tech');
      expect(COLLECTION_CATEGORIES['fashion']).toBe('fashion');
      expect(COLLECTION_CATEGORIES['lifestyle']).toBe('lifestyle');
      expect(COLLECTION_CATEGORIES['home-living']).toBe('home_living');
      expect(COLLECTION_CATEGORIES['games-play']).toBe('games_play');
    });
  });

  describe('PRODUCT_CATEGORIES', () => {
    it('should include all 5 categories', () => {
      expect(PRODUCT_CATEGORIES).toHaveLength(5);
      expect(PRODUCT_CATEGORIES).toContain('tech');
      expect(PRODUCT_CATEGORIES).toContain('fashion');
      expect(PRODUCT_CATEGORIES).toContain('lifestyle');
      expect(PRODUCT_CATEGORIES).toContain('home_living');
      expect(PRODUCT_CATEGORIES).toContain('games_play');
    });
  });

  describe('SPEC_FIELDS_BY_CATEGORY', () => {
    it('should define specs for each category', () => {
      expect(SPEC_FIELDS_BY_CATEGORY.tech).toBeDefined();
      expect(SPEC_FIELDS_BY_CATEGORY.fashion).toBeDefined();
      expect(SPEC_FIELDS_BY_CATEGORY.lifestyle).toBeDefined();
      expect(SPEC_FIELDS_BY_CATEGORY.home_living).toBeDefined();
      expect(SPEC_FIELDS_BY_CATEGORY.games_play).toBeDefined();
    });

    it('should have tech specs', () => {
      expect(SPEC_FIELDS_BY_CATEGORY.tech).toContain('processor');
      expect(SPEC_FIELDS_BY_CATEGORY.tech).toContain('battery');
      expect(SPEC_FIELDS_BY_CATEGORY.tech).toContain('connectivity');
    });

    it('should have fashion specs', () => {
      expect(SPEC_FIELDS_BY_CATEGORY.fashion).toContain('size');
      expect(SPEC_FIELDS_BY_CATEGORY.fashion).toContain('material');
      expect(SPEC_FIELDS_BY_CATEGORY.fashion).toContain('color');
    });
  });

  describe('Configuration Constants', () => {
    it('should set contact retention to 365 days', () => {
      expect(CONTACT_RETENTION_DAYS).toBe(365);
    });

    it('should limit to 5 images per product', () => {
      expect(MAX_IMAGES_PER_PRODUCT).toBe(5);
    });

    it('should allow specific image types', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('jpg');
      expect(ALLOWED_IMAGE_TYPES).toContain('png');
      expect(ALLOWED_IMAGE_TYPES).toContain('webp');
    });
  });
});
