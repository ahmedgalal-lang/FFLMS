# Requirements Quality Checklist: LMS Platform

Validates that `spec.md` is complete, clear, and consistent before planning is
considered locked. Check each item; note gaps as follow-ups.

## Coverage

- [x] Every user role has at least one prioritized user story.
- [x] P1 stories alone constitute a viable MVP (US1 authoring + US2 learn).
- [x] Each user story has an Independent Test statement.
- [x] Each user story has ≥1 Given/When/Then acceptance scenario.
- [x] Edge cases enumerated (curriculum edits, dup enrollment, timers, uploads,
      deletion, access control, cert integrity).

## Clarity

- [x] Functional requirements are individually testable (FR-001…FR-034).
- [x] No requirement mixes multiple capabilities in one line without an ID.
- [x] Success criteria are measurable and technology-agnostic (SC-001…SC-009).
- [x] Ambiguous defaults captured under Assumptions rather than left implicit.

## Consistency

- [x] Every entity referenced in requirements appears in Key Entities and
      `data-model.md`.
- [x] Every P1/P2 acceptance path has a corresponding contract in
      `contracts/openapi.yaml`.
- [x] Priorities are mutually consistent (no P2 story depends on an absent P3).
- [x] Security/authorization requirement (FR-002) applies across all stories.

## Constitution Alignment

- [x] Spec-driven: all planned work traces to an FR/story.
- [x] Testability: business-logic invariants listed as test targets in
      `data-model.md`.
- [x] Security: server-side authz is a first-class requirement (FR-002, SC-005).
- [x] Accessibility/performance encoded as success criteria (SC-007) and
      constitution principles.

## Resolved (analysis remediation, 2026-07-16)

- [x] Quiz attempt scoring — **highest-scoring attempt of record**, per-quiz
      configurable (FR-019).
- [x] Short-answer grading — **normalized exact match + optional manual
      override** (FR-018).
- [x] Coverage gaps closed — self-profile task (T019a), load/scale test
      (T086), search-latency assertion (T034a), certificate-trigger test
      (T057a), category test (T068a), pagination audit (T084) added to
      `tasks.md`.

## Open Follow-ups (non-blocking for MVP)

- [ ] Confirm certificate **visual template/branding** (issuance + verification
      logic already specified; default is a server-rendered PDF from HTML).
