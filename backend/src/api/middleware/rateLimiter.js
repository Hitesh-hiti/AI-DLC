const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../../utils/constants');
const { sendError } = require('../../utils/response');

/**
 * Rate limiter for contact form endpoint
 */
const contactLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // 24 hours
  max: RATE_LIMIT_MAX, // 5 requests per windowMs per IP
  keyGenerator: (req) => {
    // Use the standard ip property which is already set by Express/proxy
    return req.ip;
  },
  handler: (req, res) => {
    return sendError(res, null, 429, 'Too many submission attempts. Please try again later.');
  },
  skip: (req) => process.env.NODE_ENV === 'test',
  // Use standardHeaders to return rate limit info in `RateLimit-*` headers
  standardHeaders: false,
  // Disable the `X-RateLimit-*` headers
  legacyHeaders: false,
});

module.exports = {
  contactLimiter,
};
