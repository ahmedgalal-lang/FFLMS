# Deploying Lumen LMS on CranL

This app ships a `Dockerfile`, so deploy it on CranL with **Build Type =
Dockerfile**. The container applies database migrations on every boot and then
starts Next.js on `0.0.0.0:$PORT`.

## Option A — CranL dashboard (recommended)

1. **Connect GitHub**: Dashboard → **GitHub** → *Connect GitHub*, grant access
   to the `aleymahmoud/LMS` repository.
2. **Create the app**: **Applications** → *New Application* → pick this repo.
   - **Branch**: `claude/lms-spec-kit-planning-tht8dp` (or your default once
     merged)
   - **Build Type**: **Dockerfile**
   - **Region**: choose the closest one
   - **Port**: `3000` (matches the Dockerfile's `EXPOSE 3000`)
3. **Add a database**: **Applications** → *New Database* → **PostgreSQL**.
   - Set **Inject into App** to this application. CranL adds `DATABASE_URL`
     automatically.
4. **Set environment variables** (app → **Environment**):
   - `AUTH_SECRET` — run `openssl rand -base64 32` and paste the result.
   - `SEED_ON_START` — set to `true` for the **first** deploy only, to load the
     demo admin/instructor/student and a sample course. Remove it (or set
     `false`) afterwards so it doesn't re-run.
   - `DATABASE_URL` is already injected. `DIRECT_URL` is not needed for a
     CranL-managed Postgres (the entrypoint falls back to `DATABASE_URL`).
5. **Deploy**. Watch the build logs. On boot you'll see
   `prisma migrate deploy` run, then the server start.
6. Open the generated `*.cranl.net` URL. Sign in with a demo account
   (password `Password123!`): `instructor@example.com` or
   `student@example.com`.

> After the first successful deploy, unset `SEED_ON_START`.

## Option B — CranL CLI

```bash
npm i -g @cranl/cli            # per CranL docs
cranl login                    # or: export CRANL_API_KEY=...
cranl apps create              # select this repo, Build Type: Dockerfile, Port 3000
cranl db create                # PostgreSQL, inject into the app
cranl apps deploy
```

## Using Supabase instead of a CranL-managed database

If you point at Supabase, set both env vars on the app (Supabase gives you a
pooled and a direct URL):

- `DATABASE_URL` = the **pooled** URL (PgBouncer, port `6543`, `?pgbouncer=true`)
- `DIRECT_URL`   = the **direct** URL (port `5432`)

Migrations use `DIRECT_URL`; the app runtime uses `DATABASE_URL`.

## What the container does on start

`docker-entrypoint.sh`:

1. `prisma migrate deploy` — applies committed migrations (idempotent).
2. optional `prisma db seed` when `SEED_ON_START` is truthy.
3. `next start -H 0.0.0.0 -p $PORT`.

## Security note

Rotate any credentials shared during setup (database password, provider keys,
CranL API key). Never commit secrets — they belong in the platform's
Environment settings. `.env` is gitignored; `.env.example` documents the shape.
