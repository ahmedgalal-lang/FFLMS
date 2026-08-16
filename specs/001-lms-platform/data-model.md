# Data Model: LMS Platform

Source of truth for the persistence layer. Implemented as `prisma/schema.prisma`
over PostgreSQL. IDs are CUIDs unless noted. All tables carry `createdAt` /
`updatedAt`. Soft-delete (`deletedAt`) is used where content must survive for
enrolled learners (Course, Lesson).

## Enums

- `Role`: `ADMIN | INSTRUCTOR | STUDENT`
- `CourseStatus`: `DRAFT | IN_REVIEW | PUBLISHED | ARCHIVED`
- `ContentType`: `VIDEO | TEXT | FILE`
- `EnrollmentStatus`: `ACTIVE | COMPLETED | CANCELLED`
- `QuestionType`: `MULTIPLE_CHOICE | MULTI_SELECT | TRUE_FALSE | SHORT_ANSWER`
- `AttemptStatus`: `IN_PROGRESS | SUBMITTED | GRADED | EXPIRED`
- `SubmissionStatus`: `SUBMITTED | GRADED | RETURNED`
- `NotificationType`: `ENROLLMENT | GRADE_POSTED | DISCUSSION_REPLY | ANNOUNCEMENT | COURSE_STATUS`

## Entities

### User
Represents any account. Role governs capabilities.

| Field | Type | Notes |
|-------|------|-------|
| id | string PK | |
| email | string | unique, indexed |
| passwordHash | string? | null when OAuth-only |
| name | string | |
| avatarUrl | string? | object-storage key/URL |
| role | Role | default `STUDENT` |
| status | enum active/suspended | suspended revokes access |
| emailVerifiedAt | datetime? | |

Relations: `coursesAuthored (Course[])`, `enrollments (Enrollment[])`,
`accounts/sessions (Auth.js)`, `notifications`, `submissions`, `attempts`.

**Invariants**: exactly one role; suspended users fail `authorize()`.

### Category
Taxonomy for classification/filtering.

| Field | Type | Notes |
| id | string PK | |
| name | string | unique |
| slug | string | unique, indexed |
| description | string? | |

Relations: `courses (Course[])`.

### Course
An authored unit of learning.

| Field | Type | Notes |
| id | string PK | |
| title | string | |
| slug | string | unique, indexed |
| summary | string | short catalog blurb |
| description | string | rich text |
| coverImageUrl | string? | |
| status | CourseStatus | default `DRAFT` |
| instructorId | FK → User | owner |
| categoryId | FK → Category? | |
| isRequiredSequential | bool | must lessons be completed in order |
| completionThreshold | int | % required to complete (default 100) |
| order | int | curriculum position across courses (default 0); sorts the catalog and My Learning so students see courses in the sequence an instructor/admin intends |
| publishedAt | datetime? | |
| deletedAt | datetime? | soft delete |

Relations: `modules (Module[])`, `enrollments`, `announcements`,
`discussionThreads`, `certificates`.

Indexes: `(status, categoryId)`, full-text on `title, summary, description`.

**Invariants**: publish requires ≥1 module with ≥1 lesson and required metadata
(FR-008). `slug` immutable after first publish.

### Module
Ordered section within a course.

| Field | Type | Notes |
| id | string PK | |
| courseId | FK → Course | cascade delete |
| title | string | |
| order | int | position within course |

Relations: `lessons (Lesson[])`. Unique `(courseId, order)`.

### Lesson
Ordered learning unit within a module; holds content blocks.

| Field | Type | Notes |
| id | string PK | stable identity for progress |
| moduleId | FK → Module | cascade delete |
| title | string | |
| order | int | position within module |
| isRequired | bool | counts toward completion (default true) |
| estimatedMinutes | int? | |
| deletedAt | datetime? | soft delete keeps progress history valid |

Relations: `contentBlocks (ContentBlock[])`, `quiz (Quiz?)`,
`assignment (Assignment?)`, `progress (LessonProgress[])`.
Unique `(moduleId, order)`.

### ContentBlock
A typed piece of lesson content (a lesson can have several, ordered).

| Field | Type | Notes |
| id | string PK | |
| lessonId | FK → Lesson | cascade delete |
| type | ContentType | |
| order | int | |
| text | string? | when TEXT (rich HTML/markdown) |
| mediaUrl | string? | when VIDEO (embed) or FILE (object key) |
| fileName | string? | when FILE |
| fileSize | int? | bytes, when FILE |

### Enrollment
Links a student to a course.

| Field | Type | Notes |
| id | string PK | |
| studentId | FK → User | |
| courseId | FK → Course | |
| status | EnrollmentStatus | default `ACTIVE` |
| progressPercent | int | denormalized cache, recomputed on completion events |
| enrolledAt | datetime | |
| completedAt | datetime? | |

Relations: `lessonProgress (LessonProgress[])`.
**Unique** `(studentId, courseId)` — enforces one active enrollment (FR-011).

### LessonProgress
Completion record for a lesson within an enrollment.

| Field | Type | Notes |
| id | string PK | |
| enrollmentId | FK → Enrollment | cascade delete |
| lessonId | FK → Lesson | keyed by stable lesson id |
| completedAt | datetime? | null = started but not complete |
| lastPositionSec | int? | resume point for video |

**Unique** `(enrollmentId, lessonId)`.
**Invariant**: course progress derives from required lessons completed vs. total
required (FR-014, SC-003) — never position-based.

### Quiz
Assessment attached to a lesson (or module-level via a lesson).

| Field | Type | Notes |
| id | string PK | |
| lessonId | FK → Lesson | unique (one quiz per lesson) |
| title | string | |
| passingScore | int | percentage to pass |
| timeLimitSec | int? | null = untimed |
| maxAttempts | int? | null = unlimited |
| shuffleQuestions | bool | |
| showAnswersAfter | bool | reveal correct answers post-submit |

Relations: `questions (Question[])`, `attempts (QuizAttempt[])`.

### Question
| Field | Type | Notes |
| id | string PK | |
| quizId | FK → Quiz | cascade delete |
| type | QuestionType | |
| prompt | string | |
| points | int | default 1 |
| order | int | |
| correctText | string? | for SHORT_ANSWER exact-match |

Relations: `options (Option[])`.

### Option
| Field | Type | Notes |
| id | string PK | |
| questionId | FK → Question | cascade delete |
| text | string | |
| isCorrect | bool | never sent to client during an attempt |
| order | int | |

### QuizAttempt
| Field | Type | Notes |
| id | string PK | |
| quizId | FK → Quiz | |
| studentId | FK → User | |
| enrollmentId | FK → Enrollment | |
| status | AttemptStatus | |
| score | int? | percentage, set on grade |
| passed | bool? | |
| startedAt | datetime | server time |
| submittedAt | datetime? | |
| attemptNumber | int | 1-based per student/quiz |

Relations: `answers (AttemptAnswer[])`.
**Invariant**: `attemptNumber ≤ quiz.maxAttempts` when limit set (FR-019);
grading and pass/fail computed server-side (FR-018).

### AttemptAnswer
| Field | Type | Notes |
| id | string PK | |
| attemptId | FK → QuizAttempt | cascade delete |
| questionId | FK → Question | |
| selectedOptionIds | string[] | for choice types |
| answerText | string? | for SHORT_ANSWER |
| awardedPoints | int? | set on grade |

### Assignment
| Field | Type | Notes |
| id | string PK | |
| lessonId | FK → Lesson | unique |
| title | string | |
| instructions | string | rich text |
| dueAt | datetime? | |
| allowText | bool | |
| allowFile | bool | |
| maxPoints | int | |
| latePolicy | enum accept/penalize/reject | default accept+flag |

Relations: `submissions (Submission[])`.

### Submission
| Field | Type | Notes |
| id | string PK | |
| assignmentId | FK → Assignment | |
| studentId | FK → User | |
| enrollmentId | FK → Enrollment | |
| text | string? | |
| fileUrl | string? | object key |
| status | SubmissionStatus | |
| isLate | bool | server-computed vs dueAt |
| score | int? | set on grade |
| feedback | string? | |
| gradedById | FK → User? | instructor |
| submittedAt | datetime | |
| gradedAt | datetime? | |

**Unique** latest submission tracked per `(assignmentId, studentId)` (or keep
history with a `version`).

### Certificate
| Field | Type | Notes |
| id | string PK | |
| studentId | FK → User | |
| courseId | FK → Course | |
| verificationCode | string | unique, unguessable (random 128-bit) |
| issuedAt | datetime | |
| revokedAt | datetime? | revoked → verifies invalid |
| pdfUrl | string? | object key when generated |

**Unique** `(studentId, courseId)`. Public verification by `verificationCode`
(FR-024, SC-008).

### DiscussionThread / Post
`DiscussionThread`: `id`, `courseId FK`, `authorId FK`, `title`, `lessonId?`,
`createdAt`. `Post`: `id`, `threadId FK`, `authorId FK`, `body`,
`parentPostId?`, `createdAt`. Only enrolled students + course instructor may
post (FR-027).

### Announcement
`id`, `courseId FK`, `authorId FK (instructor)`, `title`, `body`, `createdAt`.
Publishing fans out `Notification` rows to enrolled students (FR-029).

### Notification
| Field | Type | Notes |
| id | string PK | |
| userId | FK → User | |
| type | NotificationType | |
| title | string | |
| body | string | |
| linkUrl | string? | resource deep link |
| readAt | datetime? | |
| createdAt | datetime | |

### AuditLog
| Field | Type | Notes |
| id | string PK | |
| actorId | FK → User | |
| action | string | e.g. `ROLE_CHANGED`, `COURSE_APPROVED` |
| targetType | string | |
| targetId | string | |
| metadata | json | |
| createdAt | datetime | |

Records sensitive admin actions (FR-033).

### Auth.js support tables
`Account`, `Session`, `VerificationToken` per the Auth.js Prisma adapter.

## Relationship Summary

```text
User 1───* Course (instructor)
User 1───* Enrollment *───1 Course
Course 1───* Module 1───* Lesson 1───* ContentBlock
Lesson 1───0..1 Quiz 1───* Question 1───* Option
Lesson 1───0..1 Assignment 1───* Submission
Enrollment 1───* LessonProgress *───1 Lesson
Quiz 1───* QuizAttempt 1───* AttemptAnswer
User 1───* Certificate *───1 Course
Course 1───* DiscussionThread 1───* Post
Course 1───* Announcement
User 1───* Notification
```

## Key Invariants & Derived Values (test targets — Principle IV)

1. **One enrollment per (student, course)** — unique constraint + idempotent
   enroll (FR-011).
2. **Progress = completed required lessons ÷ total required lessons**, keyed by
   stable lesson id; recomputed on each `LessonProgress` completion and on
   curriculum change (FR-009, FR-014, SC-003).
3. **Course complete** when progress ≥ `completionThreshold` and all required
   assessments passed → sets `Enrollment.completedAt`, triggers certificate
   issuance (FR-016, FR-024).
4. **Quiz score** = Σ awardedPoints ÷ Σ possiblePoints; `passed = score ≥
   passingScore`; computed server-side only (FR-018, SC-004).
5. **Attempt limits & timers** enforced with server time; expired attempts
   auto-submit captured answers (FR-019).
6. **Publish gate**: course needs ≥1 module, ≥1 lesson, required metadata
   (FR-008).
7. **Authorization**: instructors act only on owned courses; students act only
   within active enrollments; admins per policy (FR-002, SC-005).
