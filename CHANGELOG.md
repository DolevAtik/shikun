# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); the project is pre-1.0, so ordering is by
date rather than released version.

## [Unreleased]

### Added — העולם שלי grows
- **Thank a colleague.** `POST /me/recognitions` with a colleague picker
  (`GET /me/colleagues`): a badge and a reason, 3 per week, one per colleague per week.
  It shows in their world and on the Home recognition wall, and is never XP.
- **After the registration.** A "my registrations" section: add an upcoming session to
  the calendar (an `.ics` built in the browser), and answer "were you there?" once it
  has started (`POST /me/registrations/:id/attendance`).
- **More real acts.** Read missions prefer followed channels and the chosen world. A
  one-time profile act (a bio of 20+ characters, edited on the profile's new "about me").
- **Rewards every two or three levels:** a backdrop choice (3), pin (5), outfit choice (7),
  badge (10), skyline (12), frame (15). Choices are saved on `EmployeeWorld` and checked
  against the level on the server.
- **Personal moments:** a work anniversary on the hero, a monthly recap
  (`GET /me/progress/recap`), and "you received a new thank-you" since the last visit.
- **Department goal:** your share on the card, the five previous months, a months-in-a-row
  line, and a reward a manager or HR sets in the console (new `quests:manage` permission,
  `/quests` page).
- **Measurement:** the console's Analytics page now answers whether העולם שלי works —
  visitors, return within a week, missions opened → done, attendance, focus vs no focus,
  acts by type, and recognition per week. Aggregates only. The app sends `mission.open`,
  `world.focus` and `booking.calendar` events.

### Changed
- A session's XP moves from signing up to being there: registration 10, attendance
  30 (training) or 20 (event). "צמיחה" and "חלק מהקהילה" now open on confirmed attendance.
  Existing registrations lose XP until their attendance is confirmed.

### Migration
- `20260927090000_world_growth` is additive only: `Registration.attended/attendanceAt`,
  `User.profileCompletedAt`, `EmployeeWorld.avatarBackdrop/avatarOutfit`, an index on
  `Recognition(giverId, awardedAt)`, and the `DepartmentQuestReward` table.

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
