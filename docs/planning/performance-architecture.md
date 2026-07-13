# Performance Architecture

## Status: Implemented (code); deploy migration + warm API still ops

## Problem

The platform feels correct but not yet *smooth* under real use. Round 1 shipped audience-safe Home and Feed; round 2 is wiring admin. Several layers already cost latency today, and a few will hurt once ~5,000 employees and admin analytics are live:

- **Perceived slowness is often infra, not SQL.** The API on Render free sleeps after idle; the first SSR Home after a quiet period waits 30–50s for wake. That dominates any query tuning.
- **Every authenticated request hits Postgres twice for identity.** `JwtStrategy.validate` re-reads the user on every call (by design, for instant role revoke). Combined with SSR that calls `/auth/me` in the layout *and again* on Home, a single page load stacks redundant round-trips.
- **Home is one HTTP response but many DB queries.** `HomeService.getHome` fans out with `Promise.all` per section — good wall-clock latency, hard on the connection pool under concurrent logins.
- **Feed cards over-fetch.** List responses include full `body` plus a Node-computed `excerpt`; search uses unindexed `ILIKE`; comments and jobs lists are unbounded.
- **Media is not optimized at the edge.** Presigned uploads are right; there is no image resize/CDN transform path, and the web app never uses `next/image` despite `remotePatterns` being configured.
- **No cache, queue, or rate limit layer.** Org dictionaries, channels, and home section config are re-read from Postgres every time. Telemetry/audit (when live) write on the request path. Login/presign/telemetry have no throttling.
- **Admin aggregations are heavy by design and not yet gated.** `dashboard.service.ts` runs a large transaction of counts/`groupBy`/raw SQL; indexes for some of those filters are missing. Admin React Query scaffolding exists but Providers are not mounted yet.

What we cannot answer today without measurement:

- Which Home section queries dominate P95?
- How often is the API cold vs warm in real demos?
- What is the p95 of feed page 1 with the current `POST_INCLUDE` graph?

## Goal

Employees open Home and Feed in under a couple of seconds on a warm API, with stable scroll and media; the API stays correct on audience and auth while using fewer redundant DB trips; admin lists and dashboards stay responsive as data grows — without rewriting the modular monolith into microservices.

## Why

- **Perceived performance is the product.** The brief is an app people open every morning; cold starts and double auth fetches break that more than missing features.
- **Correctness already paid for.** Audience filtering in SQL, cursor feed pagination, batched likes, and presigned uploads are the right spine — optimize *on top* of them, do not replace them.
- **~5,000 users is small for Postgres, large for careless fan-out.** Full-table birthday scans and unbounded comments are fine in a demo seed and painful under concurrent morning load or a viral post.
- **Admin must not invent a second data path.** The same contracts, indexes, and caching rules should serve employee and admin surfaces.

## Approach

Keep the NestJS modular monolith + Next.js PWA/admin + Neon + S3-compatible storage. Add measurement first, then cut redundant work, then add indexes and selective caching, then harden lists/media/admin. Do **not** introduce Redis or a worker fleet until a measured hotspot needs them.

### Layer map (today → target)

| Layer | Today | Target (this plan) |
|---|---|---|
| Hosting | Render free (sleeps), Vercel web, Neon pooled | Keep; prefer always-on API for demos; keep Neon pooler |
| Auth | JWT + DB user on every request; duplicate `/auth/me` in layout + page | Short-lived in-process user cache *or* React `cache()` dedupe of `/auth/me`; keep revoke semantics |
| Home | N parallel section queries, birthday full scan | Cap concurrency / merge hot queries; SQL or cached birthday window |
| Feed | Cursor OK; heavy include; ILIKE search; unbounded comments | Slim list DTO; indexes/FTS later; paginate comments |
| Media | Public object URLs; raw `<img>` | `next/image` + sized URLs; optional transform later |
| Cache | None (deliberate `no-store` for audience pages) | Cache only *non-personalized* dictionaries (channels, org trees, home config shape) |
| Admin | Heavy dashboard SQL; QueryClient unused | Indexes + rollups; mount Providers; prefetch + `staleTime` |
| Safety | No rate limits | Throttle login, presign, telemetry |

### Principles

1. **Audience-personalized responses stay `no-store`.** Never put Home/Feed HTML or JSON in a shared CDN/HTTP cache keyed only by URL.
2. **Prefer fewer round-trips over cleverer SQL** when the win is obvious (dedupe `/auth/me`, slim feed list fields).
3. **Index the filters you already run** before adding Redis.
4. **Measure before queues.** Background jobs for analytics rollups only when dashboard queries exceed ~300ms (already noted in schema comments).

### Inspiration (external, not copied)

- Prisma: one client, pooler-aware URLs, kill N+1 with batch/`include`, tight `select` trees over fat graphs.
- TanStack Query + App Router: prefetch + hydrate + non-zero `staleTime` so admin does not refetch storms; key factories for invalidation.
- Feed/media platforms: keep HTTP handlers thin (presign already), cache dictionaries, resize images at the edge, push heavy aggregations off the request path when they grow.

## Implementation

### Phase 0: Measure (1–2 days)

1. Enable Prisma query logging (or OpenTelemetry) in staging/dev for Home, Feed, and `/auth/me`.
2. Record warm vs cold P95 for Home SSR against the deployed API.
3. Add a simple request timing log (or existing APM) for `JwtStrategy` + top services — enough to rank the phases below with numbers.

### Phase 1: Quick wins — cut redundant work (employee app + API)

Highest ROI for “everything feels smooth” on a warm API.

1. **Dedupe `/auth/me` in Next.** Use React `cache()` around the server fetch used by `(app)/layout.tsx` and pages so one RSC tree pays once. Stop the Home page from fetching me again if the layout already has what greeting needs (pass via props or a tiny shared loader).
2. **Slim feed list payloads.** List endpoint returns `excerpt` (or truncated body) + media thumbs metadata; full `body` only on detail / expand. Keeps cursor pagination and batch likes as-is.
3. **Paginate comments** (cursor or limit+offset) and **paginate jobs** — same contracts style as feed/admin lists.
4. **Use `next/image`** (or explicit `width`/`height` + `loading`) on `PostCard`, Home cards, and Avatars where URLs are known hosts — cuts CLS and download size.
5. **Feed “load more” → intersection observer** (still no virtualization required at current page sizes); add windowing only if users commonly load 100+ posts in one session.

### Phase 2: Auth and Home DB load

1. **JWT user lookup.** Keep “roles from DB” semantics, but add a short TTL in-process cache keyed by `userId` (e.g. 5–30s) *or* embed non-sensitive scope claims and refresh from DB only when permissions are checked for mutating routes. Document the revoke latency tradeoff.
2. **Home section fan-out.** Either:
   - bound parallelism (e.g. p-limit 4), or
   - coalesce the common content kinds into fewer `findMany` calls grouped by `kind`, then slice in memory per section.
3. **Birthdays.** At 5k users the full scan is acceptable; still add `@@index([isActive, birthday])` and/or a SQL month-day filter / nightly materialized “next 14 days” table before admin-wide people growth. Comment in code already acknowledges the tradeoff — promote it when measured.

### Phase 3: Indexes and search

1. Add indexes that match existing queries:
   - `EventDetail.startsAt`, `TrainingDetail.startsAt`
   - `Comment.createdAt`, `Interaction.createdAt` (admin ranges)
   - GIN on audience array columns used by `has` / `hasSome` (`audDepartmentIds`, `audDistrictIds`, `audOrganizationIds`, `audRoles`) if `EXPLAIN` shows seq scans
2. Replace feed `ILIKE` with Postgres full-text or `pg_trgm` when search is used in production demos; until then, keep `q` but document the cost.
3. Ensure Neon **pooled** `DATABASE_URL` + `DIRECT_URL` for migrations remain the only Prisma connection path in prod (already planned).

### Phase 4: Selective caching (only if Phase 0–1 still show load)

1. Cache **non-personalized** data in-process first (Node `lru-cache`): channel list metadata, department/district/org dictionaries, enabled `HomeSectionConfig` rows (audience filter still applied in process or per-request).
2. Introduce **Redis** only when multiple API instances need a shared cache or rate-limit store — not before.
3. Never cache audience-filtered content lists in a shared store without the viewer scope in the key.

### Phase 5: Media and edge

1. Standardize image URLs with explicit sizes (query params on transform-capable hosts, or a small imgproxy/Cloudflare Images later).
2. Keep bytes off Nest (presign stays).
3. Lazy-load below-fold Home media; keep Video-of-week iframe gated behind open (already done).

### Phase 6: Admin performance (as admin UI lands)

1. Mount `Providers` (TanStack Query) in the admin layout; keep `staleTime: 30_000`, `refetchOnWindowFocus: false`.
2. Prefetch list/dashboard in RSC → `HydrationBoundary` with matching query keys (`qk.*`).
3. Offset pagination + `placeholderData: keepPreviousData` for tables (as planned in admin-dashboard).
4. Dashboard: ship counts with the current transaction *only while tables are small*; when P95 > ~300ms, add nightly rollup tables / materialized views and read those. Index the raw paths used today before rewriting.
5. Telemetry ingest: cap batch size, rate-limit the endpoint, consider async flush later — do not block UX (fail-open already).
6. `dynamic()` import Recharts and heavy table chrome so login/shell stay light.

### Phase 7: Operational smoothness

1. For stakeholder demos: paid Render instance **or** reliable keep-alive so cold start is rare.
2. Add `@nestjs/throttler` (or edge limits) on `POST /auth/login`, media presign, and telemetry.
3. Optional: Helmet and explicit body size limits on the API.
4. CI: keep Turbo cache; avoid pulling admin chart deps into `@moch/web`.

## Scope

This plan does **not**:

- Split the API into microservices
- Move employee pages to TanStack Query (local state + SSR first page is fine for Feed today)
- Put personalized Home/Feed in a CDN cache
- Replace Prisma with raw SQL everywhere (raw only for proven hot aggregations)
- Build a full observability stack (Datadog etc.) — Phase 0 is enough to prioritize
- Change auth to Entra ID (separate seam; already designed)
- Finish the admin product surface — only the performance rules it must follow

## Notes

- **Production awareness.** Web is on Vercel; API on Render; DB on Neon; media on Supabase Storage. Any Redis or worker adds a new managed service and ops surface — justify with metrics.
- **Security vs speed.** JWT DB refresh exists so role revoke is immediate. Caching that lookup trades revoke latency (seconds) for lower load — call that out in the PR that implements it; do not silently weaken it.
- **`cache: "no-store"` stays for personalized server fetches.** Caching wins are dictionaries and client-side admin Query staleTime, not shared page caches.
- **Rollback.** Index migrations are additive (`CREATE INDEX CONCURRENTLY` where possible). Payload shape changes (feed without full body) need contract bumps coordinated with `apps/web`.
- **Open questions.**
  1. Is always-on API budget available for demos, or must we optimize only for warm path + document cold start?
  2. Acceptable role-revoke delay if we cache JWT user rows (0 / 5s / 30s)?
  3. Should feed detail be a separate route/endpoint, or expand-in-place with a second fetch?

## Suggested priority order

| Priority | Item | Why |
|---|---|---|
| P0 | Warm API (plan/paid/keep-alive) | Dominates perceived perf |
| P0 | Dedupe `/auth/me` + slim feed list | Free latency on every session |
| P1 | `next/image` / image dimensions | CLS + bandwidth on mobile |
| P1 | Comment/jobs pagination | Avoid unbounded responses |
| P2 | JWT lookup TTL or mutate-only refresh | Cuts DB QPS under concurrency |
| P2 | Home query coalesce / indexes | Scales morning rush |
| P3 | Admin Providers + dashboard indexes/rollups | Before analytics traffic |
| P3 | Rate limits + optional Redis | Abuse and multi-instance |
