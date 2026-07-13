# משרד הבינוי והשיכון — הבית הדיגיטלי

Employee Experience Platform for the Israeli Ministry of Construction and Housing.
Round one: the foundation, **Home**, and the **Feed**.

The plan this was built from is in [docs/planning/employee-experience-platform.md](docs/planning/employee-experience-platform.md).

## Running it

Prerequisites: Node 20+, pnpm, Docker.

```bash
cp .env.example .env
pnpm install
pnpm infra:up          # Postgres on 5433, MinIO on 9000
pnpm db:push           # create the schema
pnpm db:seed           # the real Ministry structure, fictional people
pnpm dev               # API on :4000, web on :3001
```

Open http://localhost:3001 — the login screen lists the demo accounts.
Password for all of them: `Moch2026!`

| Account | Role | Scope |
|---|---|---|
| `employee@moch.gov.il` | EMPLOYEE | Headquarters |
| `haifa.employee@moch.gov.il` | EMPLOYEE | Haifa district |
| `jerusalem.employee@moch.gov.il` | EMPLOYEE | Jerusalem district |
| `haifa.manager@moch.gov.il` | DISTRICT_MANAGER | Haifa district |
| `editor@moch.gov.il` | CONTENT_EDITOR | Headquarters |
| `hr@moch.gov.il` | HR | Headquarters |
| `mankal@moch.gov.il` | EXECUTIVE + ADMIN | Director-General's office |

**See the targeting work:** sign in as `haifa.employee` and then as `jerusalem.employee`.
The Haifa office-move announcement appears for exactly one of them.

## Layout

```
apps/
  api/        NestJS + Prisma + PostgreSQL — modular monolith
  web/        Next.js PWA — mobile-first, Hebrew/RTL first
packages/
  contracts/  zod schemas; the API and the clients compile against the same types
  ui/         design system — tokens, primitives
  config/     shared tsconfig
infra/
  docker-compose.yml
scripts/
  check-contrast.mjs       WCAG 2.0 AA gate over the design tokens
  check-logical-props.mjs  bans physical-direction CSS (ml-, text-left, …)
```

## The three ideas worth knowing

**Every piece of content carries an audience rule**, and one resolver decides who sees
it — [apps/api/src/audience/audience.ts](apps/api/src/audience/audience.ts). Department,
district, organization and role are ANDed; an empty rule means the whole Ministry. It is
pure, and it is the most heavily tested code in the repo, because a bug in it leaks
targeted content to the wrong people.

**Home is data, not a screen.** `GET /home` returns an ordered list of typed sections,
already resolved against the viewer. A round-two admin reorders Home by reordering rows
in `HomeSectionConfig` — no frontend release.

**Auth sits behind an interface.**
[apps/api/src/auth/providers/auth-provider.ts](apps/api/src/auth/providers/auth-provider.ts)
has one implementation today (local passwords). Microsoft Entra ID becomes a second one,
and nothing outside that folder changes.

## Accessibility

IS 5568 — the Israeli standard for a public body — is WCAG 2.0 AA, and it is enforceable
with statutory damages. So it is a build gate, not a review item:

```bash
pnpm check:a11y                     # token contrast + logical properties
pnpm --filter @moch/web test:e2e    # axe over every screen, he/en, light/dark
```

Alt text on images is required at **publish** time by the API, not patched in afterwards.
Where the gov.il palette failed contrast at mobile card scale, the token was darkened —
the brand bends, the standard does not.

## Commands

```bash
pnpm dev            # everything
pnpm test           # unit tests (the audience resolver)
pnpm check:a11y     # contrast + logical-properties gates
pnpm typecheck      # all packages
pnpm db:reset       # wipe and reseed
```

## What is not here

Community, the full Services module, the interactive district map, the Weekly Summary
page, the admin dashboard, analytics, and push notifications are all scoped out of round
one. Content is created by the seed script and the REST API — the admin publishing UI is
the first thing in round two.

## Open questions for the Ministry

1. **The national government design system** is mandatory for new government digital
   projects but restricted to authorized agencies. The tokens in
   [packages/ui/src/tokens.css](packages/ui/src/tokens.css) are provisional until we have it.
2. **Almoni**, gov.il's typeface, is commercially licensed. Without a license the app
   ships Assistant, which is a visible difference from the public site.
3. **Does a district's post need HQ approval before it publishes?** The `status` field
   models draft → pending → published, but the approval rules need a human answer.
