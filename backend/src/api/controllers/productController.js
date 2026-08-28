const ProductService = require('../../services/productService');
const { sendSuccess, sendPaginatedSuccess, sendError } = require('../../utils/response');
const logger = require('../../config/logger');

class ProductController {
  /**
   * GET /api/v1/products
   * Get all products with filtering, sorting, pagination
   */
  static async getProducts(req, res, next) {
    try {
      const { product, pagination } = await ProductService.getProducts(req.query);
      return sendPaginatedSuccess(res, product, pagination, 200, 'Products retrieved successfully');
    } catch (error) {
      logger.error('Error in getProducts:', error);
      return sendError(res, error, 500, 'Failed to retrieve products');
    }
  }

  /**
   * GET /api/v1/products/:id
   * Get single product with full details
   */
  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);

      if (!product) {
        return sendError(res, null, 404, 'Product not found');
      }
      
      return sendSuccess(res, product, 200, 'Product retrieved successfully');
    } catch (error) {
      logger.error('Error in getProductById:', error);
      return sendError(res, error, 500, 'Failed to retrieve product');
    }
  }

  /**
   * GET /api/v1/search
   * Search products by keywords
   */
  static async searchProducts(req, res, next) {
    try {
      const { q, page, limit } = req.query;
      
      if (!q) {
        return sendError(res, null, 400, 'Search query is required');
      }

      const { results, pagination } = await ProductService.searchProducts(q, { page, limit });
      return sendPaginatedSuccess(res, results, pagination, 200, 'Search results retrieved successfully');
    } catch (error) {
      logger.error('Error in searchProducts:', error);
      return sendError(res, error, 500, 'Failed to search products');
    }
  }

  /**
   * GET /api/v1/new-arrivals
   * Get new arrivals (manually curated)
   */
  static async getNewArrivals(req, res, next) {
    try {
      const { products, pagination } = await ProductService.getNewArrivals(req.query);
      return sendPaginatedSuccess(res, products, pagination, 200, 'New arrivals retrieved successfully');
    } catch (error) {
      logger.error('Error in getNewArrivals:', error);
      return sendError(res, error, 500, 'Failed to retrieve new arrivals');
    }
  }
}

module.exports = ProductController;
