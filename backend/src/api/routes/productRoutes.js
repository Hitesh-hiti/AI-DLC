const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { validateRequest, productQuerySchema, searchQuerySchema } = require('../../utils/validation');

/**
 * Product routes
 */

// GET /api/v1/products - Get all products with filters, sorting, pagination
router.get('/products', validateRequest(productQuerySchema), ProductController.getProducts);

// GET /api/v1/products/:id - Get single product details
router.get('/products/:id', ProductController.getProductById);

// GET /api/v1/search - Search products
router.get('/search', validateRequest(searchQuerySchema), ProductController.searchProducts);

// GET /api/v1/new-arrivals - Get new arrivals
router.get('/new-arrivals', validateRequest(productQuerySchema), ProductController.getNewArrivals);

module.exports = router;
