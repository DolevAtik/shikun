# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); the project is pre-1.0, so ordering is by
date rather than released version.

## [Unreleased]

### Changed — העולם שלי is real (plan: `docs/planning/my-world-production.md`)
- Every number on העולם שלי is now computed from what the employee did — `ContentRead`
  and `Registration` rows — by a new `GET /me/progress`. The demo catalog, the fake
  streak/stamp defaults, invented recognitions, and the district ranking are gone.
- Missions are real content: an unread post opens the new `/feed/[id]` page (a first
  full read grants XP and says so); a training or event opens a registration sheet
  backed by the new `POST /me/registrations` (cancel: `DELETE /me/registrations/:id`).
- Every card on the screen opens something: avatar stages, XP rules, achievement,
  unlock, recognition and department details, and a page per world (`/my-world/[world]`)
  with history, open opportunities and cancellation.
- Home: event and training cards register for real; career cards link to the board;
  cards with no destination no longer lift on hover. Profile shows level, achievements
  and recognition instead of a "next round" placeholder.
- Hebrew sentences with "N XP" or "a / b" use bidi isolates so numbers keep their order.

### Fixed
- The Next API proxy did not forward `PATCH`, so the weekly focus was never saved.

### Added
- `apps/api/src/progression/` (rules, pure computation with unit tests, service,
  controller) and `web/e2e/my-world.spec.ts`, which clicks every control on the screen.

### Removed
- Dead admin UI files: `ui/popover.tsx`, `ui/tabs.tsx` (no references).
- Accidentally committed temporary Playwright specs: `web/e2e/_debug.spec.ts`,
  `web/e2e/tmp-skeleton.spec.ts` (both self-labeled temporary).
- Unused `web/src/components/ComingSoon.tsx`.
- 11 unused dependencies from `apps/admin` (`@hookform/resolvers`, `react-hook-form`,
  `zod`, `date-fns`, `clsx`, `tailwind-merge`, `@radix-ui/react-{popover,progress,scroll-area,tabs}`,
  `@axe-core/playwright`).
- Dead `ArrowLeft`/`ArrowRight` import and re-export in `web/.../home/sections.tsx`.
- Orphaned `JWT_REFRESH_SECRET` env var (never read — refresh tokens are opaque, not JWTs)
  from `.env.example` and `render.yaml`.

### Added
- Documentation set under `docs/`: `ARCHITECTURE.md`, `PROJECT_STRUCTURE.md`,
  `API_DOCUMENTATION.md`, `CONTRIBUTING.md`, `ENVIRONMENT_SETUP.md`, and this changelog.

### Changed
- `README.md` corrected to reflect what actually ships (Home, Feed, Jobs, Services,
  Profile, and the round-two admin console) instead of the earlier "Home + Feed only" scope.

_Verified: `pnpm typecheck` (6/6), `pnpm build` (4/4), `pnpm test` (21/21) all green after
the removals above._
