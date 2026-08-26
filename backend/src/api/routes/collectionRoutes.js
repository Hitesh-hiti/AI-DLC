const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/collectionController');
const { validateRequest, productQuerySchema } = require('../../utils/validation');

/**
 * Collection routes
 */

// GET /api/v1/collections - Get all collections
router.get('/collections', CollectionController.getAllCollections);

// GET /api/v1/collections/:slug/products - Get products in a collection
router.get('/collections/:slug/products', validateRequest(productQuerySchema), CollectionController.getCollectionProducts);

module.exports = router;
