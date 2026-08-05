# Phase 0 Research: Assigned Course Visibility

No unresolved `NEEDS CLARIFICATION` markers remain in the Technical Context —
this is an established codebase, not a greenfield choice of stack. The
research below is about *design* decisions: how to fit this feature into the
existing `policy.ts` / `Enrollment`-centric architecture with the smallest
possible surface area, verified against the actual current code (not assumed).

## Decision 1: Assignment auto-enrolls by creating the same `Enrollment` row self-enroll creates

**Decision**: `assignCourseToStudent()` and the group-assignment reconciliation
both upsert a real `Enrollment` row (`status: ACTIVE`), identical in shape to
what `enroll()` creates today for self-service.

**Rationale**: Every downstream feature — progress (`progress.ts`), quiz
attempts (`attempt.ts`), assignments (`submission.ts`), discussions
(`discussion.ts`'s `isEnrolled`), the gradebook, certificates — already keys
off "does an `Enrollment` row exist for this student+course", not off *how*
the student got there. Reusing `Enrollment` means zero changes to any of
those ~9 call sites' core logic; the only thing that needs to change is
*which enrollments count as currently active* (see Decision 3).

**Alternatives considered**: A separate `hasAccessTo(course)` check layered
in front of every existing feature. Rejected — it would require touching
every one of progress/quiz/assignment/discussion/gradebook/certificate code,
each of which already has its own tested ownership check, for no behavioral
gain over just creating the `Enrollment` row assignment already implies.

## Decision 2: Restricted-course visibility is a single query predicate, not a per-request "effective access" computation

**Decision**: `course:read`'s policy case changes from:

```ts
if (action.course.status === "PUBLISHED") return true;
```

to:

```ts
if (action.course.status === "PUBLISHED" && action.course.visibility === "OPEN") return true;
```

...and falls through to the existing `owns(principal, action.course) ||
action.isEnrolled === true` line unchanged. The public catalog query
(`catalog.ts`) adds `visibility: "OPEN"` to its existing `status:
"PUBLISHED"` filter and needs no per-viewer branching at all — Restricted
courses simply never appear there, for anyone, including students who are
already assigned. Assigned students reach the course exclusively through
their existing "My Learning" list (already enrollment-driven, needs no
changes) or a direct link.

**Rationale**: `isEnrolled` is already computed at each of the ~4 call sites
that need it (`course:read`, `discussion:participate`) by checking for an
`Enrollment` row. Since assignment *is* an `Enrollment` row (Decision 1),
those call sites automatically do the right thing once they also respect
`Enrollment.status` (Decision 3) — no new "does this student have access via
a group" query needs to run on every page view. Group membership is only
ever resolved at *write* time (when membership or a group's course
assignments change), not read time. This keeps every hot read path exactly
as fast as it is today.

**Alternatives considered**: Compute "effective access" (direct ∪
group-derived) live on every course-detail/catalog read. Rejected as
unnecessary complexity and a performance regression — it would require
joining through `GroupMembership` on every page view for a fact (the
student's enrollment) that's already been materialized once, at
assignment/membership-change time.

## Decision 3: Revocation reuses the existing (currently unused) `EnrollmentStatus.CANCELLED`, and every ownership-check call site is upgraded to require `ACTIVE`

**Verified current state**: grepping the codebase, `EnrollmentStatus.CANCELLED`
is declared in `schema.prisma` and `data-model.md` (001) but **no code path
sets it or filters on it** anywhere today — every one of the 9 places that
load an `Enrollment` row for ownership (`attempt.ts`, `discussion.ts`,
`gradebook.ts`, `player.ts`, `progress.ts`, `submission.ts`,
`video-progress.ts`, `enrollment.ts` itself, `announcement.ts`'s recipient
list) does a bare `findUnique`/`findFirst` with no `status` filter. This
means FR-011 ("revoke... student cannot continue the course") isn't
achievable just by changing `CourseAssignment`/`GroupMembership` state — the
`Enrollment` row itself must reflect it, or every one of those checks would
still succeed.

**Decision**: Add a single shared loader, `loadActiveEnrollmentForAuthz()` in
`enrollment.ts`, that wraps the ownership lookup and treats a
`status: CANCELLED` enrollment as not found (throws `NotFoundError`, same
404-on-missing convention every other `loadXForAuthz` helper already uses).
Migrate all 9 call sites to use it instead of a raw `db.enrollment.findUnique`.
Revocation (direct or group-derived-with-no-remaining-route) sets
`status: CANCELLED`, never deletes the row — preserving progress/certificates
per FR-009.

**Rationale**: Centralizing "is this enrollment currently active" in one
helper, rather than adding a `status` filter independently to 9 call sites,
matches the codebase's established pattern of one shared `loadXForAuthz`
function per authorization-relevant resource, and makes it impossible for a
future call site to forget the filter.

**Alternatives considered**: A new `EnrollmentStatus.SUSPENDED` value distinct
from `CANCELLED`, to distinguish "revoked by admin" from some hypothetical
future "student cancelled their own enrollment." Rejected — no requirement in
the spec needs to distinguish *why* an enrollment is inactive, and the
constitution's simplicity principle (no design for hypothetical future
requirements) rules it out. `CANCELLED` already means exactly "not
currently active," which is all this feature needs.

## Decision 4: Group-derived access is reconciled at write time via a shared pure function

**Decision**: A new pure module, `src/server/services/assignment-calc.ts`
(naming matches the existing `progress-calc.ts` / `grading-calc.ts`
convention), exports `hasRemainingAccess(studentId, courseId, {
directAssignments, memberships, groupCourseAssignments }): boolean` — no DB
access, exhaustively unit-testable. The DB-touching wrapper in
`assignment.ts`/`group.ts` calls it whenever a `CourseAssignment` or
`GroupMembership` is removed, to decide whether the student's `Enrollment`
should flip to `CANCELLED`, and whenever one is added, to decide whether a
new `ACTIVE` `Enrollment` needs to be upserted.

**Rationale**: This is exactly the class of logic the constitution calls out
as test-first non-negotiable (access control), and pulling it out as a pure
function makes the "student in two groups, one loses the course assignment"
edge case (spec edge case: "same student in more than one group") trivial to
cover exhaustively, the same way `tests/unit/access.test.ts` covers the
`can()` matrix today.

**Alternatives considered**: Inline the remaining-access check directly in
the Prisma-touching service functions. Rejected — same reasoning as every
other `*-calc.ts` split already in the codebase: untestable without a
database otherwise.

## Decision 5: Self-service `enrollment:create` is denied for Restricted courses; assignment uses its own upsert, not `enroll()`

**Decision**: `policy.ts`'s `enrollment:create` case gains
`action.course.visibility === "OPEN"` as an additional requirement (alongside
the existing `role === "STUDENT" && status === "PUBLISHED"`), closing off
`POST /api/enrollments` as a bypass route for a Restricted course's id.
`assignCourseToStudent()` does **not** call the existing `enroll()` — that
function is shaped around "the acting principal enrolls themselves" and
authorizes via `enrollment:create`. Assignment is instructor/admin-initiated
on behalf of *someone else*, authorized via a new `assignment:manage` action
(instructor-owns-course or admin), and performs its own idempotent
`db.enrollment.upsert` by the same `(studentId, courseId)` unique constraint
`enroll()` already relies on for its own idempotency.

**Rationale**: Reusing `enroll()`'s signature would mean passing the
*student* as `principal`, which is wrong for an instructor-initiated action
and would require the instructor to already have the student's session —
nonsensical. A separate, small upsert with its own authorization action is
the correct shape and mirrors how e.g. `submission.ts`'s grading path
(grader ≠ submitter) already authorizes differently from the student's own
submit path.

**Alternatives considered**: Give `enroll()` an optional "on behalf of"
principal override. Rejected — would weaken an already-simple, well-tested
self-service function's authorization story for a caller shape it was never
designed for.
