# LMS Platform Constitution

## Core Principles

### I. Spec-Driven Delivery

Every feature begins as a specification, not code. The flow is
`constitution → specify → clarify → plan → tasks → implement`, and no
implementation task starts before its parent user story exists in `spec.md`
with acceptance scenarios. Specs describe **what** and **why** in
technology-agnostic terms; the plan owns the **how**. Any code that cannot be
traced back to a functional requirement (FR) or user story is out of scope and
must be removed or promoted into the spec first.

### II. Vertical Slices, Independently Shippable

Work is organized as prioritized user stories (P1, P2, P3…). Each story is an
independently testable, independently deployable slice that delivers user value
on its own. P1 is the MVP: shipping only P1 must still yield a usable product.
Stories must not create hidden cross-story coupling that breaks this
independence — shared foundations live in the Foundational phase, not inside a
story.

### III. Type-Safe, End-to-End

TypeScript in `strict` mode is mandatory across the entire stack. Data
contracts are validated at every trust boundary: inbound requests, form input,
and environment variables are parsed with a schema validator (Zod) before use.
The database schema (Prisma), the API layer, and the UI share the same source
of truth for types — no `any`, no unchecked casts across a boundary, no
duplicated hand-written type definitions where a generated one exists.

### IV. Test-First for Business Logic (NON-NEGOTIABLE)

Business logic — grading, progress calculation, enrollment rules, quiz scoring,
access control — must have automated tests written before or alongside the
implementation, and those tests must fail before the code exists. The pyramid:
unit tests for pure logic, integration tests for API routes and database
access, and end-to-end tests for each P1/P2 critical user journey. A user story
is not "done" until its acceptance scenarios are covered by passing tests.

### V. Secure & Role-Aware by Default

Every route, server action, and data query is deny-by-default. Authorization is
checked on the server for every mutation and every access to non-public data —
never trusted from the client. Roles (Admin, Instructor, Student) and resource
ownership are enforced at the data-access layer, not just hidden in the UI.
Secrets never reach the client bundle; passwords are hashed (bcrypt/argon2); all
user-generated content is treated as untrusted and escaped/sanitized.

### VI. Accessible, Responsive UX

The UI targets WCAG 2.1 AA. All interactive elements are keyboard-navigable,
have visible focus, and carry correct semantics/ARIA. Layouts are responsive
from 320px mobile to desktop. Every async action exposes loading, empty, error,
and success states — no dead-end blank screens. Color is never the sole carrier
of meaning.

### VII. Observable & Performant

User-facing pages target Core Web Vitals in the "good" range (LCP < 2.5s, INP <
200ms, CLS < 0.1) on a median connection. Server work is instrumented with
structured logging and error tracking; failures are captured with enough
context to diagnose without reproduction. Database access avoids N+1 queries and
paginates any unbounded list. Performance budgets are part of acceptance, not an
afterthought.

## Technology Constraints

- **Framework**: Next.js (App Router) with React Server Components as the
  default; client components only where interactivity requires them.
- **Language**: TypeScript `strict`; ESLint + Prettier enforced in CI.
- **Data**: PostgreSQL via Prisma ORM; all schema changes go through committed,
  reviewed migrations — never manual, out-of-band DB edits.
- **Auth**: Session/JWT auth via Auth.js (NextAuth) with role-based access
  control.
- **Validation**: Zod schemas shared between client and server.
- **Styling**: Tailwind CSS with an accessible component library (shadcn/ui).
- **Testing**: Vitest (unit + integration) and Playwright (e2e).
- **Environments**: All configuration comes from validated environment
  variables; no hardcoded secrets, URLs, or credentials in source.

## Development Workflow & Quality Gates

- **Branching**: Feature work happens on feature branches; `main` is always
  releasable.
- **CI gates (all must pass to merge)**: type-check, lint, unit + integration
  tests, build, and e2e for touched P1/P2 journeys.
- **Reviews**: Every change is reviewed against this constitution and the
  spec's acceptance scenarios. Reviewers verify authorization checks and test
  coverage explicitly.
- **Migrations**: Any PR touching the data model includes the Prisma migration
  and updates `data-model.md`.
- **Definition of Done**: acceptance scenarios pass, tests are green, a11y and
  performance budgets are met, and docs/quickstart reflect the change.

## Governance

This constitution supersedes ad-hoc practice. When a rule must be broken, the
violation is documented in the plan's **Complexity Tracking** table with the
concrete need and the simpler alternative that was rejected, and it must be
approved in review.

Amendments require: a written rationale, an update to this document with a
version bump, and a migration note if existing code is affected. Versioning
follows semantic rules — MAJOR for principle removal/redefinition, MINOR for a
new principle or materially expanded guidance, PATCH for clarifications.

All plans, tasks, and reviews must verify compliance with these principles.
Complexity must always be justified against the simplest approach that satisfies
the requirement.

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
