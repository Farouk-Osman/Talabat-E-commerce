# Multi-stage-friendly single stage image for the Express API.
FROM node:20-alpine

# sharp needs these on some alpine setups; keep the image lean otherwise.
WORKDIR /usr/src/app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# App source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# Runtime config (DB_URI, JWT_SECRET, ...) is injected via env/compose.
CMD ["node", "server.js"]
