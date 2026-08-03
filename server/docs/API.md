# API Reference

Base URL: `/api/v1`

All responses follow `{ status: 'success', data: ... }`. List endpoints add
`results` (count on the page) and `pagination` (`currentPage`, `limit`,
`numberOfPages`, and `next`/`prev` when applicable). List data is returned under
`data.docs`.

Auth is a Bearer JWT: `Authorization: Bearer <token>`. Admin-only routes also
require the user's `role` to be `admin`.

## Query params (list endpoints)

- `page`, `limit` — pagination (defaults: page 1, limit 10)
- `sort` — e.g. `sort=price,-createdAt`
- `fields` — projection, e.g. `fields=name,price`
- `search` — keyword match across the resource's search fields
- filtering — e.g. `price[gte]=100&price[lt]=500`

---

## Auth — `/auth`

| Method | Path | Access | Body |
|--------|------|--------|------|
| POST | `/auth/signup` | public | `name, email, password` (role is ignored — always `user`) |
| POST | `/auth/login` | public | `email, password` |
| POST | `/auth/forgotPassword` | public | `email` (dev returns `resetCode` in body) |
| POST | `/auth/verifyResetCode` | public | `resetCode` |
| PUT | `/auth/resetPassword` | public | `email, newPassword` (requires prior verify) |

Signup/login return `{ status, token, data: { user } }`.

Auth endpoints are behind a stricter rate limiter (20 req / 15 min).

---

## Users — `/users`

All routes require authentication (`protect`).

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/users/me` | any logged-in | own profile |
| PUT | `/users/updateMe` | any logged-in | `name, email, phone, profileImage` only |
| PUT | `/users/updateMyPassword` | any logged-in | `currentPassword, newPassword` → new token |
| DELETE | `/users/deleteMe` | any logged-in | soft delete (`active:false`) |
| POST | `/users` | admin | create user (`profileImage` upload) |
| GET | `/users` | admin | list |
| GET | `/users/:id` | admin | read |
| PUT | `/users/:id` | admin | update (`profileImage` upload) |
| DELETE | `/users/:id` | admin | delete |

---

## Categories — `/categories`

| Method | Path | Access |
|--------|------|--------|
| GET | `/categories` | public |
| GET | `/categories/:id` | public |
| POST | `/categories` | admin |
| PUT | `/categories/:id` | admin |
| DELETE | `/categories/:id` | admin |

Search fields: `name`.

## Subcategories — `/subcategories` (also nested under `/categories/:categoryId/subcategories`)

| Method | Path | Access |
|--------|------|--------|
| GET | `/subcategories` | public |
| GET | `/subcategories/:id` | public |
| POST | `/subcategories` | admin |
| PUT | `/subcategories/:id` | admin |
| DELETE | `/subcategories/:id` | admin |

When created via the nested route, `category` is taken from the URL param.

## Brands — `/brands`

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/brands` | public | |
| GET | `/brands/:id` | public | |
| POST | `/brands` | admin | `image` upload |
| PUT | `/brands/:id` | admin | |
| DELETE | `/brands/:id` | admin | |

## Products — `/products`

| Method | Path | Access | Notes |
|--------|------|--------|-------|
| GET | `/products` | public | |
| GET | `/products/:id` | public | |
| POST | `/products` | admin | `imageCover` + `images[]` upload |
| PUT | `/products/:id` | admin | |
| DELETE | `/products/:id` | admin | |

---

## Errors

Errors return `{ status: 'error'|'fail', message }` (full stack included in
development). Common codes: `400` validation, `401` unauthenticated, `403`
forbidden (role), `404` not found, `429` rate limited.
