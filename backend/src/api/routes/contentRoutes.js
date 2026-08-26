const express = require('express');
const router = express.Router();
const ContentController = require('../controllers/contentController');

/**
 * Static content routes
 */

// GET /api/v1/content/:page - Get static content for a page
router.get('/content/:page', ContentController.getPageContent);

module.exports = router;
