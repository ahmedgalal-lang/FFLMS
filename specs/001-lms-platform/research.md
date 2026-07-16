# Phase 0 Research: LMS Platform

Purpose: resolve the technical unknowns behind the plan's Technical Context and
record the decision + rationale + rejected alternatives for each. All
`NEEDS CLARIFICATION` items from the template are resolved here.

## 1. Framework & Rendering — Next.js App Router

- **Decision**: Next.js 15 (App Router, React 19). RSC-first; Server Actions for
  mutations; Route Handlers for a documented REST surface and uploads.
- **Rationale**: The user mandated Next.js. App Router gives server-side data
  fetching (no client waterfalls), colocated server logic, streaming, and strong
  caching primitives — ideal for a content-heavy LMS. Server Actions reduce
  boilerplate for form flows while keeping validation/authorization on the
  server.
- **Alternatives rejected**: Pages Router (legacy data-fetching model, weaker
  streaming); SPA + separate API (loses SSR SEO for the public catalog,
  duplicates types); Remix (viable, but Next.js was requested and has the larger
  ecosystem for this stack).

## 2. Database & ORM — PostgreSQL + Prisma

- **Decision**: PostgreSQL 16 with Prisma ORM; all schema changes via committed
  migrations; `select`/`include` used deliberately to avoid N+1.
- **Rationale**: The domain is highly relational (users↔courses↔enrollments↔
  progress↔grades). Postgres offers strong constraints, transactions, JSONB for
  flexible quiz payloads, and full-text search for the catalog. Prisma gives
  generated, end-to-end types satisfying Constitution Principle III.
- **Alternatives rejected**: MongoDB (relational integrity across enrollments
  and grades is awkward); Drizzle (excellent, but Prisma's migration tooling and
  type ergonomics are a better fit for the team); raw SQL (loses type safety and
  slows delivery).

## 3. Authentication & Authorization — Auth.js (NextAuth v5)

- **Decision**: Auth.js v5 with the Prisma adapter. Credentials (email/password,
  hashed with argon2/bcrypt) plus at least one OAuth provider. Roles stored on
  the user; a server-side `authorize(session, action, resource)` policy enforces
  role + ownership at the data-access layer.
- **Rationale**: Native Next.js integration, session/JWT handling, CSRF
  protection, and pluggable providers. Centralizing authorization in one policy
  module (not scattered in UI) satisfies Principle V and makes SC-005 testable.
- **Alternatives rejected**: Clerk/Auth0 (fast, but external dependency and cost;
  reserve as future option); hand-rolled auth (security risk, reinvents session
  and CSRF handling).

## 4. Validation — Zod (shared client/server)

- **Decision**: Zod schemas in `src/lib/validation`, imported by both Server
  Actions/Route Handlers and client forms (via React Hook Form resolver), plus a
  Zod-validated `env.ts`.
- **Rationale**: Single source of truth for input contracts at every trust
  boundary (Principle III), inferred TS types, and friendly error messages that
  map to form fields.
- **Alternatives rejected**: Yup (weaker TS inference); manual validation
  (duplicated, error-prone); Valibot (smaller ecosystem for this stack today).

## 5. Styling & Components — Tailwind + shadcn/ui

- **Decision**: Tailwind CSS with shadcn/ui (Radix-based) accessible primitives;
  design tokens for theming; dark mode via CSS variables.
- **Rationale**: shadcn/ui ships accessible, keyboard-navigable components
  (dialogs, menus, tabs) that jump-start Principle VI compliance; Tailwind keeps
  styling colocated and consistent.
- **Alternatives rejected**: MUI/Chakra (heavier runtime, less control over
  bundle); bespoke component library (slower, must re-solve a11y).

## 6. File & Media Storage — S3-compatible object storage + presigned URLs

- **Decision**: Store uploads in S3-compatible object storage. Client obtains a
  presigned URL from `/api/uploads`, uploads directly, then persists the object
  key. Enforce size/type server-side when issuing the URL. Video via embed/hosted
  URL in v1 (no transcoding pipeline).
- **Rationale**: Keeps large payloads off the app server (Principle VII / cost),
  scales independently, and matches FR-034. Embed-based video defers a costly
  transcoding build without blocking the learner experience.
- **Alternatives rejected**: Storing files in Postgres (bloats DB, poor
  streaming); proxying uploads through Node (memory/latency pressure); building
  transcoding in v1 (out of scope, high cost).

## 7. Assessment Model — auto-grade objective, manual-grade subjective

- **Decision**: Quizzes support MC / multi-select / true-false / short-answer;
  objective types auto-graded on submit; short-answer flagged for optional
  manual review. Assignments are always manually graded. Server time authoritative
  for timers; attempts recorded with a policy for best/last score.
- **Rationale**: Directly implements US3/US4 and FR-017–FR-021; keeps grading
  logic in a pure, unit-testable service (Principle IV, SC-004).
- **Alternatives rejected**: Third-party quiz engine (integration overhead, less
  control over grading/reporting); client-side grading (insecure — answers would
  leak; violates Principle V).

## 8. Progress & Completion Integrity

- **Decision**: `LessonProgress` rows keyed by `(enrollmentId, lessonId)`;
  course progress = completed required lessons ÷ total required lessons; lessons
  carry stable IDs and an `isRequired` flag. Completion also gates on required
  assessments passing.
- **Rationale**: Keying by stable lesson identity (not position) keeps progress
  correct across curriculum edits/reordering (FR-009, SC-003).
- **Alternatives rejected**: Position-based progress (breaks on reorder);
  storing a single percentage per enrollment (unauditable, can drift).

## 9. Background Jobs & Email

- **Decision**: Lightweight queue (BullMQ on Redis) for certificate generation,
  bulk notifications, and transactional email via a provider (e.g., Resend/SES).
  Synchronous fallback acceptable at v1 volumes.
- **Rationale**: Keeps request latency low for grading/enrollment while
  fanning-out notifications (FR-028); email delivery offloaded to a specialist.
- **Alternatives rejected**: Doing fan-out inline (latency spikes on large
  cohorts); self-hosted SMTP (deliverability burden).

## 10. Search — Postgres full-text (v1), pluggable later

- **Decision**: Catalog search via Postgres full-text search + trigram indexes
  over course title/description/category.
- **Rationale**: Meets SC-006 (<1s over 1k+ courses) without adding an external
  search service; keeps infra simple for v1.
- **Alternatives rejected**: Elasticsearch/Meilisearch/Algolia (operational and
  cost overhead unjustified at v1 scale; revisit if catalog >100k or relevance
  demands grow).

## 11. Testing Strategy

- **Decision**: Vitest for unit (pure logic) and integration (route handlers +
  services against an ephemeral Postgres via Testcontainers/CI service); Playwright
  for e2e covering each P1/P2 journey; seed fixtures for deterministic data.
- **Rationale**: Implements Principle IV's pyramid; e2e guards the money paths
  (author→publish, enroll→learn→complete, quiz submit→grade).
- **Alternatives rejected**: e2e-only (slow, flaky, poor logic coverage);
  mocking the DB in integration tests (misses real constraint/query behavior).

## 12. Deployment & Observability

- **Decision**: Deploy on a Node-capable host (Vercel or containerized Node
  behind a CDN); structured logging (pino) + error tracking (Sentry); managed
  Postgres; env config validated at boot.
- **Rationale**: Satisfies Principle VII (observability) and keeps configuration
  out of source. Choice of host is deferable; the app is host-agnostic.
- **Alternatives rejected**: Bare EC2 hand-management (higher ops burden for v1);
  serverless-only DB access without pooling (connection exhaustion risk — use a
  pooler if serverless).

## Resolved Decisions (from analysis remediation)

- **Attempt scoring (FR-019)**: when multiple attempts are allowed, the
  **highest-scoring** attempt is the attempt of record; configurable per quiz,
  default = highest.
- **Short-answer grading (FR-018)**: auto-graded by case-insensitive,
  whitespace-trimmed exact match against accepted answer(s), then flagged for
  optional instructor manual override before the score is final.
- **Background jobs (plan §Architecture)**: Redis/BullMQ queue is the standard
  path for certificate PDF generation, notification fan-out, and email; a
  **synchronous fallback is acceptable at v1 volumes** and each job task must run
  either way (see tasks T063, T072, T076).

## Open Questions Deferred to Clarification (non-blocking for MVP)

- Exact certificate template/branding and whether PDF generation is server-side
  vs. on-demand render (issuance logic and verification are already specified;
  only the visual template is open).

The item above has a safe MVP default (server-rendered PDF from an HTML
template) and does not block P1/P2 delivery.
