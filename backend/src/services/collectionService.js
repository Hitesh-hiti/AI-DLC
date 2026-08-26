const pool = require('../config/database');
const logger = require('../config/logger');

class CollectionService {
  /**
   * Get all collections
   */
  static async getAllCollections() {
    try {
      const result = await pool.query(
        'SELECT id, name, slug, description, display_order FROM collections ORDER BY display_order ASC'
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching collections:', error);
      throw error;
    }
  }

  /**
   * Get collection by slug
   */
  static async getCollectionBySlug(slug) {
    try {
      const result = await pool.query(
        'SELECT id, name, slug, description FROM collections WHERE slug = $1',
        [slug]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error fetching collection by slug:', error);
      throw error;
    }
  }
}

module.exports = CollectionService;
