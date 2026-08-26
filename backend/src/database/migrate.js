const pool = require('../config/database');
const logger = require('../config/logger');

async function migrate() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migrations...');

    // Create collections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) UNIQUE,
        description TEXT,
        display_order INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('Created collections table');

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        inventory_count INT DEFAULT 0,
        is_new_arrival BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);
    logger.info('Created products table');

    // Create indexes on products
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products(is_new_arrival);
      CREATE INDEX IF NOT EXISTS idx_products_inventory ON products(inventory_count);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
    `);
    logger.info('Created product indexes');

    // Create product_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_path VARCHAR(500) NOT NULL,
        image_order INT NOT NULL,
        alt_text VARCHAR(255),
        file_size_bytes INT,
        file_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, image_order),
        CONSTRAINT max_images_per_product CHECK (image_order <= 5)
      );
    `);
    logger.info('Created product_images table');

    // Create product_specifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_specifications (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        spec_key VARCHAR(100) NOT NULL,
        spec_value VARCHAR(500),
        display_order INT,
        UNIQUE(product_id, spec_key)
      );
    `);
    logger.info('Created product_specifications table');

    // Create contact_submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        ip_address VARCHAR(45),
        consent_given BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        INDEX idx_contact_created ON contact_submissions(created_at),
        INDEX idx_contact_ip ON contact_submissions(ip_address),
        INDEX idx_contact_expires ON contact_submissions(expires_at)
      );
    `);
    logger.info('Created contact_submissions table');

    // Create indexes on contact_submissions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
      CREATE INDEX IF NOT EXISTS idx_contact_submissions_ip_address ON contact_submissions(ip_address);
      CREATE INDEX IF NOT EXISTS idx_contact_submissions_expires_at ON contact_submissions(expires_at);
    `);
    logger.info('Created contact_submissions indexes');

    // Create static_content table
    await client.query(`
      CREATE TABLE IF NOT EXISTS static_content (
        id SERIAL PRIMARY KEY,
        page_name VARCHAR(100) UNIQUE,
        content_key VARCHAR(100),
        content_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('Created static_content table');

    logger.info('Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
