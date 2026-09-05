# Hometown Hub — Digital Community Platform

A hyperlocal community platform where people from the same city or village can
reconnect, share updates, discuss local topics, organise events, and preserve
local culture — a focused alternative to scattered WhatsApp groups.


## Live Deployment

- **Live site:** https://hometown-hub-ten.vercel.app
- **API health check:** https://hometown-hub-digital-community-platform.onrender.com/api/health

Note: the backend runs on Render's free tier, which sleeps after ~15 minutes
of inactivity — the first request after a period of idle time can take
30–60 seconds to respond while it wakes up. This is expected free-tier
behaviour, not a bug.

This repository contains a **functional MVP core** built to the full product
spec's data model and architecture: real authentication, RBAC, a working
REST API backed by PostgreSQL/Prisma, and a Next.js frontend wired to it end
to end (not a static mockup). Some deeper spec items (full analytics,
multi-language, real-time chat) are intentionally scaffolded rather than
fully built — see [Scope & what's included](#scope--whats-included) below.

## Tech stack

| Layer      | Technology |
|------------|------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend    | Node.js, Express, TypeScript |
| Database   | PostgreSQL + Prisma ORM |
| Auth       | JWT (httpOnly cookie + Bearer token), argon2 password hashing |
| Image uploads | Local disk (dev) — swap-in ready for S3 / Cloudinary |
| Testing    | Jest + Supertest (backend integration tests) |

## Project structure

```
/hometown-hub
  /backend
    /prisma          # schema.prisma, seed.ts
    /src
      /config         # env, Prisma client
      /controllers    # request handlers
      /routes         # Express routers
      /middleware     # auth, RBAC, validation, error handling, uploads
      /services       # notifications, audit logging
      /validators     # Zod schemas
      /utils
      /__tests__      # Jest + Supertest integration tests
  /frontend
    /src
      /app            # Next.js App Router pages
      /components
      /context        # AuthContext
      /lib            # API client
      /types
  /docs               # API reference
```

## 1. Prerequisites

- Node.js 18+
- A PostgreSQL database (local Postgres, or a free instance on
  [Neon](https://neon.tech) / [Supabase](https://supabase.com))

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env — set DATABASE_URL to your Postgres connection string,
# and JWT_SECRET to a long random string

npm install
npx prisma migrate dev --name init   # creates tables
npm run seed                         # loads demo data (see credentials below)
npm run dev                          # starts the API on http://localhost:4000
```

Health check: `GET http://localhost:4000/api/health`

### Seed credentials (local development only)

| Role           | Email                     | Password       |
|----------------|---------------------------|-----------------|
| Platform Admin | admin@hometownhub.dev     | Admin@12345     |
| Sample user    | aarav@example.com         | Password@123    |

**Never use these in production.** Remove or change them before deploying.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL should point at your running backend

npm install
npm run dev    # starts the app on http://localhost:3000
```

## 4. Running tests (backend)

Integration tests hit a real database, so point `DATABASE_URL` at a
disposable test database first.

```bash
cd backend
npx prisma migrate deploy
npm test
```

## 5. Production build

```bash
# Backend
cd backend
npm run build
npm start            # runs dist/index.js

# Frontend
cd frontend
npm run build
npm start
```

## 6. Deployment

- **Frontend** → Vercel (set `NEXT_PUBLIC_API_URL` to your deployed backend URL)
- **Backend** → Render / Railway / AWS (set all vars from `.env.example`;
  run `npx prisma migrate deploy` on release)
- **Database** → Neon / Supabase / AWS RDS

For production image uploads, replace the local-disk `multer` storage engine
in `backend/src/middleware/upload.middleware.ts` with a Cloudinary or S3
multer storage adapter — the rest of the app only consumes the resulting
`url`, so no other code changes are required.


### Known deployment gotchas

These are real issues hit while deploying this project to Render + Vercel —
documented here so they don't need to be re-diagnosed if you (or anyone else)
redeploy from this repo:

- **TypeScript version drift.** `typescript` is pinned to an exact version
  (`5.5.4`, no `^`) in both `package.json` files. A newer TypeScript release
  removes the classic `moduleResolution: "node"` option outright (error
  `TS5108`), which breaks the build on a fresh `npm install` even though it
  works locally with an older cached version. `backend/tsconfig.json` uses
  the modern, version-stable `"module": "node16"` / `"moduleResolution":
  "node16"` pairing instead of relying on a version-dependent default.
- **`devDependencies` getting skipped on Render.** Render (and most CI/CD
  hosts) applies `NODE_ENV=production` during the build step too, and `npm
  install` skips `devDependencies` whenever that's set — which silently
  drops `typescript`, `@types/*`, and other build-time-only tools the build
  actually needs. Render's **Build Command** must force them in:
  - **`dist/` output nesting.** `backend/tsconfig.json`'s `rootDir` must be
  `"src"` (not `"."`), and `"include"` must only cover `src/**/*.ts` —
  otherwise compiled output nests as `dist/src/index.js` instead of
  `dist/index.js`, breaking the `npm start` script (`node dist/index.js`).
  `prisma/seed.ts` doesn't need to go through this build at all; it already
  runs independently via `ts-node` (see the `seed` npm script).
- **CORS requires an exact origin match.** The backend's `FRONTEND_URL` env
  var must exactly match the deployed frontend's origin (no trailing
  slash) for the CORS middleware to allow requests from it.
- **Start command typo risk.** Render's start command should be
  `npx prisma migrate deploy && npm start` — a one-character typo (`px`
  instead of `npx`) fails with `command not found` and is easy to miss when
  copy-pasting.

## 7. API documentation

See [`docs/API.md`](./docs/API.md) for the full endpoint reference.

## Scope & what's included

**Fully implemented, working end to end:**
Auth (register/login/logout/forgot-reset password), RBAC (platform admin +
per-community roles), user profiles, community discovery/creation/approval,
public + private communities with join requests, community feed (posts,
images, comments, likes, shares, pinning), announcements, events (create,
join, capacity limits, attendee lists), in-app notifications, global search,
reporting & moderation (community + platform level), platform admin
dashboard with KPIs and growth charts, Pandit/local-services onboarding
module, audit logging, image upload pipeline, and integration tests.

**Scaffolded in the schema/API but with lighter frontend treatment:**
Tag/category browsing UI, culture & local-identity content sections, and
poll-type posts (the `POST.type` enum and DB support exist; dedicated poll
voting UI is a natural next addition).

**Not built (flagged in the original spec as future-roadmap items):**
native mobile app, marketplace/classifieds, real-time chat, push
notifications, AI-assisted moderation, and multi-language support. The
architecture (REST API, normalized schema, modular routes) is set up so
these can be added without restructuring existing code.

## Business rules enforced

- Private communities require an approved join request before members can
  view the member list or post.
- Only the post/comment owner (or a community moderator/admin/platform
  admin) can edit or delete content.
- Only community moderators/admins can pin posts or post announcements.
- Only platform admins can approve or reject new community requests; the
  creator becomes community admin automatically on approval.
- Duplicate event registrations and duplicate community join requests are
  rejected at the database level (unique constraints) as well as in the API.
- Suspended users are blocked from authenticating.
- Event capacity (`maxAttendees`) is enforced server-side.
- Private community member lists are never exposed to non-members.
