# העולם שלי — from demo dashboard to a real personal journey

## Status: Implemented (2026-09-25)

Builds on `gamified-employee-experience.md` and `my-world-return-loop.md`. Their rules still hold: five tabs, jobs inside Services, recognition is never XP, no personal ranking, XP only for a real act.
This plan changes one thing they left open: **the numbers stop being a demo catalog and become real.**

## Problem

### What is fake today

Every number on the screen comes from `components/my-world/demo-catalog.ts`, or from defaults that pretend history exists:

| What the employee sees | Where it really comes from |
|---|---|
| Level 4, 720 / 1,000 XP | Hardcoded `DEMO_XP` |
| 12 completed missions, 4 achievements | Hardcoded `DEMO_STATS`, `DEMO_ACHIEVEMENTS` |
| Streak 3, grace day, weekly card 2 / 3 | Prisma column defaults (`streakDays = 3`, `weeklyFilled = 2`) for someone who never did anything |
| Journey percentages per world | Hardcoded `DEMO_JOURNEYS` |
| Three recognitions from "יעל רוזן" etc. | Invented names. The real `Recognition` table is ignored |
| Department 1,640 / 2,000 | Hardcoded |
| District race with places 1–5 | Hardcoded, and a ranking. That breaks the "no ranking" rule |

### Dead interactions (audit of the code and the screen)

| Element | Looks | Does | Problem | Fix |
|---|---|---|---|---|
| Next mission card | Lifts on hover (`Card interactive`) | Nothing. Only the inner button works | Fake affordance | Card is not interactive. The single CTA is the action |
| Mission "התחל" (read) | Primary button | Opens `/feed`. The top of the feed, not the item | No completion, no XP, ever | Opens the real post at `/feed/[id]`. Reading it records the read and grants the XP |
| Mission "התחל" (training) | Primary button | Opens `/services`, which has no trainings | Dead end | Opens a registration dialog for a real upcoming training |
| Mission "פרטים" (activity) | Secondary button | Opens `/feed` | Dead end | Registration dialog for a real upcoming event |
| Journey "המשך" | Link per world | `/feed`, `/`, `/services` | Generic, not the world | `/my-world/[world]`: history plus open opportunities |
| Avatar + next-stage preview | Looks like a figure you can open | Nothing | Missed identity moment | Button → avatar path dialog (all stages, which are open) |
| Level / XP | Numbers | Nothing. What XP is for is never explained | "Why continue?" is unanswered | "איך צוברים XP" dialog, built from the same rules the API uses |
| Achievements | Cards | Nothing | Locked ones can't say what is missing | Button → detail dialog: condition, progress, unlock date |
| Recognition | Cards | Nothing, and the data is invented | Fake data | Real rows for the viewer. Button → detail dialog |
| Department | Card | Nothing, and the data is invented | Fake data | Real aggregate. "פרטים" → dialog: goal, remaining, days left, what counts |
| Unlocks | Dashed rows with a lock | Nothing | Can't say how far | Button → detail dialog: what opens, XP left, bar |
| District race | Ranked list | Nothing | A leaderboard, and fake | Remove |
| First-week "achievement" step | Text | Marked done when the read mission is done | Fake linkage | Derived from the real first-step achievement |
| Home: announcements, CEO message, events, projects, trainings, careers | `Card interactive` (hover lift) | Nothing | Six dead cards | No lift where there is no destination. Events and trainings get a real "הרשמה" button. Careers link to `/services/jobs` |
| Profile footer | "כישורים, תגים… בסבב הבא" | Placeholder text | Placeholder | Replace with a real progress summary and real recognition |

## Goal

Every number on העולם שלי is computed from things the employee actually did. Every element that looks clickable opens a real place, a real dialog, or a real action.

## Why (research)

- **SDT is the frame.** Workplace gamification lifts engagement when it serves autonomy, competence and relatedness. The same mechanics hurt when they are mandatory, ranked or watched ([PMC 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12867793/)). So: the employee picks a focus, feedback is immediate, and belonging is shown as a team bar.
- **Leaderboards demoralise most people.** The documented failure is public ranking and meaningless badges ([Blink](https://www.joinblink.com/intelligence/gamify-your-employee-experience-without-the-gimmicks), [Bonusly](https://bonusly.com/post/gamification)). The district race goes.
- **Duolingo's lessons are the loop and the forgiveness, not the mascot.** Daily quests and streaks work. Streaks need a freeze or they punish one bad day ([analysis](https://blakecrosley.com/guides/design/duolingo)). Loss-aversion pressure is the part critics call manipulative. We keep a streak with one grace day and never show a "you broke it" message.
- **Viva Learning / Workvivo:** progress lives on the item's detail page, "continue where you left off" is a first-class list, and recognition is tied to a person and a reason ([Viva Learning](https://support.microsoft.com/en-us/viva/learning/track-progress-in-viva-learning), [Workvivo](https://www.workvivo.com/blog/employee-recognition-feature-spotlight/)). This backs the world detail pages and the recognition detail.
- **"If-then" rewards suit simple tasks.** They work for "read this" or "register for that", and fail on complex work ([Bonusly](https://bonusly.com/post/gamification)). So XP is only for small, well-defined acts, never for job performance.

## Approach

### 1. A derived progression ledger (the core decision)

No new XP table. XP is **computed** from rows that already exist and are already true:

| Act | Source row | World | XP |
|---|---|---|---|
| Read a feed post (first full open) | `ContentRead` on a `FEED_POST` | Channel-mapped (below) | 20 |
| Register for a training | `Registration` on a `TRAINING` | Develop | 40 |
| Register for an event | `Registration` on an `EVENT` | Participate | 30 |

Channel → world: `people`, `success-stories` → Feel. `learning` → Develop. Everything else → Know. One constant in the API.

Why derived and not a ledger table: the rows already exist, are idempotent (`@@unique([userId, contentItemId])`), and can't drift from what happened. Cancelling a registration removes its XP automatically. A ledger table becomes useful when admins need manual grants or rules that change over time. The rules module is the seam for that.

All rules live in one API module, `progression/rules.ts`: XP per act, channel map, level curve, achievements, unlock levels, department target. This is the object a future admin screen edits (see the Admin section).

**Level curve.** Each level costs 20 XP more than the last. Level 1 → 2 costs 100 XP, then 120, 140, and so on. Cumulative: L2 = 100, L3 = 220, L4 = 360, L5 = 520, L10 = 1,620, L15 = 3,220. A few weeks of real reading reaches the first unlock. Level 15 is a year-long arc.

**Streak.** Consecutive Jerusalem days with at least one act. One missed day inside the run is forgiven (grace). A run with no act today still counts until tomorrow ends. No penalty copy.

**Weekly card.** Acts this Jerusalem week (Sunday start), out of 3. No endowed fake stamp.

**Achievements.** Computed from counters. The unlock date is the timestamp of the act that crossed the threshold:

| id | Condition |
|---|---|
| firstStep | 1 act |
| reader | 5 posts read |
| learner | 1 training registration |
| participant | 2 event registrations |
| explorer | At least 1 act in each of the 4 worlds |
| consistent | Streak ≥ 5 |
| level5 | Reach level 5 |

**Department quest.** Sum of XP earned this calendar month by everyone in the viewer's department (no names). Target = 80 XP × active members. Shows days left, and counts by act type. Headquarters staff with no department get an honest note instead.

**Recognition.** Real `Recognition` rows where the viewer is the recipient, with the giver's name. 0 XP. Visually separate from achievements.

### 2. Missions are real content

The API builds the open missions from audience-visible content:

- **Read** — up to 2 newest unread feed posts → `/feed/[id]`. Minutes are estimated from word count (200 wpm, minimum 1).
- **Register (training)** — the next upcoming training the viewer isn't registered for, with seats left.
- **Register (event)** — the next upcoming event the viewer isn't registered for.

The next mission is the first open one in the chosen focus world, else in this order: read, training, event. No open missions → calm empty state with "מה חדש בפיד" → `/feed`.

### 3. The flows

- **Read.** Mission → `/feed/[id]` (a new post page: the full post, with like, bookmark and comments reused from `PostCard`). The server records the read. The page shows "+20 XP · הושלם" with a link back to העולם שלי, and only if this was the first read. Back on העולם שלי, the XP bar animates from the last value this browser saw (`localStorage`, best-effort) to the real value, and the level-up dialog opens if a level was crossed.
- **Register.** Mission → dialog (title, date, format or location, seats) → `POST /me/registrations` → the response carries the new progress → the bar animates in place, the mission flips to done, and the level-up dialog opens if needed. Errors show inline with a real retry.
- **Cancel.** In the world detail page, "ביטול הרשמה" → `DELETE /me/registrations/:id`. XP is recomputed, not hidden.

### 4. Screen structure (visual order = the brief's hierarchy)

1. **Hero — me.** Greeting, avatar (button → avatar path), level with tier name, XP bar with "N XP עד רמה X", next unlock chip (button → unlock dialog), "איך צוברים XP?" (button → rules dialog), weekly card or first-week steps.
2. **Stats row.** Total XP, acts done, achievements, streak (with grace note). Static facts, no hover.
3. **המשימה הבאה שלי**, plus "עוד משימות".
4. **המסע שלי.** Focus picker, then the path START → 4 worlds → the next level milestone. Each world links to `/my-world/[world]`.
5. **ההישגים שלי.** Each opens a detail dialog.
6. **ההוקרות שלי.** Each opens a detail dialog.
7. **המשימה של המחלקה.** "פרטים" opens a dialog.
8. **מה מחכה לי.** Each unlock opens a dialog.

### 5. Routes

| Route | Why it exists |
|---|---|
| `/my-world` | The screen |
| `/my-world/[world]` | Per-world page: what counts, your history in that world, open opportunities with real CTAs |
| `/feed/[id]` | A real reading destination. Without it a "read" mission has nowhere to land |

Achievement, unlock, recognition, department, avatar and rules details are dialogs, not routes. They are short, and deep links to them aren't needed yet.

### 6. API

- `GET /me/progress` → `EmployeeProgress` (contract in `@moch/contracts`).
- `GET /me/progress/worlds/:world` → history + opportunities.
- `POST /me/registrations` `{ contentItemId }`, `DELETE /me/registrations/:contentItemId` → return `EmployeeProgress`. Must be audience-checked, EVENT/TRAINING only, not past, capacity respected, idempotent.
- `GET /feed/posts/:id` adds `reward: { xp, world } | null` (non-null on the first read only).
- `/me/world` PATCH stays, for `chosenWorld` only. The fake-default columns are no longer read (not dropped, see Notes).

### 7. Web architecture

`load-my-world.ts` becomes a mapper from `EmployeeProgress`. `demo-catalog.ts` and `DistrictLeaderboard` are deleted. The component names from the brief: MyWorldHero, AvatarProgress, XpProgress, NextMission, MissionCard, JourneySection/Card/Path, AchievementSection/Card, RecognitionSection/Card, DepartmentQuest, UnlockSection/Card, plus a shared `DetailDialog` and `RegisterDialog`.

### 8. Home and Profile

- **Home:** remove the hover lift from cards that have no destination. Events and trainings get a real register button (same dialog). Careers link to `/services/jobs`.
- **Profile:** a compact card (illustrated avatar, level, XP, link to העולם שלי), achievements unlocked, recognition received. The placeholder line goes.

### 9. Seed

Demo accounts get **real rows through the real pipes**. `employee@moch.gov.il` gets reads on several past days, one training registration, and two recognitions from named colleagues. Department colleagues get some reads, so the department bar has a real total. The UI never knows this is seed data.

## Prioritisation

| P | Item |
|---|---|
| P0 | Derived ledger + `/me/progress`. Remove all demo numbers. Read flow via `/feed/[id]`. Registration endpoint and dialog. Every dead affordance fixed. Remove the district ranking |
| P1 | Achievement, unlock, recognition, department, avatar and rules dialogs. World detail pages. Profile summary. Home register buttons |
| P2 (not now) | Home personal-progress section (needs a HomeSectionType migration). Avatar customization picker. Admin progression editor. Notifications |

## What NOT to build

- No coins, shop, loot, confetti storm, sounds, or mascot.
- No personal or district ranking. No named contributors on the department bar.
- No XP for login, app open, likes, comments, or screen views.
- No quizzes, surveys, ideas or volunteering missions. There is no backend for them, so they don't appear.
- No "training completed" XP. There is no attendance record. Registration is what's true.

## Implementation

### Phase 1: API
1. `progression/rules.ts`, `progression.service.ts` (compute), `progression.controller.ts` (`/me/progress`, world detail), `registrations.controller.ts`.
2. Contracts: `EmployeeProgress`, `WorldDetail`, `FeedPost.reward`.
3. Feed `getPost` returns the reward. `WorldService.noteRead` returns whether the read is new and stops writing the stamp and bonus fields.
4. Seed rows for the demo accounts.

### Phase 2: Web
1. Mapper + rebuilt My World sections + dialogs.
2. `/my-world/[world]`, `/feed/[id]`.
3. Home dead-card fixes + register buttons. Profile summary.
4. i18n keys (he + en).

### Phase 3: QA
Typecheck, API unit tests for the rules, and Playwright click-through of every interactive element at 360 / 390 / 430 / 768 / 1024 / 1440. RTL checks. Axe.

## Notes

- **Production DB:** no migration is needed. The unused `EmployeeWorld` columns stay, to avoid a destructive change on the live database. Dropping them is a separate, reviewed migration.
- **Numbers will be smaller and true.** A new employee starts at level 1, 0 XP. That's the point.
- **Rollback:** revert the web and API commits. No schema change to undo.
- **Admin later:** `rules.ts` is a plain object with the same shape an admin table would store (XP per act type, channel→world map, curve step, achievement thresholds, unlock levels, department target per member). Moving it to the DB changes one loader.
