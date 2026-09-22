# Gamified Employee Experience — Ministry of Construction and Housing

## Status: Planning

Revised after the navigation decision: five tabs stay, Jobs leaves the bar, **העולם שלי** takes that place.
No code in this session. Implementation starts only after this plan is accepted.

## Problem

The employee app ("הבית הדיגיטלי") already answers "what is happening at the Ministry?"
It does not yet feel like the employee's own space.

What an employee sees today:

- **Home** is an admin-ordered stack of content sections (greeting, alerts, announcements, weekly summary, CEO message, numbers, events, projects, video, trainings, careers, birthdays, recognition).
- **Navigation** is five tabs: Home, Feed, Jobs, Services, Profile. There is no desktop sidebar. The shell is a header plus a bottom bar, capped at `max-w-2xl`.
- **Jobs** is its own tab. The board, filters, and `GET /jobs` are real. Home's careers section links to `/jobs`.
- **Services** is two global lists: quick actions and quick links. It is not a directory of forms, systems, or contacts, and it has no category field.
- **Profile** is a contact card: photo or initials, role, email, unit, district.
- **Recognition** is seven badges a colleague awards a person. The code says this outright: recognition, not points, streaks, or levels (`apps/api/src/home/badges.ts`).
- Nothing is named Know, Feel, Develop, or Participate.

Actions the brief treats as missions do not exist as things an employee can finish:

- No quiz, survey, idea box, or volunteering flow.
- Event and training cards can say "registered", but only because seed data wrote `Registration` rows. There is no employee endpoint to register. There is also no "training completed" signal — only that seed flag.
- `ContentRead` exists in the database and nothing in the app writes it.
- Admin screens for learning, events, notifications, community, careers, media, and analytics are empty states. Content publishing, home-section order, employees, districts, and audit are real.

## Goal

An employee still opens a useful ministry home. Beside it, **העולם שלי** is the personal space: avatar, level, missions, the four worlds, achievements, recognition, and department progress. Jobs remain reachable, inside Services.

## Why

- **The app stays a workplace.** Gamification is a layer that makes the home more personal. It is not a second product, and it is not a game.
- **Five tabs is the limit.** Missions, worlds, achievements, and XP do not get tabs of their own. They live inside העולם שלי. Feed and Services stay, because that is how people read news and get something done.
- **Jobs move; they do not disappear.** A separate jobs tab competes with the new personal tab. The board itself is unchanged.
- **Recognition is not a score.** Colleague badges already mean "someone valued this person." Turning them into XP would erase that.
- **Points only for real acts.** Reading, registering, finishing something measurable. Not opening the app, not a like, not a glance.
- **No individual ranking.** Department bars, no names, no places. A public workplace should not publish who is "behind."
- **Accessibility stays a build gate.** IS 5568 / WCAG 2.0 AA, Hebrew RTL, and contrast-checked tokens. A bar without a text value, or an emoji used as the only label, fails that gate.

## Approach

Keep auth, audience targeting, the feed, the job board, services, recognition, and the server-driven home. Change the bar. Add one screen.

MyMojo is inspiration for the feeling — a personal figure, a short list of missions, visible progress — not a layout to copy. The ministry version is calmer: illustrated, not cartoon; levels, not loot; a department bar, not a ranking.

### Navigation

Five destinations, the same on mobile and desktop. No sixth tab.

| Tab | Route | Role |
|---|---|---|
| בית | `/` | The work dashboard. Server-driven sections, plus optional personal sections. |
| פיד | `/feed` | News and internal communication. Not part of the game. |
| שירותים | `/services` | The place to get something done, including jobs. |
| העולם שלי | `/my-world` | The whole personal layer. |
| פרופיל | `/profile` | The contact card, with a short personal summary. |

Mobile keeps the bottom bar (`BottomNav`). Desktop, from the `lg` breakpoint up, uses a sidebar with the same five items and drops the bottom bar. The information is the same; only the chrome changes. The shell may grow wider than `max-w-2xl` on desktop so Home and העולם שלי can sit in two columns. Feed, Services, and Profile stay a single readable column.

Icons are Lucide icons with a visible text label. The gamepad is not the label for העולם שלי — the words are. A gamepad-only icon reads as a toy.

`/jobs` redirects to `/services/jobs`. Old links, the Home careers link, and the e2e flows keep working. `GET /jobs` does not change.

### What stays

| Surface | Rule |
|---|---|
| Auth | Untouched. JWT access + opaque refresh, behind `AuthProvider`. |
| Audience | Every mission uses the existing resolver. A Haifa mission is invisible in Jerusalem. |
| Home contract | `GET /home` stays an ordered list of typed sections from `HomeSectionConfig`. |
| Feed | Stays a tab. Likes, follows, and opening a screen grant no XP. |
| Jobs API and board | Same list, same filters, same cards. Only the entry point moves. |
| Recognition | Human-awarded `BadgeKey`. Never converted into XP or into an achievement. |
| Admin content | Create, edit, publish, archive, audience, home-section order. Untouched. |
| Tokens and a11y gates | New components go through contrast, logical properties, and axe. |

### Home

Home is still the dashboard. It is not a gamification screen.

The section list stays server-driven. An admin enables, disables, and reorders sections, including the new personal ones. The frontend does not hardcode the stack.

The one override: **an emergency alert renders above everything**, including avatar, XP, and missions, even if a `HomeSectionConfig` row orders it lower. A critical alert outranks a level.

New section types, off until the phase that turns them on:

| Type | What the employee sees | Depth |
|---|---|---|
| `PERSONAL_PROGRESS` | Greeting by first name, illustrated avatar, level, XP bar ("720 / 1000"). | Compact. Links to העולם שלי. |
| `TODAYS_MISSIONS` | Up to three mission cards, each with its XP. | Teaser. The full list is on העולם שלי. |
| `GOALS` | One or two weekly goal bars. | Teaser. |
| `RECOGNITION` | Already exists. Colleagues' awards. | Unchanged. Not XP. |

When `PERSONAL_PROGRESS` is enabled, the seed disables the standalone `GREETING` section so the name is not said twice. An admin can turn the personal section off and the greeting comes back.

Announcements, events, trainings, the weekly summary, and the rest keep rendering under those sections. Finding information does not require finishing a mission.

### Feed

Unchanged as a product. Channels, posts, comments, bookmarks, and follows stay here.

A later XP rule may award points for a real read (`ContentRead` on a post). That rule does not move the feed into העולם שלי, and a like never qualifies.

### Services

Services becomes the directory. Jobs are one category inside it, not a tab.

Version 1 shows categories we can fill with data that already exists:

| Category | Source |
|---|---|
| משרות והזדמנויות | The current job board, at `/services/jobs`. Same `GET /jobs`, same scope filters, same cards. |
| שירותים לעובד | Existing quick actions. |
| מערכות ומידע | Existing quick links (the systems people leave the app for). |

טפסים, אנשי קשר, and further categories are named slots, not fake screens. Quick actions and links have no category column today. Version 1 does not invent forms or a phone book. A later admin field can file a link under a category; until that data exists, those headings are omitted rather than shown empty.

The jobs page component moves under the services route. It is not rewritten.

### העולם שלי

This is the new screen, and the only place the personal layer is complete.

It is a personal employee space: modern, quiet, progress-driven. Not a children's game, and not a copy of MyMojo.

Top to bottom:

1. **Header** — greeting, illustrated avatar, level, XP bar with the numbers in text.
2. **Missions** — real cards only. Completing one marks it done, adds the XP, and plays a short motion on the bar and the counter. If `prefers-reduced-motion` is set, the numbers update with no motion.
3. **Four worlds** — progress, not tabs. Know, Feel, Develop, Participate, each with its own accent and a labeled bar.
4. **Goals** — the weekly targets in full.
5. **Achievements** — automatic thresholds. Visually distinct from recognition.
6. **ההוקרות שלי** — recognition already received, with who gave it and why. Explicitly not points.
7. **Department progress** — bars for departments, totals only, no employee names and no rank.

The screen reads `GET /me/progress` plus the viewer's existing recognition rows. It does not go through `HomeSectionConfig`. Home's personal sections are the summary; this page is the source.

#### The four worlds

They are not primary navigation. They sit on this page as four progress areas.

| World | Means | Fed by | Token |
|---|---|---|---|
| Know | Knowledge and updates | Reads of announcements, the weekly summary, video | `--accent-teal` |
| Feel | Wellbeing and belonging | Registration for a social event. Recognition is shown beside this world and is not counted as XP. | `--accent-amber` |
| Develop | Growth | Registration for a training. Jobs are not XP. | `--accent-violet` |
| Participate | Showing up | Registration for a participatory event, set per event by the admin. | `--accent-green` |

A world with no XP yet shows "0" and an empty bar, not a made-up percentage. The percent is XP earned in that world this month, against a soft target on the challenge — not "percent of all ministry content."

A world name can link to the related existing surface (Know → an announcement, Develop → a training). The feed and the job board are not relocated under a world.

### Missions and XP

A mission is a row an admin creates. It points at something the employee can actually finish, with a world, an XP amount, an audience, and a date window.

Version 1 has two completion signals. Those are the only ones that can be true:

| Signal | Completes when | What has to be added |
|---|---|---|
| `OPEN_CONTENT` | The viewer opens that announcement, summary, or video | Start writing `ContentRead`. The table is already there. |
| `REGISTER` | The viewer registers for that event or training | `POST /registrations` on the table that already exists. Idempotent. Audience-checked. |

"Completed a training" is not the same as "registered." The product has no attendance or completion record. Version 1 pays XP for registration. A completion signal waits until that record exists. Quizzes, surveys, ideas, and volunteering are not missions until those features exist.

"Today" on Home means: audience matches, window is open, not completed, admin order, capped at three. העולם שלי shows the full open list.

XP is a ledger:

- `XpRule` — action, world, points, daily cap, enabled.
- `XpEvent` — one grant. Unique on `(userId, ruleId, entityId)`.
- `UserProgress` — cached total, level, and equipped avatar slots. Rebuilt from the ledger if the cache is wrong.
- `Mission`, `MissionCompletion`.
- `Challenge` — a weekly metric and a target. These are the "goals."
- `Achievement` — a counter threshold. Separate table from `Recognition`.
- `AvatarCosmetic` — catalog of slots and the level that unlocks each.

No XP for: opening the app, a daily login, a like, a follow, a random tap, or viewing a screen without the qualifying action. Comments are not an XP action in version 1. They are too easy to farm, and the decision limits points to measured engagement.

Default grants, all capped:

| Action | World | XP | Cap |
|---|---|---|---|
| Read a targeted announcement or the weekly summary | Know | 20 | 3 / day |
| Watch the video of the week | Know | 30 | 1 / day |
| Register for a training | Develop | 40 | 2 / day |
| Register for an event | Feel or Participate, chosen per event | 20 | 2 / day |

Level curve, seeded and later editable, rises by band. The employee sees the number and a short Hebrew tier:

| Levels | Tier |
|---|---|
| 1–4 | מתחיל/ה |
| 5–9 | שותף/ה |
| 10–14 | מוביל/ה |
| 15+ | ותיק/ה |

Streak is not part of this release. A missed-day counter pressures people who are on leave or in reserve duty, and this decision did not ask for one.

Department progress sums XP earned by members of that department this week. No names. Headquarters people with no department are left off the chart rather than placed in a fake team.

### Recognition

Shown on Home (existing section), on העולם שלי, and on Profile.

Copy and structure make the distinction obvious: "הוקרה מ…" names the giver and the reason. Achievements are a different block, earned from counters, with no giver. Neither block adds to XP.

### Profile

Profile stays a contact card. It is not rebuilt around the game.

Order:

1. Photo or initials, name, title, role — as today.
2. A compact line: illustrated avatar, level, XP, link to העולם שלי.
3. Contact rows: email, phone, unit, district. Sign-out stays.
4. Recognition received.
5. Achievements earned.

Someone who never opens העולם שלי can still find a colleague's details here. The personal blocks are additions under the card, not a replacement of it.

### Avatar

Two pictures, two jobs:

- **Photo or initials** stay on the feed, on comments, and on recognition. That is how colleagues recognize a person.
- **Illustrated figure** is the progression avatar on Home's personal section, on העולם שלי, and as the small mark on Profile. SVG slots: base, clothing, accessory, frame, background. Level 1 is the base. Levels 5, 10, and 15 each unlock one slot, in the Ministry's house colors. No pets, weapons, or loot.

Version 1 ships four original looks. The catalog is data, so a later admin screen can add a cosmetic without a layout change. Nothing is copied from MyMojo.

### Motion

Existing `--duration` and `--ease` are the ceiling.

- Completing a mission on העולם שלי checks the card, counts the XP, and fills the bar.
- Level-up is a dismissible dialog (`role="dialog"`) with the new level and the unlocked slot. Not a full-screen ceremony.
- No confetti. Reduced motion skips the tween and updates the numbers.

### Admin

A new console section, **Progression**, gated on `content:manage`. Forms over the new tables: XP rules, missions (with the existing audience picker), goals, achievement thresholds, level curve, cosmetic unlocks.

Home's new sections are turned on and off in the home-section editor that already exists. Creating a mission does not require a deploy. That editor lands in the last phase.

### Design system

Extend `packages/ui`. Do not restyle the admin, and do not replace the token file.

New components, light and dark, RTL, 200% zoom:

- `ProgressBar` — the value is also text.
- `MissionCard`
- `WorldCard`
- `LevelMark`
- `AchievementBadge` — not the recognition chip.
- `IllustratedAvatar`

World colors are the accent tokens already contrast-checked. No new hex without a pair in `scripts/check-contrast.mjs`.

Radius, shadow, and type stay on the current scale. The app feels more like a digital home because of the figure, the cards, and the bars — not because the navy brand is replaced.

## Implementation

Each phase leaves login, Home, Feed, the job board, Services, Profile, and admin publish working.

### Phase 1: Audit

This document. No code.

### Phase 2: Design system

1. Add the components above to `packages/ui`, on a preview route that is not in the nav.
2. Map the four worlds onto existing accent tokens. Run `pnpm check:a11y`.
3. Honor `prefers-reduced-motion`.

No product screen changes yet.

### Phase 3: Navigation and Services

1. Replace the Jobs tab with העולם שלי. Five items: Home, Feed, Services, העולם שלי, Profile.
2. Add the desktop sidebar at `lg`. Hide the bottom bar there. Same destinations.
3. Move the job board to `/services/jobs`. Redirect `/jobs` to it. Point the Home careers link at the new path.
4. On Services, show three categories: jobs, quick actions, quick links. Do not add empty categories for forms or contacts.
5. העולם שלי renders an honest empty state (Level 1, no missions yet).
6. Confirm the Haifa versus Jerusalem announcement still targets correctly, and the job filters still work from the new URL.

### Phase 4: Home sections

1. Add `PERSONAL_PROGRESS`, `TODAYS_MISSIONS`, and `GOALS` to the home contract and to `HomeSectionView`. Empty states until the ledger exists.
2. Force `EMERGENCY` to render first.
3. Enable the personal section and today's missions in the seed, under the alert and above announcements. Disable standalone `GREETING` in that seed.
4. An admin can disable either new section from the existing home editor once the types are accepted there.

### Phase 5: Progression ledger

1. Add the Prisma models. Migration is additive.
2. Write `ContentRead` when an employee opens an announcement, summary, or video.
3. Add `POST /registrations` and a register control on event and training cards.
4. Append an `XpEvent` only when a rule matches, the cap allows it, and the entity was not already rewarded.
5. Add `GET /me/progress`.
6. Wire העולם שלי to that payload, and wire Home's personal sections to the same numbers (teaser depth on Home, full list on העולם שלי).
7. Seed three missions pointed at seeded content, and two weekly goals.

### Phase 6: Avatar and worlds

1. Four original SVG looks, unlocking at levels 1, 5, 10, and 15.
2. Show the figure on העולם שלי, on Home's personal section, and as the small mark on Profile.
3. Draw the four world bars on העולם שלי from this month's XP.

### Phase 7: Profile and recognition placement

1. Keep the contact card first.
2. Add the compact progress line, then recognition, then achievements.
3. Feed avatars stay photos.

### Phase 8: Admin progression

1. Progression section in the admin sidebar, permission `content:manage`.
2. Forms for rules, missions, goals, thresholds, and cosmetic levels.
3. A mission saved here appears on העולם שלי and, if it is in the top three open missions, on Home — for the matching audience only.

## Scope

This plan does not:

- Add tabs for Missions, Worlds, Achievements, or XP.
- Turn Know, Feel, Develop, or Participate into primary navigation.
- Delete the feed, Services, or the job board.
- Turn Home into a gamification-only screen, or hardcode its section order in the frontend.
- Place an emergency alert under the avatar.
- Turn recognition into XP, or show an individual leaderboard.
- Add quizzes, surveys, idea submission, volunteering, a streak, or an employee notification inbox.
- Invent forms and a staff directory that the data does not have.
- Change auth, the audience resolver, content publishing, or the feed's data model.
- Restyle the admin console's existing screens.
- Copy MyMojo's layout, illustration, or reward economy.
- Ship confetti, battle modes, or a currency shop.

## Notes

**Rollback.** Disable the new Home sections and העולם שלי falls back to its empty state. Redirect `/jobs` → `/services/jobs` stays, so the board is never only at the old URL. The ledger tables can sit empty without affecting current endpoints.

**Production.** The API is on Render and Postgres is on Neon (see `docs/planning/admin-dashboard.md`). Migrations are additive. Web and API ship together, so new home section types are not served to an old client.

**Audience safety.** Tested the way `audience.spec.ts` is tested.

**Farming.** Unique `(userId, ruleId, entityId)` plus a daily cap. No credit for likes, logins, or passive views.

**Accessibility.** Every bar has a text value. World names are visible words. The level-up dialog is a real dialog. Motion respects `prefers-reduced-motion`. New colors go through `scripts/check-contrast.mjs`.

**Open questions**

1. Department bars are the decision. Confirm that headquarters staff with no department are simply absent from the chart.
2. Is self-serve registration for a training acceptable? The table already allows it; the missing piece is the endpoint.
3. Almoni and the national government design system are still unresolved. This redesign uses the provisional tokens and does not wait on them.
