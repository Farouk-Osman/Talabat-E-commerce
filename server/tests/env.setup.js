// Runs BEFORE any module is imported (jest `setupFiles`).
// config/env.js calls process.exit(1) when DB_URI or JWT_SECRET are missing, so
// these must exist before the first `require('../app')`. DB_URI is a placeholder:
// the real connection is the in-memory server started in tests/setup.js.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';
process.env.DB_URI = 'mongodb://127.0.0.1/placeholder';
