const Joi = require('joi');

/**
 * Validation schemas for API endpoints
 */

const productQuerySchema = Joi.object({
  collection: Joi.string()
    .valid('all-products', 'tech-gadget', 'fashion', 'lifestyle', 'home-living', 'games-play')
    .optional(),
  sort: Joi.string()
    .valid('newest', 'price-asc', 'price-desc', 'popular')
    .optional(),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  availability: Joi.string()
    .valid('in-stock', 'out-of-stock', 'all')
    .optional(),
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
});

const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).max(100).required(),
  page: Joi.number().min(1).optional().default(1),
  limit: Joi.number().min(1).max(100).optional().default(20),
});

const contactFormSchema = Joi.object({
  name: Joi.string().max(255).required(),
  email: Joi.string().email().required(),
  subject: Joi.string().max(255).required(),
  message: Joi.string().min(10).max(5000).required(),
  consent_given: Joi.boolean().required().valid(true),
});

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query || req.body, { abortEarly: false });
    
    if (error) {
      const messages = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details,
      });
    }
    
    // Replace req.query or req.body with validated values
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }
    
    next();
  };
};

module.exports = {
  productQuerySchema,
  searchQuerySchema,
  contactFormSchema,
  validateRequest,
};
