/**
 * Application constants
 */

const COLLECTIONS = [
  { id: 1, name: 'All Products', slug: 'all-products', display_order: 1 },
  { id: 2, name: 'Tech & Gadget', slug: 'tech-gadget', display_order: 2 },
  { id: 3, name: 'Fashion', slug: 'fashion', display_order: 3 },
  { id: 4, name: 'Lifestyle', slug: 'lifestyle', display_order: 4 },
  { id: 5, name: 'Home & Living', slug: 'home-living', display_order: 5 },
  { id: 6, name: 'Games & Play', slug: 'games-play', display_order: 6 },
];

const COLLECTION_CATEGORIES = {
  'all-products': 'all',
  'tech-gadget': 'tech',
  'fashion': 'fashion',
  'lifestyle': 'lifestyle',
  'home-living': 'home_living',
  'games-play': 'games_play',
};

const PRODUCT_CATEGORIES = [
  'tech',
  'fashion',
  'lifestyle',
  'home_living',
  'games_play',
];

const SPEC_FIELDS_BY_CATEGORY = {
  tech: ['processor', 'ram', 'storage', 'battery', 'connectivity'],
  fashion: ['size', 'material', 'color', 'fit'],
  lifestyle: ['dimensions', 'weight', 'material', 'color'],
  home_living: ['dimensions', 'weight', 'material', 'color'],
  games_play: ['age_range', 'player_count', 'duration'],
};

const STATIC_PAGES = {
  about: 'our_story',
  'contact-info': 'contact_information',
};

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 86400000; // 24 hours
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 5;

const CONTACT_RETENTION_DAYS = 365;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGES_PER_PRODUCT = 5;
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp'];

module.exports = {
  COLLECTIONS,
  COLLECTION_CATEGORIES,
  PRODUCT_CATEGORIES,
  SPEC_FIELDS_BY_CATEGORY,
  STATIC_PAGES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  CONTACT_RETENTION_DAYS,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_PRODUCT,
  ALLOWED_IMAGE_TYPES,
};
