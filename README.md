# INFNOVA Internship Applicant Management API

Backend take-home challenge — NestJS REST API for managing internship applicants, with JWT authentication, soft deletes, and a dashboard summary.

---

## Stack

- **NestJS 11** — framework
- **Prisma 6** (SQLite) — ORM and database (note: Prisma 7 has breaking datasource changes; this project intentionally stays on v6)
- **passport-jwt / @nestjs/jwt** — authentication
- **class-validator / class-transformer** — DTO validation
- **bcrypt** — password hashing
- **@nestjs/swagger** — API documentation

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/eyob42/infnova-applicant-api.git
cd infnova-applicant-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET to a strong random string

# 4. Run database migrations
npx prisma migrate deploy

# 5. Seed the admin user
npx prisma db seed

# 6. Start the development server
npm run start:dev
```

The API will be available at `http://localhost:3000`.  
Interactive API docs (Swagger UI): `http://localhost:3000/api/docs`

---

## Environment Variables

| Variable       | Description                              | Example              |
|----------------|------------------------------------------|----------------------|
| `DATABASE_URL` | SQLite file path (relative to prisma/)   | `file:./dev.db`      |
| `JWT_SECRET`   | Secret for signing JWT tokens            | `change-me`          |
| `JWT_EXPIRES_IN` | Token expiry duration                  | `1d`                 |
| `PORT`         | HTTP server port                         | `3000`               |

See `.env.example` for a template.

---

## Seed / Demo Credentials

> These are development/demo credentials only. Change before any real deployment.

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@infnova.com`    |
| Password | `Admin123!`            |

---

## Authentication

All endpoints (including GETs) require a valid JWT bearer token.

**Login** to get a token:
```
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@infnova.com", "password": "Admin123!" }
```

Response:
```json
{
  "accessToken": "eyJ...",
  "admin": { "id": 1, "email": "admin@infnova.com" }
}
```

Pass the token as a header on all subsequent requests:
```
Authorization: Bearer <accessToken>
```

---

## API Reference

### Auth

| Method | Path             | Description              | Auth |
|--------|------------------|--------------------------|------|
| POST   | /api/auth/login  | Login, returns JWT token | No   |
| GET    | /api/auth/me     | Get current admin info   | Yes  |

### Applicants

| Method | Path                        | Description                         |
|--------|-----------------------------|-------------------------------------|
| POST   | /api/applicants             | Create a new applicant              |
| GET    | /api/applicants             | List applicants (paginated)         |
| GET    | /api/applicants/:id         | Get a single applicant              |
| PATCH  | /api/applicants/:id         | Update applicant fields             |
| DELETE | /api/applicants/:id         | Soft-delete an applicant            |
| PATCH  | /api/applicants/:id/status  | Update application status           |
| PATCH  | /api/applicants/:id/notes   | Update applicant notes              |

### Dashboard

| Method | Path                  | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | /api/dashboard/summary | Aggregate counts by status and track    |

---

## List Endpoint Query Parameters

`GET /api/applicants` supports the following query params:

| Param       | Type   | Default     | Description                                  |
|-------------|--------|-------------|----------------------------------------------|
| `page`      | number | `1`         | Page number                                  |
| `limit`     | number | `10`        | Results per page                             |
| `search`    | string | —           | Case-insensitive match on name or email      |
| `status`    | enum   | —           | Filter by `PENDING`, `SHORTLISTED`, `ACCEPTED`, `REJECTED` |
| `track`     | enum   | —           | Filter by internship track                   |
| `sortBy`    | string | `createdAt` | Sort field: `createdAt`, `name`, or `status` |
| `sortOrder` | string | `desc`      | `asc` or `desc`                              |

Example:
```
GET /api/applicants?page=1&limit=5&search=jane&status=PENDING&sortBy=name&sortOrder=asc
```

---

## Internship Tracks

- `FRONTEND_DEVELOPMENT`
- `BACKEND_DEVELOPMENT`
- `MOBILE_DEVELOPMENT`
- `UI_UX_DESIGN`
- `DATA_ANALYTICS`

---

## Business Rules

- **Email uniqueness** — no two applicants may share the same email address.
- **Notes max length** — notes are capped at 1000 characters.
- **Status transition** — transitioning from `REJECTED` to `ACCEPTED` is blocked with a 400 error. All other transitions are permitted, per the literal spec (this is a deliberate choice, not an oversight).
- **Soft deletes** — `DELETE /api/applicants/:id` sets `deletedAt` on the record rather than removing it. All list, detail, and dashboard queries exclude soft-deleted records.

---

## Architecture

```
src/
├── auth/           # JWT strategy, guard, login DTO, auth service + controller
├── applicants/     # Applicants CRUD, list, status/notes endpoints, DTOs
├── dashboard/      # Summary aggregate endpoint
├── prisma/         # PrismaService (global module)
└── main.ts         # Bootstrap — ValidationPipe, Swagger, dotenv
prisma/
├── schema.prisma   # Admin + Applicant models, enums
├── migrations/     # Migration history
└── seed.ts         # Seeds the admin user
```

**Key design decisions:**
- No business logic in controllers — controllers call services only.
- `PrismaModule` is `@Global()`, so `PrismaService` is available everywhere without re-importing.
- `ConfigModule` is `isGlobal: true` for the same reason.
- `import 'dotenv/config'` is the very first line of `main.ts` to ensure `process.env` is fully populated before NestJS builds the module tree (avoids a DI initialization order issue with Prisma connecting before ConfigModule loads).
- `ValidationPipe` is configured with `whitelist: true` (strips unknown fields) and `transform: true` (coerces query string values to their declared types).

---

## Running Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

---

## Migrations

To apply migrations on a fresh database:
```bash
npx prisma migrate deploy
```

To create a new migration during development:
```bash
npx prisma migrate dev --name <migration-name>
```

---

## Limitations

- SQLite is used for simplicity. The Prisma schema and queries are compatible with PostgreSQL — swapping the `datasource` provider and `DATABASE_URL` is the only change needed.
- No pagination cursor support — offset/limit only.
- No role-based access control — a single admin user manages all applicants.
- `search` uses Prisma's `contains` filter, which is case-insensitive on SQLite but case-sensitive on PostgreSQL. A production build would need `mode: 'insensitive'` added to the filter.
