# Data Model: Assigned Course Visibility

Additive extension of `prisma/schema.prisma` (source: `specs/001-lms-platform/data-model.md`).
All new tables are CUIDs, carry `createdAt`, and follow the existing
soft-state convention (no hard deletes of assignment/membership history —
see Invariants). No existing table's existing columns change shape; one new
column is added to `Course`.

## New Enums

- `CourseVisibility`: `OPEN | RESTRICTED` — default `OPEN` on the `Course`
  table, so every course that exists before this migration keeps behaving
  exactly as it does today (Success Criterion SC-005).

## Modified Entities

### Course *(extended)*

| Field | Type | Notes |
|-------|------|-------|
| visibility | CourseVisibility | **new**, default `OPEN` |

**Invariant (updated)**: `course:read` and the public catalog now additionally
require `visibility === "OPEN"` for the "published courses are world-readable"
shortcut to apply; a `RESTRICTED` course falls through to the existing
owner-or-enrolled check (see `research.md` Decision 2).

### Enrollment *(no schema change — semantics clarified)*

**Invariant (new)**: `status` MUST be treated as gating access everywhere an
`Enrollment` row is loaded for ownership (`attempt.ts`, `discussion.ts`,
`gradebook.ts`, `player.ts`, `progress.ts`, `submission.ts`,
`video-progress.ts`, `enrollment.ts`, `announcement.ts`). A `CANCELLED`
enrollment is authorization-equivalent to no enrollment at all, while its
row (and every `LessonProgress`/`QuizAttempt`/`Submission`/`Certificate` that
references it) is retained. See `research.md` Decision 3 for the shared
`loadActiveEnrollmentForAuthz()` loader this drives.

## New Entities

### Group

A named, reusable collection of students, scoped to the instructor/admin who
owns it. Not tied to a single course — the same group can have multiple
courses assigned to it over time (spec Assumption).

| Field | Type | Notes |
|-------|------|-------|
| id | string PK | |
| name | string | e.g. "Batch 3 — Fall Cohort" |
| ownerId | string FK → User | the instructor or admin who created/manages it |
| createdAt | datetime | |
| updatedAt | datetime | |

Relations: `owner (User)`, `memberships (GroupMembership[])`,
`courseAssignments (GroupCourseAssignment[])`.

**Invariants**: only `ownerId` (or any admin) may add/remove members or
assign/revoke courses for a group — mirrors course ownership's `owns()`
check. Deleting a group cascades its memberships and course assignments
(FR edge case: "group deleted while it has an assigned course") — the
resulting reconciliation runs the same `hasRemainingAccess()` check as an
individual membership removal, per member per formerly-assigned course.

### GroupMembership

A student's current membership in a group. Existence of the row *is* the
membership — no soft-delete needed here (removing a member removes the row);
the durable history that must survive is the student's `Enrollment` and
progress, not the membership record itself.

| Field | Type | Notes |
|-------|------|-------|
| id | string PK | |
| groupId | string FK → Group | |
| studentId | string FK → User | |
| addedAt | datetime | |

**Constraints**: unique `(groupId, studentId)` — a student is either in a
group or not (FR-010's idempotency for group-derived assignment relies on
this: adding an already-member is a no-op).

**Invariants**: creating a row triggers upserting an `ACTIVE` `Enrollment`
for every course in that group's `courseAssignments`. Deleting a row triggers
`hasRemainingAccess()` per formerly-accessible course, cancelling the
`Enrollment` only if no other route (direct `CourseAssignment` or another
group) remains.

### CourseAssignment

A direct grant of access from one course to one student, independent of any
group.

| Field | Type | Notes |
|-------|------|-------|
| id | string PK | |
| courseId | string FK → Course | |
| studentId | string FK → User | |
| assignedById | string FK → User | instructor or admin who granted it |
| createdAt | datetime | |
| revokedAt | datetime? | null while active |

**Constraints**: unique `(courseId, studentId)` — matches FR-006's
idempotency requirement (assigning twice is a no-op, not a duplicate row);
re-assigning after a revoke updates `revokedAt` back to null rather than
inserting a second row.

**Invariants**: `courseId` must reference a `PUBLISHED` course (spec
Assumption — courses must be published to be assignable, same rule as
self-enrollment already enforces). Creating/reactivating a row upserts an
`ACTIVE` `Enrollment`. Setting `revokedAt` triggers `hasRemainingAccess()`
(a student might still have the course via a group) before deciding whether
to cancel the `Enrollment`.

### GroupCourseAssignment

A grant of access from one course to an entire group; combined with that
group's current `GroupMembership` rows, this determines who currently has
group-derived access.

| Field | Type | Notes |
|-------|------|-------|
| id | string PK | |
| groupId | string FK → Group | |
| courseId | string FK → Course | |
| assignedById | string FK → User | |
| createdAt | datetime | |
| revokedAt | datetime? | null while active |

**Constraints**: unique `(groupId, courseId)` — same idempotency shape as
`CourseAssignment`.

**Invariants**: creating/reactivating upserts an `ACTIVE` `Enrollment` for
every *current* member of the group (future members are handled by
`GroupMembership`'s own invariant above, not by this row). Setting
`revokedAt` runs `hasRemainingAccess()` for every current member against
this course, cancelling each member's `Enrollment` only if no other route
remains.

## Relationships Summary

```text
User (instructor/admin) ──owns──> Group ──has──> GroupMembership ──> User (student)
                                     │
                                     └──has──> GroupCourseAssignment ──> Course

User (instructor/admin) ──grants──> CourseAssignment ──> Course
                                              │
                                              └──> User (student)

(GroupMembership × GroupCourseAssignment) ∪ CourseAssignment
        ──reconciles to──> Enrollment.status (ACTIVE | CANCELLED)
```

A student's *effective* access to a `RESTRICTED` course, at any point in
time, is fully captured by whether their `Enrollment` row for that course is
`ACTIVE` — that row is the materialized result of every direct and
group-derived grant, kept in sync at write time (see `research.md` Decisions
2 and 4). No read path needs to re-derive it.
