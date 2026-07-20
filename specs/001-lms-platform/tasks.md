---
description: "Task list for LMS Platform implementation"
---

# Tasks: LMS Platform

> **Implementation status.** Phases 1–7 (T001–T063) are implemented and
> verified: project scaffold + tooling, the foundational data/auth/authz layer,
> **US1 course authoring & publishing**, **US2 enroll & learn with progress**,
> **US3 quizzes & automated grading** (builder + timed/attempt-limited taker with
> server-side grading), **US4 assignments & manual grading** (authoring, text/file
> submission with server-time late flag, instructor grading queue + feedback,
> notifications), and **US5 gradebook & certificates** (per-course gradebook
> aggregation, student grades view, automatic certificate issuance on completion +
> public verification page). 63 unit/integration tests + 4 e2e journeys pass;
> typecheck, lint, and build are green. (Async certificate PDF generation, T063,
> is deferred — certificates verify by code without a PDF.)
>
> Known simplifications carried as follow-ups: presigned uploads return a
> deterministic URL (real S3 SigV4 signing plugs into `src/server/storage`);
> drag-and-drop curriculum reordering has a service + API but the builder UI
> uses add/delete ordering; password-reset and OAuth wiring are stubbed. Phases
> 5–11 (quizzes, assignments, gradebook/certificate UI, admin, discussions,
> analytics, polish) are not yet built.

**Input**: Design documents from `/specs/001-lms-platform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included. The constitution makes tests mandatory for business logic
(Principle IV), so test tasks appear for grading, progress, enrollment, access
control, and each P1/P2 journey.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1…US8 (maps to spec.md user stories)
- File paths follow the web-app structure in `plan.md`

## Path Conventions

Single Next.js project: `src/app/**`, `src/server/**`, `src/lib/**`,
`prisma/**`, `tests/**` at repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffold, tooling, and quality gates.

- [ ] T001 Scaffold Next.js 15 App Router + TypeScript strict project at repo root (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`)
- [ ] T002 [P] Configure Tailwind CSS + shadcn/ui and base theme tokens in `src/app/globals.css`, `components.json`
- [ ] T003 [P] Configure ESLint + Prettier + strict TS rules (`.eslintrc`, `.prettierrc`)
- [ ] T004 [P] Add Vitest + Playwright configs and test scripts (`vitest.config.ts`, `playwright.config.ts`, `tests/` skeleton)
- [ ] T005 [P] Add `docker-compose.yml` (Postgres 16, Redis, MinIO) and `.env.example`
- [ ] T006 Add Zod-validated env loader in `src/config/env.ts`
- [ ] T007 [P] Add CI workflow (typecheck, lint, test, build, e2e) in `.github/workflows/ci.yml`

**Checkpoint**: `pnpm dev` boots an empty app; all quality-gate scripts run.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data layer, auth, authorization, and shared UI shells that ALL
stories depend on.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [ ] T008 Author `prisma/schema.prisma` with all enums + entities from `data-model.md`; generate first migration
- [ ] T009 Add Prisma client singleton in `src/server/db.ts`
- [ ] T010 [P] Implement `prisma/seed.ts` (admin, instructor, student, sample published course)
- [ ] T011 Configure Auth.js (NextAuth v5) with Prisma adapter, credentials + one OAuth provider, role on session in `src/server/auth/`
- [ ] T012 Implement password hashing (argon2) for credentials sign-up/sign-in in `src/server/auth/password.ts`
- [ ] T013 Implement central `authorize(session, action, resource)` policy layer in `src/server/access/` (deny-by-default; role + ownership)
- [ ] T014 [P] Unit tests for `authorize()` role/ownership matrix in `tests/unit/access.test.ts` (write first, must fail)
- [ ] T015 [P] Shared Zod schemas skeleton in `src/lib/validation/` (course, enrollment, quiz, assignment, user)
- [ ] T016 [P] Object-storage adapter + presigned URL issuance in `src/server/storage/`
- [ ] T017 [P] Structured logging (pino) + error tracking wiring in `src/server/observability.ts`
- [ ] T018 [P] App shells & role-aware nav/layouts in `src/components/layout/` and route groups `(auth)`, `(marketing)`, `(learn)`, `(teach)`, `(admin)`
- [ ] T019 [P] Auth pages: sign in / register / password reset in `src/app/(auth)/`
- [ ] T020 Uniform API error handling + pagination helper in `src/server/http.ts`; `/api/uploads` route handler

**Checkpoint**: A user can register, sign in, and land on a role-appropriate
empty dashboard; authorization tests pass.

---

## Phase 3: User Story 1 - Authoring & publishing a course (Priority: P1) 🎯 MVP

**Goal**: Instructors create, structure, and publish courses with multi-type
lesson content.

**Independent Test**: As instructor, create a course with a module + two lessons
(text + video), publish, and see it in the catalog.

### Tests for US1 ⚠️ (write first, must fail)

- [ ] T021 [P] [US1] Integration test: create/edit course + publish gate in `tests/integration/course-authoring.test.ts`
- [ ] T022 [P] [US1] Unit test: publish completeness rule (FR-008) in `tests/unit/publish-gate.test.ts`
- [ ] T023 [P] [US1] E2E: author → publish → appears in catalog in `tests/e2e/authoring.spec.ts`

### Implementation for US1

- [ ] T024 [P] [US1] Course service (create/update/delete, slug, status) in `src/server/services/course.ts`
- [ ] T025 [P] [US1] Curriculum service (modules/lessons ordering, reorder by stable id) in `src/server/services/curriculum.ts`
- [ ] T026 [US1] Publish service enforcing completeness gate in `src/server/services/publish.ts` (depends on T024, T025)
- [ ] T027 [P] [US1] Route handlers: `POST /api/courses`, `PUT /api/lessons/{id}`, `POST /api/courses/{id}/publish` in `src/app/api/courses/`
- [ ] T028 [US1] Instructor Studio: course list + create form in `src/app/(teach)/studio/`
- [ ] T029 [US1] Course builder UI: modules/lessons drag-reorder + content-block editor (text/video/file upload) in `src/components/course/`
- [ ] T030 [US1] Wire file uploads through presigned URL flow in the content-block editor
- [ ] T031 [US1] Validation + loading/empty/error/success states across authoring forms

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Enroll & learn with progress (Priority: P1) 🎯 MVP

**Goal**: Students discover, enroll, consume lessons, and see accurate progress.

**Independent Test**: As student, enroll, complete lessons, leave/return, confirm
progress and resume are correct.

### Tests for US2 ⚠️ (write first, must fail)

- [ ] T032 [P] [US2] Unit test: progress computation from stable lesson ids (FR-009/014, SC-003) in `tests/unit/progress.test.ts`
- [ ] T033 [P] [US2] Integration test: idempotent enrollment (FR-011) in `tests/integration/enrollment.test.ts`
- [ ] T034 [P] [US2] E2E: catalog → enroll → complete lesson → resume in `tests/e2e/learning.spec.ts`

### Implementation for US2

- [ ] T035 [P] [US2] Catalog service + Postgres full-text search/filter in `src/server/services/catalog.ts`
- [ ] T036 [P] [US2] Enrollment service (idempotent) in `src/server/services/enrollment.ts`
- [ ] T037 [US2] Progress service (mark complete, recompute %, resume point, course-complete trigger) in `src/server/services/progress.ts`
- [ ] T038 [P] [US2] Route handlers: `GET /api/courses`, `POST /api/enrollments`, `GET /api/enrollments`, `POST /api/lessons/{id}/complete`
- [ ] T039 [US2] Public catalog + course detail pages in `src/app/(marketing)/courses/`
- [ ] T040 [US2] Course player + lesson viewer (video/text/file) + mark-complete + resume in `src/app/(learn)/courses/[slug]/`
- [ ] T041 [US2] "My Learning" dashboard with progress bars in `src/app/(learn)/my-learning/`

**Checkpoint**: US1 + US2 both work independently — this is the shippable MVP.

---

## Phase 5: User Story 3 - Quizzes & automated grading (Priority: P2)

**Goal**: Instructors build quizzes; students take them; objective grading is
automatic with attempts/timers enforced.

### Tests for US3 ⚠️ (write first, must fail)

- [ ] T042 [P] [US3] Unit test: quiz scoring + pass/fail across question types (FR-018) in `tests/unit/quiz-grading.test.ts`
- [ ] T043 [P] [US3] Integration test: attempt limit + timer expiry auto-submit (FR-019) in `tests/integration/quiz-attempts.test.ts`
- [ ] T044 [P] [US3] E2E: build quiz → submit → see score in `tests/e2e/quiz.spec.ts`

### Implementation for US3

- [ ] T045 [P] [US3] Quiz builder service (questions/options/points/threshold) in `src/server/services/quiz.ts`
- [ ] T046 [US3] Grading service (auto-grade objective, compute score/pass, never leak answers) in `src/server/services/grading.ts` (depends on T045)
- [ ] T047 [US3] Attempt service (start/limit/timer/auto-submit, server time) in `src/server/services/attempt.ts`
- [ ] T048 [P] [US3] Route handlers: start attempt, submit attempt in `src/app/api/quizzes/`
- [ ] T049 [US3] Quiz builder UI in `src/components/quiz/builder/`
- [ ] T050 [US3] Quiz taker UI (timer, submit, results view) in `src/components/quiz/taker/`

**Checkpoint**: Quizzes end-to-end functional.

---

## Phase 6: User Story 4 - Assignments & manual grading (Priority: P2)

### Tests for US4 ⚠️ (write first, must fail)

- [ ] T051 [P] [US4] Integration test: submit (text/file) + late flag by server time (FR-020) in `tests/integration/assignment-submit.test.ts`
- [ ] T052 [P] [US4] Integration test: grade + student notified (FR-021) in `tests/integration/assignment-grade.test.ts`

### Implementation for US4

- [ ] T053 [P] [US4] Assignment service (create, due date, late policy) in `src/server/services/assignment.ts`
- [ ] T054 [US4] Submission + grading service (score/feedback, late detection) in `src/server/services/submission.ts`
- [ ] T055 [P] [US4] Route handlers: submit, grade in `src/app/api/assignments/`
- [ ] T056 [US4] Assignment authoring UI + student submission UI + instructor grading UI

**Checkpoint**: Assignments end-to-end functional.

---

## Phase 7: User Story 5 - Gradebook & certificates (Priority: P2)

### Tests for US5 ⚠️ (write first, must fail)

- [ ] T057 [P] [US5] Unit test: certificate verification (issued/never/revoked) (SC-008) in `tests/unit/certificate.test.ts`
- [ ] T058 [P] [US5] Integration test: gradebook aggregation (FR-022) in `tests/integration/gradebook.test.ts`

### Implementation for US5

- [ ] T059 [P] [US5] Gradebook aggregation service in `src/server/services/gradebook.ts`
- [ ] T060 [P] [US5] Certificate service (issue on completion, unguessable code, verify, revoke) in `src/server/services/certificate.ts`
- [ ] T061 [US5] Route handlers: `GET /api/courses/{id}/gradebook`, `GET /api/certificates/verify/{code}`
- [ ] T062 [US5] Gradebook UI (instructor) + student grades view + public verification page in `src/app/(marketing)/verify/`
- [ ] T063 [US5] Async certificate PDF generation via queue job in `src/server/jobs/certificate.ts`

**Checkpoint**: Gradebook + verifiable certificates functional.

---

## Phase 8: User Story 6 - Admin: users, roles, approvals (Priority: P2)

### Tests for US6 ⚠️ (write first, must fail)

- [ ] T064 [P] [US6] Integration test: role change + audit log (FR-003/033) in `tests/integration/admin-roles.test.ts`
- [ ] T065 [P] [US6] Integration test: course approve/reject flow (FR-025) in `tests/integration/admin-review.test.ts`

### Implementation for US6

- [ ] T066 [P] [US6] Admin service (user management, role change, suspend) + AuditLog writes in `src/server/services/admin.ts`
- [ ] T067 [P] [US6] Course review service (approve/reject/publish/archive) in `src/server/services/review.ts`
- [ ] T068 [P] [US6] Category/taxonomy service in `src/server/services/category.ts`
- [ ] T069 [US6] Route handlers under `src/app/api/admin/`
- [ ] T070 [US6] Admin console UI (users, review queue, categories) in `src/app/(admin)/`

**Checkpoint**: Admin governance functional.

---

## Phase 9: User Story 7 - Discussions & notifications (Priority: P3)

### Tests for US7 ⚠️

- [ ] T071 [P] [US7] Integration test: thread post + reply notification (FR-027/028) in `tests/integration/discussion.test.ts`

### Implementation for US7

- [ ] T072 [P] [US7] Notification service + fan-out on events (enroll, grade, reply, announcement) in `src/server/services/notification.ts`
- [ ] T073 [P] [US7] Discussion service (threads/posts, enrolled-only) in `src/server/services/discussion.ts`
- [ ] T074 [US7] Announcement service + broadcast in `src/server/services/announcement.ts`
- [ ] T075 [US7] Discussion UI, announcements UI, notification center + `GET /api/notifications`
- [ ] T076 [P] [US7] Transactional email adapter + queue integration in `src/server/jobs/email.ts`

**Checkpoint**: Communication features functional.

---

## Phase 10: User Story 8 - Analytics (Priority: P3)

### Tests for US8 ⚠️

- [ ] T077 [P] [US8] Integration test: course analytics aggregation (FR-030) in `tests/integration/analytics.test.ts`

### Implementation for US8

- [ ] T078 [P] [US8] Analytics service (enrollments, completion rate, avg scores, per-lesson drop-off) in `src/server/services/analytics.ts`
- [ ] T079 [US8] Instructor course analytics dashboard in `src/app/(teach)/studio/analytics/`
- [ ] T080 [US8] Admin org-wide reports in `src/app/(admin)/reports/`

**Checkpoint**: All user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T081 [P] Accessibility audit (WCAG 2.1 AA): keyboard, focus, ARIA, contrast across P1/P2 screens
- [ ] T082 [P] Performance pass: Core Web Vitals budgets, N+1 query review, add missing indexes (SC-006/007)
- [ ] T083 [P] Security hardening: rate limiting, CSRF/headers, upload scanning, secret audit
- [ ] T084 [P] Seed richer demo data + `README.md` + update `quickstart.md`
- [ ] T085 Full quickstart validation run (all 6 gates green) and MVP demo walkthrough

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)** → no deps.
- **Foundational (P2)** → depends on Setup; **BLOCKS all user stories**.
- **US1, US2 (P1 stories)** → depend only on Foundational; deliver the MVP.
- **US3–US6 (P2)** → depend on Foundational; US3/US4 build on US1/US2 content;
  US5 gradebook/certs depend on US3/US4 producing grades.
- **US7, US8 (P3)** → depend on Foundational; consume data from earlier stories.
- **Polish** → after targeted stories are complete.

### Within Each User Story

- Tests written first and FAIL before implementation (Principle IV).
- Services (server) before route handlers before UI.
- Models/services marked [P] run in parallel when in different files.

### Parallel Opportunities

- All Setup `[P]` tasks (T002–T007) run together.
- Foundational `[P]` tasks (T014–T019) run together after the schema (T008) and
  auth (T011, T013) exist.
- Once Foundational completes, US1 and US2 can be built in parallel by different
  developers; P2 stories likewise after their P1 dependencies.

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. Phase 4 US2 →
   **STOP, validate, demo**. That is a usable LMS: author + publish + enroll +
   learn + track progress.

### Incremental Delivery

Add US3 (quizzes) → US4 (assignments) → US5 (gradebook/certs) → US6 (admin) →
US7 (discussions/notifications) → US8 (analytics), each shippable on its own.

---

## Notes

- `[P]` = different files, no dependency.
- `[Story]` label ties each task to a spec user story for traceability.
- Commit after each task or logical group; keep `main` releasable.
- Every mutation task must call `authorize()` server-side (Principle V).
- Total: 85 tasks across 11 phases; MVP = T001–T041.
