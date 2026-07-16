# LMS Platform

A multi-role Learning Management System built with **Next.js** (App Router),
planned using [GitHub Spec Kit](https://github.com/github/spec-kit).

Instructors author courses (modules → lessons with video/text/file content) and
assessments (quizzes, assignments); students discover, enroll, learn with tracked
progress, take assessments, and earn verifiable certificates; admins manage
users, approve courses, and view reports.

## Status

🚀 **MVP implemented.** The shippable MVP — **US1 (course authoring & publishing)**
and **US2 (enroll & learn with progress)** — is built and verified. Remaining
user stories (quizzes, assignments, gradebook/certificates UI, admin console,
discussions, analytics) follow `specs/001-lms-platform/tasks.md`.

**What works today**

- Email/password + optional GitHub auth with role-based sessions (Admin /
  Instructor / Student), enforced server-side via a central `authorize()` policy.
- Instructor Studio: create courses, structure modules → lessons, add
  video/text/file content blocks, and publish behind a completeness gate.
- Public catalog with search/filter, course detail, idempotent enrollment.
- Course player with lesson navigation, **mark complete**, resume point, live
  progress, automatic course completion + certificate issuance.
- **My Learning** dashboard with per-course progress.

**Quality:** 37 unit/integration tests + 3 Playwright e2e journeys passing;
`typecheck`, `lint`, and production `build` all green. See
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
