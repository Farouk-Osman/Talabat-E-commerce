# Talabat Client (Angular)

Standalone-components Angular frontend for the e-commerce API.

## Prerequisites

- Node.js 18+ and npm
- The backend API running (default `http://localhost:3000`)

## Setup

```bash
cd client
npm install
```

Set the API URL in `src/environments/environment.ts` if your backend is not on
`http://localhost:3000/api/v1`.

## Run

```bash
npm start          # ng serve — dev server on http://localhost:4200
npm run build      # production build into dist/emporium-client
```

## What's here

- `core/auth.service.ts` — login/signup, token + user persistence (localStorage), reactive `isLoggedIn`/`isAdmin` signals.
- `core/auth.interceptor.ts` — attaches `Authorization: Bearer <token>` to requests.
- `core/auth.guard.ts` — `authGuard` (logged-in) and `adminGuard` (admin role) route guards.
- `core/api.service.ts` — CRUD calls; unwraps the API's `data.docs` list shape.
- `pages/` — products & categories browse, login, signup, and an admin categories CRUD page.

## CORS

The backend enables permissive CORS (`app.use(cors())`), so the dev server on
`:4200` can call the API on `:3000` directly.
