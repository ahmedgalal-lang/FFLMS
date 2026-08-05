# Feature Specification: Assigned Course Visibility

**Feature Branch**: `002-assign-courses`

**Created**: 2026-08-05

**Status**: Draft

**Input**: User description: "Restrict course visibility and enrollment: instructors/admins can assign specific published courses to specific students (or groups), so students only see and can enroll in courses assigned to them rather than the entire public catalog. Needs to coexist with (or replace, TBD) the current fully-open catalog/self-enrollment model. Built with the existing Next.js App Router stack."

**Resolved decisions** (from clarification):

- **Scope**: Per-course toggle. Each instructor marks a course as *Open* (today's behavior — anyone can browse and self-enroll) or *Restricted* (only assigned students/groups can see or access it). No change to existing open courses.
- **Targeting**: Named, reusable **groups/cohorts**, in addition to assigning individuals directly. Group membership is *live*: adding a student to a group grants them access to every course currently assigned to that group; removing them revokes access granted through that group (assignments made to them directly, outside any group, are unaffected).
- **Access on assignment**: Assigning a course (to a student or a group) **auto-enrolls** — the student gets full access immediately, appearing in their existing "My Learning" list exactly like a self-enrolled course does today. No separate "assigned but not yet enrolled" state.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assign a course to a student (Priority: P1)

An instructor (or admin) picks one of their own **restricted** published courses and assigns it directly to a specific student. That student is immediately enrolled and sees the course in My Learning; a student who was never assigned that course does not see it anywhere, including catalog search.

**Why this priority**: This is the core capability the whole feature exists for — without it, nothing else is testable or valuable.

**Independent Test**: As an instructor, mark a course Restricted and assign it to one student. Sign in as that student and confirm the course appears in My Learning, fully accessible. Sign in as a different, unassigned student and confirm the course is invisible everywhere (catalog, search, direct link).

**Acceptance Scenarios**:

1. **Given** an instructor owns a restricted, published course and a student exists, **When** the instructor assigns the course to that student, **Then** the student is auto-enrolled and the course appears in their My Learning immediately.
2. **Given** a student who has not been assigned a restricted course, **When** that student browses or searches the catalog, **Then** the course does not appear, and visiting its direct URL does not grant access.
3. **Given** an admin (not the course's instructor), **When** the admin assigns any published course (restricted or open) to a student, **Then** the assignment succeeds the same as if the owning instructor had made it.
4. **Given** a course is already assigned to a student, **When** the same instructor assigns the same course to the same student again, **Then** the system does not create a duplicate assignment or a duplicate enrollment (idempotent).
5. **Given** an instructor marks one of their courses Restricted, **When** students who had already self-enrolled while it was Open, **Then** their existing enrollment and access continue unaffected (switching to Restricted only changes *future* visibility/access, not existing enrollments).

---

### User Story 2 - Create a group and assign a course to it (Priority: P2)

An instructor or admin creates a named group (e.g., "Batch 3 — Fall Cohort"), adds a set of existing students to it, and assigns a restricted course to the whole group in one action. Every current member is enrolled; anyone added to the group later automatically gains the same access.

**Why this priority**: Removes the friction that would make the feature impractical for any cohort larger than a handful of students, and supports the recurring-cohort case (new hires, new semester) without re-assigning course-by-course.

**Independent Test**: As an instructor, create a group, add 5 existing students to it, and assign a restricted course to the group. Confirm all 5 are enrolled. Add a 6th student to the group afterward and confirm they gain access to that same course automatically. Remove one member and confirm their access to that course is revoked.

**Acceptance Scenarios**:

1. **Given** an instructor wants to grant several students access at once, **When** they create a group, add students to it, and assign a course to the group, **Then** every current member is individually auto-enrolled in that course.
2. **Given** a group already has a course assigned to it, **When** a new student is added to that group, **Then** that student is automatically enrolled in every course currently assigned to the group.
3. **Given** a student is a member of a group with an assigned course, **When** that student is removed from the group, **Then** their access granted through that group is revoked (their progress is preserved per FR-009), unless they were also assigned the same course individually or via another group.
4. **Given** a bulk assignment (to a group) targets a course already assigned to that group, **When** the action runs again, **Then** it is a no-op (idempotent).

---

### User Story 3 - Revoke a course assignment (Priority: P3)

An instructor or admin removes a previously granted assignment — either a direct student assignment or a group assignment — so affected students no longer see or can access that course going forward.

**Why this priority**: Important for correcting mistakes and managing access over time, but the platform is usable and valuable with only grant (not revoke) capability in the first release.

**Independent Test**: As an instructor, revoke a student's direct assignment to a course and confirm the course disappears from My Learning. Separately, revoke a group's assignment to a course and confirm it disappears for every member who doesn't have another route to access.

**Acceptance Scenarios**:

1. **Given** a student is directly assigned to a course, **When** the instructor revokes that assignment, **Then** the course no longer appears in that student's My Learning and further access is blocked.
2. **Given** a group is assigned to a course, **When** the instructor revokes the group's assignment, **Then** every member loses access unless they have a separate direct assignment or membership in another group with that course assigned.
3. **Given** a student had already made progress in a course before being unassigned, **When** the assignment is revoked, **Then** the student's prior progress/completion record is preserved (not deleted) in case access is restored later, but the student cannot continue the course while unassigned.

---

### Edge Cases

- What happens if an instructor tries to assign a course they don't own (and aren't an admin)? → Rejected, same as every other instructor-scoped action today.
- What happens if a restricted course is switched back to Open? → It immediately becomes visible/self-enrollable to everyone in the catalog again; existing assignment records are simply no longer the access-gating mechanism for that course.
- What happens if a course is assigned to a student/group and then unpublished/archived by the instructor? → The assignment record remains, but the course becomes inaccessible to the student until republished, consistent with how unpublished courses already behave for enrolled students.
- What happens if a student's account is suspended? → Existing suspension behavior already denies all access; assignment status is irrelevant while suspended.
- What happens when a course is deleted while it has active assignments (direct or via group)? → Assignments are removed along with the course (cascade), same as existing enrollments today.
- What happens when a group is deleted while it has an assigned course? → Members lose access granted through that group (per FR-009, their progress is preserved), unless they have another route to access (direct assignment or another group).
- Can a student see *that* a restricted course exists (e.g., in search) without being assigned to it? → No — a restricted course an unassigned student cannot discover it at all, not even a locked preview.
- Can the same student be in more than one group? → Yes; their effective access is the union of everything granted directly to them and via every group they belong to.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an instructor to assign one of their own restricted, published courses directly to a specific student.
- **FR-002**: System MUST allow an admin to assign any published course (restricted or open) to any student, regardless of who instructs it.
- **FR-003**: System MUST prevent an instructor from assigning a course they do not own.
- **FR-004**: System MUST prevent a student, and any other unauthorized role, from creating or revoking course assignments, or from creating/managing groups.
- **FR-005**: System MUST allow an instructor or admin to create a named group and add/remove students to/from it.
- **FR-006**: System MUST allow an instructor (for their own courses) or admin (for any course) to assign a course to a group, granting access to every current member.
- **FR-007**: System MUST automatically grant a student access to a course when they are added to a group that already has that course assigned, without a separate manual step.
- **FR-008**: System MUST automatically revoke a student's access to a course, granted via a group, when that student is removed from the group — unless they retain access through a direct assignment or another group.
- **FR-009**: System MUST NOT delete a student's existing progress/grades/certificates when their access to a course is revoked (directly or via group membership change); it MUST only block further access.
- **FR-010**: System MUST treat assigning the same course to the same student (directly, or via a group they're already in) more than once as a no-op (idempotent), not an error or duplicate record.
- **FR-011**: System MUST allow an instructor (for their own courses) or admin (for any course) to revoke a direct student assignment or a group's assignment.
- **FR-012**: System MUST let each instructor mark, per course they own, whether it is Open (self-enrollable by any student, today's behavior) or Restricted (visible and accessible only to assigned students/groups).
- **FR-013**: System MUST exclude Restricted courses from the public catalog, search, and any browsing surface for students who are not currently assigned access to them.
- **FR-014**: System MUST, when a course is assigned to a student (directly or via group), automatically enroll that student immediately — access is not gated behind a separate manual "Enroll" step.
- **FR-015**: System MUST surface a student's assigned courses through their existing My Learning view (no separate "assigned" list needed, since assignment auto-enrolls).
- **FR-016**: System MUST let an instructor view, per course, the current list of students and groups it is assigned to.
- **FR-017**: System MUST let an instructor or admin view, per group, its current member list and the courses assigned to it.
- **FR-018**: System MUST preserve all existing enrollments and access when a course is switched between Open and Restricted — the toggle only changes future discoverability/self-enrollment, not existing student access.

### Key Entities

- **Course Assignment**: Represents a direct grant of access from one course to one student. Attributes: the course, the student, who granted it (instructor or admin), when it was granted, and whether it is currently active or revoked. One record per (course, student) pair.
- **Course** *(existing entity, extended)*: Gains a visibility attribute — Open or Restricted — controlling whether it is self-enrollable from the public catalog or accessible only via assignment (direct or group).
- **Group**: A named, reusable collection of students, owned/managed by the instructor or admin who created it. Has a member list that can change over time.
- **Group Membership**: Represents a student's current membership in a group. Adding/removing a membership record is what drives automatic access grant/revoke for that group's assigned courses.
- **Group Course Assignment**: Represents a grant of access from one course to an entire group. Combined with each group's current membership, this determines which students currently have group-derived access to that course.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An instructor can grant a student direct access to a restricted course in under 30 seconds from the course's management screen.
- **SC-002**: A student never sees a restricted course they have no access to, in any list, search, or direct-link scenario, verified across 100% of restricted courses in testing.
- **SC-003**: An instructor can create a group, add 50 students, and assign a course to that group in under 2 minutes of hands-on effort.
- **SC-004**: Adding or removing a student from a group changes their course access within one page load / refresh, with no stale cached access.
- **SC-005**: Existing courses and enrollments created before this feature ships continue to work exactly as they did before (zero regression in the current open-catalog flow) — every course defaults to Open on upgrade.

## Assumptions

- Only the instructor who owns a course, or an admin, can create or revoke assignments, mark a course Restricted, or manage groups for it — this mirrors every other instructor-scoped action already in the system (curriculum edits, quiz management, grading).
- Groups are not tied to a single course — the same group can be reused across multiple courses (e.g., "Batch 3" assigned to several courses over a semester).
- Assignment (direct or group) targets existing user accounts; there is no invitation/email-based flow to assign a course to someone who hasn't signed up yet — that is out of scope for this feature.
- A course must be in the `PUBLISHED` state to be assignable, consistent with the existing rule that only published courses can be enrolled in at all.
- Revoking access (direct or via group membership change) is a soft state change (the assignment/membership record and the student's learning history are retained), not a hard delete — this preserves grades, certificates, and progress history.
- This feature does not change anything about how admins already interact with courses (admins already bypass ordinary access checks for non-learner actions).
- Every existing course defaults to Open on rollout, so nothing already published silently becomes inaccessible.
