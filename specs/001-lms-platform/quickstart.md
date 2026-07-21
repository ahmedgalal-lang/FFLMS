# Quickstart: LMS Platform

Local setup and smoke test for the LMS platform (all 8 user stories).

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

## 4. Smoke test (core journey)

1. Sign in as `instructor@lms.test` -> **Studio** -> **New course**.
2. Add a module, add two lessons, add a text/video content block.
3. Optionally attach a **quiz** or **assignment** to a lesson.
4. **Publish** (disabled until the completeness gate passes).
5. Sign out, sign in as `student@lms.test`.
6. **Catalog** -> open the course -> **Enrol** -> land in the player.
7. **Complete & continue** through lessons; take the quiz / submit the
   assignment; watch progress reach 100% and earn a **certificate**.
8. Open **Grades** -> **Download PDF**, or **Verify** the certificate publicly.
9. Revisit **My Learning** — progress and completion persist.

The seeded `admin@lms.test` account can also exercise **US6** (Admin ->
users/roles, review queue, categories, reports).

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

- **Document/image uploads are stored in the database** (`FileAsset` table;
  avatars as data URLs via `POST /api/files`) — no S3/MinIO required. A 5 MB
  per-file cap applies.
- **Video uploads use Supabase Storage.** Set `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` and create a **public** bucket named
  `media` (or set `SUPABASE_STORAGE_BUCKET`). The browser uploads directly to
  Supabase, so large files never hit the app server. Without it configured, the
  in-app video upload button is hidden and instructors paste a YouTube/Vimeo or
  direct video URL instead (the player auto-detects embed vs. direct file).
- **Email** (password reset, notifications) uses Resend when `RESEND_API_KEY` is
  set; otherwise messages are logged to the console — the flow still works
  locally via the logged reset link.
- **GitHub OAuth** activates only when `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
  are set; email/password auth works without them.
- Authorization is enforced server-side on every mutation via `authorize()` in
  `src/server/access/policy.ts`.
- The suite is **98 unit/integration tests + 10 Playwright e2e journeys** (one
  per user story).
