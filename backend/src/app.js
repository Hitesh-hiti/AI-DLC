const express = require('express');
const cors = require('cors');
require('dotenv').config();

const requestLogger = require('./api/middleware/requestLogger');
const errorHandler = require('./api/middleware/errorHandler');

const productRoutes = require('./api/routes/productRoutes');
const contactRoutes = require('./api/routes/contactRoutes');
const contentRoutes = require('./api/routes/contentRoutes');
const collectionRoutes = require('./api/routes/collectionRoutes');

const app = express();

/**
 * Middleware
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log('--- REQUEST DEBUG ---');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  console.log('---------------------');

  next();
});

app.use(requestLogger);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * API Routes
 */
app.use('/api/v1', productRoutes);
app.use('/api/v1', contactRoutes);
app.use('/api/v1', contentRoutes);
app.use('/api/v1', collectionRoutes);

/**
 * Static files
 */
app.use('/images', express.static('public/images'));

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

/**
 * Error handler (must be last)
 */
app.use(errorHandler);

module.exports = app;
