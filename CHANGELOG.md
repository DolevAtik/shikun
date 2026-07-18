# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); the project is pre-1.0, so ordering is by
date rather than released version.

## [Unreleased]

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
