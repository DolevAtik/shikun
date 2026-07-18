# Performance Report

A review of the runtime and bundle performance of the API and the two frontends. The
backend performance *design* is documented in
[planning/performance-architecture.md](planning/performance-architecture.md); this report
records the current state and the remaining opportunities. No performance change was applied
automatically — the one actionable item (F-1) alters SSR behavior and is left for a decision.

**Overall: already well-optimized.** The expensive paths were engineered deliberately.

## What is already in place

### API / database
- **GIN indexes on the audience array columns** (`ContentItem.aud*` — departments,
  districts, organizations, roles). The audience resolver filters with `has`/`hasSome`;
  without GIN these are sequential scans, so this is the single most important index in the
  schema (`migrations/…_performance_indexes`).
- **Composite/range indexes** for the Home and admin queries: `User(isActive, birthday)`,
  `EventDetail(startsAt)`, `TrainingDetail(startsAt)`, `Comment(contentItemId, createdAt)`,
  `Interaction(createdAt)`, `Registration(createdAt)`.
- **In-process TTL cache** (`common/ttl-cache.ts`) for non-personalized dictionaries and
  the short-lived JWT user lookup — explicitly *not* for audience-filtered content, which
  is the correct boundary (caching personalized content is how you leak it).
- **Bounded-concurrency `mapPool`** so section resolution fans out with a fixed ceiling
  rather than unbounded `Promise.all`.
- **Login avoids a second round trip** — the auth provider returns the user with its org
  relations, so the row is read once (`auth.service.ts`).
- **Pagination** is a shared helper (`common/pagination.ts`); list endpoints are paged.

### Frontends
- **Server-first rendering.** The employee app has only ~9 client components out of its
  component tree; data is fetched in async server components (`serverFetchOrLogin`), so
  there are no client-side fetch waterfalls on first paint. This is the biggest single
  performance lever and it is already pulled.
- Client components are scoped to genuinely interactive pieces (nav, forms, feed
  interactions, telemetry beacon).
- Media is uploaded directly to object storage via presigned URLs — large files never pass
  through the API process.
- `NEXT_PUBLIC_*` build inputs participate in the Turbo cache key, so builds are correctly
  incremental.

## Findings / opportunities

### F-1 — Code-split `recharts` on the admin dashboard (Medium, frontend)
`recharts` is a large charting library imported statically into
`admin/.../dashboard/DashboardView.tsx`, a client component, so it lands in the dashboard's
initial JS. Loading it with `next/dynamic({ ssr: false })` (or a dynamic `import()` behind a
render gate) would remove it from first load and fetch it only when the dashboard mounts.
**Trade-off:** the chart would no longer server-render; acceptable for an
authenticated-only admin view. This is the highest-value bundle win available.

### F-2 — Consider `dynamic` for other heavy, rarely-first-paint admin widgets (Low)
The admin app uses no route-level dynamic imports today. Beyond charts, the command palette
(`cmdk`) and large editors are candidates if bundle analysis shows them on the critical
path. Measure first (`next build` already prints per-route First Load JS) before splitting —
over-splitting adds request waterfalls.

### F-3 — TTL cache is per-process (Informational)
`TtlCache` is in-memory, so on a multi-instance deployment each instance keeps its own copy
and entries are not shared or invalidated across instances. This is fine for the current
single-instance Render deployment and for the data it caches (dictionaries, short TTLs). If
the API scales horizontally and starts caching anything with a correctness requirement,
move to a shared cache (e.g. Redis). No action needed now.

## Suggested priority

1. **F-1** — measurable reduction in the admin dashboard's initial JS, low risk.
2. F-2 — only after reading the per-route First Load JS numbers from `next build`.
3. F-3 — revisit if/when the API scales beyond one instance.
