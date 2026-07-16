# API Contracts: LMS Platform

This directory defines the platform's server contracts.

- `openapi.yaml` — REST Route Handlers under `src/app/api/**`. This is the
  documented, testable HTTP surface (used by integration tests, external
  integrations, and file-upload URL issuance).
- Form-driven mutations are implemented primarily as **Server Actions**
  (`src/app/**/actions.ts`). Each Server Action follows the same contract rules
  below and shares the Zod schemas in `src/lib/validation`.

## Contract Rules (apply to every endpoint and action)

1. **Auth**: Every non-public endpoint requires a valid session. The handler
   calls `authorize(session, action, resource)` before any data access.
   Unauthenticated → `401`; authenticated but forbidden → `403`.
2. **Validation**: Request bodies/queries are parsed with a Zod schema. Invalid
   input → `400` with `{ error, fieldErrors }`.
3. **Not found vs forbidden**: To avoid leaking existence, a resource the caller
   may not see returns `404`, not `403`, where disclosure matters (e.g. another
   instructor's draft).
4. **Pagination**: List endpoints accept `?page` & `?pageSize` (default 20, max
   100) and return `{ items, page, pageSize, total }`.
5. **Idempotency**: `POST /enrollments` is idempotent per (student, course).
6. **Errors**: Uniform shape `{ error: string, code?: string, fieldErrors?: {} }`.
7. **Time**: Server time is authoritative for quiz timers and due dates.
8. **Uploads**: Clients never POST large bodies to the app. They request a
   presigned URL, upload directly to object storage, then persist the returned
   key.

## Public (no auth) endpoints

- `GET /api/courses` — catalog of PUBLISHED courses; supports `q`, `category`,
  `page`, `pageSize`.
- `GET /api/courses/{slug}` — public course detail (published only).
- `GET /api/certificates/verify/{code}` — certificate verification result.

## Role matrix (summary)

| Capability | Student | Instructor | Admin |
|-----------|:-------:|:----------:|:-----:|
| Browse catalog / verify certificate | ✅ | ✅ | ✅ |
| Enroll, learn, submit assessments | ✅ | — | — |
| Create/edit own courses & assessments | — | ✅ | ✅ |
| Grade submissions in own course | — | ✅ | ✅ |
| Approve/publish/archive any course | — | — | ✅ |
| Manage users & roles | — | — | ✅ |
| Org-wide reports | — | own courses only | ✅ |

See `../data-model.md` for entity shapes and `../spec.md` for the functional
requirements each contract satisfies.
