# Admin Dashboard — Employee Experience Platform

## Status: Planning

## Context

Round 1 shipped a mobile-first Hebrew/RTL PWA for the ~5,000 employees of the Ministry of Construction and Housing. It is live: web on Vercel, the API on Render, Postgres on Neon, media in an S3 bucket.

It has no admin. Every content item on that platform was put there by `apps/api/prisma/seed.ts`. Today, changing what appears on an employee's Home screen means writing SQL. The README says it plainly: *"the admin publishing UI is the first thing in round two."*

This plan builds it: a desktop-first web console for communications, HR, district managers, executives, and system administrators to manage all platform content, people, and configuration.

The original brief specified React + Vite + React Router + Axios. **We are not doing that**, and the reason matters: this repo already has a Next.js 15 + NestJS monorepo with a proven httpOnly-cookie auth model where the browser never holds a token. A Vite SPA would have to either move tokens into JavaScript or add cross-origin cookies with CSRF protection — a real security regression, to satisfy a stack preference. The admin is a new Next.js app (`apps/admin`) that reuses that auth pattern. TanStack Query, shadcn/ui, and TanStack Table all come in as specified.

## Problem

- **Nothing can be published.** The only write endpoints in the API are create-post, comment, like/bookmark, follow, and media-presign. There is no content CRUD, no moderation, no user management, no scheduling.
- **Nothing is measured.** There is no telemetry table. Nothing logs a page view, a session, or a read. DAU/MAU cannot be computed from data that was never collected.
- **Nothing is recorded.** There is no audit log. If content changed, there is no record of who changed it.
- **The rules exist but have no UI.** The permissions matrix, the seven roles, and the audience-targeting model are all live and enforced in the API — and completely unreachable by a human.
- **Whole domains have no data model at all**: notifications, documents/policies/FAQ, courses, content version history, moderation reports, media folders.

## Goal

A production-grade admin console where an authorized non-engineer can publish targeted content, moderate the community, manage employees and districts, send notifications, and see honest analytics — with every screen backed by a real endpoint and real data.

## Why

- **The platform is inert without it.** Round 1 built a beautiful surface with no way to feed it.
- **The hard part is already done.** The audience model, the RBAC matrix, the content schema, and the presigned-upload flow all exist and are tested. The admin exposes them; it does not invent them.
- **Accessibility is a legal obligation, not a preference.** IS 5568 (WCAG 2.0 AA) applies to a public body and carries statutory damages. The repo already enforces it with two build gates. The admin must extend them, not exempt itself from them.

## Approach

### One new app: `apps/admin`

Next.js 15 App Router, port 3002, its own Vercel project. Reuses `next-intl` (he/en), the `@moch/ui` token system, and the login/proxy/cookie auth pattern copied from `apps/web`. Shares types via `packages/contracts`. Does **not** share components with the employee app beyond the existing `@moch/ui` primitives — `packages/ui` is source-only and feeds a mobile PWA that has zero Radix in its bundle today.

```
apps/admin/
  components.json         { "rtl": true, style: base-nova }
  src/
    app/
      shadcn-bridge.css   ← the token mapping layer (below)
      api/auth/{login,logout}/route.ts
      api/proxy/[...path]/route.ts     GET POST PUT PATCH DELETE
      [locale]/(admin)/   the 15 sections
    components/
      ui/        vendored shadcn primitives — admin-only
      shell/     AppShell Sidebar Topbar Breadcrumbs GlobalSearch UserMenu
      data/      DataTable Toolbar Pagination BulkActionBar Export
      form/      AudiencePicker RichTextEditor MediaPicker SchedulePicker
      charts/    Recharts wrappers bound to the accent tokens
    lib/
      client-api.ts  query-keys.ts  use-list-query.ts  nav.ts
```

### shadcn/ui, re-themed — without forking the token file

The rule this codebase lives by is *"colors are CSS variables, never literals — swapping the token file swaps the whole product."* shadcn ships its own variable names (`--background`, `--primary`, `--muted`…). We reconcile them in one file, `shadcn-bridge.css`, where **every shadcn variable is declared as an alias of a moch variable, never as a value**:

```css
:root {
  --background: var(--bg);
  --foreground: var(--text);
  --primary:    var(--brand-blue);
  --muted:      var(--surface-sunken);
  --ring:       var(--brand-blue);
  --chart-1:    var(--accent-blue);   /* reuse the 6 existing accent tokens */
  /* … */
}
```

**There is no `.dark` block in that file, and that is the whole design.** Every right-hand side is a variable `tokens.css` already redefines under `.dark`, so dark mode comes for free and the one-file-swaps-the-product property survives — including a future migration to the national government design system.

We keep shadcn's class names (`bg-background`, `text-muted-foreground`) rather than rewriting components to moch names. Rewriting would look tidier and would break every future `shadcn add` and every upstream diff, forever.

**RTL:** shadcn shipped official RTL support in January 2026. `"rtl": true` in `components.json` + `shadcn add --rtl` emits logical classes (`ms-*`, `start-*`, `slide-in-from-end`). Three caveats, with decided answers:

| Component | Decision |
|---|---|
| `sidebar` | **Don't vendor it.** ~700 lines needing manual RTL migration. Ours is a ~150-line `<nav>` with `border-inline-end`, RTL-correct by construction and permission-filtered server-side. |
| `pagination` | **Don't vendor it.** shadcn's is a link-based page list. What tables need is a footer: page-size select, "1–20 מתוך 340", semantic prev/next. ~60 lines. |
| `calendar` | **We do need it**, but not in Phase 1 (the Dashboard uses 7d/30d/90d presets). Phase 2: pass `dir` into react-day-picker v9, `weekStartsOn: 0` (Sunday), `date-fns/locale/he`. |

Portal animations use **fade + zoom, never directional slides** — a fade has no direction, so there is nothing to mirror and nothing for the buggy `tw-animate-css` logical slide utilities to get wrong.

### The list-page kit — build it once, use it fifteen times

Every one of the 15 sections is a table with search, filters, sort, pagination, bulk actions, and export. **The URL is the source of truth for list state** (via `nuqs`), which is what lets RSC and TanStack Query coexist without fighting:

```
page.tsx (server)      parse searchParams → prefetchQuery(qk.content.list(query)) → HydrationBoundary
ContentTable (client)  useListQuery() reads the same searchParams → useQuery(same key)
```

Same key on both sides, derived from the same URL. First paint is server-rendered with the viewer's cookie attached; no double fetch. `staleTime: 30s` and `placeholderData: keepPreviousData` so paging doesn't flash a skeleton.

**No Server Actions.** All mutations go `useMutation` → `adminFetch` → the proxy, because the proxy already implements single-use refresh-token rotation and Server Actions would need a second parallel refresh path.

Shared list contract in `packages/contracts/src/list.ts` — `ListQuerySchema` (page/pageSize/q/dir), `pageOf(item)`, and per-domain extensions where **`sort` is always a per-endpoint enum, never a free string** (otherwise it is an ORDER BY injection and an accidental seq-scan). Offset pagination, deliberately diverging from the feed's cursors: admins need "page 7 of 43" and a total count.

### The authorization distinction that this whole thing rests on

`apps/api/src/audience/audience.ts` answers **"may I *see* this?"** — and an empty audience dimension means *everyone*.

The admin needs the opposite question: **"may I *change* this?"** — where an empty dimension must mean *nobody but a ministry-wide manager*. These are not inverses; they are different questions. So we add `apps/api/src/audience/manageable.ts` beside it, following the discipline the existing file already established: two forms (`canManage` pure, `manageableWhere` compiled to Prisma) with a spec asserting they agree, exactly like `audience.spec.ts`.

**No admin list endpoint may ever call `audienceWhere`.** The trap, stated once so it lands: `audDistrictIds: { has: X }` excludes empty arrays, so ministry-wide content is *not* manageable by a district manager even though they can *see* it in the employee app. That is correct, and it is the easiest thing in this system to get backwards.

Enforced structurally: every admin content query goes through one `AdminContentRepository` that always ANDs `manageableWhere(viewer)`; writes use `updateMany({ where: { id, ...manageableWhere(viewer) } })` and assert `count === 1`, which closes the TOCTOU race and makes "not yours" indistinguishable from "not found" — the same information-leak discipline `FeedService.getPost` already applies. A third gate script, `scripts/check-admin-scope.mjs`, bans raw `prisma.contentItem` access outside the repository.

`/api/admin/*` is a separate namespace with its own controllers — never new verbs on the employee routes. Two opposite authorization models on one controller is exactly how content leaks.

### Extend `ContentItem` rather than adding tables

The existing content model is the payoff of Round 1's design, and most of the brief falls straight into it:

- **Documents, Policies, FAQ** → new `ContentKind` values + thin detail tables. They inherit audience targeting, status workflow, tags, search, and version history for free.
- **Scheduled publishing needs no scheduler.** Employee queries already filter `status: PUBLISHED, publishedAt <= now`. A row with a *future* `publishedAt` is already invisible and becomes visible at the right moment by itself. Scheduling is a datetime field.
- **Expiration needs no scheduler either** — add `ContentItem.expiresAt` and one clause to the visibility filter. (`AlertDetail.expiresAt` already exists; promote it.)

The only thing that truly needs a scheduler is notification sends. **In-process cron is a lie on Render's free tier** — the instance sleeps. Use an external GitHub Action cron → token-authed `POST /api/internal/tick` → idempotent handler. The existing keep-awake action already establishes this pattern.

### Telemetry starts in Phase 1, not Phase 4

Nothing is logged today, so **if telemetry slips to the Analytics phase, Analytics ships empty.** This is the single most important sequencing decision in the plan. `AnalyticsEvent` + `ContentRead` + a batched `POST /api/events` beacon land in Phase 1 — which means a small, unavoidable change to `apps/web`. Same argument for the audit log: one that starts recording in Phase 4 has a three-month hole in it, and completeness is the entire point.

Storage is a **raw event table with no rollups.** ~5,000 employees and ~200k events/month; Postgres will answer DAU/MAU directly for years. Premature rollup tables are the classic analytics over-engineering, and on a free-tier instance a nightly rollup job is itself a liability.

## Implementation

### Phase 0 — Plumbing (folded into Phase 1, ~3 days)

1. Scaffold `apps/admin` (port 3002, next.config, tailwind config extending `@moch/ui/tailwind-preset`, i18n, middleware, `messages/{he,en}.json` — a **separate** catalogue, not an extension of web's 123 keys).
2. `components.json` with `"rtl": true`.
3. **`scripts/check-logical-props.mjs` → add `"apps/admin/src"` to `ROOTS`** (one line — it turns "shadcn has RTL support" from a claim into a build failure).
4. Second Vercel project + `render.yaml`'s `WEB_ORIGIN` becomes a comma list (`main.ts` already splits on comma).
5. **Add CI** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. There is none today and both hosts deploy from `main` on push. 30 lines, highest-leverage safety change available.

### Phase 1 — Shell, design system, data layer, Dashboard (~3–4 weeks)

**Frontend**

6. `shadcn-bridge.css`; vendor ~29 primitives with `--rtl`; strip shadcn's `focus-visible:ring-*` in favour of the already-contrast-tested moch `--focus-ring`.
7. **Extend `scripts/check-contrast.mjs` *before* the components land**, or the gate passes a UI it never inspected. Add a `--danger-on` token (shadcn's white destructive-foreground on dark mode's light red `#f2988f` is ≈2.1:1 — **it fails**), the new muted/popover pairs, a `COMPOSITE_PAIRS` block reusing the existing `tintOver()` for shadcn's `bg-muted/50` habit, and the five chart tokens.
8. Providers: `QueryProvider`, Radix `DirectionProvider`, `<Toaster position="bottom-center">` (direction-neutral), `ThemeScript` copied from web.
9. Auth: login/logout route handlers, proxy **with PUT/PATCH added**, cookies renamed `moch_admin_at` / `moch_admin_rt` (see Notes).
10. Shell: `AppShell`, own `Sidebar` (15 sections from `lib/nav.ts`, permission-filtered **server-side** so the client is never told about sections it can't see), `Topbar` (breadcrumbs from `usePathname()` against the same registry, ⌘K global search, notification bell, user menu, theme + locale toggles).
11. `(admin)/layout.tsx` — `/auth/me` → 401 redirect → `admin:access` gate → `no-access` page.
12. **The list-page kit** — `DataTable` (TanStack Table), toolbar, own pagination, column visibility, `BulkActionBar`, CSV export, empty states, skeletons, `ConfirmDialog`, `useListQuery`. *This is the bulk of the phase and it pays for itself across the next 14 sections. Over-invest here.*
13. `lib/query-keys.ts` (hierarchical, with a `normalize()` so `{page:1,q:undefined}` and `{q:undefined,page:1}` aren't two keys), `lib/client-api.ts` with a typed `ApiError` that **maps the API's zod issues onto React Hook Form's `setError` per field** — a 400 lands on the right input, not in a generic toast.
14. Dashboard: KPI tiles, Recharts charts on the accent tokens, recent activity, quick actions. **Only metrics with real history** (see Notes).
15. **Settings → Home Layout editor** — `HomeSectionConfig` already exists, is already audience-aware, and already drives Home ("Home is data, not code"). Drag-to-reorder + enable/disable + audience. ~1 endpoint set and 1 screen, and it is the proof that the console actually *drives* the employee app. Best demo-to-cost ratio in the program.
16. e2e: new **desktop** Playwright project (the existing one is Pixel 7 only) running `expectNoA11yViolations` on every screen, he + en, light + dark.

**Backend**

17. `packages/contracts/src/list.ts` + `src/admin/*.ts`; `apps/api/src/common/pagination.ts`.
18. `audience/manageable.ts` + `manageable.spec.ts` + `scripts/check-admin-scope.mjs`.
19. `Permission` enum grows to ~20 (`admin:access`, `content:schedule`, `media:manage`, `comments:moderate`, `notifications:send`, `audit:view`, `roles:manage`…). **Still a hardcoded TS matrix.** DB-backed RBAC is Phase 4 — do not touch live auth in the phase where the admin's real permission shape is still being learned.
20. `AdminModule`: `admin/dashboard`, `admin/search` (one endpoint, grouped results, ⌘K), `admin/org`, `admin/home`.
21. **`AuditLog` + an `@Audited()` decorator + interceptor, wired to every admin write from day one.**
22. **`AnalyticsEvent` + `ContentRead` + `POST /api/events` + the `apps/web` beacon.**

### Phase 2 — Content CMS, Media Library, Moderation (~3–4 weeks)

23. Prisma: `ContentVersion` (immutable, appended **on publish, not on every keystroke**; detail stored as JSON, not eight duplicated tables), `ContentItem.expiresAt`, `Comment.status` + `hiddenReason` (**moderation must be soft — hard-deleting a comment destroys the evidence of the thing you moderated**), `ModerationReport`, `MediaFolder` + `Media.{folderId, uploadedById, deletedAt, replacesId}`.
24. `admin/content`: list, get, create, PATCH, publish/unpublish, schedule, pin, archive, hard-delete (only from ARCHIVED, only with `content:delete`), bulk, version list/diff/restore. **Bulk actions return `{ succeeded[], failed[{id, reason}] }`** — partial success is the *normal* case (a district manager archives 38 of 40; two aren't theirs) and the toast must say so.
25. **`AudiencePicker` — the flagship component.** Four dimension selectors, a live "this will reach ~N employees" count (`POST /admin/audience/estimate`), and a plain-Hebrew rendering of the rule ("עובדי מחוז חיפה שהם מנהלים"). This is what makes the audience model usable by a non-engineer. Give it real design time.
26. **Preview**: a short-lived signed token + a `/preview/[token]` route in **`apps/web`** that server-renders the real employee view, iframed at 390px inside the admin. Re-rendering the cards inside the admin would mean duplicating the employee renderers — and a preview that isn't the real renderer is a lie.
27. Rich text: **Markdown**. The editor writes Markdown; `apps/web` gets a sanitizing renderer to replace today's `whitespace-pre-line`.
28. `admin/media`: register-after-upload through the **existing** presign flow, folders, tags, alt-text editing with a **"missing alt" filter** (an accessibility dashboard, for free), replace/version, soft delete with a usage check, drag-drop upload.
29. `admin/moderation`: queue, hide/unhide, actor history — **plus the report button in `apps/web`.** A moderation queue with no report button in the employee app is a queue with nothing in it.
30. Calendar RTL migration.

### Phase 3 — Employees, Districts, Events, Learning, Careers, Services (~3–4 weeks)

Six CRUD sections, mostly variations on the Phase 1 kit — which is exactly why Phase 1 must be over-invested in.

31. **Employees**: list/search/filter, detail, create, **deactivate (never hard-delete a `User`** — FKs everywhere and audit integrity), role assignment, **bulk CSV import** (preview → validate → commit, per-row error report — a real feature, budget 3 days), export.
32. **Districts / Departments / Organizations**: CRUD. **District colors are *tokens*, not hexes** — offer the five token names, not a color picker, or the contrast gate becomes decorative.
33. **Events**: CRUD + capacity enforcement (`EventDetail.capacity` exists and nothing enforces it today) + waitlist + `Registration.status` + check-in + registrant export.
34. **Learning** *(catalogue + registration, not a full LMS)*: courses and webinars as `ContentItem`s extending the existing `TrainingDetail`, registration, attendance, instructors, training calendar, certificate PDF on attendance.
35. **Careers** *(external link, as today)*: `CAREER` CRUD. No applications table, no CV storage.
36. **Services**: `QuickLink`/`QuickAction` CRUD (both models exist) + `DOCUMENT`/`POLICY`/`FAQ` kinds + **the employee Services page must render them** (touches `apps/web`).

### Phase 4 — Notifications, Analytics, Permissions, Audit Logs (~4–5 weeks)

37. **Notifications**: `NotificationCampaign` (carrying **the same four audience columns**, resolved by the same `audienceMatches` — reuse the *rule*, not the table) + `NotificationDelivery` (materialized at send time, `@@unique([campaignId, userId])`, powers open/click rates *and* the in-app bell in both apps). Composer reuses `AudiencePicker`. **In-app + email only; web push is out of scope.**
38. **Analytics**: by now there are 3+ months of real events. Executive dashboards, drill-down, PDF + Excel export. ⚠️ **The PDF must embed a Hebrew font or every glyph renders as a box** — budget a day for that alone. Generate exports in a Vercel function, **never in-process on the API** (a 10k-row workbook can spike 200MB+ and OOM a 512MB instance).
39. **The RBAC migration** — the highest-risk item in the program, in its own week. See Notes.
40. **Permissions UI**: role list, permission-matrix editor, custom roles, per-assignment scope, "who has this permission" reverse lookup.
41. **Audit Logs UI**: filter by actor/action/entity/date, diff viewer, export. The data has been accumulating since Phase 1.

## Verification

Per phase, and not negotiable:

- **`pnpm lint`** — must pass, which now means: the contrast gate (extended with the new shadcn pairs), the logical-props gate (extended to `apps/admin/src`), and the new admin-scope gate.
- **`pnpm --filter @moch/api test`** — `manageable.spec.ts` must assert `canManage` and `manageableWhere` agree over a fixture matrix, the same way `audience.spec.ts` already does for the audience model.
- **`pnpm --filter @moch/admin test:e2e`** — every admin screen through axe (`wcag2a` + `wcag2aa`), in **he and en, light and dark**. Plus: **every chart ships with a visually-hidden `<table>` of its data** — Recharts renders SVG that axe will correctly flag, and a chart with no text alternative fails WCAG 1.1.1. Under IS 5568 that is not optional.
- **The employee-app regression net**: `pnpm --filter @moch/web test:e2e` must still pass after every phase. The audience-targeting tests in `apps/web/e2e/app.spec.ts` (a Haifa announcement is visible to `haifa.employee` and has count 0 for `jerusalem.employee`) are the canary for the thing that must never break.
- **Manual, end to end, per phase**: log in as each seeded persona (`Moch2026!`) and confirm a district manager sees and can edit *only* their district's content; publish an item from the admin and watch it appear in the employee app at `localhost:3001`.

## Scope

Explicitly not doing:

- **Vite / React Router / Axios** — superseded (see Context).
- **Web push** (VAPID, service-worker subscriptions). Phase 4 ships in-app + email.
- **Bilingual content.** The admin UI is he/en; what it publishes is Hebrew.
- **A full LMS** — no modules, lessons, or per-lesson completion tracking.
- **In-platform job applications** — no CV storage, no candidate pipeline.
- **Entra ID SSO.** The seam exists (`auth/providers/auth-provider.ts`); the migration is its own project.
- **Real-time.** The notification bell polls (30s) and refetches on focus. No websockets.
- **Multi-tenant admin isolation** for subordinate organizations (עמידר, רמ״י).
- **Multi-step approval chains / delegation.** `DRAFT → PENDING → PUBLISHED` only.
- Interactive district map. Offline admin. QR check-in (the schema is left ready; the UI is not built).

## Notes

**The RBAC migration is the one thing that can take the whole platform down.** `jwt.strategy.ts` runs on every authenticated request in the employee app; a bug there is an outage or, worse, a silent privilege change nobody notices. Three independently-deployable steps:

1. **Additive** — create the tables, seed the built-ins from `ROLE_PERMISSIONS`, backfill from `User.roles[]`. **Nothing reads them.** Zero risk. Ship alone.
2. **Dual-read + assert** — compute permissions from both sources, *use the old one*, log divergence. Run for a week. (The same instinct that already makes `audience.spec.ts` assert two implementations agree — this codebase already believes in this discipline.)
3. **Cut over** behind `RBAC_SOURCE=static|dual|db`, with write-through to `User.roles[]` for one release so rollback is a flag flip, not a data recovery.

**The line that protects the audience model: custom roles grant *permissions*; they never become *audience dimensions*.** `ContentItem.audRoles` stays the `Role` enum. Without this line, the RBAC work destabilizes `audienceWhere` — the hottest, most safety-critical query in the employee app — to serve an admin nicety.

**Analytics has no history, and we will say so.** Honestly available on day one from existing tables: headcount and new employees, content counts, community activity (`Comment`/`Interaction` timestamps), registrations, most-active district and department, most-*commented* posts (a genuine proxy for most-viewed), upcoming events. **Phase 1's Dashboard is built from exactly these, and every number on it is real.** Genuinely new telemetry — DAU/MAU, sessions, most-*viewed* posts, unread announcements — ships with an explicit *"נאסף מאז 13.07.2026"* state and a real empty state. **We never seed fake analytics.** A fabricated DAU chart in a government executive dashboard is the kind of thing that ends a project.

**Cookie isolation.** Both apps sit on `*.vercel.app` today, which is on the public suffix list, so cookies cannot be shared. If they ever move to subdomains of one apex, a shared `moch_at` on `.moch.gov.il` **would** let an employee session silently authenticate the admin console. Rename the admin cookies now; never set a `Domain` attribute.

**The media ASCII-key trap.** `sanitize()` is already well tested — Hebrew filenames in an S3 key made Supabase return `400 InvalidKey`. The risk is not that it is broken; it is that a *new* upload path never calls it. Bulk upload, CSV avatar import, and the certificate generator are three new places that can each reintroduce it independently. Make `sanitize` the only exported way to build a key, and never let a caller pass one in.

**Render's free tier** (512MB, sleeps after 15 min) is the operating constraint behind several decisions above: external cron instead of in-process, exports in Vercel functions instead of on the API, streamed CSV import, and an index for **every** admin sort key (an unindexed `ORDER BY title` over `ContentItem` is a seq-scan on a sleepy instance).

**Honest size: 12–16 weeks for one strong full-stack engineer; 7–9 with two** (the phases split cleanly along a frontend/backend seam). Phase 1 alone is 3–4 weeks *before a single content item can be edited*, because it is building a design system, a table kit, a data layer, an auth shell, and two extended build gates. Nobody should believe this is a six-week project.

**Still open, worth deciding before the phase that needs it:**

- Does a district's post need HQ approval before publishing? (Already open question #3 in the README — now *blocking*, because `manageableWhere` has to encode who can approve.) — *needed for Phase 2*
- Retention policy for audit logs and analytics events. A legal question for a public body, and it changes the table design. — *needed for Phase 1*
- Who resets passwords? If Entra ID is landing soon, don't build an invite/reset flow. — *needed for Phase 3*
