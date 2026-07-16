# Implementation Plan: LMS Platform

**Branch**: `001-lms-platform` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-lms-platform/spec.md`

## Summary

Build a multi-role Learning Management System as a single Next.js (App Router)
web application. Instructors author courses (modules → lessons with
video/text/file content) and assessments (quizzes, assignments); students
discover, enroll, learn with tracked progress, take assessments, and earn
verifiable certificates; admins manage users, approve courses, and view reports.

The technical approach: a monolithic Next.js app using React Server Components
for data-heavy pages, Route Handlers + Server Actions for mutations, Prisma over
PostgreSQL for persistence, Auth.js for authentication with role-based
authorization enforced in a server-side data-access layer, Zod for end-to-end
validation, and S3-compatible object storage for uploads. Delivery is sliced by
the spec's prioritized user stories, MVP = US1 (authoring) + US2 (enroll & learn).

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`), Node.js 20+ runtime

**Primary Dependencies**: Next.js 15 (App Router, React 19), Prisma 6, Auth.js
(NextAuth v5), Zod, Tailwind CSS + shadcn/ui, TanStack Query (client cache for
interactive views), React Hook Form, Vitest, Playwright

**Storage**: PostgreSQL 16 (primary data via Prisma); S3-compatible object
storage for file/media uploads; Redis (optional) for rate limiting and
background job queue

**Testing**: Vitest (unit + integration with a test database), Playwright (e2e
for P1/P2 journeys), Prisma migrate for schema; MSW for network mocking where
needed

**Target Platform**: Linux server (Node) behind a CDN; modern evergreen browsers,
responsive 320px→desktop

**Project Type**: Web application (single Next.js full-stack project)

**Performance Goals**: Core Web Vitals "good" (LCP < 2.5s, INP < 200ms, CLS <
0.1); catalog search < 1s over 1k+ courses; quiz grading response < 2s;
API p95 < 300ms for common reads

**Constraints**: Server-enforced authorization on every non-public path; no
secrets in client bundle; all lists paginated; uploads size/type limited;
accessible to WCAG 2.1 AA

**Scale/Scope**: v1 targets ~5,000 learners, ~10,000 enrollments, ~1,000
courses; ~8 user stories, ~15 core entities, ~40 route handlers/actions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies |
|-----------|------------------------|
| I. Spec-Driven Delivery | Every task in `tasks.md` traces to an FR / user story in `spec.md`; no orphan code. |
| II. Vertical Slices | Phases map 1:1 to prioritized user stories; MVP = US1+US2 ships alone. Shared infra lives in the Foundational phase. |
| III. Type-Safe E2E | TS `strict`, Prisma-generated types, Zod schemas shared client/server; no `any` across boundaries. |
| IV. Test-First for Logic | Grading, progress, enrollment, and access rules get unit + integration tests written before implementation; e2e per P1/P2 journey. |
| V. Secure & Role-Aware | Central `authorize()` in the data-access layer; deny-by-default; every mutation re-checks role + ownership on the server. |
| VI. Accessible & Responsive | shadcn/ui accessible primitives, keyboard/focus/ARIA acceptance checks, loading/empty/error/success states required. |
| VII. Observable & Performant | RSC-first rendering, pagination everywhere, structured logging + error tracking, N+1 avoidance via Prisma `include`/`select` and query review. |

**Result**: PASS. No violations requiring Complexity Tracking at this stage.

## Project Structure

### Documentation (this feature)

```text
specs/001-lms-platform/
├── plan.md              # This file
├── research.md          # Phase 0 output — tech decisions & rationale
├── data-model.md        # Phase 1 output — entities, relations, invariants
├── quickstart.md        # Phase 1 output — local setup & smoke test
├── contracts/           # Phase 1 output — API contracts
│   ├── openapi.yaml      #   REST route handler contracts
│   └── README.md         #   Server Action & auth contract notes
├── checklists/          # Optional quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks) — NOT created by /plan
```

### Source Code (repository root)

Single full-stack Next.js project using the App Router. Feature-first modules
under `src/`, with routes grouped by role/segment.

```text
prisma/
├── schema.prisma            # DB schema (source of truth for data types)
├── migrations/              # Committed, reviewed migrations
└── seed.ts                  # Dev/demo seed data

src/
├── app/                     # Next.js App Router
│   ├── (marketing)/         # Public landing + course catalog
│   │   ├── page.tsx
│   │   ├── courses/         # Catalog list + course detail
│   │   └── verify/          # Public certificate verification
│   ├── (auth)/              # Sign in / register / reset
│   ├── (learn)/             # Student area (My Learning, course player)
│   │   ├── my-learning/
│   │   └── courses/[slug]/  # Player, lessons, quizzes, assignments
│   ├── (teach)/             # Instructor studio (course builder, gradebook)
│   │   └── studio/
│   ├── (admin)/             # Admin console (users, approvals, reports)
│   └── api/                 # Route Handlers (REST) — see contracts/openapi.yaml
│       ├── auth/[...nextauth]/
│       ├── courses/
│       ├── enrollments/
│       ├── lessons/
│       ├── quizzes/
│       ├── assignments/
│       ├── certificates/
│       └── uploads/         # Presigned upload URL issuance
├── server/                  # Server-only business logic (never imported by client)
│   ├── auth/                # Auth.js config, session, authorize() guard
│   ├── db.ts                # Prisma client singleton
│   ├── services/            # Domain services: courses, enrollment, grading,
│   │                        #   progress, certificates, notifications
│   ├── access/              # Role + ownership policy functions
│   └── storage/             # Object-storage adapter (presigned URLs)
├── lib/                     # Shared utilities (validation, formatting, slug)
│   └── validation/          # Zod schemas shared client/server
├── components/              # UI components (shadcn/ui-based, accessible)
│   ├── ui/                  # Primitives
│   ├── course/              # Course builder, player, cards
│   ├── quiz/                # Quiz taker/builder
│   └── layout/              # Shells, nav per role
├── hooks/                   # Client hooks (TanStack Query wrappers)
├── types/                   # Shared TS types / enums not owned by Prisma
└── config/                  # env.ts (Zod-validated), constants

tests/
├── unit/                    # Pure logic (grading, progress, access rules)
├── integration/             # Route handlers + services against test DB
└── e2e/                     # Playwright journeys per P1/P2 story

.github/workflows/ci.yml     # type-check, lint, test, build, e2e gates
```

**Structure Decision**: Web application — a single Next.js full-stack project.
A monolith is chosen over separate frontend/backend services because Next.js
Route Handlers + Server Actions already provide the server tier, the domain is
cohesive, and the team is optimizing for delivery speed and end-to-end type
safety. The `src/server/**` boundary keeps business logic server-only and
testable; `src/lib/validation` holds the Zod schemas shared across the boundary.
Splitting into microservices is an explicit non-goal for v1 (see Complexity
Tracking rationale — none required).

## Architecture Notes

- **Rendering**: RSC by default for catalog, course detail, dashboards, and
  gradebook (data-fetching on the server, no client waterfalls). Client
  Components only for interactive surfaces (course builder drag-and-drop, quiz
  taker, rich-text editor), hydrated with TanStack Query where live updates
  matter.
- **Mutations**: Server Actions for form-driven flows (create course, submit
  quiz, grade assignment) with Zod validation and `authorize()` at the top of
  each action. Route Handlers (`/api/**`) provide a documented REST surface for
  external/integration use and file-upload URL issuance.
- **AuthZ**: A single `authorize(session, action, resource)` policy layer in
  `src/server/access` is invoked by every service method; UI hiding is
  cosmetic-only and never the sole control.
- **Files/Media**: Client requests a presigned upload URL from `/api/uploads`,
  uploads directly to object storage, then persists the resulting key — the app
  server never proxies large bodies. Video via embed URL in v1.
- **Background work**: Certificate issuance, bulk notifications, and email are
  dispatched to a lightweight queue (Redis/BullMQ) so request latency stays low;
  synchronous fallback is acceptable for v1 low volumes.
- **Progress integrity**: Completion is computed from `LessonProgress` keyed by
  stable lesson IDs so curriculum reordering/edits never corrupt a learner's
  percentage (FR-009, SC-003).

## Complexity Tracking

> No constitution violations. No entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
