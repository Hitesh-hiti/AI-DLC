const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../../utils/constants');
const { sendError } = require('../../utils/response');

/**
 * Rate limiter for contact form endpoint
 */
const contactLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // 24 hours
  max: RATE_LIMIT_MAX, // 5 requests per windowMs per IP
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => {
    return sendError(res, null, 429, 'Too many submission attempts. Please try again later.');
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = {
  contactLimiter,
};
