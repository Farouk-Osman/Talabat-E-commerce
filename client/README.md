# Talabat Client (Angular)

A polished Angular frontend for the e-commerce API, built with standalone components and a clean service-based architecture.

## Overview

This client provides a modern shopping experience with:

- user authentication and protected routes
- product and category browsing
- profile management
- admin screens for managing catalog content
- API communication through a centralized service layer

## Tech Stack

- Angular 18
- TypeScript
- RxJS
- Standalone components
- Angular Router

## Prerequisites

Make sure you have:

- Node.js 18+ and npm
- the backend API running on http://localhost:3000

## Setup

From the repository root, install the client dependencies:

```bash
cd client
npm install
```

If your backend is not running at the default location, update the API base URL in [src/environments/environment.ts](src/environments/environment.ts).

## Run the Application

```bash
npm start
```

This starts the Angular development server at:

- http://localhost:4200

To build for production:

```bash
npm run build
```

The production output is generated in the dist/emporium-client folder.

## Project Structure

```text
src/
├── app/
│   ├── core/              # auth, API service, guards, shared models
│   ├── pages/             # login, signup, products, categories, profile, admin views
│   ├── app.component.ts   # root component
│   └── app.routes.ts      # route configuration
├── environments/          # environment configuration
└── styles.css             # global styles
```

## Key Areas

- [src/app/core/auth.service.ts](src/app/core/auth.service.ts) — handles login, signup, token storage, and user state
- [src/app/core/auth.interceptor.ts](src/app/core/auth.interceptor.ts) — attaches the JWT to outgoing requests
- [src/app/core/auth.guard.ts](src/app/core/auth.guard.ts) — protects routes for authenticated and admin users
- [src/app/core/api.service.ts](src/app/core/api.service.ts) — central API communication layer
- [src/app/pages](src/app/pages) — UI pages for browsing products, managing categories, and working with user accounts

## API Communication

The frontend expects the backend API at:

```text
http://localhost:3000/api/v1
```

## CORS Notes

The backend is configured to allow cross-origin requests during development, so the Angular dev server on port 4200 can communicate with the API on port 3000 without additional setup.
