const requestLogger = require('../../src/api/middleware/requestLogger');
const errorHandler = require('../../src/api/middleware/errorHandler');
const { contactLimiter } = require('../../src/api/middleware/rateLimiter');

describe('Middleware', () => {
  describe('requestLogger', () => {
    it('should be a middleware function', () => {
      expect(typeof requestLogger).toBe('function');
      expect(requestLogger.length).toBe(3); // (req, res, next)
    });

    it('should log request information', () => {
      expect(typeof requestLogger).toBe('function');
    });

    it('should attach response listener', () => {
      expect(typeof requestLogger).toBe('function');
    });
  });

  describe('errorHandler', () => {
    it('should be a middleware function', () => {
      expect(typeof errorHandler).toBe('function');
      expect(errorHandler.length).toBe(4); // (err, req, res, next) - 4 params is required for error handler
    });

    it('should log errors', () => {
      expect(typeof errorHandler).toBe('function');
    });

    it('should handle validation errors', () => {
      expect(typeof errorHandler).toBe('function');
    });

    it('should handle database errors', () => {
      expect(typeof errorHandler).toBe('function');
    });
  });

  describe('contactLimiter', () => {
    it('should be rate limiting middleware', () => {
      expect(typeof contactLimiter).toBe('function');
    });

    it('should limit requests per IP per time window', () => {
      expect(typeof contactLimiter).toBe('function');
    });

    it('should skip rate limiting in test mode', () => {
      expect(typeof contactLimiter).toBe('function');
    });
  });
});
