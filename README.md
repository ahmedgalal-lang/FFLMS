# LMS Platform

A multi-role Learning Management System built with **Next.js** (App Router),
planned using [GitHub Spec Kit](https://github.com/github/spec-kit).

Instructors author courses (modules → lessons with video/text/file content) and
assessments (quizzes, assignments); students discover, enroll, learn with tracked
progress, take assessments, and earn verifiable certificates; admins manage
users, approve courses, and view reports.

## Status

🚧 **MVP implemented.** The plan's shippable slice is built and verified:
Phase 1 (Setup), Phase 2 (Foundational), **US1** (course authoring &
publishing), and **US2** (enroll & learn with progress). The P2/P3 stories
(quizzes, assignments, gradebook/certificates, admin, discussions, analytics)
remain as planned increments in `specs/001-lms-platform/tasks.md`.

### What works today

- **Accounts & auth** — register / sign in (email + password via Auth.js),
  role-aware sessions (Admin / Instructor / Student), server-side
  `authorize()` policy enforced on every mutation.
- **Authoring (US1)** — instructor studio: create courses, build modules &
  lessons, add video/text/file content blocks, live publish-readiness gate,
  publish / unpublish.
- **Learning (US2)** — public catalog with search & category filter + pagination,
  course detail, idempotent enrollment, course player with lesson content,
  mark-complete, accurate progress %, resume-where-you-left-off, "My Learning".

### Verified

- 22 unit tests green (progress computation, publish gate, authorization matrix)
- `next build` clean (12 routes), `tsc --noEmit` and ESLint pass
- End-to-end over HTTP: catalog/search, auth redirects, credentials login with
  role in session; enroll idempotency and progress→100%/COMPLETED confirmed
  against the database

### Run it

```bash
npm install
cp .env.example .env          # point DATABASE_URL at a Postgres 16 instance
npm run db:migrate            # apply migrations
npm run db:seed               # demo admin / instructor / student
npm run dev                   # http://localhost:3000
```

Demo logins (all password `Password123!`): `admin@example.com`,
`instructor@example.com`, `student@example.com`. See
[`specs/001-lms-platform/quickstart.md`](specs/001-lms-platform/quickstart.md)
for details.

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

## Planned Tech Stack

- **Next.js 15** (App Router, React 19, RSC-first) + TypeScript `strict`
- **PostgreSQL 16** via **Prisma** ORM
- **Auth.js (NextAuth v5)** with role-based access (Admin / Instructor / Student)
- **Zod** validation shared client/server
- **Tailwind CSS + shadcn/ui** (accessible primitives)
- **Vitest** (unit/integration) + **Playwright** (e2e)
- S3-compatible object storage for uploads; Redis/BullMQ for background jobs

## MVP Scope

User Story 1 (course authoring/publishing) + User Story 2 (enroll & learn with
progress) form the shippable MVP — see `tasks.md` phases 1–4.

## Working with the plan

Spec Kit skills are installed under `.claude/skills/` (e.g. `/speckit-plan`,
`/speckit-tasks`, `/speckit-implement`, `/speckit-analyze`). To begin building,
follow the tasks in order starting from Phase 1.
