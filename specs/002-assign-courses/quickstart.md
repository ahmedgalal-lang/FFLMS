# Quickstart: Assigned Course Visibility

Manual validation guide for this feature once implemented. Assumes the base
platform's own quickstart (`specs/001-lms-platform/quickstart.md`) has already
been followed — a seeded DB with `admin@lms.test` / `instructor@lms.test` /
`student@lms.test` (password `password123`) and `pnpm dev` running.

## Prerequisites

- Migrations applied (`pnpm db:migrate`) including this feature's new tables
  and `Course.visibility` column.
- At least two student accounts to tell apart "assigned" from "unassigned"
  behavior — the seed's `student@lms.test` plus one more created via
  `/sign-up`.

## Story 1 — Direct assignment (P1)

1. Sign in as `instructor@lms.test`, open one of your published courses in
   Studio, and switch its visibility to **Restricted**.
2. Sign in as `student@lms.test` (unassigned) → `/courses` → confirm the
   course is **absent** from the catalog and search.
3. Attempting the course's direct URL (`/courses/<slug>`) as this student →
   confirm it 404s / denies access (not just hides the "Enroll" button).
4. Sign in as the instructor again → the course's assignment panel → assign
   it directly to the second student.
5. Sign in as that second student → **My Learning** → confirm the course
   appears already enrolled, with no separate "Enroll" click required
   (SC-001, FR-014).
6. Repeat step 4 (assign the same student again) → confirm no error, no
   duplicate entry in My Learning (FR-006, FR-010).

**Expected**: unassigned student never sees it anywhere; assigned student has
it in My Learning immediately after one instructor action.

## Story 2 — Group assignment with live membership (P2)

1. As the instructor, create a group (e.g. "Test Cohort") and add the second
   student (from Story 1) to it.
2. Assign the Restricted course from Story 1 to the group.
3. Confirm the student already had access from their direct assignment —
   create/use a *third*, previously-unassigned student for a clean test:
   add them to the group instead and confirm they gain the course in My
   Learning automatically, with no separate assign step (FR-007).
4. Remove that third student from the group → confirm the course disappears
   from their My Learning (FR-008), while the second student (direct
   assignment + group membership) still has it, since they have another
   route to access (edge case: "student in more than one group / multiple
   routes").

**Expected**: group membership changes alone drive access, without any
per-student manual action once the group has a course assigned.

## Story 3 — Revocation preserves history (P3)

1. As the third student from Story 2 (before being removed from the group),
   complete at least one lesson in the Restricted course.
2. As the instructor, revoke that student's access (via group removal, per
   Story 2 step 4, or a direct revoke if they'd been directly assigned).
3. Confirm: the course disappears from their My Learning and they cannot
   continue it (FR-011).
4. As the instructor/admin, confirm via the gradebook/analytics that the
   student's prior lesson-completion record for that course is still present
   (FR-009) — nothing was deleted, only access was blocked.
5. Re-assign the course to that student directly → confirm their prior
   progress is still there (not reset to zero).

**Expected**: revoke blocks future access without erasing history; re-grant
resumes from where they left off.

## Regression check — existing Open courses are unaffected

1. Sign in as any student and confirm the existing seeded/self-enrolled Open
   course from the base quickstart still appears in the catalog and is
   still self-enrollable exactly as before (SC-005).
2. Confirm an admin can still browse/manage every course regardless of
   visibility, same as they could before this feature (admins bypass
   ordinary access checks per the base policy).

## Automated coverage this quickstart complements

- `tests/unit/assignment-access.test.ts` — the `hasRemainingAccess()` matrix
  (direct only / group only / both / neither / multiple groups).
- `tests/integration/group.test.ts`, `tests/integration/assignment.test.ts` —
  real-Postgres versions of Stories 1–3 above, called directly against the
  services (no HTTP layer), following the existing integration-test pattern.
- `tests/e2e/course-assignment.spec.ts` — Story 1 driven through the actual
  browser UI, one journey per the project's "one Playwright spec per user
  story" convention.
