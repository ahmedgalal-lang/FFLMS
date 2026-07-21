# LMS Platform

A multi-role Learning Management System built with **Next.js** (App Router),
planned using [GitHub Spec Kit](https://github.com/github/spec-kit).

Instructors author courses (modules → lessons with video/text/file content) and
assessments (quizzes, assignments); students discover, enroll, learn with tracked
progress, take assessments, and earn verifiable certificates; admins manage
users, approve courses, and view reports.

## Status

✅ **All 8 user stories implemented and verified.** The full platform — authoring,
learning, quizzes, assignments, certificates, admin console, discussions, and
analytics — is built, tested, and deployable. See
`specs/001-lms-platform/tasks.md` for the task-level breakdown.

**What works today**

- **Auth & roles** — email/password (argon2) + optional GitHub auth with
  role-based JWT sessions (Admin / Instructor / Student), enforced server-side via
  a central deny-by-default `authorize()` policy. Self-service **password reset**
  by email (US: account recovery).
- **US1 — Authoring & publishing** — Instructor Studio: create courses, structure
  modules → lessons, add video/text/file content blocks, and publish behind a
  completeness gate. Rich text is sanitized server-side.
- **US2 — Enroll & learn** — public catalog with search/filter, course detail,
  idempotent enrollment; course player with lesson navigation, **mark complete**,
  resume point, live progress, and automatic course completion.
- **US3 — Quizzes** — quiz builder (single/multi choice), student taker, automated
  grading with attempts and scoring.
- **US4 — Assignments** — text/file submissions with instructor manual grading and
  feedback.
- **US5 — Certificates** — automatic issuance on completion, a public verification
  page, revoke support, and a downloadable **PDF certificate** (pdf-lib).
- **US6 — Admin console** — user CRUD & role/status management, course review
  queue, category management, all tracked in an audit log.
- **US7 — Discussions & notifications** — per-course discussion boards
  (threads/posts), instructor announcements, and an in-app notification center.
- **US8 — Analytics & reports** — instructor per-course analytics (completion
  rate, per-lesson completion) and admin org-wide reports.
- **Profiles** — every user can upload an avatar (stored in-DB as a data URL),
  edit basic info/bio, and change their password.

**Storage & email** — file uploads (lesson/assignment attachments) are stored in
the database (no external object store required); email uses Resend when
configured and falls back to structured logs otherwise.

**Security** — sanitized rich text (XSS), security headers (CSP, HSTS,
X-Frame-Options, etc.), and in-memory rate limiting on sign-in.

**Quality:** 98 unit/integration tests + 10 Playwright e2e journeys (one per user
story) passing; `typecheck`, `lint`, and production `build` all green. See
[`quickstart.md`](specs/001-lms-platform/quickstart.md) to run it locally.

## Spec-Driven Planning Artifacts

The plan was produced with Spec Kit's workflow
(`constitution → specify → plan → tasks`):

| Artifact | Path | Purpose |
|----------|------|---------|
| Constitution | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Governing principles & quality gates |
| Specification | [`specs/001-lms-platform/spec.md`](specs/001-lms-platform/spec.md) | Prioritized user stories, requirements, success criteria |
| Research | [`specs/001-lms-platform/research.md`](specs/001-lms-platform/research.md) | Tech decisions & rationale |
| Plan | [`specs/001-lms-platform/plan.md`](specs/001-lms-platform/plan.md) | Architecture, stack, project structure |
| Data Model | [`specs/001-lms-platform/data-model.md`](specs/001-lms-platform/data-model.md) | Entities, relations, invariants |
| API Contracts | [`specs/001-lms-platform/contracts/`](specs/001-lms-platform/contracts/) | REST/OpenAPI + action contracts |
| Quickstart | [`specs/001-lms-platform/quickstart.md`](specs/001-lms-platform/quickstart.md) | Local setup & smoke test |
| Tasks | [`specs/001-lms-platform/tasks.md`](specs/001-lms-platform/tasks.md) | 85 implementation tasks by user story |

## Tech Stack

- **Next.js 15** (App Router, React 19, RSC-first) + TypeScript `strict`
- **PostgreSQL 16** via **Prisma** ORM
- **Auth.js (NextAuth v5)** with role-based access (Admin / Instructor / Student)
- **Zod** validation shared client/server
- **Tailwind CSS + shadcn/ui** (accessible primitives)
- **Vitest** (unit/integration) + **Playwright** (e2e)
- **Database-backed file storage** (no external object store needed)
- **pdf-lib** for certificate PDFs; **Resend** (optional) for transactional email
- Deploys to **Vercel** with **Supabase** Postgres

## Running locally

See [`quickstart.md`](specs/001-lms-platform/quickstart.md) for full setup. In
short:

```bash
pnpm install
cp .env.example .env          # adjust DATABASE_URL / DIRECT_URL / AUTH_SECRET
pnpm db:migrate               # apply migrations
pnpm db:seed                  # seed demo accounts + a sample course
pnpm dev                      # http://localhost:3000
```

Seeded accounts (password `password123`): `admin@lms.test`,
`instructor@lms.test`, `student@lms.test`.

**Test commands:** `pnpm test` (unit/integration), `pnpm test:e2e` (Playwright),
`pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Spec-Driven Planning

Spec Kit skills are installed under `.claude/skills/` (e.g. `/speckit-plan`,
`/speckit-tasks`, `/speckit-implement`, `/speckit-analyze`). The implementation
follows the tasks in `specs/001-lms-platform/tasks.md`.
