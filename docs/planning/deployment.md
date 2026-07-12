# Deployment — Vercel + managed API, database and object storage

## Status: Planning

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
| `apps/api` (NestJS) | `localhost:4000` | **Railway** (Render is equivalent) | Long-lived Node process, native deps, no cold-start penalty on Prisma |
| Postgres | Docker | **Neon** | Managed, free tier, branches per environment |
| Media | MinIO in Docker | **Cloudflare R2** | S3-compatible, zero egress cost, public bucket URL |

Railway is chosen over Render for the API because it detects the pnpm workspace, and its `railway.json` accepts monorepo-aware build and start commands. Nothing in the plan depends on that choice — Render, Fly.io, or a plain VM work the same way, and the code changes below are host-agnostic.

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
| Vercel | `NEXT_PUBLIC_API_URL` | `https://<api>.up.railway.app` |
| Railway | `DATABASE_URL` | Neon **pooled** connection string |
| Railway | `DIRECT_URL` | Neon **direct** connection string (migrations only) |
| Railway | `JWT_SECRET`, `JWT_REFRESH_SECRET` | freshly generated, 32+ random bytes each |
| Railway | `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | `15m`, `7d` |
| Railway | `WEB_ORIGIN` | the Vercel production domain |
| Railway | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | from R2 |
| Railway | `S3_PUBLIC_URL` | R2 public bucket URL (new variable — see below) |

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

### Phase 1: Version control
1. `git init`, verify [.gitignore](../../.gitignore) already excludes `.env`, `node_modules/`, `dist/`, `.next/`.
2. First commit; create a private GitHub repository; push.

### Phase 2: Database
1. Create a Neon project; copy both the pooled and the direct connection strings.
2. Add `directUrl` to the `datasource` block in `schema.prisma`.
3. Locally, against a scratch database: `prisma migrate dev --name init` → commit `prisma/migrations/`.
4. Apply to Neon: `prisma migrate deploy` with `DIRECT_URL` pointing at Neon.

### Phase 3: Object storage
1. Create an R2 bucket; enable its public URL; create an S3 API token.
2. Add the CORS rule for `PUT` from the Vercel origin (the origin is not known until Phase 5 — use a placeholder and tighten it there).
3. Add `S3_PUBLIC_URL` support to `MediaService`, defaulting to today's behaviour.

### Phase 4: API on Railway
1. New Railway service from the GitHub repo.
2. Build: `cd ../.. && pnpm install && pnpm turbo run build --filter=@moch/api`. Start: `pnpm --filter @moch/api start`. Release: `pnpm --filter @moch/api exec prisma migrate deploy`.
3. Fix the port in `main.ts`.
4. Set every API variable from the table above. Generate real JWT secrets.
5. Verify: `GET /api/health` — or, if no health route exists, any public route returns 200 over HTTPS.

### Phase 5: Web on Vercel
1. Import the repo; set Root Directory, Install and Build commands as above.
2. Set `NEXT_PUBLIC_API_URL` to the Railway domain.
3. Add the R2 hostname to `remotePatterns`.
4. Deploy; take the resulting domain and set it as `WEB_ORIGIN` on Railway and in the R2 CORS rule.

### Phase 6: Seed and verify
1. Run the seed against Neon (needs a script that does not depend on `dotenv -e ../../.env`, since there is no `.env` file in a deployed environment).
2. End-to-end on the public URL: log in as a demo persona → Home renders targeted content → Feed loads → an image upload round-trips → refresh rotation still works after the access token expires.

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
