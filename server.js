const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const dbConnection = require('./config/database');
const ApiError = require('./utils/apiError');
const globalErrorHandler = require('./middlewares/errorMiddleware');
const categoryRoute = require('./routes/categoryRoute');
const subCategoryRoute = require('./routes/subCategoryRoute');
const brandRoute = require('./routes/brandRoute');
const productRoute = require('./routes/productRoute');
const userRoute = require('./routes/userRoute');
const authRoute = require('./routes/authRoute');

const app = express();

// Load environment variables
dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(express.static('uploads'));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
console.log(`Environment: ${process.env.NODE_ENV}`);

// Connect to database
dbConnection();

// Mount Routes
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/categories/:categoryId/subcategories', subCategoryRoute);
app.use('/api/v1/subcategories', subCategoryRoute);
app.use('/api/v1/brands', brandRoute);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);

// Unhandled routes
app.use((req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl}`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export app and server for testing
module.exports = { app, server };

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.name, err.message);
  server.close(() => {
    console.error('Server closed');
    process.exit(1);
  });
});
