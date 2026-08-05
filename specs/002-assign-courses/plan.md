# Implementation Plan: Assigned Course Visibility

**Branch**: `002-assign-courses` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-assign-courses/spec.md`

## Summary

Add a per-course Open/Restricted toggle, group-based (cohort) course assignment
with live membership, and auto-enrollment on assignment — layered onto the
existing single Next.js app rather than as new infrastructure. Restricted
courses are invisible to the public catalog and to `enrollment:create`
self-service for anyone not granted access; access is granted either directly
(student) or indirectly (via a Group the student belongs to), and granting
access immediately creates the same `Enrollment` row the existing self-enroll
flow creates today, so every downstream feature (progress, quizzes,
certificates, gradebook) needs zero changes — they already key off
`Enrollment`, not off *how* the student got enrolled.

## Technical Context

**Language/Version**: TypeScript 5.x (`strict`, `noUncheckedIndexedAccess`), Node.js 22 — unchanged, existing project.

**Primary Dependencies**: Next.js 15 (App Router, React 19 RSC-first), Prisma 6, Auth.js v5, Zod, Tailwind + shadcn/ui, Vitest, Playwright — no new dependencies required.

**Storage**: PostgreSQL 16 via Prisma. 4 new tables (`Group`, `GroupMembership`, `CourseAssignment`, `GroupCourseAssignment`) plus one new column (`Course.visibility`). All additive — no destructive migration.

**Testing**: Vitest unit tests for the new pure access-decision logic (mirrors `access.test.ts`'s exhaustive-matrix style) and for the "effective access" computation (direct + group-derived); Vitest integration tests for the new services against a real Postgres (mirrors `tests/integration/enrollment.test.ts`); Playwright e2e for the P1 assign→see-in-My-Learning journey.

**Target Platform**: Same as existing app — Linux server (Node), CranL deployment, modern evergreen browsers.

**Project Type**: Web application (single Next.js full-stack project) — feature slots into the existing structure, no new project/service.

**Performance Goals**: Same budgets as the base app (Core Web Vitals "good"); computing a student's effective access (direct ∪ group-derived) must not turn the catalog/My Learning queries into N+1s — a student's group memberships and assignments are fetched with the existing enrollment/catalog query, not per-course.

**Constraints**: Server-enforced authorization only (never trust the client) — `authorize()` gets new `Action` variants, not new ad-hoc checks; a Restricted course must be provably invisible (no leak via search, sitemap, or direct-link 404-vs-403 timing) to a student without access; existing enrollments/courses must be unaffected by the migration (every existing `Course` row defaults to `OPEN` visibility).

**Scale/Scope**: 3 user stories (P1 direct assign, P2 group assign, P3 revoke), 18 FRs, ~4 new Prisma models, ~2 new service modules, ~6-8 new server actions/route handlers, ~3-4 new Studio UI screens (course visibility toggle, group management, per-course assignment panel).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies |
|-----------|------------------------|
| I. Spec-Driven Delivery | Every task in the eventual `tasks.md` traces to an FR in `specs/002-assign-courses/spec.md`; no orphan code. |
| II. Vertical Slices | US1 (direct assign) is independently shippable and is the MVP for this feature; US2 (groups) and US3 (revoke) layer on without US1 needing to change. |
| III. Type-Safe E2E | New Prisma models generate types Zod schemas validate against; no hand-written parallel types; `Course.visibility` is a new enum, not a stringly-typed flag. |
| IV. Test-First for Logic | The "effective access" computation (does student X currently have access to restricted course Y, and why) is pure business logic — grading/progress-caliber — and gets unit tests before/alongside implementation, per the constitution's non-negotiable. |
| V. Secure & Role-Aware | Extends `policy.ts`'s existing deny-by-default `Action` union and `can()` switch rather than introducing a parallel authorization mechanism; catalog/course-read queries gain a `WHERE` clause for visibility, not a client-side filter. |
| VI. Accessible & Responsive | New Studio screens (group manager, assignment panel) reuse existing shadcn/ui primitives (`Dialog`, `Table`-equivalent list rows, `Badge`) already in `src/components/ui/`, keeping the same a11y baseline. |
| VII. Observable & Performant | Effective-access resolution is a single query per page load (join, not N+1); mutations (assign/revoke/group membership change) log via the existing `logger`. |

**Result**: PASS. No violations requiring Complexity Tracking.

**Post-design re-check** (after Phase 1 — see `research.md` and `data-model.md`):
still PASS. The design introduces zero new architectural patterns — new
`Action` variants slot into the existing `policy.ts` switch, new services
follow the existing `Principal`-first/`authorize()`-first shape, the one new
pure-logic module (`assignment-calc.ts`) follows the existing `*-calc.ts`
split, and every new Server Action follows the existing `ActionState`
convention. No Complexity Tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-assign-courses/
├── plan.md              # This file
├── research.md          # Phase 0 output — design decisions & rationale
├── data-model.md        # Phase 1 output — new entities, relations, invariants
├── contracts/           # Phase 1 output
│   ├── openapi.yaml       #   New REST route handler contracts
│   └── README.md          #   Server Action & policy contract notes
├── quickstart.md        # Phase 1 output — manual validation walkthrough
├── checklists/
│   └── requirements.md
└── tasks.md              # Phase 2 output (/speckit-tasks) — NOT created here
```

### Source Code (repository root)

No new top-level directories. This feature extends the existing structure documented in `specs/001-lms-platform/plan.md`:

```text
prisma/
├── schema.prisma                 # + Group, GroupMembership, CourseAssignment,
│                                  #   GroupCourseAssignment models;
│                                  #   + Course.visibility (CourseVisibility enum)
└── migrations/
    └── <new>_add_course_assignment/

src/
├── app/
│   ├── (marketing)/courses/       # catalog query gains a visibility filter
│   ├── (teach)/studio/[courseId]/
│   │   ├── assign/                # NEW — per-course assignment panel (students + groups)
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   └── page.tsx               # gains the Open/Restricted toggle control
│   └── (teach)/studio/groups/     # NEW — group management (create, membership)
│       ├── page.tsx
│       ├── [groupId]/page.tsx
│       └── actions.ts
├── server/
│   ├── access/policy.ts           # + Action variants: course:visibility, group:manage,
│   │                              #   assignment:manage; can() cases for each
│   └── services/
│       ├── course.ts              # loadCourseForAuthz gains `visibility`;
│       │                          #   setCourseVisibility()
│       ├── group.ts                # NEW — createGroup, addMember, removeMember,
│       │                          #   assignCourseToGroup, revokeCourseFromGroup
│       ├── assignment.ts           # NEW — assignCourseToStudent, revokeAssignment,
│       │                          #   effectiveAccess()/hasAccess() pure helpers
│       ├── enrollment.ts           # enroll() reused by assignment auto-enroll path
│       └── catalog.ts              # listCourses() gains visibility-aware WHERE clause
└── lib/validation/index.ts        # + groupCreateSchema, courseAssignSchema, etc.

tests/
├── unit/
│   └── assignment-access.test.ts  # NEW — pure effective-access matrix (mirrors access.test.ts)
├── integration/
│   ├── group.test.ts               # NEW
│   └── assignment.test.ts          # NEW
└── e2e/
    └── course-assignment.spec.ts   # NEW — one journey per priority story
```

**Structure Decision**: Extend the existing single Next.js project in place — no new app, package, or service boundary. Two new service modules (`group.ts`, `assignment.ts`) sit alongside the existing `enrollment.ts`/`course.ts` at the same layer, following the established `Principal`-first, `authorize()`-gated pattern; no new architectural pattern is introduced.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
