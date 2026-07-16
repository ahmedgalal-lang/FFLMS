# Quickstart: LMS Platform

Local setup and smoke test for the LMS Next.js app. This document is written
against the plan's structure; it becomes runnable once the Setup + Foundational
tasks are complete.

## Prerequisites

- Node.js 20+
- pnpm (or npm)
- Docker (for local PostgreSQL + Redis) or a reachable Postgres 16 instance
- An S3-compatible bucket + credentials (MinIO works locally)

## 1. Install

```bash
pnpm install
```

## 2. Environment

Copy the example and fill values. Env vars are validated by `src/config/env.ts`
(Zod) at boot — the app refuses to start if any are missing/invalid.

```bash
cp .env.example .env.local
```

Required keys:

```dotenv
DATABASE_URL=postgresql://lms:lms@localhost:5432/lms
AUTH_SECRET=            # openssl rand -base64 32
AUTH_URL=http://localhost:3000
# OAuth (at least one provider)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
# Object storage
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=lms-uploads
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Optional
REDIS_URL=redis://localhost:6379
EMAIL_PROVIDER_API_KEY=
```

## 3. Start infra (Docker)

```bash
docker compose up -d   # postgres, redis, minio
```

## 4. Database

```bash
pnpm prisma migrate dev      # apply migrations
pnpm prisma db seed          # demo admin, instructor, student, sample course
```

Seed creates:
- `admin@example.com` / `Password123!` (ADMIN)
- `instructor@example.com` / `Password123!` (INSTRUCTOR) with one published course
- `student@example.com` / `Password123!` (STUDENT)

## 5. Run

```bash
pnpm dev        # http://localhost:3000
```

## 6. Smoke test (maps to P1/P2 acceptance)

1. **Author (US1)**: sign in as instructor → Studio → create a course → add a
   module + two lessons (text + video) → publish. Confirm it appears in the
   catalog.
2. **Learn (US2)**: sign in as student → open the catalog → enroll → complete a
   lesson → confirm progress % increases and "resume" points to the next lesson.
3. **Quiz (US3)**: as instructor add a quiz; as student submit → confirm score
   and pass/fail render within ~2s.
4. **Verify cert (US5)**: complete the course as the student → copy the
   certificate code → open `/verify` and confirm it validates.

## 7. Quality gates (run before pushing)

```bash
pnpm typecheck     # tsc --noEmit (strict)
pnpm lint          # eslint
pnpm test          # vitest unit + integration
pnpm test:e2e      # playwright (P1/P2 journeys)
pnpm build         # next build
```

All six must pass — they mirror the CI gates in the constitution.

## Troubleshooting

- **App won't boot / env error**: a required var failed Zod validation — read the
  printed field list.
- **DB connection refused**: ensure `docker compose up -d` is running and
  `DATABASE_URL` host/port match.
- **Uploads fail**: verify the S3 bucket exists and credentials are set; MinIO
  console is at `http://localhost:9001`.
