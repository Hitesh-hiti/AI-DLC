const pool = require('../config/database');
const logger = require('../config/logger');

class ProductService {
  /**
   * Get all products with filtering, sorting, and pagination
   */
  static async getProducts(filters = {}) {
    try {
      const {
        collection = 'all-products',
        sort = 'newest',
        price_min,
        price_max,
        availability = 'all',
        page = 1,
        limit = 20,
      } = filters;

      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM products WHERE is_active = TRUE';
      const params = [];

      // Filter by collection/category
      if (collection !== 'all-products') {
        const categoryMap = {
          'tech-gadget': 'tech',
          'fashion': 'fashion',
          'lifestyle': 'lifestyle',
          'home-living': 'home_living',
          'games-play': 'games_play',
        };
        const category = categoryMap[collection];
        if (category) {
          query += ` AND category = $${params.length + 1}`;
          params.push(category);
        }
      }

      // Filter by price range
      if (price_min !== undefined) {
        query += ` AND price >= $${params.length + 1}`;
        params.push(price_min);
      }
      if (price_max !== undefined) {
        query += ` AND price <= $${params.length + 1}`;
        params.push(price_max);
      }

      // Filter by availability
      if (availability === 'in-stock') {
        query += ` AND inventory_count > 0`;
      } else if (availability === 'out-of-stock') {
        query += ` AND inventory_count = 0`;
      }

      // Sort
      const sortMap = {
        newest: 'created_at DESC',
        'price-asc': 'price ASC',
        'price-desc': 'price DESC',
        popular: 'inventory_count DESC',
      };
      const orderBy = sortMap[sort] || 'created_at DESC';

      // Get total count
      const countResult = await pool.query(
        query.replace('SELECT *', 'SELECT COUNT(*) as count'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const paginatedQuery = `${query} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      const result = await pool.query(paginatedQuery, [...params, limit, offset]);

      return {
        products: result.rows,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID with full details
   */
  static async getProductById(productId) {
    try {
      const productResult = await pool.query(
        'SELECT * FROM products WHERE id = $1 AND is_active = TRUE',
        [productId]
      );

      if (productResult.rows.length === 0) {
        return null;
      }

      const product = productResult.rows[0];

      // Get images
      const imagesResult = await pool.query(
        'SELECT id, image_path, alt_text, image_order FROM product_images WHERE product_id = $1 ORDER BY image_order ASC',
        [productId]
      );

      // Get specifications
      const specsResult = await pool.query(
        'SELECT spec_key, spec_value FROM product_specifications WHERE product_id = $1 ORDER BY display_order ASC',
        [productId]
      );

      const specifications = {};
      specsResult.rows.forEach(row => {
        specifications[row.spec_key] = row.spec_value;
      });

      return {
        ...product,
        images: imagesResult.rows,
        specifications,
      };
    } catch (error) {
      logger.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  /**
   * Search products by keywords
   */
  static async searchProducts(query, filters = {}) {
    try {
      const { page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      // PostgreSQL full-text search
      const searchQuery = `
        SELECT id, name, description, price, category, inventory_count,
               ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), 
                      plainto_tsquery('english', $1)) as rank
        FROM products
        WHERE is_active = TRUE
        AND to_tsvector('english', name || ' ' || COALESCE(description, '')) 
            @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as count
        FROM products
        WHERE is_active = TRUE
        AND to_tsvector('english', name || ' ' || COALESCE(description, '')) 
            @@ plainto_tsquery('english', $1)
      `;

      const [result, countResult] = await Promise.all([
        pool.query(searchQuery, [query, limit, offset]),
        pool.query(countQuery, [query]),
      ]);

      const total = parseInt(countResult.rows[0].count);

      return {
        results: result.rows,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get new arrivals (manually curated)
   */
  static async getNewArrivals(filters = {}) {
    try {
      const { page = 1, limit = 20, sort = 'newest' } = filters;
      const offset = (page - 1) * limit;

      const sortMap = {
        newest: 'created_at DESC',
        'price-asc': 'price ASC',
        'price-desc': 'price DESC',
        popular: 'inventory_count DESC',
      };
      const orderBy = sortMap[sort] || 'created_at DESC';

      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE AND is_new_arrival = TRUE'
      );
      const total = parseInt(countResult.rows[0].count);

      const result = await pool.query(
        `SELECT * FROM products WHERE is_active = TRUE AND is_new_arrival = TRUE
         ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return {
        products: result.rows,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching new arrivals:', error);
      throw error;
    }
  }
}

module.exports = ProductService;
