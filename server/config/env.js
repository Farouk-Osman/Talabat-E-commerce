// Centralized, validated environment configuration.
// Loaded once at startup. Fails fast when required secrets are missing so the
// app never silently runs with an insecure fallback JWT secret.
const path = require('path');
const dotenv = require('dotenv');

// Resolve .env relative to this file (server/.env) rather than the process CWD,
// so the backend loads its env no matter where it's launched from (root
// workspace script, server/, Docker, etc.).
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const REQUIRED = ['DB_URI', 'JWT_SECRET'];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Do not start with a broken/insecure configuration.
  // eslint-disable-next-line no-console
  console.error(
    `FATAL: missing required environment variables: ${missing.join(', ')}.\n` +
      `Copy .env.example to .env and fill them in.`
  );
  process.exit(1);
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  dbUri: process.env.DB_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  uploadStorage: process.env.UPLOAD_STORAGE || 'memory',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = config;
