# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A multi-role Learning Management System (Admin / Instructor / Student) built with Next.js 15 App Router, React 19 RSC-first, Prisma + PostgreSQL, Auth.js v5, Zod, Tailwind + shadcn/ui. Planned with [Spec Kit](https://github.com/github/spec-kit); all 8 user stories (US1–US8) are implemented.

## Commands

Package manager is **pnpm** (v10, Node 22).

```bash
pnpm dev                  # dev server on :3000
pnpm build                # prisma generate && next build
pnpm typecheck            # tsc --noEmit (strict)
pnpm lint                 # eslint (next/core-web-vitals + next/typescript)
pnpm format               # prettier --write .

pnpm test                 # vitest run — unit + integration (REQUIRES a live DATABASE_URL)
pnpm test:watch
pnpm exec vitest run tests/unit/quiz-grading.test.ts          # single file
pnpm exec vitest run -t "idempotent"                          # single test by name

pnpm test:e2e             # playwright; builds + starts the app itself unless E2E_BASE_URL is set
pnpm exec playwright test tests/e2e/quiz.spec.ts              # single e2e spec

pnpm db:migrate           # prisma migrate dev (creates a migration)
pnpm db:deploy            # prisma migrate deploy (applies committed migrations)
pnpm db:seed              # demo accounts + sample course (idempotent upserts)
pnpm db:studio
```

Local Postgres: `docker compose up -d postgres` (the `minio`/`redis` services in `docker-compose.yml` are vestigial — nothing in the app uses them). Copy `.env.example` to `.env`; only `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` are required.

Seeded accounts, password `password123`: `admin@lms.test`, `instructor@lms.test`, `student@lms.test`. The e2e suite signs in with these (`tests/e2e/helpers.ts`), so a seeded DB is a prerequisite for `test:e2e`.

Against an already-running server with a preinstalled browser:
`E2E_BASE_URL=http://localhost:3000 PW_CHROMIUM_PATH=/opt/pw-browsers/chromium pnpm exec playwright test`

CI (`.github/workflows/ci.yml`) runs typecheck → lint → test → build against a Postgres service container. E2e is not in CI.

## Architecture

### The layer rule

`src/app/**` (pages, server actions, route handlers) is a **thin** layer. It resolves the principal, parses input with Zod, calls a service, and shapes the response. All business logic and every database query live in `src/server/services/*`. Never query `db` from a page, action, or route handler.

Every service function takes a `Principal` as its **first argument** and calls `authorize(principal, action)` before touching data. There is no ambient "current user" inside services — this is what makes them testable without a request context.

```
UI/route → requirePrincipal() → service(principal, input)
                                   ├─ loadXForAuthz()  → 404 if missing
                                   ├─ authorize(principal, {type, resource})  → throws
                                   └─ db.…
```

### Authorization — `src/server/access/policy.ts`

The single source of truth for who may do what. `can()`/`authorize()` are **pure**: they take a `Principal` (`{id, role, status}`) plus already-loaded resource attributes, never a DB handle, so `tests/unit/access.test.ts` covers the matrix exhaustively. Deny-by-default; suspended users are denied everything; admins bypass everything *except* learner-owned actions (enroll, complete lesson, attempt quiz, submit assignment).

Adding a permission means adding a variant to the `Action` union and a case to the `can()` switch — the compiler then finds every call site. `src/server/auth/index.ts` provides `getPrincipal()` (nullable) and `requirePrincipal()` (throws `AuthorizationError`).

### Two mutation entry points

- **Server actions** (`src/app/**/actions.ts`) — the default for UI-driven mutations. They catch errors and return an `ActionState` (`{ error?: string; ok?: boolean }`) for `useActionState`; they never let exceptions escape to the client.
- **Route handlers** (`src/app/api/**/route.ts`) — wrapped in `route()` from `src/server/http.ts`, which maps thrown errors to uniform JSON: `AuthorizationError`→403, `ZodError`→422, `AppError`/`NotFoundError`/`ConflictError`→their status, anything else→500 (logged). Services throw; handlers stay one-liners.

### Pure-logic split

Business rules that can be computed without a database are isolated in `*-calc` modules and unit-tested directly: `progress-calc.ts` (percent complete over *required* lessons, keyed by lesson id so reordering can't corrupt progress), `grading-calc.ts` (all-or-nothing objective grading). The DB-touching wrappers (`progress.ts`, `attempt.ts`) load rows and delegate.

### Route groups

`(marketing)` public catalog/verify · `(auth)` sign-in/up/reset · `(learn)` student pages · `(teach)` instructor Studio · `(admin)` admin console. The `(teach)` and `(admin)` layouts redirect on role — but that's UX only; the real check is `authorize()` in the service. `/dashboard` is a redirect router sending each role to its home.

### Validation & types

Zod schemas in `src/lib/validation/index.ts` are shared by React Hook Form, server actions, and route handlers. Prisma-generated types are the source of truth for entities — don't hand-write parallel types. `tsconfig` has `strict` **and** `noUncheckedIndexedAccess`, so indexed access yields `T | undefined`.

### Environment

Import `env` from `src/config/env.ts` — never read `process.env` directly on the server, and never import this module from client code. It Zod-validates at load and bridges Vercel/Supabase-injected names (`POSTGRES_PRISMA_URL`/`NEXT_PUBLIC_SUPABASE_URL` → `DATABASE_URL`/`SUPABASE_URL`). `scripts/vercel-build.sh` mirrors that bridging for the Prisma CLI. Optional features gate on exported booleans (`isOAuthEnabled`, `isSupabaseStorageEnabled`) and degrade rather than fail.

### Storage — two paths, deliberately

- **Documents/images** → bytes in Postgres (`FileAsset`), uploaded via `POST /api/files`, served from `/api/files/[id]`. Capped at 5 MB (`MAX_FILE_BYTES`). Avatars are inline data URLs.
- **Video** → Supabase Storage. The server mints a signed upload URL (`services/media.ts`) and the **browser uploads directly**, because Vercel caps request bodies at ~4.5 MB. If Supabase isn't configured the upload button hides and instructors paste a YouTube / Vimeo / Google Drive / direct-file URL instead.

`src/lib/video.ts` classifies and normalizes those URLs and must stay free of server imports (it's bundled to the client). Uploaded/YouTube/Vimeo videos support resume, watch-% gating, and in-video cue questions via their player APIs; Google Drive embeds have no playback API and are untrackable — preserve that distinction when touching the player.

### Security invariants

Rich text is sanitized **server-side** (`security/sanitize.ts`) before storage, since it's later rendered with `dangerouslySetInnerHTML`. Sign-in is rate-limited in-memory per email (`security/rate-limit.ts` — per-instance, best effort). Security headers including CSP live in `next.config.ts`; the CSP allowlists YouTube/Vimeo player origins, so adding an embed provider means editing `script-src`/`frame-src` there. Log via `logger` from `server/observability.ts` (pino, redacts password/token fields); `bestEffort()` wraps fire-and-forget side effects like notifications.

## Testing

- `tests/unit/**` — pure functions, no DB.
- `tests/integration/**` — real Postgres, real services. They construct `Principal` objects literally (no auth session) and call services directly. Each file creates its own fixtures with a random suffix and deletes them in `afterAll` — follow that pattern; the suite runs against a shared database.
- `tests/e2e/**` — Playwright journeys, one per user story. Excluded from `tsconfig`.

Per the constitution, business logic (grading, progress, enrollment rules, access control) is test-first and non-negotiable.

## Spec-driven workflow

`.specify/memory/constitution.md` holds the governing principles; `specs/001-lms-platform/` holds spec, plan, data-model, contracts, quickstart, and the 85-task breakdown. Spec Kit skills are installed under `.claude/skills/` (`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`, `/speckit-analyze`, …). Substantive feature work is expected to trace back to a user story / FR in `spec.md`; a PR touching the data model updates the Prisma migration **and** `data-model.md`.
