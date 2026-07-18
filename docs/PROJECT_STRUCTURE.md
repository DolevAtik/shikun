# Project Structure

A pnpm workspace (`pnpm-workspace.yaml`: `apps/*`, `packages/*`) orchestrated by Turborepo
(`turbo.json`). `^build` ordering guarantees `packages/contracts` is compiled before any
app that imports it.

```
shikun/
├─ apps/
│  ├─ api/                      NestJS + Prisma + PostgreSQL — modular monolith
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma       ~30 models; polymorphic ContentItem + detail tables
│  │  │  ├─ migrations/         includes performance_indexes, admin_telemetry
│  │  │  └─ seed.ts             real Ministry structure, fictional people
│  │  └─ src/
│  │     ├─ main.ts             bootstrap: /api prefix, 1mb body cap, CORS
│  │     ├─ app.module.ts       module wiring + the three global guards
│  │     ├─ audience/           the resolver (audience.ts) + manageable scope + specs
│  │     ├─ auth/               controller, service, JWT strategy, guards, provider iface
│  │     ├─ admin/              admin surface: content, home, events, dashboard, audit,
│  │     │                        telemetry, search
│  │     ├─ feed/ home/ jobs/   employee-facing modules
│  │     ├─ services/ org/ media/
│  │     ├─ users/              user.mapper.ts (DB row → API shape)
│  │     └─ common/             prisma module, health, http filter, pagination,
│  │                              ttl-cache, zod-body decorator
│  ├─ web/                      Next.js PWA — employee app (:3001)
│  │  ├─ src/app/[locale]/
│  │  │  ├─ (app)/              feed, jobs, services, profile, home (page.tsx)
│  │  │  ├─ login/
│  │  │  └─ api/                auth/{login,logout} + proxy/[...path]
│  │  ├─ src/components/        home/, feed/, jobs/, services/ + shared
│  │  ├─ src/i18n/ src/lib/     routing, api client (serverFetch/serverFetchOrLogin)
│  │  ├─ messages/              he/en translation catalogs
│  │  └─ e2e/                   Playwright + axe specs (app, screenshots, helpers)
│  └─ admin/                    Next.js — admin console, round two (:3002)
│     ├─ src/app/[locale]/(admin)/   analytics, audit, careers, community, content,
│     │                                districts, employees, events, learning, media,
│     │                                notifications, permissions, services, settings
│     ├─ src/components/        content/, dashboard/, data/, home/, shell/, ui/ (vendored
│     │                           shadcn-style primitives over Radix)
│     └─ src/lib/               api client, client-api (zod→react-hook-form), query-keys, cn
├─ packages/
│  ├─ contracts/               zod schemas — the shared type source of truth
│  │  └─ src/                   admin, audience, feed, home, jobs, list, org, roles,
│  │                             services, user
│  ├─ ui/                       design system: tokens.css, tailwind-preset.js, cn,
│  │                             Button/Card/Avatar/Chip/Skeleton/EmptyState
│  └─ config/                  shared tsconfig
├─ infra/
│  └─ docker-compose.yml       Postgres :5433, MinIO :9000
├─ scripts/
│  ├─ check-contrast.mjs        WCAG 2.0 AA gate over the tokens
│  ├─ check-logical-props.mjs   bans physical-direction CSS (ml-, text-left, …)
│  └─ check-admin-scope.mjs     guards the admin/employee import boundary
├─ docs/                        this documentation set + planning/
├─ render.yaml                  Render blueprint for the API
├─ turbo.json  pnpm-workspace.yaml  package.json      workspace root
└─ .env.example                every configuration key, documented inline
```

## Conventions

- **Ports:** API `:4000` (`/api` prefix), web `:3001`, admin `:3002`, Postgres `:5433`,
  MinIO `:9000`.
- **Package names:** `@moch/api`, `@moch/web`, `@moch/admin`, `@moch/contracts`,
  `@moch/ui`, `@moch/config`.
- **RTL-first:** logical CSS properties only (`ms-`/`me-`, `start`/`end`) — the physical
  variants are banned by a build gate.
- **Admin ↔ employee boundary:** the admin app may reuse the employee app's `cn`/tokens
  but the import direction is guarded by `check-admin-scope.mjs`.
