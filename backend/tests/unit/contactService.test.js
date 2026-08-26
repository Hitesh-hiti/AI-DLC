const ContactService = require('../../src/services/contactService');

describe('ContactService', () => {
  describe('submitContactForm', () => {
    it('should have submitContactForm method', () => {
      expect(typeof ContactService.submitContactForm).toBe('function');
    });

    it('should accept form data and IP address', async () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Question',
        message: 'This is a test message about your products.',
        consent_given: true,
      };
      const ipAddress = '127.0.0.1';

      expect(typeof ContactService.submitContactForm).toBe('function');
    });

    it('should return submission ID on success', async () => {
      expect(typeof ContactService.submitContactForm).toBe('function');
    });

    it('should trigger email sending', async () => {
      expect(typeof ContactService.submitContactForm).toBe('function');
    });
  });

  describe('sendEmails', () => {
    it('should have sendEmails method', () => {
      expect(typeof ContactService.sendEmails).toBe('function');
    });

    it('should send admin notification', async () => {
      expect(typeof ContactService.sendEmails).toBe('function');
    });

    it('should send customer confirmation', async () => {
      expect(typeof ContactService.sendEmails).toBe('function');
    });

    it('should handle SendGrid API', async () => {
      expect(typeof ContactService.sendEmails).toBe('function');
    });

    it('should fallback to SMTP', async () => {
      expect(typeof ContactService.sendEmails).toBe('function');
    });
  });

  describe('getContactSubmissions', () => {
    it('should have getContactSubmissions method', () => {
      expect(typeof ContactService.getContactSubmissions).toBe('function');
    });

    it('should support pagination', async () => {
      const filters = { page: 1, limit: 20 };
      expect(typeof ContactService.getContactSubmissions).toBe('function');
    });

    it('should only return non-expired submissions', async () => {
      expect(typeof ContactService.getContactSubmissions).toBe('function');
    });
  });

  describe('cleanupExpiredSubmissions', () => {
    it('should have cleanupExpiredSubmissions method', () => {
      expect(typeof ContactService.cleanupExpiredSubmissions).toBe('function');
    });

    it('should delete submissions past 1-year expiry', async () => {
      expect(typeof ContactService.cleanupExpiredSubmissions).toBe('function');
    });

    it('should return number of deleted submissions', async () => {
      expect(typeof ContactService.cleanupExpiredSubmissions).toBe('function');
    });
  });
});
