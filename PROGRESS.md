# MEAN Hardening — Plan & Progress

> Working doc to resume the "harden this API into a strong MEAN stack" effort.
> Full approved plan lives at `~/.claude/plans/sleepy-growing-storm.md`.
> Last updated: 2026-08-01.

## Goal

Turn the MongoDB + Express + Node e-commerce API into a production-grade **MEAN**
stack: fix security holes + functional bugs, add password-reset/self-service,
make tests hermetic (in-memory Mongo), and add an Angular frontend.
No new domain models (no reviews/cart/orders) this round.

Each phase must leave the repo working and testable.

## Verification targets

- After Phases 1–5: `npm run lint` and `npm test` (hermetic) must be green.
- After Phase 6: tests run with **no** live `DB_URI`.
- After Phase 8: `ng build` in `client/` succeeds.

---

## Status at a glance

| Phase | Title | Status |
|------|-------|--------|
| 1 | App/server split + config hardening | ✅ Done |
| 2 | Security middleware | ✅ Done (deps installed & wired) |
| 3 | Auth & access-control lockdown | ✅ Done |
| 4 | Password reset flow | ✅ Done |
| 5 | Functional bug fixes | ✅ Done |
| 6 | Hermetic tests + coverage | ✅ Done (17 tests green) |
| 7 | Tooling / DX | ✅ Done (Docker, CI, docs) |
| 8 | Angular frontend | ✅ Done (`ng build` passes) |
| 9 | Monorepo restructure (server/ + client/) | ✅ Done (verified) |

**✅ VERIFIED (2026-08-01):** `npm run lint` clean, `npm test` → 17 passed / 7 suites,
`ng build` in `client/` succeeds (output `client/dist/emporium-client`). All three
verification targets met.

### Phase 9 — Monorepo restructure
Separate frontend/backend and add a single runner for both.
- Backend moved from repo root into `server/` (all requires are relative, so imports
  are unaffected). `config/env.js` now resolves `.env` via `__dirname` (CWD-independent).
- Root `package.json` is a private npm-workspaces orchestrator (`workspaces:
  ["server", "client"]`) with `concurrently` as the only new dependency.
- `npm run dev` boots the API (nodemon) and Angular dev server (ng serve) together.
  Root `build`/`start`/`lint`/`test` delegate to the appropriate workspace.
- `docker-compose.yml` `api.build` retargeted to `./server`; CI `npm ci` at root
  installs both workspaces, then lint → test → build client.
- README rewritten for the monorepo; backend `docs/API.md` moved to `server/docs/`.

### Verify (run these)

```bash
npm run lint                       # eslint . — expect 0 errors
npm test                          # jest hermetic (mongodb-memory-server) — all green
```

```bash
# Angular client — run in a SEPARATE step (PowerShell has no && operator):
cd client
npm install                        # do NOT run `npm audit fix --force` — see note
npm run build                      # Angular prod build → dist/emporium-client
```

Note: `mongodb-memory-server` downloads a Mongo binary on first `npm test` run;
if there's no network/cache it may hang — report if so.

**Do not run `npm audit fix --force` in `client/`.** The flagged CVEs are all in
the dev toolchain (webpack-dev-server, the CLI's MCP SDK) and never ship to users;
`--force` cross-upgrades Angular packages to incompatible majors and breaks the
build. If a prior `--force` mangled `client/node_modules`, delete it and
`client/package-lock.json`, then re-run `npm install`.

### Fixes applied after first verification run
- `app.js`: removed `app.options('*', cors())` — Express 5's path-to-regexp v8
  rejects the bare `'*'` path (was crashing every test suite at import). `cors()`
  already handles preflight, so the line was redundant.
- `.eslintrc`: disabled `node/no-unpublished-require` for `tests/**` — `supertest`
  and `mongodb-memory-server` are legit devDependencies.
- `client/package.json`: pinned to a self-consistent Angular 18 set and dropped
  unused `@angular/animations` + `@angular/platform-browser-dynamic` (a stray
  `npm audit fix --force` had left a mismatched 18/20/22 tree that can't build).

### Fixes applied after second run (all routes returned 500)
- `middlewares/errorMiddleware.js`: added the 4th `next` param. Express only
  registers a middleware as an error handler when its arity is exactly 4 — with 3
  params, every thrown `ApiError` (401/403/404) fell through to Express's default
  handler and surfaced as 500.
- `app.js`: **removed `express-mongo-sanitize` and `hpp`.** Both reassign
  `req.query`, which is a read-only getter in Express 5, so they threw on *every*
  request (even public GETs → 500). See KNOWN GAP below.

### ⚠️ KNOWN GAP — NoSQL-injection / param-pollution sanitization
Removing `express-mongo-sanitize` + `hpp` restores Express 5 compatibility but
drops that layer of defense. Mitigations still in place: `express-validator`
per route, Mongoose schema casting. **Follow-up:** replace with Express 5-safe
sanitization (mutate `req.query` in place rather than reassigning, or use
`express-validator`'s sanitizers / a custom middleware). Tracked, not yet done.

---

## What's done (details)

### Phase 1 — App/server split + config hardening ✅
- `app.js` builds & exports the Express `app` (no `listen`, no DB connect) — enables hermetic tests.
- `server.js` loads config, connects DB, `app.listen`, unhandledRejection handler. Exports `{ app, server }`.
- `config/env.js` — centralized, **fail-fast** config: `process.exit(1)` if `DB_URI` or `JWT_SECRET` missing. Exposes `isTest`/`isDev`/`isProd`.
- `config/database.js` — connects via `config.dbUri`.
- Removed insecure `'your_secret_key'` JWT fallback (security fix — **do not reintroduce**).
- `.env.example` present.

### Phase 2 — Security middleware ✅
Wired in `app.js` in correct order: `helmet`, `cors` (+ `app.options('*', cors())`),
`express.json`/`urlencoded` (20kb limit), `express.static('uploads')`,
`express-mongo-sanitize`, `hpp`, `morgan` (skipped in test).
- Global rate limiter on `/api` (max 300 / 15min) — `skip` when `config.isTest`.
- Stricter `authLimiter` on `/api/v1/auth` (max 20 / 15min) — skipped in test unless request sends header `x-test-ratelimit: on`.
- Deps added to `package.json` and installed: `helmet`, `cors`, `express-mongo-sanitize`, `hpp`, `express-rate-limit`; devDep `mongodb-memory-server`.

### Phase 3 — Auth & access-control lockdown ✅
- `authService.signup` never reads `role` from body (forces `user`).
- `routes/userRoute.js`: `router.use(protect)`, self-service routes declared **before** `/:id`, then `router.use(restrictTo('admin'))` gates admin CRUD.
- Self-service in `services/userService.js`: `getMe`, `updateMe` (whitelists name/email/phone + profileImage; rejects password/role), `updateMyPassword` (verifies current, re-issues token), `deleteMe` (soft delete `active:false`).
- `utils/validators/userValidator.js` — create/getById/update/delete + updateMe/updateMyPassword validators.

### Phase 4 — Password reset flow ✅
- `models/userModel.js`: `passwordChangedAt`, `passwordResetCode`, `passwordResetExpires`, `passwordResetVerified`.
- `services/authService.js`: `forgotPassword` (SHA-256 hashed 6-digit code, 10-min expiry, `save({validateBeforeSave:false})`, logs/returns code in non-prod), `verifyResetCode`, `resetPassword` (checks `passwordResetVerified`).
- `routes/authRoute.js` wires signup/login/forgotPassword/verifyResetCode/resetPassword with `utils/validators/authValidator.js`.
- No SMTP: reset code logged/returned in dev, structured for drop-in nodemailer.

### Phase 5 — Functional bug fixes ✅
- `utils/apiFeatures.js`: `paginate(countDocuments)` computes real page count / next / prev; generic `search(searchFields)` builds `$or` regex; added `'search'` to filter excludeFields.
- `services/handlersFactory.js` `getAll`: counts filtered+searched docs, then paginates.
- `services/categoryService.js` migrated to `handlersFactory` (`searchFields:['name']`) — list shape now unified to `data` like other endpoints.
- Slug generation moved to `pre('save')` + `pre('findOneAndUpdate')` hooks on category/subCategory/brand/product models.
- Schema fixes: `min_length`/`max_length` → `minlength`/`maxlength`; fixed misleading brand messages; slug `index:true`.
- `routes/categoryRoute.js` + `routes/subCategoryRoute.js`: write routes now `protect, restrictTo('admin')`.
- `searchFields` added to brand/product/subCategory service options.

---

## What's left (do next, in order)

### Phase 6 — Hermetic tests + coverage ✅ (written; verify with `npm test`)
Files created/updated:
- `jest.config.js` — node env, `setupFiles:[tests/env.setup.js]`, `setupFilesAfterEnv:[tests/setup.js]`, `testTimeout:30000`, coverage config.
- `tests/env.setup.js` — sets `NODE_ENV/JWT_SECRET/JWT_EXPIRES_IN/DB_URI` before any import (so `config/env.js` fail-fast passes).
- `tests/setup.js` — `MongoMemoryServer` start in `beforeAll`, clear collections `afterEach`, disconnect + stop `afterAll`.
- `tests/auth-protect.test.js` + `tests/upload.test.js` — rewritten to import `../app` (not `../server`); dropped own DB/`server.close` handling; create admin per-test (collections cleared between tests).
- New tests: `signup-role.test.js` (role escalation blocked), `rate-limit.test.js` (authLimiter → 429 with `x-test-ratelimit: on`), `password-reset.test.js` (forgot→verify→reset happy path + unverified-rejected), `pagination.test.js` (numberOfPages / results / next / prev), `user-route-protection.test.js` (401 unauth, 403 non-admin, 200 self /me + admin list).
- `.eslintrc` — added `overrides` enabling `jest` env for `tests/**` + `jest.config.js`.

### Phase 7 — Tooling / DX ✅
- ✅ `package.json`: added `test:watch`, `test:coverage`.
- ✅ `Dockerfile` (node:20-alpine, `npm ci --omit=dev`, `CMD node server.js`), `.dockerignore`.
- ✅ `docker-compose.yml`: `mongo` (mongo:7 + healthcheck) + `api` (depends_on mongo healthy, `UPLOAD_STORAGE=disk`, uploads volume). `JWT_SECRET` from env with fallback default.

**Docker build fixed & verified end-to-end (2026-08-02).** The Phase-7 Docker files
were authored but had never actually built. After the Phase-9 monorepo restructure,
the only `package-lock.json` lived at the repo **root** (npm workspaces), but
`server/Dockerfile` builds with context `./server` and runs `npm ci --omit=dev` —
which requires a lockfile *in its build context*. `docker compose build api` failed
at that step.
- **Fix:** generated a standalone `server/package-lock.json` (in an isolated temp dir,
  so npm didn't just rewrite the root workspace lockfile) and committed it under
  `server/`. Kept `npm ci` for reproducible installs.
- **Verified:** `docker compose build api` succeeds; `docker compose up -d` →
  mongo healthy + api up; `GET /api/v1/categories` → 200 unified list shape;
  `POST /api/v1/auth/signup` → 201, user persisted to Mongo, JWT issued, `role`
  correctly forced to `user`. `docker compose down` clean.
- ✅ `docs/API.md` — full endpoint reference (envelope, list shape, auth, users self-service + admin CRUD, categories/subcategories/brands/products, query params).
- ✅ `.github/workflows/ci.yml`: Node 20 → `npm ci` → `npm run lint` → `npm test` (hermetic, no Mongo service container needed).

### Phase 8 — Angular frontend (true MEAN) ✅
Hand-authored Angular 18 standalone-components client in `client/` (sandbox has no
Angular CLI/network, so scaffolded by hand rather than `ng new`):
- Config: `package.json`, `angular.json` (application builder → `dist/emporium-client`), `tsconfig*.json` (strict + strictTemplates), `index.html`, `styles.css`, `environments/environment.ts`.
- `main.ts` — `bootstrapApplication` with `provideRouter` + `provideHttpClient(withInterceptors([authInterceptor]))`.
- `core/`: `models.ts`, `auth.service.ts` (signals + localStorage), `auth.interceptor.ts` (Bearer), `auth.guard.ts` (`authGuard`/`adminGuard`), `api.service.ts` (unwraps `data.docs`).
- `pages/`: products, categories, login, signup, admin (categories CRUD, gated by `adminGuard`).
- `app.component.ts` (nav w/ conditional Admin link), `app.routes.ts` (lazy `loadComponent`).
- `client/README.md` run instructions; `client/.gitignore`; root `.gitignore` ignores `client/{node_modules,dist,.angular}`.

---

## Standing constraints / decisions
- **Never reintroduce** the `'your_secret_key'` JWT fallback (deliberate security fix).
- Don't echo secret values; flag files likely to contain secrets.
- Commit only when the user explicitly asks; push to new branches only.
- Migrating `categoryService` to the factory changed its list response shape to the unified `data` — deliberate; Angular consumes the unified shape.
- No mailer wired: reset code logged in dev, structured for drop-in nodemailer.
- Bash classifier has been intermittently unavailable — retry `npm run lint` / `npm test` when it recovers.
