const CollectionService = require('../../services/collectionService');
const ProductService = require('../../services/productService');
const { sendSuccess, sendPaginatedSuccess, sendError } = require('../../utils/response');
const logger = require('../../config/logger');

class CollectionController {
  /**
   * GET /api/v1/collections
   * Get all collections
   */
  static async getAllCollections(req, res, next) {
    try {
      const collections = await CollectionService.getAllCollections();
      return sendSuccess(res, collections, 200, 'Collections retrieved successfully');
    } catch (error) {
      logger.error('Error in getAllCollections:', error);
      return sendError(res, error, 500, 'Failed to retrieve collections');
    }
  }

  /**
   * GET /api/v1/collections/:slug/products
   * Get products in a specific collection
   */
  static async getCollectionProducts(req, res, next) {
    try {
      const { slug } = req.params;

      // Verify collection exists
      const collection = await CollectionService.getCollectionBySlug(slug);
      if (!collection && slug !== 'all-products') {
        return sendError(res, null, 404, 'Collection not found');
      }

      // Get products for collection
      const filters = {
        ...req.query,
        collection: slug,
      };

      const { products, pagination } = await ProductService.getProducts(filters);
      return sendPaginatedSuccess(res, products, pagination, 200, 'Collection products retrieved successfully');
    } catch (error) {
      logger.error('Error in getCollectionProducts:', error);
      return sendError(res, error, 500, 'Failed to retrieve collection products');
    }
  }
}

module.exports = CollectionController;
