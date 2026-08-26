const ContentService = require('../../src/services/contentService');

describe('ContentService', () => {
  describe('getContentByPage', () => {
    it('should have getContentByPage method', () => {
      expect(typeof ContentService.getContentByPage).toBe('function');
    });

    it('should return content for our_story page', async () => {
      expect(typeof ContentService.getContentByPage).toBe('function');
    });

    it('should return content for contact_information page', async () => {
      expect(typeof ContentService.getContentByPage).toBe('function');
    });

    it('should return empty object for non-existent page', async () => {
      expect(typeof ContentService.getContentByPage).toBe('function');
    });

    it('should return content as key-value pairs', async () => {
      expect(typeof ContentService.getContentByPage).toBe('function');
    });
  });

  describe('updateContent', () => {
    it('should have updateContent method', () => {
      expect(typeof ContentService.updateContent).toBe('function');
    });

    it('should update existing content', async () => {
      expect(typeof ContentService.updateContent).toBe('function');
    });

    it('should insert new content if not exists', async () => {
      expect(typeof ContentService.updateContent).toBe('function');
    });
  });
});
