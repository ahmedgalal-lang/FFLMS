# Quickstart: LMS Platform

Local setup and smoke test for the LMS MVP (US1 authoring + US2 enroll & learn).

## Prerequisites

- Node.js 20+ (22 recommended) and `pnpm` 10+
- A PostgreSQL 16 database. Either:
  - `docker compose up -d postgres` (uses `docker-compose.yml`), or
  - any local Postgres — set `DATABASE_URL` accordingly.

## 1. Install & configure

```bash
pnpm install
cp .env.example .env         # then edit DATABASE_URL / AUTH_SECRET
# generate a real secret:
#   openssl rand -base64 32
```

## 2. Database

```bash
pnpm prisma migrate deploy   # apply committed migrations
pnpm db:seed                 # admin/instructor/student + a sample course
```

Seeded accounts (password `password123`):

| Role       | Email               |
| ---------- | ------------------- |
| Admin      | admin@lms.test      |
| Instructor | instructor@lms.test |
| Student    | student@lms.test    |

## 3. Run

```bash
pnpm dev            # http://localhost:3000
```

## 4. Smoke test (MVP journey)

1. Sign in as `instructor@lms.test` -> **Studio** -> **New course**.
2. Add a module, add two lessons, add a text/video content block.
3. **Publish** (disabled until the completeness gate passes).
4. Sign out, sign in as `student@lms.test`.
5. **Catalog** -> open the course -> **Enrol** -> land in the player.
6. **Complete & continue** through lessons; watch progress reach 100%.
7. Revisit **My Learning** — progress and completion persist.

## 5. Quality gates

```bash
pnpm typecheck      # tsc --noEmit (strict)
pnpm lint           # eslint
pnpm test           # vitest unit + integration (needs DATABASE_URL)
pnpm build          # next production build
pnpm test:e2e       # playwright (builds + starts, then drives a browser)
```

For e2e against an already-running server (and a preinstalled Chromium):

```bash
E2E_BASE_URL=http://localhost:3000 \
PW_CHROMIUM_PATH=/path/to/chromium \
pnpm exec playwright test
```

## Notes

- File uploads use presigned URLs (`POST /api/uploads`). Without S3/MinIO
  configured, text and video content still work; file blocks return a clear
  "storage not configured" error.
- Authorization is enforced server-side on every mutation via `authorize()` in
  `src/server/access/policy.ts`.
