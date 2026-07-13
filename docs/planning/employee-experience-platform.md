# Employee Experience Platform — Ministry of Construction and Housing

## Status: Round 1 delivered

Foundation, Home and Feed are built and verified. Round two starts with the admin
publishing surface. What shipped, and how it was checked, is in the README.

Two things changed during the build and are worth recording:

- **District colors became design tokens, not database hexes.** A single hex cannot clear
  WCAG contrast on both a white card and a dark one, and a district chip is colored text on
  a tint of itself. The database now stores `var(--district-haifa)` and the theme resolves it.
- **The header needed its own surface token.** `--brand-navy` was doing two jobs — a text
  color and the header background. In dark mode the text color correctly inverts to a light
  blue, which quietly turned the header into white-on-pale-blue at 1.94:1. axe caught it on
  the real page; the static contrast check had not, because it tested the pair that was
  written down rather than the pair that rendered.

## Context

The Ministry has no single digital home. Employees learn what is happening through scattered emails, WhatsApp groups, and word of mouth; headquarters and the regional districts barely see each other's work; and there is no place where an employee can find a colleague, register for training, or read what leadership actually said.

This plan covers the foundation and the first two surfaces of an internal Employee Experience Platform: the **Home** hub and the **Feed**. It is round one of a larger product (Community, Services, Profile, District Map, Weekly Summary, Admin, Analytics all follow) and it deliberately builds the spine those later modules hang off, rather than shipping every screen shallow.

The bar is a product employees open voluntarily every morning — comparable in feel to Teams, Notion, or LinkedIn, not to a 2010s government portal, while still reading unmistakably as the Ministry of Construction and Housing.

## Problem

- An employee cannot answer "what happened at the Ministry this week?" in under a minute.
- Content has no audience targeting — everything goes to everyone, so people stop reading.
- Districts are invisible to headquarters and to each other.
- There is no shared identity, role, or permission model to build any of the above on.
- Nothing today is accessible to IS 5568 / WCAG 2.0 AA, which is legally binding for a public body in Israel.

## Goal

An employee opens the app, and within sixty seconds knows what matters to *them* today — with the content targeted, in Hebrew, accessible, and fast enough that they come back tomorrow.

## Why

- **Home is the product.** Every reference platform (Simpplr, Staffbase, LumApps) wins or loses on the personalized home hub, not on feature count. If Home feels premium, the rest is downhill.
- **Targeting is the differentiator.** The market lesson is that engagement collapses when everyone gets everything. Audience rules (department / district / role) must exist in the data model from the first migration — retrofitting them is a rewrite.
- **The foundation is load-bearing.** Auth, roles, i18n/RTL, the design system, and the content model are used by all seven remaining modules. Getting them right once is the difference between a 3-month product and a 12-month one.
- **Accessibility is not optional.** IS 5568 (≈ WCAG 2.0 AA) carries statutory damages up to ₪50,000 per claim. It is cheap to build in and expensive to bolt on.

## Approach

### Stack and shape

A **pnpm + Turborepo monorepo**. The employee app is a mobile-first **Next.js PWA** — one React codebase that is instantly demoable in a browser, installable on a phone, and shares its design system with the admin dashboard that comes in round two. A Flutter client can be added later against the same REST contract if app-store distribution is required; nothing here forecloses that.

```
apps/
  web/        Next.js — employee PWA (mobile-first, the five tabs)
  admin/      Next.js — admin dashboard (scaffold only in round one)
  api/        NestJS — modular monolith, clean architecture
packages/
  ui/         design system: tokens, primitives, cards
  contracts/  zod schemas + inferred TS types, shared by api and clients
  config/     eslint, tsconfig, tailwind preset
infra/
  docker-compose.yml   postgres + minio (S3-compatible object storage)
```

**Backend**: NestJS modular monolith (not microservices — wrong cost at this size, and the module boundaries give us the same seams later). Prisma + PostgreSQL. Repository pattern so modules depend on interfaces, not on Prisma. Object storage via S3-compatible presigned uploads (MinIO locally, any bucket in production).

**Auth**: JWT access + refresh, behind an `AuthProvider` interface with a `LocalAuthProvider` implementation now. Microsoft Entra ID / OIDC becomes a second implementation later without touching call sites — this is the single most important future-integration seam in the spec.

### Hebrew, RTL, and typography

Hebrew is the default locale and RTL the default direction. `next-intl` with locale routing (`/he`, `/en`); every string goes through i18n from line one. Layout uses **CSS logical properties only** (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*` in Tailwind) — no `left`/`right` anywhere, so the LTR flip is free rather than a rewrite. Hebrew-first type stack, since premium typography in Hebrew is a different problem from premium typography in Latin and most enterprise apps get it wrong.

### Brand and visual identity

The app must feel continuous with the Ministry's public identity on gov.il — same blues, the same calm institutional tone, the Ministry's colorful-houses logo in the header — while being *warmer* than the public site, because this is an internal home, not a service counter.

Two hard constraints surfaced in research, and both need a decision from the Ministry rather than an invention from us:

- **Israel has a national government design system**, mandatory for new government digital projects since 2025 — but access is restricted to authorized government agencies. If the Ministry can obtain it, it becomes our token source and this section collapses into "consume the official system." Until then we derive tokens from the live gov.il site and treat them as provisional.
- **gov.il's typeface is Almoni** (AlefAlefAlef) — a commercial, licensed font, not a free one. If the Ministry holds a license we use it. If not, the fallback is a free Hebrew face (Assistant / Heebo), and the design must not depend on Almoni's exact metrics.

The logo's house colors are the app's **accent** palette — used for category chips, district colors on the map, and badge tiers — which lets the brand feel present without a single blue-on-blue government screen. The logo itself is used as-is, never recolored or redrawn.

### Design system

Token-driven (`packages/ui`): color, spacing, radius, elevation, motion — with the brand tokens as the single source, so a later swap to the official government system is a token-file change, not a refactor. Light mode first with dark mode from the same tokens. Rounded cards, soft shadows, restrained gradients, generous spacing, calm motion (and a `prefers-reduced-motion` path). Accessibility is enforced in the primitives — focus rings, contrast-checked pairs, semantic landmarks, rem-based sizing that survives 200% zoom — so screens inherit compliance instead of each one re-litigating it.

Where brand and accessibility collide, accessibility wins and we darken the token — the law is not negotiable and the brand is.

### Content and targeting model

One idea does most of the work: **every piece of content carries an audience rule**, and a single resolver decides who sees it.

| Concept | Purpose |
|---|---|
| `Audience` | department IDs + district IDs + role list; empty = everyone |
| `ContentItem` | base for announcements, feed posts, events, careers, trainings |
| `Channel` | a feed an employee can follow (Organization, Districts, Projects, People, Leadership, Innovation, Learning, Career, Videos, Success Stories) |
| `Interaction` | like / comment / bookmark / share, polymorphic over content |
| `HomeSection` | ordered, typed, admin-configurable Home layout |

Home is **not** a hardcoded screen. It renders an ordered list of typed sections (greeting, emergency alert, announcements, events, CEO message, video of the week, projects, key numbers, careers, training, quick actions, birthdays, recognition, quick links) from a single `GET /home` call that resolves the viewer's audience server-side. That is what makes Home configurable in round two without a frontend release, and it is why the Home endpoint is one request rather than fifteen.

### Roles

`Employee`, `Manager`, `DistrictManager`, `ContentEditor`, `HR`, `Executive`, `Administrator` — as a permissions matrix (`publish`, `edit`, `delete`, `approve`, `manage:users`, `manage:feeds`, `manage:content`, `view:analytics`) evaluated by a NestJS guard. Roles are seeded and enforced in round one even though the admin UI that exercises them arrives in round two; the API is the enforcement point either way.

## Implementation

### Phase 1: Foundation
1. Monorepo: pnpm workspaces, Turborepo, shared tsconfig/eslint/tailwind preset in `packages/config`.
2. `infra/docker-compose.yml` — Postgres + MinIO.
3. `apps/api` NestJS skeleton: config, Prisma module, health check, global validation pipe, error filter.
4. `packages/contracts` — zod schemas as the single source of truth for request/response types.

### Phase 2: Design system and shell
1. Brand assets: Ministry logo as SVG (header, splash, PWA icons, favicon), brand tokens extracted from gov.il, logo-derived accent palette. Every token contrast-checked before a single component uses it.
2. `packages/ui` — tokens (light + dark), then primitives: Button, Card, Avatar, Badge, Chip, Skeleton, Sheet, Tabs, EmptyState.
3. Hebrew type scale and font loading — Almoni if licensed, Assistant/Heebo fallback behind one font token; logical-property Tailwind preset with `left`/`right` lint-banned.
4. `apps/web` shell: `next-intl` locale routing, RTL `dir` handling, five-tab bottom navigation, app-wide layout, PWA manifest + service worker.
5. Dark mode via `prefers-color-scheme` plus an explicit user toggle.

### Phase 3: Identity, roles, org data
1. Prisma schema: `User`, `Department`, `District`, `Role`, `Audience`.
2. Auth module: JWT access/refresh behind `AuthProvider`; login screen; session handling in the PWA.
3. Roles guard + permissions matrix.
4. Seed script with the Ministry's **real** structure, not invented placeholders:
   - **Five districts** (מחוזות): צפון, חיפה, מרכז, ירושלים, דרום. There is no Tel Aviv district — the org chart is five, and the district map must draw five.
   - **Senior divisions** (אגפים בכירים): כספים, טכנולוגיות דיגיטליות ומידע, מימון ותקציבים, נכסים וחברות, רשם הקבלנים, שיווק, תכנון, הגנה על רוכשי דירות, מיעוטים, ניתוח כלכלי, רכש ולוגיסטיקה.
   - **Administrations** (מינהלים): מינהל לסיוע בדיור, מינהל ענייני הכפר. Plus הלשכה המשפטית.
   - ~60 employees spread across those units and all seven roles, with Hebrew names and real-sounding job titles.
5. Model the **subordinate bodies** (רשות מקרקעי ישראל, עמידר, חלמיש, הרשות להתחדשות עירונית, המרכז למיפוי ישראל, דירה להשכיר…) as a first-class `Organization` relation rather than free text. They are separate legal entities whose staff may eventually need scoped access, and encoding them as strings now guarantees a migration later.

### Phase 4: Home
1. Prisma: `ContentItem`, `Announcement`, `Event`, `HomeSection`, `QuickLink`, `Recognition`, birthdays.
2. Audience resolver service — the one function that decides visibility. Unit-test it hard; everything downstream trusts it.
3. `GET /home` — returns the viewer's ordered, resolved sections in one call.
4. Home screen: greeting, emergency alert banner, and the section cards. This is the screen that gets the design attention.

### Phase 5: Feed
1. Prisma: `Channel`, `FeedPost`, `Media`, `Follow`, `Interaction`, `Tag`.
2. Feed endpoints: list channels, follow/unfollow, paginated channel feed (cursor-based), like / comment / bookmark, filters and tags.
3. Media: presigned upload to object storage, image + video, thumbnails.
4. Feed UI: channel switcher, post card (image/video/attachment), interactions, filters, bookmarks.
5. Basic search across feed content — the scaffold for the global search that lands with Services.

### Phase 6: Accessibility and quality gate
1. `axe-core` via Playwright over every shipped screen, in CI, in both directions and both themes.
2. Keyboard-only walkthrough; screen-reader labels in Hebrew; 200% zoom; contrast audit against WCAG 2.0 AA.
3. Lighthouse PWA + performance budget on Home.

## Scope

This plan does **not** build: Community (posting, polls, mentions), Services (directory, forms, knowledge center), Profile beyond the identity record, the interactive District Map, the Weekly Summary page, the full Admin dashboard, Analytics, push notifications, or the Flutter client.

Round one produces content through the **seed script and the REST API**, not through an editor UI — the admin publishing surface is the first thing in round two. That is a deliberate boundary, and it means the round-one demo shows seeded content, not content you typed in yourself.

The recognition/badge system is modeled in the schema but not surfaced beyond the Home recognition card.

## Verification

1. `docker compose up -d && pnpm db:seed && pnpm dev`.
2. Log in as a seeded user of each role; confirm the permissions matrix actually denies what it should (a `ContentEditor` can publish, an `Employee` gets 403).
3. Confirm targeting works: log in as a Haifa district employee and a Jerusalem HQ employee side by side — Home must differ, and a district-targeted announcement must appear for exactly one of them.
4. Walk Home and Feed on a 375px viewport: follow a channel, like, comment, bookmark, upload an image, filter by tag.
5. Flip to `/en` — layout mirrors cleanly, nothing overlaps. Flip to dark mode — contrast holds.
6. Put the app next to the Ministry's gov.il page on one screen: it should read as the same organization, and as a nicer product.
7. `pnpm test` (unit, with the audience resolver covered) and `pnpm test:e2e` (Playwright + axe, zero WCAG 2.0 AA violations).

## Notes and open questions

- **No production risk.** Greenfield repo, no active bots, no shared infrastructure, no partner config. Nothing to roll back.
- **Three things to request from the Ministry, in priority order.** All three are cheap to ask for now and expensive to work around later:
  1. **Access to the national government design system** (mandatory for new government digital projects since 2025, restricted to authorized agencies). If we get it, it replaces our provisional tokens outright.
  2. **The Almoni font license** — gov.il's typeface is commercial. Without it we ship a free Hebrew fallback, which is fine, but it is a visible difference from the public site.
  3. **The logo as vector source files** (SVG), plus whatever brand guidelines exist. Tracing it from a website screenshot is not acceptable output for a government product.
- **Brand-vs-accessibility conflicts are expected.** The gov.il palette was tuned for a desktop public site; some of it will fail WCAG 2.0 AA at mobile card scale. The plan resolves these in favor of accessibility, but the Ministry should know we may darken official blues rather than ship a legally exposed screen.
- **Entra ID is the biggest technical unknown.** The `AuthProvider` seam is designed for it, but the Ministry's actual tenant, claims, and group mappings will shape the user sync. Worth confirming early — it can invalidate assumptions in the `User` model.
- **Who are the real content editors?** The publishing workflow (does a district post need HQ approval before it appears?) changes the state machine on `ContentItem`. We model a `status` field with a draft → pending → published path, but the approval rules need a human answer before round two.
- **Video hosting at ministry scale** (CEO video, video of the week) may need a real transcoding pipeline rather than raw object storage. Fine for round one; flag it before Community lets everyone upload video.
