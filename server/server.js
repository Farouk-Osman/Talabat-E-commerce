const config = require('./config/env');
const dbConnection = require('./config/database');
const app = require('./app');

// Connect to database
dbConnection();

// Start server
const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${config.port} [${config.env}]`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', err.name, err.message);
  server.close(() => {
    // eslint-disable-next-line no-console
    console.error('Server closed');
    process.exit(1);
  });
});

module.exports = { app, server };
