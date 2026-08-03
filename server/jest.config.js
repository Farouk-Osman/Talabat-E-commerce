// Jest configuration for hermetic tests.
// - env.setup.js runs via `setupFiles` (BEFORE any module import) so config/env.js
//   fail-fast validation sees NODE_ENV/JWT_SECRET/DB_URI already set.
// - setup.js runs via `setupFilesAfterEnv` (test framework installed) so it can use
//   beforeAll/afterEach/afterAll to spin the in-memory Mongo server.
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'middlewares/**/*.js',
    'utils/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'app.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
