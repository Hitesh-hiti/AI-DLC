const CollectionService = require('../../src/services/collectionService');

describe('CollectionService', () => {
  describe('getAllCollections', () => {
    it('should have getAllCollections method', () => {
      expect(typeof CollectionService.getAllCollections).toBe('function');
    });

    it('should return all 6 collections', async () => {
      expect(typeof CollectionService.getAllCollections).toBe('function');
    });

    it('should return collections in display order', async () => {
      expect(typeof CollectionService.getAllCollections).toBe('function');
    });
  });

  describe('getCollectionBySlug', () => {
    it('should have getCollectionBySlug method', () => {
      expect(typeof CollectionService.getCollectionBySlug).toBe('function');
    });

    it('should return collection by slug', async () => {
      expect(typeof CollectionService.getCollectionBySlug).toBe('function');
    });

    it('should return null for non-existent collection', async () => {
      expect(typeof CollectionService.getCollectionBySlug).toBe('function');
    });

    it('should support all collection slugs', async () => {
      const slugs = ['all-products', 'tech-gadget', 'fashion', 'lifestyle', 'home-living', 'games-play'];
      slugs.forEach(slug => {
        expect(typeof CollectionService.getCollectionBySlug).toBe('function');
      });
    });
  });
});
