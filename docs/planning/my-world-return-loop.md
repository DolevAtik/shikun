# Make העולם שלי worth opening again

## Status: Planning

No code in this session. This is the research and the proposed loop.
It sits on top of `docs/planning/gamified-employee-experience.md`. That plan still holds: five tabs, jobs inside Services, recognition is not XP, no personal ranking, points only for a real act.

## Problem

העולם שלי already answers "who am I and how far am I?"
It does not answer "why should I open this again tomorrow?"

What is true in the product today:

- The screen is a snapshot from `apps/web/src/components/my-world/demo-catalog.ts`. The same numbers come back on every visit.
- `GET /me/progress` does not exist. `load-my-world.ts` says so.
- One mission grants XP, and only if the employee presses "התחל" on this screen (`apply-completion.ts`). Training and activities only open another page.
- `ContentRead` exists in the database. Nothing in the app writes it, so reading the feed cannot move the world.
- The streak is a fixed `3`. It does not tick, and it does not forgive a missed day.
- The next reward is far: 280 XP to level 5, on a bar of 1,000. People speed up when the prize is close, not when it is a long way off.
- The next avatar is a sentence ("רמה 5: אווטאר חדש"). The employee cannot see the figure they are about to become.
- There is no choice. The four worlds are a path to look at, not a focus the employee picked.
- Nothing on the screen says "this changed since yesterday."

A fuller illustration will not fix that. The pull is a loop, not another card.

## Goal

An employee opens העולם שלי because one personal thing moved, or because one small real action will move it — and they can see which, in a few seconds.

## Why

- **People return for a near finish, not a distant level.** A café stamp card and a song-rating study both found the same thing: effort rises as the reward gets close, and that acceleration predicts coming back (Kivetz, Urminsky, Zheng, 2006). A head start helps. A card that already has two stamps is finished faster than an empty card of the same length.
- **One obvious step beats a dashboard of goals.** Duolingo's streak started working when it stopped being tied to a points system and became "one lesson today." The first seven days are the fragile window. A streak does not save a product that has nothing worth doing.
- **A little slack keeps the habit.** A rigid streak punishes a day off and people quit. Duolingo's streak freeze, based on work from the University of Pennsylvania and UCLA, raised daily activity. The freeze is not a cheat. It is what makes people stay.
- **Choice is the difference between play and pressure.** Reviews of workplace gamification (Self-Determination Theory) find a lift when people feel autonomy, competence, and belonging. The same points and badges reduce engagement when the system is mandatory, ranked, or watched. Consent matters. Not everyone wants to play.
- **Public rank is the wrong social mechanic here.** The documented failure mode is a scoreboard that staff experience as a whip (the Disneyland hotels case is the usual citation). Belonging in this app is already specified as a department bar and colleague recognition, without names and without places.
- **Identity is the investment that makes a return likely.** Points spent are gone. A figure that changed, a week the employee chose, and a badge one act away are things they have put into the product. That is what they come back to see.

## Approach

Add a daily loop to the screen that already exists. Do not add a tab, a leaderboard, or a second game.

The loop, every visit:

1. **What changed.** One line at the top of the world. Examples: "נשארה פעולה אחת להישג", "המחלקה התקדמה", "הצעד של היום עדיין פתוח". If nothing changed and nothing is open, the calm empty state stays. Do not invent urgency.
2. **One step.** A single mission, two minutes, tied to something the employee can actually finish in Feed, Services, or an event. The button opens that thing. XP lands when the act is confirmed, not when the button is pressed.
3. **A near prize.** A weekly card of three meaningful acts, shown above the long level bar. New employees start with one stamp already filled, so the card is never a blank. The level bar stays. It is the long story. The card is the reason to come back this week.
4. **The figure moves.** When a stamp or a level lands, the ring, the counter, and the next avatar preview update together. Short, quiet, already the rule: no confetti storm.
5. **They leave something here.** The week they chose, the stamps, the avatar stage. Next visit opens on that, not on a fresh poster.

### The daily step

One card. Title, time, world, XP, one button.

It is authored, not random. A weekly update to read, a training to finish, an event to register for. The same three shapes the screen already shows. What changes is that the card is the only open ask, and finishing it happens in the place the work already lives.

Opening the app, a like, and a glance still grant nothing.

### The weekly card

Three stamps. Copy like "2 מתוך 3 השבוע".

This is the goal-gradient object. The level bar of 1,000 XP is too far to pull a Tuesday visit. Three acts are close enough to accelerate, small enough not to become a grind.

The endowed first stamp is a product decision, not fake history. Say it plainly: "התחלנו בשבילך". Do not pretend the employee already did the work.

A missed week resets the card, not the level, not the avatar, not recognition. No "שברת רצף" banner.

### Streak, with one grace day

The streak counts a day on which a meaningful act was confirmed.

One unused grace day is visible ("יש לך יום גמיש"). Using it keeps the number and does not grant XP. The grace day refills after a completed week, not after opening the app.

The number on the stats row stays. The new part is that it can move, and that a single quiet day does not wipe it.

### A week they choose

Under the journey, one question, easy to skip: "השבוע אני מתמקד ב…" and the four worlds.

Choosing does not lock the others. It pins that world and prefers its mission as the daily step. Duolingo saw a retention lift when people committed to a goal in their own words. Here the commitment is one tap, and it can be changed.

Skipping leaves the screen exactly as it is now.

### Show the next figure

The chip "רמה 5: אווטאר חדש" becomes the current figure beside a muted preview of the next stage (pin, badge, frame — the stages `IllustratedAvatar` already draws).

People return to see themselves change. A sentence does not do that.

### The department, still without names

When the shared bar moves, the line is "המחלקה התקדמה" and the new total. No list of who contributed. No rank. Recognition stays a quote from a colleague, still worth zero XP.

### The first week

Three real acts, in order, for an employee with no completed mission yet:

1. Read one ministry update.
2. Open one service they will actually use.
3. Receive the first-step achievement, which already exists in the catalog.

After that, the weekly card takes over. This is the fragile window. It is not a tutorial of the screen.

## Implementation

### Phase 1: The loop, still on the demo catalog

1. Add a weekly stamp card and a "what changed" line to `EmployeeGamification`, filled from `demo-catalog.ts`.
2. Render them above the long XP bar in `MyWorldHero` / `OverallProgress`. New flags: `showWeeklyCard`, `showDailyStep`. Default on, so an admin can turn them off later the same way the other sections turn off (`flags.ts`).
3. Collapse the mission list so one step is the ask. The other missions stay as a quiet "עוד בדרך", which the screen already does.
4. Add the muted next-avatar preview next to the current figure. No new art system. Reuse `IllustratedAvatar` at the next milestone level.

### Phase 2: The step completes somewhere else

1. Define the three confirmations that may grant XP: a content read, a training completion, an event registration. Map each to a mission id.
2. Stop granting XP from the "התחל" button itself. That button only navigates. The grant arrives when the confirmation exists.
3. `ContentRead` is the first confirmation to actually write. Registration already has a seed shape and no employee endpoint. Training completion does not exist yet. Do not invent a fourth source.
4. Replace the demo mapper in `load-my-world.ts` only for the fields the API can fill. Leave the rest on the catalog until then.

### Phase 3: Streak, grace, and the chosen week

1. Persist the streak, the grace day, and the chosen world on the employee, not in the browser only.
2. A confirmed act on a new calendar day (Asia/Jerusalem) extends the streak. The grace day covers one missed day and does not award XP.
3. The chosen world only changes which mission is featured. It does not lock the journey.

### Phase 4: First week and the department pulse

1. If `missionsCompleted` is 0, show the three-step first week instead of the weekly card.
2. The department line updates when the shared total changes. Still no names.

## Scope

This plan does not:

- Add a tab, a map minigame, loot, coins, or a shop.
- Rank employees, name contributors, or show a top list.
- Award XP for opening the app, logging in, liking, or viewing a screen.
- Turn colleague recognition into points or into an achievement.
- Send push notifications or guilt reminders. A notification is a separate decision.
- Build avatar customization, sound, or an admin mission editor.
- Change Home, Feed, Services, or Profile except where a confirmation (a real read, a real registration) has to be recorded.

## Notes

- **Voluntary.** Every new block is behind a flag, and the weekly focus can be skipped. Workplace gamification that people cannot opt out of is the version that raises stress.
- **Absence is quiet.** A missed day spends the grace day or resets the weekly card. It does not send a message, and it does not lower the level.
- **Accessibility stays the gate.** The stamp card has text, not stamps alone. The preview is decorative and has a text name. RTL ratios stay `2 / 3`, never reversed. Reduced motion keeps the number change and drops the float.
- **Rollback.** Flags off returns the screen to the current sections. No migration is required for Phase 1, because the catalog is the only store.
- **Open question.** Who writes the daily step once the demo catalog is not enough: a fixed weekly set, or an admin-published mission? Phase 1 does not need that answer. Phase 2 does, before anyone builds an editor.
