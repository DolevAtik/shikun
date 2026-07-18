# Architecture

The Employee Experience Platform ("הבית הדיגיטלי") for the Israeli Ministry of
Construction and Housing. This document describes how the system is put together and the
handful of decisions everything else follows from.

## Shape

A pnpm + Turborepo monorepo with three deployable apps and three shared packages.

```
                    ┌──────────────────────────────┐
   employee ───────▶│  apps/web   (Next.js :3001)   │────┐
                    └──────────────────────────────┘    │  same-origin
                                                         │  /api/proxy/*
                    ┌──────────────────────────────┐    │  (httpOnly cookie → Bearer)
   admin ──────────▶│  apps/admin (Next.js :3002)   │────┤
                    └──────────────────────────────┘    │
                                                         ▼
                            ┌──────────────────────────────────────┐
                            │  apps/api  (NestJS :4000, prefix /api)│
                            │  Throttler → JwtAuth → Permissions    │
                            └──────────────────────────────────────┘
                                          │
                            ┌─────────────┴─────────────┐
                            ▼                            ▼
                     PostgreSQL (Prisma)          S3 / MinIO (media)
```

The two frontends never call the API cross-origin from the browser. Each has a
`app/api/proxy/[...path]` route that forwards to the API server-side, attaching the JWT
from an httpOnly cookie. The access token is therefore never exposed to client JavaScript.

## The decisions worth knowing

**Contract-first typing.** `packages/contracts` holds zod schemas that are the single
source of truth for every shape crossing the wire. The API validates request bodies
against them (`@ZodBody`), and both frontends import the inferred types. A field renamed
in one place fails to compile everywhere it is wrong.

**The audience resolver is the core.** `apps/api/src/audience/audience.ts` is one pure
function that decides who may see a piece of content. Department, district, organization,
and role are ANDed; an empty rule means the whole Ministry. It is the most heavily tested
code in the repo (`audience.spec.ts`, `manageable.spec.ts`) because a bug there leaks
targeted content to the wrong people.

**Home is data, not a screen.** `GET /home` returns an ordered list of typed, already
resolved sections, driven by rows in `HomeSectionConfig`. Reordering Home is a data
change (round-two admin: `PUT /admin/home/sections`), not a frontend release.

**Auth sits behind an interface.** `apps/api/src/auth/providers/auth-provider.ts` has one
implementation today — local passwords hashed with argon2. Microsoft Entra ID becomes a
second implementation of the same interface, and nothing outside that folder changes.
Access tokens are JWTs (`JWT_SECRET`, 15-min default TTL). Refresh tokens are **opaque
random strings stored hashed** in the `RefreshToken` table — not JWTs — so there is
deliberately no separate refresh-signing secret.

## Request lifecycle (API)

Every request passes three global guards, in order (`apps/api/src/app.module.ts`):

1. **`ThrottlerGuard`** — global ceiling 120 req/min; sensitive routes tighten it
   (`login` 10/min, `refresh` 30/min, `media/presign` 20/min).
2. **`JwtAuthGuard`** — authentication is on by default; a route opts out with `@Public()`
   (login, refresh, logout, health).
3. **`PermissionsGuard`** — authorization is opt-in per route with
   `@RequirePermissions(...)`; scope (which district/department) is enforced separately by
   the audience rules on the data itself.

Validation is zod via `@ZodBody`, not class-validator — there is no global ValidationPipe
on purpose. Errors are shaped by a single `HttpExceptionFilter`.

## Authorization model

Roles map to permissions in `packages/contracts/src/roles.ts` (`ROLE_PERMISSIONS`). The
API guard is the enforcement point; the admin UI merely reflects it. `admin:access` is the
gate — every other admin permission is inert without it.

| Role | Permissions |
|---|---|
| `EMPLOYEE` | (none) |
| `MANAGER` | admin:access, content:publish, content:edit |
| `DISTRICT_MANAGER` | + content:approve |
| `CONTENT_EDITOR` | admin:access, content:{publish,edit,delete,manage}, feeds:manage |
| `HR` | admin:access, content:{publish,edit}, users:manage |
| `EXECUTIVE` | admin:access, content:{publish,approve}, analytics:view |
| `ADMIN` | all of the above |

`MANAGER`/`DISTRICT_MANAGER` can publish, but only within their own scope — scope is the
audience rule on the content, checked independently of the permission.

## Data model

PostgreSQL via Prisma (`apps/api/prisma/schema.prisma`, ~30 models). Content is
polymorphic: a `ContentItem` row carries the common fields (kind, status, audience,
timestamps) and a per-kind detail table holds the rest — `AnnouncementDetail`,
`FeedPostDetail`, `EventDetail`, `CareerDetail`, `TrainingDetail`, `VideoDetail`,
`CeoMessageDetail`, `AlertDetail`. Around it: org structure (`Organization`, `District`,
`Department`, `User`), engagement (`Interaction`, `Comment`, `Registration`, `Follow`),
Home building blocks (`HomeSectionConfig`, `QuickLink`, `QuickAction`, `KeyMetric`,
`Recognition`, `WeeklySummary`), and observability (`AuditLog`, `AnalyticsEvent`,
`ContentRead`).

## Accessibility as a build gate

IS 5568 (the Israeli standard for a public body) is WCAG 2.0 AA and carries statutory
damages, so it is enforced, not reviewed:

- `scripts/check-contrast.mjs` — token contrast at card scale.
- `scripts/check-logical-props.mjs` — bans physical-direction CSS in an RTL-first app.
- `scripts/check-admin-scope.mjs` — guards the admin/employee import boundary.
- Playwright + axe-core run over every screen, he/en, light/dark.

These run in `pnpm lint` and `pnpm check:a11y`.

## Related documents

- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) — the folder map.
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — every endpoint.
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) — configuration.
- [deployment.md](deployment.md) — how it ships.
- [planning/](planning/) — the design documents each phase was built from.
