const logger = require('../../config/logger');
const { sendError } = require('../../utils/response');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Validation errors
  if (err.isJoi || err.details) {
    return sendError(res, err, 400, 'Validation error');
  }

  // Database errors
  if (err.code === 'ECONNREFUSED') {
    return sendError(res, err, 503, 'Database connection failed');
  }

  // Default error
  return sendError(res, err, 500, 'Internal server error');
};

module.exports = errorHandler;
