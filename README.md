# Talabat — MEAN Stack Monorepo

A full-stack e-commerce application: an Express + MongoDB REST API (`server/`) and an
Angular single-page frontend (`client/`), managed as a single npm-workspaces monorepo.

> Note: despite the name, this is a generic e-commerce API (categories, subcategories,
> brands, products, users, JWT auth) — not a Talabat integration.

## Repository layout

```
.
├── package.json          # workspace root — orchestrates both apps (no app code)
├── docker-compose.yml    # API + MongoDB stack
├── server/               # backend: Express 5 + Mongoose REST API
│   ├── app.js server.js
│   ├── config/ models/ routes/ services/ middlewares/ utils/ tests/
│   └── package.json      # @talabat/server
└── client/               # frontend: Angular 18 standalone-components SPA
    └── package.json      # emporium-client
```

## Prerequisites

- Node.js 20+ and npm 8+ (npm workspaces)
- A MongoDB instance for local dev, **or** Docker (see below). Tests need neither —
  they use an in-memory MongoDB.

## Setup

One install at the root wires up **both** workspaces:

```bash
npm install
```

Create the backend env file from the template:

```bash
cp server/.env.example server/.env
# then set DB_URI and JWT_SECRET
```

## Run the whole stack

```bash
npm run dev
```

This starts **both** processes together (via `concurrently`):

- **api** — the Express API on <http://localhost:3000> (nodemon, auto-reload)
- **web** — the Angular dev server on <http://localhost:4200> (auto-reload)

The frontend talks to the API at `http://localhost:3000/api/v1` (configured in
`client/src/environments/environment.ts`).

## Other root commands

| Command             | What it does                                              |
|---------------------|-----------------------------------------------------------|
| `npm run dev`       | Run API + Angular dev server together                     |
| `npm run dev:server`| Run only the API (nodemon)                                |
| `npm run dev:client`| Run only the Angular dev server                           |
| `npm run build`     | Production build of the Angular client                    |
| `npm start`         | Run the API in production mode                            |
| `npm run lint`      | Lint the backend                                          |
| `npm test`          | Run the backend's hermetic Jest suite                     |

Any workspace script can also be run directly, e.g.
`npm run test:coverage --workspace server`.

## Docker

Bring up the API + MongoDB together:

```bash
# provide a JWT secret via env or a .env next to docker-compose.yml
docker compose up --build
```

The `api` service builds from `./server`; MongoDB data and uploaded images persist in
named volumes. The Angular client is not containerized (run it with `npm run dev:client`
or serve the `npm run build` output from any static host).

## Documentation

- Backend API reference: [`server/docs/API.md`](server/docs/API.md)
- Backend architecture & conventions: [`CLAUDE.md`](CLAUDE.md)
- Hardening/refactor history: [`PROGRESS.md`](PROGRESS.md)
- Frontend details: [`client/README.md`](client/README.md)

## Testing

The backend suite is hermetic — `mongodb-memory-server` starts an in-memory MongoDB, so
no external database or `DB_URI` is required:

```bash
npm test                              # from the root
npm run test:coverage --workspace server
```

## License

MIT — see [LICENSE](./LICENSE).
