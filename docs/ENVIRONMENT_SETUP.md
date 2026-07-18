# Environment Setup

## Prerequisites

- **Node 20+** (Render deploys on 22)
- **pnpm** (`packageManager: pnpm@9.15.0` — `corepack enable` picks it up)
- **Docker** (for local Postgres + MinIO)

## First run

```bash
cp .env.example .env
pnpm install
pnpm infra:up          # Postgres on :5433, MinIO on :9000
pnpm db:push           # create the schema
pnpm db:seed           # real Ministry structure, fictional people
pnpm dev               # API :4000, web :3001, admin :3002
```

Open http://localhost:3001. Demo accounts are listed on the login screen; the password for
all of them is `Moch2026!`. See the [README](../README.md#running-it) for the account table.

## Configuration keys

Every key is documented inline in [`.env.example`](../.env.example). Summary:

| Key | Purpose | Local default |
|---|---|---|
| `DATABASE_URL` | Pooled Postgres connection | local Postgres on :5433 |
| `DIRECT_URL` | Unpooled connection for migrations | same as above locally; the direct string on Neon |
| `JWT_SECRET` | Signs access-token JWTs | `dev-only-change-me` (replace when deployed) |
| `JWT_ACCESS_TTL` | Access-token lifetime | `15m` |
| `JWT_REFRESH_TTL` | Refresh-token lifetime | `7d` |
| `API_PORT` | Local API port | `4000` |
| `WEB_ORIGIN` | Comma-separated CORS allow-list (web + admin) | `http://localhost:3001,http://localhost:3002` |
| `S3_ENDPOINT` | Object storage endpoint | MinIO `http://localhost:9000` |
| `S3_REGION` / `S3_BUCKET` | Bucket region / name | `us-east-1` / `moch-media` |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Storage credentials | MinIO dev creds |
| `S3_PUBLIC_URL` | Public read domain when it differs from the API endpoint | unset locally (MinIO serves both) |
| `NEXT_PUBLIC_API_URL` | API base URL baked into the web build | `http://localhost:4000` |
| `NEXT_PUBLIC_MEDIA_HOST` | Media host (no scheme) for `next/image` | unset locally |

> **Note:** refresh tokens are opaque random strings stored hashed, not JWTs — there is no
> separate refresh-signing secret to configure. (`JWT_REFRESH_SECRET`, previously present
> but never read, was removed.)

> `NEXT_PUBLIC_*` values are inlined into the web bundle at build time and participate in
> the Turbo cache key (`turbo.json` → `globalEnv`). Change one and the web app must rebuild.

## Useful commands

```bash
pnpm dev            # everything (turbo runs all dev servers)
pnpm build          # build every package/app
pnpm typecheck      # tsc --noEmit across the workspace
pnpm test           # unit tests (Vitest — the audience resolver, media)
pnpm test:e2e       # Playwright + axe (requires running servers)
pnpm lint           # a11y gates + turbo lint
pnpm check:a11y     # contrast + logical-props + admin-scope gates
pnpm db:reset       # wipe and reseed
pnpm infra:down     # stop Postgres + MinIO
```

See [deployment.md](deployment.md) for production configuration (Render API, Neon Postgres,
Vercel frontends).
