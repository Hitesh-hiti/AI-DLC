const pool = require('../config/database');
const logger = require('../config/logger');
const { COLLECTIONS, STATIC_PAGES } = require('../utils/constants');

async function seed() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database seeding...');

    // Seed collections
    for (const collection of COLLECTIONS) {
      await client.query(
        `INSERT INTO collections (name, slug, description, display_order) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [
          collection.name,
          collection.slug,
          `Browse our ${collection.name.toLowerCase()} collection`,
          collection.display_order,
        ]
      );
    }
    logger.info(`Seeded ${COLLECTIONS.length} collections`);

    // Seed static content
    const staticContent = [
      {
        page_name: 'our_story',
        content_key: 'title',
        content_value: 'Our Story',
      },
      {
        page_name: 'our_story',
        content_key: 'mission',
        content_value: 'At Northstar, we believe shopping should be simple, enjoyable, and accessible to everyone. Our mission is to bring quality products from around the world right to your fingertips.',
      },
      {
        page_name: 'our_story',
        content_key: 'vision',
        content_value: 'We envision a world where discovering new products is effortless, and every customer finds exactly what they need.',
      },
      {
        page_name: 'our_story',
        content_key: 'values',
        content_value: 'Quality, Integrity, Innovation, Customer-First',
      },
      {
        page_name: 'contact_information',
        content_key: 'email',
        content_value: 'support@northstar.com',
      },
      {
        page_name: 'contact_information',
        content_key: 'phone',
        content_value: '+1 (555) 123-4567',
      },
      {
        page_name: 'contact_information',
        content_key: 'address',
        content_value: '123 Commerce Street, Silicon Valley, CA 94025',
      },
      {
        page_name: 'contact_information',
        content_key: 'hours',
        content_value: 'Monday - Friday: 9 AM - 6 PM PST',
      },
    ];

    for (const content of staticContent) {
      await client.query(
        `INSERT INTO static_content (page_name, content_key, content_value) 
         VALUES ($1, $2, $3)
         ON CONFLICT (page_name, content_key) DO UPDATE 
         SET content_value = EXCLUDED.content_value`,
        [content.page_name, content.content_key, content.content_value]
      );
    }
    logger.info(`Seeded ${staticContent.length} static content entries`);

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
