# Deployment

How this project runs in production, what it depends on, and what it cost in code changes to get there.

The plan that produced this is [docs/planning/deployment.md](planning/deployment.md). This document is the record of what actually happened, and the runbook for doing it again.

**Live:** https://shikun-web.vercel.app

---

## The shape of it

The product is one repository and two hosts. Vercel runs the code — both Next.js apps and the NestJS API — and Supabase holds the state: Postgres and the media bucket.

The API used to run on Render, as a long-lived process. Render's free service slept after 15 minutes idle and took 30–50 seconds to wake, which landed on whoever opened the app first; a GitHub cron pinged it through the day to hide that. It now runs as a single Vercel function (`apps/api/api/index.js` → `src/serverless.ts`) that boots the same Nest app once per instance. A cold instance costs a second or two, not a minute. The native dependencies that once argued against serverless — `argon2` and Prisma's query engine — ship Linux builds; Prisma needs `binaryTargets` to include `rhel-openssl-3.0.x`.

| Part | Host | Region | What it is |
|---|---|---|---|
| `apps/web` | **Vercel** | `fra1` | Next.js 15 app — the employee PWA |
| `apps/admin` | **Vercel** | `fra1` | Next.js admin console |
| `apps/api` | **Vercel** (`shikun-api`) | `fra1` | NestJS API as one serverless function |
| Database | **Supabase Postgres** | `eu-central-1` | Project `shikoun`, reached through the Supavisor pooler |
| Media | **Supabase Storage** | `eu-central-1` | S3-compatible bucket, `moch-media`, same project |

Everything sits in Frankfurt on purpose. The API talks to the database several times per page render, so those two must be co-located; putting the database in Virginia would add an Atlantic crossing to every query. Frankfurt is also the closest region to Israel.

The browser never talks to the API directly. Client code calls `/api/proxy/...` on the Vercel domain, and that Next route handler attaches the httpOnly cookie server-side. This is why moving the API to a different host was a one-variable change, and why the API's CORS configuration is a second line of defence rather than the only one.

---

## The services, and what lives in each

| Service | URL | What it holds | Why it |
|---|---|---|---|
| **GitHub** | [DolevAtik/shikun](https://github.com/DolevAtik/shikun) | The source. Every Vercel project deploys from `main`. | Nothing is uploaded by hand. |
| **Vercel** | [shikun-web.vercel.app](https://shikun-web.vercel.app) | The employee app. | Native Next host: SSR, middleware and route handlers work without configuration. |
| **Vercel** | [shikun-api.vercel.app](https://shikun-api.vercel.app) | The NestJS API. | Same host as the apps, no sleep-and-wake, same region. |
| **Supabase** | project `shikoun` (`hzdkqckpvxmkwrvprksy`) | Postgres 17 and the `moch-media` bucket. | One project for all state. Its Auth is unused — the API issues its own JWTs. |

**Supabase pauses a free project after a week without activity.** A paused project takes the database *and* the media down together. Restore it from the dashboard (Project → Restore); the free plan allows two active projects per account.

The configuration files declare the deployments, so no host depends on someone remembering a dashboard setting:

- [apps/api/vercel.json](../apps/api/vercel.json) — the API: build (and migrate), Frankfurt region, the function, and the rewrite that sends every path to it.
- [apps/web/vercel.json](../apps/web/vercel.json), [apps/admin/vercel.json](../apps/admin/vercel.json) — the apps: build command, Frankfurt region, and the two public `NEXT_PUBLIC_*` values.

---

## The monorepo problem, and how each host solves it

`@moch/contracts` is a compiled package (`main: ./dist/index.js`), and `turbo.json` declares `build` as depending on `^build`. A bare `next build` or `nest build` inside an app directory therefore fails — the contracts `dist/` does not exist yet. Every project must install and build from the repository root, through Turborepo:

```
# web / admin                                        # api
cd ../.. && pnpm install --frozen-lockfile           cd ../.. && pnpm install --frozen-lockfile
cd ../.. && pnpm turbo run build --filter=@moch/web  cd ../.. && pnpm turbo run build --filter=@moch/api
                                                       && cd apps/api && pnpm exec prisma migrate deploy
```

The API function is plain JS that `require`s `dist/src/serverless.js`: Nest's dependency injection needs the decorator metadata `tsc` emits, which Vercel's own TypeScript compilation cannot be trusted to produce.

`@moch/ui` needs no build — it is source, listed in `transpilePackages`.

---

## Environment variables

**Web and admin** — declared in their `vercel.json`, because both are public URLs and Next inlines `NEXT_PUBLIC_*` **at build time**. A value changed on a running deployment does nothing until it is rebuilt; this is the single most confusing failure mode in this setup.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://shikun-api.vercel.app` |
| `NEXT_PUBLIC_MEDIA_HOST` | `hzdkqckpvxmkwrvprksy.supabase.co` |

`NEXT_PUBLIC_MEDIA_HOST` is also listed in `turbo.json`'s `globalEnv` — otherwise it is not part of Turborepo's cache key, and changing it would replay a stale build.

**API** — set on the `shikun-api` Vercel project (Settings → Environment Variables, Production), never committed. The database password contains URL-reserved characters, so it is percent-encoded in both URLs.

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **transaction** pooler: `postgresql://postgres.hzdkqckpvxmkwrvprksy:<pw>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` — `pgbouncer=true` turns off prepared statements, which a transaction pooler cannot keep; `connection_limit=1` because every function instance opens its own |
| `DIRECT_URL` | Supabase **session** pooler: same host, port `5432`, no query string — migrations need a real session. (The `db.<ref>.supabase.co` direct host is IPv6-only, which Vercel's build cannot reach.) |
| `JWT_SECRET` | random, generated when the project was created |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | `15m`, `7d` |
| `WEB_ORIGIN` | `https://shikun-web.vercel.app,https://shikun-admin.vercel.app` |
| `S3_ENDPOINT` | `https://hzdkqckpvxmkwrvprksy.storage.supabase.co/storage/v1/s3` — note the `storage.` subdomain |
| `S3_REGION` | `eu-central-1` |
| `S3_BUCKET` | `moch-media` |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | Supabase → Project Settings → Storage → S3 Access Keys |
| `S3_PUBLIC_URL` | `https://hzdkqckpvxmkwrvprksy.supabase.co/storage/v1/object/public/moch-media` — the read domain, which is *not* the S3 endpoint |

---

## How a change reaches production

`git push origin main` → all three Vercel projects rebuild.

Database migrations are not a separate step: the API's build runs `prisma migrate deploy` before the new function goes live, so a failed migration fails the deploy and the previous version keeps serving. Write migrations with `pnpm db:migrate` locally, commit `apps/api/prisma/migrations/`, and push. **Never `db push` against Supabase** — that is how a schema and its migration history diverge.

---

## What had to change in the code

Six changes for the first deployment — four predictable, two only found by deploying — and one more for the move off Render.

1. **Port.** `main.ts` read `API_PORT`. Hosts inject `PORT`, and expect the process to bind `0.0.0.0`.
2. **Entrypoint.** `package.json`'s `start` pointed at `dist/main.js`, but `nest build` emits `dist/src/main.js` — because `tsconfig` includes both `src/` and `prisma/`, so the common root is the package, not `src`. This never showed up locally, since `nest start` does not use that script. **In production it is an instant crash loop.**
3. **`directUrl`** in `schema.prisma` — a pooled connection (Neon's then, Supabase's now) cannot run migrations.
4. **First migration.** The project had none; the schema was created with `db push`. `prisma/migrations/0_init` was generated from the schema with `migrate diff` and the local database baselined with `migrate resolve --applied`, so no developer lost their data.
5. **Public media URL.** `MediaService` built `publicUrl` as `${S3_ENDPOINT}/${bucket}/${key}`. True for MinIO, false for every managed bucket, where the S3 API endpoint is not publicly readable. Hence `S3_PUBLIC_URL`, falling back to the old expression so local MinIO is unaffected.
6. **ASCII storage keys.** `sanitize()` deliberately kept Hebrew letters in the object key, with a comment saying `"דוח שנתי.pdf"` should survive the round trip. MinIO accepted that; **Supabase rejects it with `400 InvalidKey`**. Storage keys must be ASCII. Nothing was lost by fixing it — `Media.fileName` already carries the display name, and the key was never the right place for it. Locked down by tests in [media.spec.ts](../apps/api/src/media/media.spec.ts).

7. **Serverless entry point.** App configuration moved from `main.ts` into [bootstrap.ts](../apps/api/src/bootstrap.ts), shared by the local process (`main.ts`, which listens) and the Vercel function ([serverless.ts](../apps/api/src/serverless.ts), which caches one initialised app per instance and hands each request to its Express adapter). The throttler's counters are in memory, so on serverless the per-minute ceiling applies per function instance rather than globally.

Points 2 and 6 are the argument for verifying a deployment by driving it, not by reading a dashboard: both were green everywhere and broken in fact.

---

## Verifying a deployment

In order — each step isolates one link in the chain, so a failure names its own cause.

```bash
# 1. The API is up and can reach the database.
curl https://shikun-api.vercel.app/api/health
# → {"status":"ok","database":"up"}

# 2. Authentication is enforced, not just present.
curl https://shikun-api.vercel.app/api/org/districts
# → 401

# 3. Login works against the API itself.
curl -X POST https://shikun-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@moch.gov.il","password":"Moch2026!"}'
# → { tokens, user }

# 4. Login works through the web app — this is what proves Vercel knows the API's address.
curl -X POST https://shikun-web.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@moch.gov.il","password":"Moch2026!"}'

# 5. The product actually works: audience targeting. Log in as haifa.employee and
#    as jerusalem.employee and load /he — only the first may see the Haifa-only
#    office-move announcement.

# 6. Media: log in as editor@moch.gov.il, POST /api/media/presign, PUT the file to
#    the returned uploadUrl, then GET the returned publicUrl.
```

Step 5 is the one worth caring about. Everything before it proves the servers are alive; only step 5 proves the audience model — the whole point of the platform — survived the move.

---

## Operational notes

**A cold function instance takes a second or two** to boot Nest and connect to Postgres; warm requests do not pay it. The web app's `fetchThroughWake` still retries 502/503/504 for up to 50 seconds — a safety net now, not the normal path.

**Supabase pauses a free project after about a week without traffic.** Everything then fails at once — `/api/health` returns 500 and uploads stop. Restore it in the dashboard; data is kept.

**The demo seed is a security wart.** Nine personas share one password (`Moch2026!`) on a public URL. That is acceptable for a link sent to a handful of stakeholders and unacceptable for anything longer-lived. The fix — splitting the organizational-structure seed from the demo-user seed — is a separate task.

**The hosting choice is a demo choice.** Vercel and Supabase are both outside Israel and outside the government cloud. For a stakeholder review that is fine. For a system holding real Ministry employee data, Israeli public-sector policy is likely to require Nimbus or on-premise hosting, and this entire document would be replaced. Nothing here forecloses that: the API still runs as a plain Node process (`node dist/src/main.js`) that binds `$PORT`, reads config from the environment, and speaks S3 and Postgres.

---

## Recreating this from scratch

1. **Supabase** — create a project in Central EU. Storage → new bucket `moch-media`, **public**. Project Settings → Storage → new S3 access key. Database → Settings → set a database password. Connect → take the transaction (6543) and session (5432) pooler strings.
2. **Migrate and seed** — from any machine, with the session-pooler string in both variables:
   `DATABASE_URL=<session> DIRECT_URL=<session> pnpm --filter @moch/api db:deploy`, then `… pnpm --filter @moch/api db:seed:prod`. (`db:seed` is the local variant and expects a `.env` file.)
3. **Vercel, API** — new project from the repo, Root Directory `apps/api`, Framework "Other". `apps/api/vercel.json` supplies the rest. Add the variables listed above for Production.
4. **Vercel, apps** — two more projects, Root Directory `apps/web` and `apps/admin`. Their `vercel.json` supplies the rest.
5. Push to `main`.
6. Verify with the six steps above.
