# Deployment — Vercel + managed API, database and object storage

## Status: Live — https://shikun-web.vercel.app

Web on Vercel (Frankfurt), API on Render (Frankfurt), database on Neon (Frankfurt). Verified end to end against the public URL: login, Home, Feed, Profile, and — the one that matters — audience targeting, with the Haifa-only announcement present for `haifa.employee` and absent for `jerusalem.employee`.

Media is done too, on **Supabase Storage** rather than R2 (R2 requires a card on file; Supabase does not). Verified through the deployed API: presign → upload → public read.

This plan is finished. The record of what was built, the services, the variables and the verification steps live in [docs/deployment.md](../deployment.md). What remains open is not deployment work: the demo seed's shared password on a public URL, and the question of whether a Ministry system may be hosted outside the government cloud at all. Both are in Notes below.

## Context

The platform runs today only on a developer's machine: `pnpm infra:up` starts Postgres and MinIO in Docker, the NestJS API listens on `localhost:4000`, and the Next.js app on `localhost:3001`. Nothing is reachable from outside that machine.

The ask is to put it "in the air" with Vercel. Vercel can host exactly one of the four moving parts — the Next.js app. This plan covers where the other three go and what has to change in the code for any of it to work.

## Problem

- There is no deployed environment. The product cannot be shown to anyone who is not sitting at the developer's laptop.
- The repository is not under version control at all (`git init` has never been run), and Vercel deploys from a git remote.
- Several things that work by accident locally will fail in a hosted environment:
  - The API binds to `API_PORT`, but hosting platforms inject the port as `PORT`.
  - There are no Prisma migrations — the database is created with `db push`. Production needs `migrate deploy`.
  - Media URLs are built as `S3_ENDPOINT/BUCKET/key`, which is a MinIO shape. A real bucket's public URL is not its API endpoint.
  - `next.config.mjs` only allows images from `localhost` and `images.unsplash.com`.

## Goal

A reviewer opens a public URL, logs in as a demo persona, sees a personalized Home and Feed, and can upload media — with no laptop involved.

## Why

- **Vercel alone is not enough, and that is the central fact of this plan.** `apps/api` is a long-lived NestJS server using Prisma and `argon2` (a native module). It is a poor fit for serverless functions. Splitting the API onto a Node host is not a workaround; it is the normal shape for this stack.
- **The architecture already anticipates the split.** The browser never talks to the API directly — client code calls `/api/proxy/...` ([client-api.ts](../../apps/web/src/lib/client-api.ts)), which is a Next route handler that attaches the httpOnly cookie server-side ([route.ts](../../apps/web/src/app/api/proxy/%5B...path%5D/route.ts)). Pointing the web app at a remote API is one environment variable, and no CORS exposure to the browser.
- **Object storage was designed for this.** `MediaService` speaks S3 and nothing else, so a managed bucket is config, not a rewrite.

## Approach

### Where each part runs

| Part | Today | Production | Why |
|---|---|---|---|
| `apps/web` (Next.js 15) | `localhost:3001` | **Vercel** | Native Next.js host; SSR, middleware and route handlers all work |
| `apps/api` (NestJS) | `localhost:4000` | **Render** | Long-lived Node process, native deps, no serverless cold-start penalty on Prisma |
| Postgres | Docker | **Neon** | Managed, free tier, branches per environment |
| Media | MinIO in Docker | **Cloudflare R2** | S3-compatible, zero egress cost, public bucket URL |

Render hosts the API, declared in [render.yaml](../../render.yaml) at the repository root. Nothing in the plan depends on that choice — Railway, Fly.io, or a plain VM work the same way, because the code changes below are host-agnostic: bind `$PORT`, read config from the environment.

Two properties of Render's free plan shape the demo and are worth stating plainly:

- **The service sleeps after 15 minutes of inactivity** and takes 30–50 seconds to wake. The first page load after a quiet period will hang for most of a minute, because Next renders Home server-side and blocks on the API. It is not broken; it is asleep. A paid instance, or a pinger, is the fix if that ever matters.
- **Render's free Postgres is deleted 30 days after creation.** This is why the database stays on Neon rather than moving to Render for a single-vendor setup. Neon's free tier does not expire.

### The monorepo build on Vercel

`@moch/contracts` is a compiled package (`main: ./dist/index.js`), and `turbo.json` declares `build` as depending on `^build`. So a bare `next build` inside `apps/web` fails — the contracts `dist/` does not exist yet. Vercel must be told to build from the repository root through Turborepo:

- **Root Directory**: `apps/web` (with "Include files outside the root directory" enabled)
- **Install Command**: `cd ../.. && pnpm install`
- **Build Command**: `cd ../.. && pnpm turbo run build --filter=@moch/web`
- **Output Directory**: `apps/web/.next` (Vercel infers this)

`@moch/ui` needs no build — it is source, listed in `transpilePackages`.

### Environment variables

`NEXT_PUBLIC_API_URL` is read in [api.ts](../../apps/web/src/lib/api.ts) and the proxy route, both server-side only. It is still `NEXT_PUBLIC_`-prefixed, which means **Next inlines it at build time** — changing it on Vercel requires a redeploy, not just a restart. Worth knowing before debugging a stale API URL for an hour.

| Where | Variable | Value |
|---|---|---|
| Vercel | `NEXT_PUBLIC_API_URL` | `https://shikun-api.onrender.com` |
| Vercel | `NEXT_PUBLIC_MEDIA_HOST` | the R2 public hostname, no scheme |
| Render | `DATABASE_URL` | Neon **pooled** connection string |
| Render | `DIRECT_URL` | Neon **direct** connection string (migrations only) |
| Render | `JWT_SECRET`, `JWT_REFRESH_SECRET` | generated by `render.yaml` (`generateValue`) |
| Render | `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | `15m`, `7d` — already in `render.yaml` |
| Render | `WEB_ORIGIN` | `https://shikun-web.vercel.app` |
| Render | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | from R2 |
| Render | `S3_PUBLIC_URL` | R2 public bucket URL (new variable — see below) |

`NODE_ENV=production` is set by both platforms, which is what flips the session cookie to `secure` in [session.ts](../../apps/web/src/lib/session.ts).

### Code changes this requires

Five small changes. They are the whole reason this is a plan and not a checklist of dashboard clicks.

1. **Port** — [main.ts](../../apps/api/src/main.ts) reads `API_PORT`. Hosts inject `PORT`. Read `process.env.PORT ?? process.env.API_PORT ?? 4000`.
2. **Prisma direct URL** — Neon's pooled connection is right for the app but wrong for migrations. Add `directUrl = env("DIRECT_URL")` to the `datasource` block in `schema.prisma`.
3. **First migration** — there is no `prisma/migrations/` directory. Generate one locally (`prisma migrate dev --name init`) and commit it; production then runs `prisma migrate deploy` on every release, and never `db push`.
4. **Media public URL** — `MediaService` builds `publicUrl` as `${S3_ENDPOINT}/${bucket}/${key}`. That is true for MinIO and false for R2, where the S3 API endpoint is not publicly readable. Introduce `S3_PUBLIC_URL`, falling back to the current expression so local MinIO keeps working unchanged.
5. **Image host** — add the R2 public hostname to `remotePatterns` in [next.config.mjs](../../apps/web/next.config.mjs).

Plus one configuration change outside the code: **the R2 bucket needs a CORS rule** allowing `PUT` from the Vercel origin, because the browser uploads straight to the bucket with a presigned URL.

### Seeding production

`prisma/seed.ts` creates demo personas that all share one password (`Moch2026!`). That is correct for a demo and dangerous for anything that outlives one. The seed also creates the real organizational structure — districts, divisions, subordinate bodies — which production genuinely needs.

For a demo deployment: seed everything, and treat the URL as semi-public. Before this carries any real Ministry content, the user seed must be split from the org-structure seed. Called out again under Notes.

## Implementation

### Phase 1: Version control — done
1. `git init`; [.gitignore](../../.gitignore) already excludes `.env`, `node_modules/`, `dist/`, `.next/`.
2. Pushed to `DolevAtik/shikun`.

### Phase 2: Code changes — done
1. `PORT` binding on `0.0.0.0` in `main.ts`; `start` fixed to the real entrypoint, `dist/src/main.js`.
2. `directUrl` in `schema.prisma`; `prisma/migrations/0_init` generated from the schema and the local database baselined against it.
3. `S3_PUBLIC_URL` in `MediaService`, `NEXT_PUBLIC_MEDIA_HOST` in `next.config.mjs` (and in `turbo.json`'s `globalEnv`, or Vercel would replay a stale build).
4. `GET /api/health` — checks the database, not just the process. Render polls it; a human should open it first.

### Phase 3: Web on Vercel — done
Live at https://shikun-web.vercel.app. Renders the login screen; every authenticated surface 500s until the API exists, which is the expected intermediate state.

### Phase 4: Database (Neon)
1. Create a Neon project; copy the pooled and the direct connection strings.
2. They go to Render as `DATABASE_URL` and `DIRECT_URL`. Nothing needs to run by hand — the API applies `0_init` on its first boot.

### Phase 5: API on Render
1. New Blueprint from the repo; Render reads [render.yaml](../../render.yaml).
2. Fill the `sync: false` variables: the two Neon URLs (S3 can wait).
3. Verify `https://shikun-api.onrender.com/api/health` returns `{"status":"ok","database":"up"}`. This is the moment the database is proven reachable, and it happens before the web app is involved at all.
4. Seed: `pnpm --filter @moch/api db:seed:prod` with `DATABASE_URL` pointing at Neon — from any machine, it needs no deployment.

### Phase 6: Connect Vercel to the API
1. Set `NEXT_PUBLIC_API_URL=https://shikun-api.onrender.com` on Vercel and **redeploy** — the value is inlined at build time, so a restart alone changes nothing.
2. End-to-end on the public URL: log in as a demo persona → Home renders targeted content → Feed loads → refresh rotation still works after the access token expires.

### Phase 7: Object storage (R2) — optional, uploads only
1. Create an R2 bucket; enable its public URL; create an S3 API token.
2. Set the `S3_*` variables on Render and `NEXT_PUBLIC_MEDIA_HOST` on Vercel (then redeploy).
3. CORS rule on the bucket: allow `PUT` from `https://shikun-web.vercel.app`, because the browser uploads straight to the bucket with a presigned URL.

## Scope

This plan does **not** cover:

- A custom domain or DNS. Both platforms' default domains are used.
- A staging environment, preview-deployment API branching, or a CI pipeline beyond the platforms' own git-push deploys.
- Monitoring, alerting, log aggregation, or backups beyond Neon's defaults.
- Dockerizing the API. Railway's builder handles a pnpm workspace without a Dockerfile; a `Dockerfile` becomes worthwhile only if the host changes.
- Hardening the demo seed (see below).

## Notes

**This is a Ministry project, and that may override the whole hosting choice.** Vercel, Railway, Neon and Cloudflare are all outside Israel and outside any government cloud. For a demo or a stakeholder review this is fine. For anything holding real employee data, Israeli public-sector policy is likely to require government cloud (Nimbus) or on-premise hosting, and the answer changes entirely. **Open question for the user — this plan assumes a demo, not a production system of record.**

**Rollback** is per-platform and cheap: Vercel keeps every deployment and can promote a previous one instantly; Railway redeploys a previous commit. The only irreversible step is a database migration — which is why Phase 2 introduces real migrations before anything is deployed, rather than after.

**The demo seed is the main security wart.** One shared password across all personas, published on a public URL. Acceptable for a link shared with a handful of stakeholders; not acceptable a day longer than that. The fix — splitting the org-structure seed from the demo-user seed, and requiring per-user passwords — is a separate task.
