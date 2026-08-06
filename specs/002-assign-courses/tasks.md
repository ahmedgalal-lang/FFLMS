---
description: "Task list for Assigned Course Visibility (002-assign-courses)"
---

# Tasks: Assigned Course Visibility

**Input**: Design documents from `/specs/002-assign-courses/` (plan.md, spec.md, research.md, data-model.md, contracts/README.md, quickstart.md)

**Tests**: Included. Per the project constitution (Principle IV, non-negotiable), access-control and grading-class business logic is test-first — the pure `assignment-calc.ts` module and every `policy.ts` addition get unit tests, and every new service gets integration tests, following the exact pattern already used by `tests/unit/access.test.ts` and `tests/integration/enrollment.test.ts`.

**⚠️ Naming note**: The codebase already has a `model Assignment` (graded coursework — `src/server/services/assignment.ts` does not exist yet but `submission.ts` and the `Assignment` content-block type do). This feature's `CourseAssignment` Prisma model and `src/server/services/course-assignment.ts` service are a **different concept** (a course-access grant, not coursework). File/module names below use `course-assignment.ts` / `course-assign.ts` routes, not bare `assignment.ts`, specifically to avoid colliding with the existing coursework `Assignment` domain — do not rename these to match `research.md`/`contracts/README.md`'s shorthand prose ("assignment.ts") literally; those docs use the short form for readability, this file's paths are the authoritative ones.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1/US2/US3)

## Path Conventions

Single Next.js project — `src/`, `tests/`, `prisma/` at repository root, per `plan.md`'s Project Structure.

---

## Phase 1: Setup (Schema)

**Purpose**: Extend the persistence layer. Nothing in later phases can be implemented until this migration exists.

- [ ] T001 Add `CourseVisibility` enum (`OPEN | RESTRICTED`) and a `visibility` field (default `OPEN`) to the `Course` model in `prisma/schema.prisma`
- [ ] T002 [P] Add `Group`, `GroupMembership`, `CourseAssignment`, `GroupCourseAssignment` models to `prisma/schema.prisma`, per `data-model.md` (unique constraints: `GroupMembership(groupId, studentId)`, `CourseAssignment(courseId, studentId)`, `GroupCourseAssignment(groupId, courseId)`)
- [ ] T003 Run `pnpm db:migrate` to generate and commit the migration in `prisma/migrations/`; update `specs/001-lms-platform/data-model.md`'s enum list to mention the new `CourseVisibility` enum exists (cross-reference only, full entity docs stay in this feature's own `data-model.md`)

**Checkpoint**: `pnpm typecheck` passes with the new Prisma Client types available.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared access-control plumbing every user story depends on. Per `research.md` Decisions 2–3, this is what makes `RESTRICTED` courses actually invisible/inaccessible without touching every downstream feature.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests for Foundational logic (write first, confirm they fail)

- [ ] T004 [P] Unit tests for `hasRemainingAccess()` in `tests/unit/course-assignment-access.test.ts` — cover: direct assignment only, group assignment only, both, neither, student in two groups where one loses the course, direct assignment revoked but group access remains (mirrors the exhaustive-matrix style of `tests/unit/access.test.ts`)
- [ ] T005 [P] Unit tests for the updated `can()` cases in `tests/unit/access.test.ts` — add cases for `course:read` on a `RESTRICTED` course (owner passes, enrolled student passes, unenrolled student fails), `enrollment:create` denied when `course.visibility === "RESTRICTED"`, and the three new `Action` variants (`course:visibility`, `group:manage`, `assignment:manage`) for owner/admin/other-instructor/student

### Implementation

- [ ] T006 [P] Create the pure `hasRemainingAccess(studentId, courseId, { directAssignments, memberships, groupCourseAssignments }): boolean` function in `src/server/services/course-assignment-calc.ts` (no DB access — mirrors `progress-calc.ts`/`grading-calc.ts`)
- [ ] T007 Add `loadActiveEnrollmentForAuthz(studentId, courseId)` to `src/server/services/enrollment.ts` — wraps the existing ownership lookup, throws `NotFoundError` (same 404-on-missing convention as other `loadXForAuthz` helpers) when the enrollment's `status` is `CANCELLED`
- [ ] T008 [P] Add `{ type: "course:visibility"; course: CourseResource }`, `{ type: "group:manage"; group: GroupResource }`, `{ type: "assignment:manage"; course: CourseResource }` to the `Action` union and their `can()` cases in `src/server/access/policy.ts` — each reuses the existing `owns()` + admin-bypass shape already used by `course:update`
- [ ] T009 Update the `course:read` case in `src/server/access/policy.ts`: the `status === "PUBLISHED"` shortcut now additionally requires `action.course.visibility === "OPEN"`; the existing `owns(...) || action.isEnrolled === true` fallback is unchanged
- [ ] T010 Update the `enrollment:create` case in `src/server/access/policy.ts`: add `action.course.visibility === "OPEN"` as a required condition alongside the existing role/status checks
- [ ] T011 [P] Update `listCourses()` in `src/server/services/catalog.ts` to add `visibility: "OPEN"` to its `WHERE` clause (Restricted courses never appear in the public catalog, per `research.md` Decision 2 — no per-viewer branching)
- [ ] T012 Migrate the existing ownership-check `db.enrollment.findUnique` calls to use `loadActiveEnrollmentForAuthz()` instead of a raw lookup, in: `src/server/services/attempt.ts`, `src/server/services/discussion.ts`, `src/server/services/gradebook.ts`, `src/server/services/player.ts`, `src/server/services/progress.ts`, `src/server/services/submission.ts`, `src/server/services/video-progress.ts` (7 files — `announcement.ts` already filters `status: { not: "CANCELLED" }` correctly and needs no change; `enrollment.ts`'s own `enroll()`/idempotency lookup is a separate self-service concern, out of scope for this feature, leave as-is)
- [ ] T013 [P] Add `courseAssignSchema` (`{ courseId, studentId }`), `groupCreateSchema` (`{ name }`), `groupAssignCourseSchema` (`{ groupId, courseId }`), `groupMemberSchema` (`{ groupId, studentId }`) to `src/lib/validation/index.ts`

**Checkpoint**: Foundation ready — `pnpm test` (unit) passes for the new access-control matrix; `pnpm typecheck` and `pnpm lint` are clean. Every user story below can now proceed.

---

## Phase 3: User Story 1 - Assign a course to a student (Priority: P1) 🎯 MVP

**Goal**: An instructor/admin can mark a course Restricted and directly assign it to one student, who is auto-enrolled; an unassigned student sees nothing.

**Independent Test**: Mark a course Restricted, assign it to one student, confirm it's in their My Learning and invisible to a different student — no groups involved.

### Tests for User Story 1

- [ ] T014 [P] [US1] Integration test in `tests/integration/course-assignment.test.ts`: instructor assigns own course to a student → student's `Enrollment` is `ACTIVE`; instructor cannot assign a course they don't own (403-equivalent `AuthorizationError`); admin can assign any course; assigning twice is a no-op (FR-001–FR-004, FR-010, mirrors `tests/integration/enrollment.test.ts`'s fixture pattern — random-suffixed users/course, cleaned up in `afterAll`)
- [ ] T015 [P] [US1] Integration test in `tests/integration/course-visibility.test.ts`: setting a course to `RESTRICTED` hides it from `listCourses()` and denies `enrollment:create` for a non-assigned student; switching back to `OPEN` restores catalog visibility and self-enroll, with existing enrollments from before the switch untouched (FR-012, FR-013, FR-018, SC-005)

### Implementation for User Story 1

- [ ] T016 [US1] Create `src/server/services/course-assignment.ts` with `assignCourseToStudent(principal, courseId, studentId)` (authorizes via `assignment:manage`, requires `course.status === "PUBLISHED"`, upserts a `CourseAssignment` row — clears `revokedAt` if re-assigning after a prior revoke, — then upserts an `ACTIVE` `Enrollment` for the student, mirroring `enroll()`'s idempotent upsert shape per `research.md` Decision 5) and `listCourseAssignments(principal, courseId)` (returns direct assignments for the instructor's assignment panel, FR-016)
- [ ] T017 [US1] Add `setCourseVisibility(principal, courseId, visibility)` to `src/server/services/course.ts` (authorizes via `course:visibility`, updates `Course.visibility`, no effect on existing enrollments — FR-018)
- [ ] T018 [US1] Add `setCourseVisibilityAction` and `assignCourseToStudentAction` server actions to `src/app/(teach)/studio/[courseId]/actions.ts` (new file, following the existing `ActionState` convention from `src/app/(teach)/studio/actions.ts`)
- [ ] T019 [US1] Add a visibility toggle (Open/Restricted) to the course settings UI in `src/components/course/course-settings-dialog.tsx`
- [ ] T020 [US1] Create the assignment panel page `src/app/(teach)/studio/[courseId]/assign/page.tsx` — lists current direct assignments (via `listCourseAssignments`) and a form to assign by student email/search, wired to `assignCourseToStudentAction`
- [ ] T021 [US1] Add an "Assign students" link from the course's Studio detail page (`src/app/(teach)/studio/[courseId]/page.tsx`) to the new `/studio/[courseId]/assign` page, visible when the course is `RESTRICTED`
- [ ] T022 [US1] Confirm `src/app/(learn)/my-learning/page.tsx` needs no changes — auto-enrollment via `Enrollment` means the stats tiles and list added earlier already reflect assigned courses correctly; verify manually per `quickstart.md` Story 1

**Checkpoint**: User Story 1 fully functional and independently testable/deployable — this is the MVP. Run `quickstart.md`'s Story 1 walkthrough before proceeding.

---

## Phase 4: User Story 2 - Create a group and assign a course to it (Priority: P2)

**Goal**: Instructor/admin creates a named group, adds students to it (live membership — join grants access, leave revokes it), and assigns a Restricted course to the whole group at once.

**Independent Test**: Create a group, add 5 students, assign a course to the group — all 5 gain access; add a 6th afterward — they gain it automatically; remove one — they lose it (unless they have another route).

### Tests for User Story 2

- [ ] T023 [P] [US2] Integration test in `tests/integration/group.test.ts`: create group → add members → assign course to group → all current members `ACTIVE` enrolled; add a new member after the course was already assigned to the group → auto-enrolled (FR-005–FR-007); remove a member → their `Enrollment` becomes `CANCELLED` unless they retain access via a direct assignment or another group (FR-008, spec edge case "student in more than one group")
- [ ] T024 [P] [US2] Integration test in `tests/integration/group.test.ts` (same file, separate `describe`): assigning a course to a group twice, or adding an already-member twice, is a no-op (FR-010); a non-owning instructor cannot manage another instructor's group or assign someone else's course to their own group

### Implementation for User Story 2

- [ ] T025 [US2] Create `src/server/services/group.ts` with `createGroup(principal, name)`, `addGroupMember(principal, groupId, studentId)` (upserts `GroupMembership`; for every course in the group's active `GroupCourseAssignment`s, upserts an `ACTIVE` `Enrollment` for the student), `removeGroupMember(principal, groupId, studentId)` (deletes the `GroupMembership`; for every formerly-accessible course, calls `hasRemainingAccess()` and cancels the `Enrollment` only if nothing remains), `listGroups(principal)`, `getGroup(principal, groupId)` (FR-017)
- [ ] T026 [US2] Add `assignCourseToGroup(principal, groupId, courseId)` to `src/server/services/group.ts` (authorizes via `assignment:manage` against the course, requires `PUBLISHED`, upserts `GroupCourseAssignment`, upserts `ACTIVE` `Enrollment` for every current member)
- [ ] T027 [US2] Create `src/app/(teach)/studio/groups/actions.ts` with `createGroupAction`, `addGroupMemberAction`, `removeGroupMemberAction`, `assignCourseToGroupAction`, following the existing `ActionState` convention
- [ ] T028 [US2] Create `src/app/(teach)/studio/groups/page.tsx` — list the instructor/admin's groups, create-group form
- [ ] T029 [US2] Create `src/app/(teach)/studio/groups/[groupId]/page.tsx` — group detail: current members (add/remove), courses assigned to the group (assign-course-to-group form scoped to the owner's own published Restricted courses)
- [ ] T030 [US2] Add a "Groups" link to the Studio nav/layout (`src/app/(teach)/studio/page.tsx` or `src/components/layout/app-shell.tsx`, whichever already holds Studio's sub-navigation)

**Checkpoint**: User Stories 1 AND 2 both work independently. Run `quickstart.md`'s Story 2 walkthrough.

---

## Phase 5: User Story 3 - Revoke a course assignment (Priority: P3)

**Goal**: Instructor/admin revokes a direct student assignment or a group's assignment to a course; access is blocked but history (progress/grades/certificates) is preserved.

**Independent Test**: Revoke a direct assignment → course disappears from that student's My Learning, their prior lesson-completion record is still visible to the instructor via the gradebook.

### Tests for User Story 3

- [ ] T031 [P] [US3] Integration test in `tests/integration/course-assignment.test.ts` (extends T014's file): revoking a direct `CourseAssignment` sets the student's `Enrollment.status` to `CANCELLED` unless `hasRemainingAccess()` finds a group route, in which case it stays `ACTIVE` (FR-011); revoking does not delete any `LessonProgress`/`QuizAttempt`/`Submission`/`Certificate` rows (FR-009)
- [ ] T032 [P] [US3] Integration test in `tests/integration/group.test.ts` (extends T023's file): revoking a `GroupCourseAssignment` (unassigning a course from a group entirely) cancels every current member's `Enrollment` for that course, unless a member has another route (direct assignment or a different group) — FR-011, spec edge case "group deleted while it has an assigned course" (same reconciliation path as an explicit revoke)

### Implementation for User Story 3

- [ ] T033 [US3] Add `revokeCourseFromStudent(principal, courseId, studentId)` to `src/server/services/course-assignment.ts` — sets `CourseAssignment.revokedAt`, calls `hasRemainingAccess()`, cancels the `Enrollment` only if nothing remains (FR-007, FR-009, FR-011)
- [ ] T034 [US3] Add `revokeCourseFromGroup(principal, groupId, courseId)` to `src/server/services/group.ts` — sets `GroupCourseAssignment.revokedAt`, runs `hasRemainingAccess()` per current member, cancelling only those with no other route
- [ ] T035 [US3] Add `revokeCourseFromStudentAction` to `src/app/(teach)/studio/[courseId]/actions.ts` and a revoke control next to each row in the assignment panel (`src/app/(teach)/studio/[courseId]/assign/page.tsx`, built in T020)
- [ ] T036 [US3] Add `revokeCourseFromGroupAction` to `src/app/(teach)/studio/groups/actions.ts` and a revoke control next to each assigned-course row in the group detail page (`src/app/(teach)/studio/groups/[groupId]/page.tsx`, built in T029)
- [ ] T037 [US3] Wire group deletion (if `src/app/(teach)/studio/groups/page.tsx`/`[groupId]/page.tsx` exposes a "delete group" action) through the same per-member `hasRemainingAccess()` reconciliation as an explicit `revokeCourseFromGroup`, before the `Group` row itself cascades away — spec edge case "group deleted while it has an assigned course"

**Checkpoint**: All three user stories independently functional. Run `quickstart.md`'s Story 3 walkthrough in full.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T038 [P] E2E test `tests/e2e/course-assignment.spec.ts` covering the Story 1 journey end-to-end through the real UI (sign in as instructor → restrict a course → assign a student → sign in as that student → confirm it's in My Learning; sign in as a different student → confirm it's absent from the catalog), per the project's "one Playwright spec per user story" convention
- [ ] T039 Run the full `quickstart.md` walkthrough (all 3 stories + the regression check) manually against a seeded local DB
- [ ] T040 `pnpm typecheck && pnpm lint && pnpm test` clean; update `README.md`'s feature list and `CLAUDE.md` if any new architectural pattern needs documenting (expected: none, per `plan.md`'s Constitution re-check — confirm this holds)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 (needs the new Prisma types). **Blocks all user stories.**
- **User Story 1 (Phase 3)**: Depends on Phase 2 only. This is the MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2 only — independently testable without US1's assignment panel, though it reuses `assignment:manage` authorization from Phase 2.
- **User Story 3 (Phase 5)**: Depends on Phase 2, and on the service files US1 (`course-assignment.ts`) and US2 (`group.ts`) create — revoke functions are added to those same files, not new ones. Cannot start until T016 and T025 exist.
- **Polish (Phase 6)**: Depends on all three stories being complete.

### Parallel Opportunities

- T001/T002 (schema) can be written together, but T003 (migration generation) must come after both.
- All Foundational tests (T004, T005) and the independent implementation pieces (T006, T008, T011, T013) marked [P] can run in parallel; T007, T009, T010, T012 touch shared files/depend on the schema and should follow.
- Once Phase 2 is checkpointed, **User Story 1 and User Story 2 can be built in parallel** by different people — they touch disjoint files (`course-assignment.ts`+`studio/[courseId]/*` vs `group.ts`+`studio/groups/*`) and neither depends on the other's UI.
- User Story 3 cannot start in parallel with 1/2 — it adds functions to the files US1/US2 create.

---

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → Phase 2 (Foundational, blocking) → Phase 3 (US1).
2. **STOP and VALIDATE**: run `quickstart.md` Story 1. This alone is shippable — an instructor can already restrict a course and hand-assign it to individual students.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → validate → deploy (MVP: direct assignment).
3. US2 → validate → deploy (adds bulk/group assignment on top).
4. US3 → validate → deploy (adds revoke, completing the CRUD).
5. Polish (e2e + full quickstart + doc check).

Each increment is deployable on its own — a course can be restricted and hand-assigned (US1) with no group or revoke UI yet, and nothing about that first release needs to change when US2/US3 land later.
