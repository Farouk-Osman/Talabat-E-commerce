# NodeJS Talabat API v1

A RESTful API built with Node.js to interact with Talabat’s integration infrastructure (orders, menus, vendor management).  
This project serves as a bridge between a local POS or vendor platform and Talabat’s backend, enabling programmatic management of orders, catalog, store status, etc.

---

## Table of Contents

- [Features](#features)  
- [Architecture & Structure](#architecture--structure)  
- [Prerequisites](#prerequisites)  
- [Installation & Setup](#installation--setup)  
- [Configuration](#configuration)  
- [Usage / Endpoints](#usage--endpoints)  
- [Middleware & Utilities](#middleware--utilities)  
- [Error Handling & Logging](#error-handling--logging)  
- [Security Considerations](#security-considerations)  
- [Testing](#testing)  
- [Contribution](#contribution)  
- [License](#license)  
- [Acknowledgements / References](#acknowledgements--references)

---

## Features

- Vendor authentication & access token issuance  
- CRUD operations for menus / catalog  
- Webhooks support (e.g. incoming orders, order status updates)  
- Order management: accept, reject, update status  
- Vendor availability toggling  
- Data validation via middlewares  
- Utility helpers (e.g. date handling, request formatting)  
- Error-handling middleware  
- Logging support  
- Modular folder structure (routes, services, models, middlewares, utils, config)  

---

## Architecture & Structure

Here is a high-level view of how the project is organized:

```
.
├── server.js                # Entry point / bootstrap
├── config/                  # Configuration files (e.g. environment, constants)
├── routes/                  # Express route definitions
├── controllers / services   # Business logic handlers
├── models/                  # Data models / schemas (e.g. for persistence or DTOs)
├── middlewares/             # Express middlewares (auth, validation, error handling)
├── utils/                   # Helper utilities (date, formatting, etc.)
├── .eslintrc, .prettierrc    # Linting / formatting rules
└── package.json             # Project metadata & dependencies
```

- **server.js**: Boots the Express application, connects necessary middleware, sets routes, and starts the HTTP server.  
- **routes**: Declares endpoints and associates them with controllers.  
- **services / controllers**: Encapsulate business logic, isolate route handlers from domain logic.  
- **models**: Represent data structures (either DB schemas or DTO definitions).  
- **middlewares**: Reusable logic such as authentication, request validation, error capturing, etc.  
- **utils**: Common helpers (e.g. formatting dates, constructing responses).  
- **config**: Stores environment-based settings (API keys, base URLs, timeouts, etc.)

This modular structure ensures concerns are separated, making the codebase easier to maintain, extend, and test.

---

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (recommended version: v14.x, v16.x, or newer)  
- **npm** (or Yarn)  
- Access credentials / integration keys from Talabat’s system (if required)  
- A development environment for local testing (you may use tools like `nodemon`)  
- HTTPS / SSL support if needed (some endpoints / webhooks may require secure endpoints)  

---

## Installation & Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Farouk-Osman/NodeJS-Talabat-api-v1.git
   cd NodeJS-Talabat-api-v1
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create your environment configuration file. You may use `.env` or `config/default.js` (depending on implementation). Example variables:

   ```
   PORT=3000
   TALABAT_API_BASE_URL=https://integration.talabat.com
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_secret
   WEBHOOK_SECRET=your_webhook_secret
   LOG_LEVEL=info
   ```

4. Run the project:

   ```bash
   npm start
   ```

   During development, you may prefer:

   ```bash
   npm run dev
   ```

5. The API should now be listening on `http://localhost:<PORT>` (e.g. `http://localhost:3000`).

---

## Configuration

The project expects configuration values to drive behavior. Typical configuration may include:

| Key | Purpose |
|---|---|
| `PORT` | HTTP port number |
| `TALABAT_API_BASE_URL` | Base URL for Talabat’s integration middleware |
| `CLIENT_ID`, `CLIENT_SECRET` | Credentials for authentication / token issuance |
| `WEBHOOK_SECRET` | Secret token / HMAC key to validate incoming webhook requests |
| `LOG_LEVEL` | Logging granularity (e.g. info, debug, warn, error) |
| `REQUEST_TIMEOUT` | Timeout for outbound HTTP requests |
| Any other keys for third‑party integrations (if used) |

Make sure your `.gitignore` excludes any config files that include secrets.

---

## Usage / Endpoints

Below is a sample list of endpoints you might expect; adapt it to your implementation.

### Authentication & Token

- `POST /auth/token` — Exchange client credentials or login payload for an access token  
- `GET /auth/refresh` — Refresh token (if supported)

### Vendor / Store

- `GET /vendor/:vendorId` — Retrieve vendor profile  
- `POST /vendor/:vendorId/availability` — Set store as open/closed  

### Catalog / Menu

- `GET /vendor/:vendorId/menu` — Fetch current menu  
- `PUT /vendor/:vendorId/menu` — Submit or update menu (items, categories)  
- `PATCH /vendor/:vendorId/menu/items/:itemId/availability` — Toggle availability of a menu item  

### Order Webhooks

These are endpoints Talabat may call to notify your system of order events:

- `POST /webhook/order-dispatch` — New incoming order  
- `POST /webhook/order-updated` — Order status changed or canceled  

### Order Management (Outgoing / Confirmations)

- `POST /vendor/:vendorId/order/:orderId/accept` — Accept an order  
- `POST /vendor/:vendorId/order/:orderId/reject` — Reject an order (with reason)  
- `POST /vendor/:vendorId/order/:orderId/status` — Update status (e.g. “ready”, “picked up”)

---

## Middleware & Utilities

- **Request Validation**: Validate request bodies & parameters (e.g., via `Joi`, `express-validator`, or custom validator).  
- **Authentication Middleware**: Ensure incoming requests have valid tokens or client credentials.  
- **Webhook Signature Validation**: For security, verify webhook origin via signature / secret.  
- **Error Middleware**: Centralized error handler to respond with friendly error format (code, message)  
- **Logging Utility**: Log request / response details, errors, etc.  
- **Helpers / Utils**: Formatting timestamps, response wrapping (e.g. `{ data: ..., error: null }`), retry logic, etc.

---

## Error Handling & Logging

- All uncaught errors should be handled by a centralized middleware that returns a JSON error response.  
- Errors should include an error code, message, and optionally details (in development only).  
- Logging should capture at least: request path, params, method, error stack, timestamps.  
- Use log levels (info, warn, error) appropriately.

---

## Security Considerations

- Never expose secrets, client credentials, or private keys.  
- Use HTTPS / SSL for all webhook and client communication.  
- Validate payload signatures (if Talabat supports that) to avoid spoofed webhooks.  
- Rate-limit incoming requests (e.g. via `express-rate-limit`) to prevent abuse.  
- Sanitize and validate all user input / path parameters.  
- Use secure headers (e.g. via `helmet`) and CORS policies if needed.

---

## Testing

- Write **unit tests** for individual service / utility modules (e.g. using Mocha, Jest).  
- Write **integration / end-to-end tests** to simulate real HTTP requests (e.g. via Supertest).  
- Optionally, mock external calls to Talabat APIs to test your routes without dependency.  
- Include test scripts in `package.json`, e.g.:

  ```json
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  }
  ```

- Aim for good code coverage, especially around error paths and edge cases.

---

## Contribution

Contributions, bug reports, and pull requests are welcome! Here’s a suggested workflow:

1. Fork the repository  
2. Create a feature branch: `git checkout -b feature/awesome-feature`  
3. Write code (with tests)  
4. Ensure all tests pass and code style is consistent  
5. Submit a Pull Request explaining your changes  

Please follow the existing code style, naming conventions, and document newly added endpoints.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgements / References

- Talabat / Delivery Hero Integration API documentation: managing menus, orders, stores, webhooks.  
- Node.js / Express best practices  
- Community resources on building REST APIs
