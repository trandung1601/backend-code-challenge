# Problem 5 — Book CRUD API (Express + TypeScript + Prisma/SQLite)  <!-- omit in toc -->

A small REST API to manage **Books** with full CRUD, filtering, pagination, sorting,
input validation and centralized error handling. Built with **ExpressJS + TypeScript**,
persisted in **SQLite** through **Prisma ORM**.

> **Why SQLite?** It's a file-based database — no server, no Docker, no external setup.
> After install, setup is explicit and reproducible with one command.

## Table of Contents  <!-- omit in toc -->

- [Requirements](#requirements)
- [Configuration](#configuration)
- [Run the application](#run-the-application)
	- [Optional: load sample data](#optional-load-sample-data)
	- [Production build](#production-build)
	- [Run tests](#run-tests)
- [Interactive API docs (Swagger)](#interactive-api-docs-swagger)
- [Data model](#data-model)
- [API reference](#api-reference)
	- [1. Create — `POST /api/books`](#1-create--post-apibooks)
	- [2. List with filters — `GET /api/books`](#2-list-with-filters--get-apibooks)
	- [3. Get one — `GET /api/books/:id`](#3-get-one--get-apibooksid)
	- [4. Update — `PATCH /api/books/:id`](#4-update--patch-apibooksid)
	- [5. Delete — `DELETE /api/books/:id`](#5-delete--delete-apibooksid)
- [Project structure](#project-structure)

---

## Requirements

- **Node.js >= 20** (developed on Node 24)
- npm

That's it. No database server to install.

---

## Configuration

Copy the example env file and adjust if needed:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

| Variable       | Default          | Description                                    |
| -------------- | ---------------- | ---------------------------------------------- |
| `PORT`         | `3001`           | HTTP port the server listens on                |
| `NODE_ENV`     | `development`    | `development` \| `test` \| `production`        |
| `DATABASE_URL` | `file:./dev.db`  | SQLite file location (relative to `prisma/`)   |

Environment variables are validated with Zod at startup ([`src/config/env.ts`](src/config/env.ts));
the app fails fast with a clear message if something is wrong.

---

## Run the application

```bash
# 1) install dependencies
npm install

# 2) generate Prisma client + apply migrations
npm run setup

# 3) start in dev mode — applies DB migrations, then runs with auto-reload
npm run dev
```

Server starts at **http://localhost:3001**.

> `npm run setup` generates the Prisma client and creates `dev.db` by applying the committed migrations.
> `npm run dev` also runs `prisma migrate deploy`, so repeated local starts stay in sync with the schema.
>
> On first run, `npm run dev` executes `prisma migrate deploy`, which creates `dev.db`
> and applies the schema. No manual DB step required.

### Optional: load sample data

```bash
npm run seed        # inserts 6 example books
```

### Production build

```bash
npm run build       # compile TypeScript (src/) to dist/
npm start           # migrate + run the compiled server (dist/server.js)
```

> `npm start` runs the **already-compiled** `dist/server.js`; it does not compile on the fly.
> Run `npm run build` first, and again after any source change. The build compiles only `src/`
> (`rootDir: "src"`), so the entry point lands at `dist/server.js` — matching the `main` and
> `start` script. `tests/` and `prisma/seed.ts` are run directly with `tsx`, so they are not
> part of the build.

### Run tests

```bash
npm test            # inside problems/problem5
```

From the repository root you can also run:

```bash
npm run setup:problem5
npm run test:problem5
```

---

## Interactive API docs (Swagger)

Once the server is running, open the **Swagger UI** in your browser:

```
http://localhost:3001/docs
```

From there you can browse every endpoint, see request/response schemas, and click
**"Try it out"** to call the API directly — no curl or Postman needed.

The raw OpenAPI 3.0 spec is also served as JSON at:

```
http://localhost:3001/docs.json
```

---

## Data model

| Field         | Type      | Rules                                  |
| ------------- | --------- | -------------------------------------- |
| `id`          | Int       | Auto-increment primary key             |
| `title`       | String    | Required, non-empty                    |
| `author`      | String    | Required, non-empty                    |
| `price`       | Float     | `>= 0`                                 |
| `stock`       | Int       | Integer, `>= 0`                        |
| `category`    | String    | Required                               |
| `imageUrl`    | String    | Optional external URL or stored image path |
| `isAvailable` | Boolean   | Defaults to `true`                     |
| `createdAt`   | DateTime  | Set automatically on create            |
| `updatedAt`   | DateTime  | Updated automatically on every change  |

---

## API reference

Base URL: `http://localhost:3001`

| Method   | Endpoint         | Description                       |
| -------- | ---------------- | --------------------------------- |
| `GET`    | `/docs`          | Swagger UI (interactive docs)     |
| `GET`    | `/docs.json`     | OpenAPI 3.0 spec (JSON)           |
| `GET`    | `/health`        | Health check                      |
| `POST`   | `/api/books`     | Create a book                     |
| `GET`    | `/api/books`     | List books (filters + pagination) |
| `GET`    | `/api/books/:id` | Get one book                      |
| `PATCH`  | `/api/books/:id` | Update a book (partial)           |
| `DELETE` | `/api/books/:id` | Delete a book                     |

### 1. Create — `POST /api/books`

```bash
curl -X POST http://localhost:3001/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring","author":"Martin Fowler","price":40,"stock":8,"category":"Programming","imageBase64":"iVBORw0KGgo...","imageMimeType":"image/png"}'
```

`201 Created`
```json
{ "id": 7, "title": "Refactoring", "author": "Martin Fowler", "price": 40, "stock": 8,
  "category": "Programming", "imageUrl": "/uploads/books/1720000000000-cover.png",
  "isAvailable": true, "createdAt": "...", "updatedAt": "..." }
```

To store an image, send either:

| Field           | Description |
| --------------- | ----------- |
| `imageUrl`      | External image URL if the image is already hosted elsewhere |
| `imageBase64`   | Raw base64 string or `data:image/png;base64,...`; the API writes it to `uploads/books/` |
| `imageMimeType` | Required for raw base64: `image/jpeg`, `image/png`, `image/webp`, or `image/gif` |
| `image`         | File upload field when using `multipart/form-data` in Swagger or curl |

Stored images are served publicly from:

```
http://localhost:3001/uploads/books/<filename>
```

In Swagger UI, use `POST /api/books` → **Try it out**. The default request media type is
`multipart/form-data`, so the `image` field shows a file picker.

```bash
curl -X POST http://localhost:3001/api/books \
  -F "title=Refactoring" \
  -F "author=Martin Fowler" \
  -F "price=40" \
  -F "stock=8" \
  -F "category=Programming" \
  -F "image=@./cover.png;type=image/png"
```

Invalid input returns `400` with per-field messages:
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "title is required" },
    { "field": "price", "message": "price must be >= 0" },
    { "field": "stock", "message": "stock must be an integer" }
  ]
}
```

### 2. List with filters — `GET /api/books`

Supported query parameters:

| Param         | Type              | Description                                       |
| ------------- | ----------------- | ------------------------------------------------- |
| `search`      | string            | Case-insensitive match on **title or author**     |
| `category`    | string            | Exact category match                              |
| `minPrice`    | number            | Price `>=` value                                  |
| `maxPrice`    | number            | Price `<=` value                                  |
| `isAvailable` | `true` \| `false` | Availability filter                               |
| `page`        | number (def `1`)  | Page number                                       |
| `limit`       | number (def `10`) | Page size (max `100`)                             |
| `sortBy`      | `price`\|`stock`\|`title`\|`createdAt` (def `createdAt`) | Sort field |
| `order`       | `asc` \| `desc` (def `desc`) | Sort direction                         |

```bash
curl "http://localhost:3001/api/books?category=Programming&minPrice=20&page=1&limit=5&sortBy=price&order=asc"
```

`200 OK`
```json
{
  "data": [ /* books */ ],
  "pagination": { "page": 1, "limit": 5, "total": 2, "totalPages": 1 }
}
```

### 3. Get one — `GET /api/books/:id`

```bash
curl http://localhost:3001/api/books/1
```
Returns `200` with the book, or `404` if the id doesn't exist.

### 4. Update — `PATCH /api/books/:id`

Partial update — send any subset of fields:

```bash
curl -X PATCH http://localhost:3001/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"price":99.5,"stock":1,"imageBase64":"iVBORw0KGgo...","imageMimeType":"image/png"}'
```
Returns `200` with the updated book, or `404` if not found.

Replacing an image deletes the previously stored file from `uploads/books/`.
To remove a book's image without replacing it, send `"imageUrl": null`:

```bash
curl -X PATCH http://localhost:3001/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":null}'
```

### 5. Delete — `DELETE /api/books/:id`

```bash
curl -X DELETE http://localhost:3001/api/books/1
```
Returns `204 No Content`, or `404` if not found.

---

## Project structure

```
problem5/
├── package.json
├── tsconfig.json
├── .env.example
├── prisma/
│   ├── schema.prisma        # SQLite datasource + Book model
│   ├── migrations/          # committed migration history
│   └── seed.ts              # sample data
├── tests/
│   └── book.test.ts         # CRUD + filter tests (node:test + supertest)
└── src/
    ├── config/
    │   ├── env.ts           # Zod-validated environment variables
    │   ├── paths.ts         # uploads/project paths (independent of cwd)
    │   └── database.ts      # shared PrismaClient instance
    ├── constants/
    │   └── image.ts         # shared image MIME allowlist + size limit
    ├── controllers/
    │   └── book.controller.ts
    ├── services/
    │   └── book.service.ts
    ├── repositories/
    │   └── book.repository.ts
    ├── routes/
    │   ├── book.routes.ts
    │   └── index.ts
    ├── types/
    │   └── book.types.ts
    ├── middlewares/
    │   ├── error.middleware.ts
    │   ├── multipart.middleware.ts  # parses multipart/form-data image uploads
    │   └── validate.middleware.ts
    ├── validators/
    │   └── book.validator.ts
    ├── utils/
    │   ├── api-response.ts
    │   ├── image-storage.ts         # writes uploaded/base64 images to uploads/books/
    │   └── AppError.ts
    ├── docs/
    │   └── openapi.ts       # OpenAPI 3.0 spec (served via Swagger UI at /docs)
    ├── app.ts               # Express app factory (middleware + routes)
    └── server.ts            # entry point (listen + graceful shutdown)
```

**Design notes**
- **Layered:** routes → validation → controller → service → repository → Prisma. Keeps HTTP concerns,
  business logic and data access separate and testable.
- **Validation:** every write body, list query and `:id` param is parsed & coerced with Zod
  before reaching a controller.
- **Errors:** all handlers `next(err)` into one place that maps `ZodError → 400`,
  `AppError → its status`, Prisma `P2025 → 404`, everything else `→ 500`.
- **Persistence:** data lives in `dev.db` and survives restarts.
