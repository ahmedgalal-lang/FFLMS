# Contracts: Assigned Course Visibility

This feature adds **no new REST route handlers** — every mutation here is
instructor/admin, form-driven, and fits the project's existing rule that
"Server actions are the default for UI-driven mutations" (`CLAUDE.md`). The
only existing REST surface this feature touches is `GET /api/courses`
(catalog), which gains a `WHERE visibility = 'OPEN'` clause with no change to
its request/response shape — not worth a contract revision.

All new Server Actions live in `src/app/(teach)/studio/**/actions.ts`,
following the existing `ActionState = { error?: string; ok?: boolean }`
convention, and share Zod schemas added to `src/lib/validation/index.ts`.
Every action resolves the principal via `requirePrincipal()` first, same as
every existing action in the file.

## Contract Rules (inherited from `specs/001-lms-platform/contracts/README.md`, unchanged)

Auth, validation, not-found-vs-forbidden, idempotency, and error-shape rules
all apply unchanged. The idempotency rule extends naturally: assigning a
course to a student/group that already has it is a no-op success, not an
error (FR-006, FR-010) — enforced at the DB layer via the unique constraints
in `data-model.md`, not by a pre-check-then-insert race.

## New Server Actions

### `setCourseVisibilityAction(courseId, visibility)`

- **Auth**: course owner (instructor) or admin. `authorize(principal, { type: "course:visibility", course })`.
- **Input**: `{ courseId: string; visibility: "OPEN" | "RESTRICTED" }`.
- **Behavior**: Updates `Course.visibility`. No effect on existing `Enrollment` rows either direction (FR-018) — flips only future catalog/self-enroll visibility.
- **Errors**: 404-equivalent (`AppError`) if the course doesn't exist or isn't owned by the caller.

### `createGroupAction(name)`

- **Auth**: any INSTRUCTOR or ADMIN (groups aren't course-scoped, so there's no course-ownership check at creation).
- **Input**: `{ name: string }` (1–100 chars, matches other name-field schemas in `validation/index.ts`).
- **Output**: the created `Group`, owned by the caller.

### `addGroupMemberAction(groupId, studentId)` / `removeGroupMemberAction(groupId, studentId)`

- **Auth**: group owner or admin. `authorize(principal, { type: "group:manage", group })`.
- **Input**: `{ groupId: string; studentId: string }`.
- **Behavior (add)**: Upserts a `GroupMembership`; for every course currently assigned to the group, upserts an `ACTIVE` `Enrollment` for the student.
- **Behavior (remove)**: Deletes the `GroupMembership`; for every course currently assigned to the group, runs `hasRemainingAccess()` and cancels the student's `Enrollment` for that course only if no other route remains.
- **Errors**: 404 if `studentId` doesn't reference a STUDENT-role user.

### `assignCourseToGroupAction(groupId, courseId)` / `revokeCourseFromGroupAction(groupId, courseId)`

- **Auth**: course owner (instructor) or admin — same `assignment:manage`-family check as the direct-assignment actions, evaluated against the course, not the group.
- **Input**: `{ groupId: string; courseId: string }`.
- **Behavior (assign)**: Requires `course.status === "PUBLISHED"`. Upserts a `GroupCourseAssignment`; upserts an `ACTIVE` `Enrollment` for every current member.
- **Behavior (revoke)**: Sets `revokedAt`; runs `hasRemainingAccess()` per current member, cancelling only those with no other route.

### `assignCourseToStudentAction(courseId, studentId)` / `revokeCourseFromStudentAction(courseId, studentId)`

- **Auth**: course owner (instructor) or admin. `authorize(principal, { type: "assignment:manage", course })`.
- **Input**: `{ courseId: string; studentId: string }`.
- **Behavior (assign)**: Requires `course.status === "PUBLISHED"`. Upserts a `CourseAssignment` (or clears `revokedAt` if re-assigning); upserts an `ACTIVE` `Enrollment` for the student — this is the one call site allowed to create an `Enrollment` on behalf of a *different* principal than the one enrolling, since it's instructor/admin-initiated (see `research.md` Decision 5).
- **Behavior (revoke)**: Sets `revokedAt`; runs `hasRemainingAccess()` (student might still have it via a group) before deciding whether to cancel the `Enrollment`.
- **Errors**: 404 if `studentId` doesn't reference a STUDENT-role user; `AppError` if the course isn't published.

### Read-only loaders (used by the Studio assignment panel and group pages)

- `listCourseAssignments(courseId)` — direct + group-derived students currently with access to a course, for the instructor's assignment panel (FR-016).
- `listGroups()` / `getGroup(groupId)` — a group's current members and assigned courses (FR-017).

## Policy additions (`src/server/access/policy.ts`)

Three new `Action` variants, following the existing discriminated-union
pattern exactly:

```ts
| { type: "course:visibility"; course: CourseResource }
| { type: "group:manage"; group: GroupResource }
| { type: "assignment:manage"; course: CourseResource }
```

`can()` gains one case per variant, each reusing the existing `owns()` /
admin-bypass shape already used by `course:update`/`quiz:manage`/etc. — no
new authorization *mechanism*, just new resource types feeding the same
pattern. `enrollment:create`'s existing case gains one additional condition
(`action.course.visibility === "OPEN"`), and `course:read`'s
published-is-public shortcut gains the same condition (see `research.md`
Decision 2).

See `../data-model.md` for entity shapes and `../spec.md` for the functional
requirements each action satisfies.
