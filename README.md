# Talabat E-Commerce Monorepo

A polished full-stack e-commerce starter built as a Node.js + Express API and Angular frontend, managed as a npm workspaces monorepo.

> This project is a generic e-commerce application with categories, subcategories, brands, products, users, and JWT-based authentication. The Talabat name is historical branding rather than a real integration.

## Highlights

- REST API backend in Express 5 with Mongoose and MongoDB
- Angular 18 single-page application for browsing and admin-style management
- JWT authentication, role-based access control, and rate limiting
- Product and user image uploads with resizing and storage handling
- Structured validation, centralized error handling, and test coverage
- Docker-ready local development stack

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express 5, Mongoose, JWT, multer, sharp |
| Frontend | Angular 18, TypeScript, RxJS |
| Database | MongoDB |
| Testing | Jest, Supertest, mongodb-memory-server |
| Dev Ops | Docker Compose, npm workspaces |

## Project Structure

```text
.
├── package.json              # Root workspace scripts and shared tooling
├── docker-compose.yml       # API + MongoDB container setup
├── server/                   # Backend application
│   ├── app.js                # App bootstrap
│   ├── server.js             # Server entrypoint
│   ├── config/               # DB and env configuration
│   ├── routes/               # API routes
│   ├── services/             # Business logic and CRUD helpers
│   ├── models/               # Mongoose schemas
│   ├── middlewares/          # Auth, validation, error handling
│   ├── utils/                # Validators, upload helpers, API helpers
│   └── tests/                # Backend test suite
└── client/                   # Angular frontend
    └── src/                  # Components, services, routes, and styles
```

## Prerequisites

Make sure you have:

- Node.js 20+ and npm 8+
- MongoDB running locally, or Docker available for the included Compose setup

## Quick Start

1. Install dependencies from the repository root:

```bash
npm install
```

2. Create the backend environment file:

```bash
cp server/.env.example server/.env
```

3. Update the values in server/.env, especially:

```env
DB_URI=mongodb://127.0.0.1:27017/talabat
JWT_SECRET=your_super_secret_key
PORT=3000
NODE_ENV=development
```

4. Start the full stack:

```bash
npm run dev
```

This starts:

- API on http://localhost:3000
- Angular app on http://localhost:4200

The frontend is configured to call the API at http://localhost:3000/api/v1.

## Useful Commands

| Command | Purpose |
|---|---|
| npm run dev | Launch both backend and frontend together |
| npm run dev:server | Run only the API in development mode |
| npm run dev:client | Run only the Angular client |
| npm run build | Build the Angular client for production |
| npm start | Start the API in production mode |
| npm run seed | Seed the database with example data |
| npm run seed:destroy | Remove seeded data |
| npm run lint | Lint the backend code |
| npm test | Run the backend test suite |

You can also target a workspace directly, for example:

```bash
npm run test:coverage --workspace server
```

## API Overview

The API is mounted under /api/v1 and supports:

- Authentication: signup, login, password reset, and verification
- Users: profile management and admin user operations
- Categories and subcategories: CRUD support with nested routes
- Brands and products: CRUD with image uploads
- Pagination, filtering, sorting, and search on list endpoints

For the detailed contract, see [server/docs/API.md](server/docs/API.md).

## Docker

A ready-made Docker setup is available for the API and MongoDB:

```bash
docker compose up --build
```

This uses the server container plus a MongoDB service and preserves uploaded files and database data via named volumes.

## Testing

The backend test suite uses Jest and mongodb-memory-server, so it can run without a live external database.

```bash
npm test
npm run test:coverage --workspace server
```

## Documentation

- API reference: [server/docs/API.md](server/docs/API.md)
- Backend architecture notes: [CLAUDE.md](CLAUDE.md)
- Project progress and hardening notes: [PROGRESS.md](PROGRESS.md)
- Frontend specifics: [client/README.md](client/README.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
