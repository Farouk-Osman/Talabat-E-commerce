const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const config = require('./config/env');
const ApiError = require('./utils/apiError');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const categoryRoute = require('./routes/categoryRoute');
const subCategoryRoute = require('./routes/subCategoryRoute');
const brandRoute = require('./routes/brandRoute');
const productRoute = require('./routes/productRoute');
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');

const app = express();

// Security headers
app.use(helmet());

// CORS. cors() handles preflight (OPTIONS) requests itself, so no separate
// app.options() route is needed — and Express 5's path-to-regexp rejects the
// bare '*' path anyway.
app.use(cors());

// Body parsers
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// Serve uploaded files
app.use(express.static('uploads'));

// NOTE: express-mongo-sanitize and hpp are incompatible with Express 5 (both
// try to reassign req.query, which is a read-only getter in v5). Removed for
// now; input sanitization is still enforced via express-validator in each route.
// For production, consider express-validator's built-in sanitizers or wait for
// Express 5-compatible versions of these packages.

// Request logging (skip noise during tests)
if (!config.isTest) {
  app.use(morgan(config.isDev ? 'dev' : 'combined'));
}

// Global rate limiter. Disabled in tests so hermetic suites can hammer the API.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', globalLimiter);

// Stricter limiter for auth endpoints (brute-force protection).
// The rate-limit test opts back in by setting a header (see tests).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.isTest && req.get('x-test-ratelimit') !== 'on',
  message: 'Too many auth attempts, please try again later.',
});

// Mount routes
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/categories/:categoryId/subcategories', subCategoryRoute);
app.use('/api/v1/subcategories', subCategoryRoute);
app.use('/api/v1/brands', brandRoute);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authLimiter, authRoute);
// Health check
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;

  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'talabat-api',
    database: dbStatus[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Unhandled routes
app.use((req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl}`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
