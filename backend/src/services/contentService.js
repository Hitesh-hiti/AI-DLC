const pool = require('../config/database');
const logger = require('../config/logger');

class ContentService {
  /**
   * Get static content by page name
   */
  static async getContentByPage(pageName) {
    try {
      const result = await pool.query(
        'SELECT content_key, content_value FROM static_content WHERE page_name = $1 ORDER BY content_key ASC',
        [pageName]
      );

      // Convert rows to key-value object
      const content = {};
      result.rows.forEach(row => {
        content[row.content_key] = row.content_value;
      });

      return content;
    } catch (error) {
      logger.error('Error fetching static content:', error);
      throw error;
    }
  }

  /**
   * Update static content
   */
  static async updateContent(pageName, contentKey, contentValue) {
    try {
      const result = await pool.query(
        `INSERT INTO static_content (page_name, content_key, content_value, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (page_name, content_key) 
         DO UPDATE SET content_value = EXCLUDED.content_value, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [pageName, contentKey, contentValue]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error updating static content:', error);
      throw error;
    }
  }
}

module.exports = ContentService;
