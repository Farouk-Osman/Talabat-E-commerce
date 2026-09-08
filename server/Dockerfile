FROM node:20-alpine

WORKDIR /usr/src/app

# Copy root workspace manifests
COPY package*.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json

# Install production dependencies for the server workspace
RUN npm ci --omit=dev --workspace server

# Copy server source
COPY server ./server

WORKDIR /usr/src/app/server

CMD ["node", "server.js"]