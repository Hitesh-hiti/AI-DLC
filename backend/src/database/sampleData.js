const pool = require('../config/database');
const logger = require('../config/logger');

/**
 * Sample products for testing and development
 * Run this AFTER migrations and seed
 */
const sampleProducts = [
  // Tech & Gadget products
  {
    name: 'Wireless Headphones Pro',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    price: 199.99,
    category: 'tech',
    sku: 'WH-PRO-001',
    inventory_count: 50,
    is_new_arrival: true,
    specs: { processor: 'A1 Chip', connectivity: 'Bluetooth 5.0', battery: '30 hours' }
  },
  {
    name: 'Smart Watch Series 5',
    description: 'Advanced fitness tracking, heart rate monitoring, and seamless smartphone integration.',
    price: 349.99,
    category: 'tech',
    sku: 'SW-S5-001',
    inventory_count: 35,
    is_new_arrival: true,
    specs: { processor: 'Dual Core', ram: '1GB', battery: '18 hours', connectivity: 'LTE' }
  },
  {
    name: 'Portable Speaker X',
    description: '360-degree sound with waterproof design. Perfect for outdoor adventures.',
    price: 89.99,
    category: 'tech',
    sku: 'PS-X-001',
    inventory_count: 100,
    is_new_arrival: false,
    specs: { connectivity: 'Bluetooth 5.0', battery: '12 hours' }
  },
  {
    name: 'USB-C Fast Charger',
    description: '65W fast charging for laptops, tablets, and smartphones.',
    price: 49.99,
    category: 'tech',
    sku: 'CHARGER-65W',
    inventory_count: 200,
    is_new_arrival: false,
    specs: { wattage: '65W', ports: '2' }
  },

  // Fashion products
  {
    name: 'Casual Cotton T-Shirt',
    description: 'Comfortable 100% organic cotton t-shirt in various colors.',
    price: 24.99,
    category: 'fashion',
    sku: 'TSHIRT-COTTON',
    inventory_count: 150,
    is_new_arrival: false,
    specs: { material: 'Organic Cotton', sizes: 'XS-XXL', colors: 'Navy, White, Black' }
  },
  {
    name: 'Denim Jeans Classic',
    description: 'Timeless denim jeans with perfect fit and durability.',
    price: 79.99,
    category: 'fashion',
    sku: 'JEANS-CLASSIC',
    inventory_count: 80,
    is_new_arrival: false,
    specs: { material: 'Cotton Denim', fit: 'Regular', sizes: '28-38' }
  },
  {
    name: 'Leather Crossbody Bag',
    description: 'Stylish leather bag perfect for daily use. Adjustable shoulder strap.',
    price: 129.99,
    category: 'fashion',
    sku: 'BAG-LEATHER-CB',
    inventory_count: 45,
    is_new_arrival: true,
    specs: { material: 'Full Grain Leather', color: 'Brown', capacity: '8L' }
  },
  {
    name: 'Running Sneakers',
    description: 'Lightweight and comfortable sneakers for running and casual wear.',
    price: 99.99,
    category: 'fashion',
    sku: 'SNEAKERS-RUN',
    inventory_count: 120,
    is_new_arrival: false,
    specs: { material: 'Mesh & Synthetic', sizes: '6-13', weight: '280g' }
  },

  // Lifestyle products
  {
    name: 'Yoga Mat Premium',
    description: 'Non-slip yoga mat with carrying strap. Perfect for home or studio.',
    price: 44.99,
    category: 'lifestyle',
    sku: 'YOGA-MAT-PRE',
    inventory_count: 60,
    is_new_arrival: false,
    specs: { material: 'TPE', thickness: '6mm', dimensions: '183x61cm' }
  },
  {
    name: 'Stainless Steel Water Bottle',
    description: 'Keeps drinks hot or cold for 24 hours. BPA-free.',
    price: 34.99,
    category: 'lifestyle',
    sku: 'BOTTLE-SS-24H',
    inventory_count: 200,
    is_new_arrival: false,
    specs: { capacity: '750ml', material: 'Stainless Steel', colors: 'Silver, Black, Pink' }
  },
  {
    name: 'Travel Backpack',
    description: 'Spacious backpack with multiple compartments. TSA-friendly.',
    price: 119.99,
    category: 'lifestyle',
    sku: 'BACKPACK-TRAVEL',
    inventory_count: 75,
    is_new_arrival: true,
    specs: { capacity: '40L', material: 'Polyester', weight: '1.2kg' }
  },

  // Home & Living products
  {
    name: 'LED Desk Lamp',
    description: 'Adjustable brightness and color temperature for comfortable reading.',
    price: 59.99,
    category: 'home_living',
    sku: 'LAMP-LED-DESK',
    inventory_count: 90,
    is_new_arrival: false,
    specs: { power: '12W', brightness_levels: '5', color_temp: '3000-6500K' }
  },
  {
    name: 'Cotton Bed Sheet Set',
    description: '100% Egyptian cotton sheets. Includes 2 pillowcases.',
    price: 89.99,
    category: 'home_living',
    sku: 'SHEETS-EG-COTTON',
    inventory_count: 110,
    is_new_arrival: false,
    specs: { material: 'Egyptian Cotton', thread_count: '1000TC', sizes: 'Twin-King' }
  },
  {
    name: 'Decorative Wall Art Print',
    description: 'Modern minimalist wall art. Framed and ready to hang.',
    price: 39.99,
    category: 'home_living',
    sku: 'WALL-ART-PRINT',
    inventory_count: 200,
    is_new_arrival: true,
    specs: { material: 'Paper & Glass', dimensions: '50x70cm', frame: 'Wood' }
  },

  // Games & Play products
  {
    name: 'Board Game - Strategy Classic',
    description: 'Award-winning strategy board game for 2-4 players.',
    price: 44.99,
    category: 'games_play',
    sku: 'BOARD-GAME-STRAT',
    inventory_count: 55,
    is_new_arrival: false,
    specs: { player_count: '2-4', duration: '45-60 min', age_range: '12+' }
  },
  {
    name: 'Puzzle 1000 Pieces',
    description: 'Beautiful landscape puzzle with high-quality pieces.',
    price: 24.99,
    category: 'games_play',
    sku: 'PUZZLE-1000',
    inventory_count: 180,
    is_new_arrival: false,
    specs: { pieces: '1000', size: '68x48cm', difficulty: 'Medium' }
  },
  {
    name: 'STEM Building Kit',
    description: 'Educational building set for developing problem-solving skills.',
    price: 59.99,
    category: 'games_play',
    sku: 'STEM-KIT-JUNIOR',
    inventory_count: 70,
    is_new_arrival: true,
    specs: { pieces: '500+', age_range: '8-14', materials: 'Plastic' }
  },
];

async function insertSampleProducts() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting to insert sample products...');

    for (const product of sampleProducts) {
      // Insert product
      const productResult = await client.query(
        `INSERT INTO products (name, description, price, category, sku, inventory_count, is_new_arrival, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         ON CONFLICT (sku) DO NOTHING
         RETURNING id`,
        [
          product.name,
          product.description,
          product.price,
          product.category,
          product.sku,
          product.inventory_count,
          product.is_new_arrival,
        ]
      );

      if (productResult.rows.length === 0) {
        logger.info(`Product ${product.sku} already exists, skipping`);
        continue;
      }

      const productId = productResult.rows[0].id;

      // Insert specifications
      if (product.specs) {
        let displayOrder = 1;
        for (const [key, value] of Object.entries(product.specs)) {
          await client.query(
            `INSERT INTO product_specifications (product_id, spec_key, spec_value, display_order)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (product_id, spec_key) DO NOTHING`,
            [productId, key, value, displayOrder++]
          );
        }
      }

      logger.info(`Inserted product: ${product.name} (ID: ${productId})`);
    }

    logger.info(`Successfully inserted ${sampleProducts.length} sample products`);
    process.exit(0);
  } catch (error) {
    logger.error('Error inserting sample products:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  insertSampleProducts();
}

module.exports = { insertSampleProducts, sampleProducts };
