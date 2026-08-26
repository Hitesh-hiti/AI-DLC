const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiter');
const { validateRequest, contactFormSchema } = require('../../utils/validation');

/**
 * Contact routes
 */

// POST /api/v1/contact - Submit contact form (with rate limiting)
router.post('/contact', contactLimiter, validateRequest(contactFormSchema), ContactController.submitContactForm);

module.exports = router;
