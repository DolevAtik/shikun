import type { Achievement, AchievementId, Moment, ProgressAct, WorldFocus, WorldProgress } from "@moch/contracts";
import { ProgressActSchema } from "@moch/contracts";
import { daysBetween, jerusalemDay, sundayOf } from "../world/world-dates";
import { levelFor, RULES, WORLDS, xpForLevel } from "./rules";

/** One thing the employee did that earns XP. */
export interface Act {
  /** Null for the profile act, which is about the employee, not an item. */
  contentItemId: string | null;
  act: ProgressAct;
  world: WorldFocus;
  xp: number;
  at: Date;
}

export interface Computed {
  level: ReturnType<typeof levelFor>;
  streakDays: number;
  graceUsed: boolean;
  weeklyFilled: number;
  worlds: WorldProgress[];
  achievements: Achievement[];
}

export function compute(acts: Act[], now = new Date()): Computed {
  const sorted = [...acts].sort((a, b) => a.at.getTime() - b.at.getTime());
  const total = sorted.reduce((sum, act) => sum + act.xp, 0);
  const level = levelFor(total);
  const days = new Set(sorted.map((act) => jerusalemDay(act.at)));
  const today = jerusalemDay(now);
  const streak = currentStreak(days, today);
  const weekStart = sundayOf(today);
  const weeklyFilled = sorted.filter((act) => jerusalemDay(act.at) >= weekStart).length;

  const worlds = WORLDS.map((id) => {
    const inWorld = sorted.filter((act) => act.world === id);
    const count = inWorld.length;
    return {
      id,
      xp: inWorld.reduce((sum, act) => sum + act.xp, 0),
      acts: count,
      milestone: (Math.floor(count / RULES.worldMilestone) + 1) * RULES.worldMilestone,
    };
  });

  return {
    level,
    streakDays: streak.days,
    graceUsed: streak.graceUsed,
    weeklyFilled: Math.min(RULES.weeklyTarget, weeklyFilled),
    worlds,
    achievements: achievements(sorted, streak.days, level.level),
  };
}

/**
 * Consecutive Jerusalem days with at least one act, ending today — or
 * yesterday, because today is not over yet. One missing day inside the run is
 * forgiven. There is no penalty for the rest; the number simply starts again.
 */
export function currentStreak(days: Set<string>, today: string): { days: number; graceUsed: boolean } {
  let cursor = days.has(today) ? today : shift(today, -1);
  let count = 0;
  let graceUsed = false;
  for (let guard = 0; guard < 400; guard += 1) {
    if (days.has(cursor)) {
      count += 1;
      cursor = shift(cursor, -1);
    } else if (!graceUsed && days.has(shift(cursor, -1))) {
      graceUsed = true;
      cursor = shift(cursor, -1);
    } else {
      break;
    }
  }
  return { days: count, graceUsed: count > 0 && graceUsed };
}

/** The day (as a timestamp) any run first reached `target` active days. */
function streakReachedAt(sorted: Act[], target: number): Date | null {
  const firstActOfDay = new Map<string, Date>();
  for (const act of sorted) {
    const key = jerusalemDay(act.at);
    if (!firstActOfDay.has(key)) firstActOfDay.set(key, act.at);
  }
  const keys = [...firstActOfDay.keys()].sort();
  let run = 0;
  let graceUsed = false;
  let previous: string | null = null;
  for (const key of keys) {
    const gap = previous ? daysBetween(previous, key) : 1;
    if (gap === 1) run += 1;
    else if (gap === 2 && !graceUsed) {
      run += 1;
      graceUsed = true;
    } else {
      run = 1;
      graceUsed = false;
    }
    previous = key;
    if (run >= target) return firstActOfDay.get(key)!;
  }
  return null;
}

function achievements(sorted: Act[], streakDays: number, level: number): Achievement[] {
  const nth = (filter: (act: Act) => boolean, n: number): Date | null =>
    sorted.filter(filter)[n - 1]?.at ?? null;

  return RULES.achievements.map(({ id, target, world }) => {
    let current = 0;
    let unlockedAt: Date | null = null;
    switch (id) {
      case "firstStep":
        current = sorted.length;
        unlockedAt = nth(() => true, target);
        break;
      case "reader":
        current = sorted.filter((act) => act.act === "read").length;
        unlockedAt = nth((act) => act.act === "read", target);
        break;
      // Being there, not signing up: these open on confirmed attendance.
      case "learner":
        current = sorted.filter((act) => act.act === "trainingAttended").length;
        unlockedAt = nth((act) => act.act === "trainingAttended", target);
        break;
      case "participant":
        current = sorted.filter((act) => act.act === "eventAttended").length;
        unlockedAt = nth((act) => act.act === "eventAttended", target);
        break;
      case "explorer": {
        const seen = new Set<WorldFocus>();
        for (const act of sorted) {
          seen.add(act.world);
          if (seen.size === target && !unlockedAt) unlockedAt = act.at;
        }
        current = seen.size;
        break;
      }
      case "consistent":
        unlockedAt = streakReachedAt(sorted, target);
        current = unlockedAt ? target : streakDays;
        break;
      case "level5": {
        current = level;
        let running = 0;
        for (const act of sorted) {
          running += act.xp;
          if (running >= xpForLevel(target)) {
            unlockedAt = act.at;
            break;
          }
        }
        break;
      }
    }
    return {
      id,
      target,
      world,
      current: Math.min(current, target),
      unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
    };
  });
}

function shift(day: string, delta: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** Jerusalem calendar month of a moment, YYYY-MM. */
export function monthOf(date: Date): string {
  return jerusalemDay(date).slice(0, 7);
}

/** `count` months ending with `month`, oldest first. */
export function monthsBack(month: string, count: number): string[] {
  const [year, index] = month.split("-").map(Number);
  const out: string[] = [];
  for (let back = count - 1; back >= 0; back -= 1) {
    const date = new Date(Date.UTC(year!, index! - 1 - back, 1));
    out.push(date.toISOString().slice(0, 7));
  }
  return out;
}

/** UTC instant of the Jerusalem midnight that opens `month`, with a day of slack before it. */
export function monthFloor(month: string): Date {
  const [year, index] = month.split("-").map(Number);
  return new Date(Date.UTC(year!, index! - 1, 1) - 86_400_000);
}

export interface RecapCounts {
  xp: number;
  acts: Record<ProgressAct, number>;
  activeDays: number;
  topWorld: WorldFocus | null;
  achievements: AchievementId[];
  levelStart: number;
  levelEnd: number;
}

/**
 * One month looked back on, from the full act history. The level at the start
 * is what the acts before the month add up to; the achievements are the ones
 * whose unlocking act fell inside it.
 */
export function recapCounts(acts: Act[], month: string, now = new Date()): RecapCounts {
  const inMonth = acts.filter((act) => monthOf(act.at) === month);
  const before = acts.filter((act) => monthOf(act.at) < month);
  const through = acts.filter((act) => monthOf(act.at) <= month);
  const counts = Object.fromEntries(ProgressActSchema.options.map((act) => [act, 0])) as Record<ProgressAct, number>;
  for (const act of inMonth) counts[act.act] += 1;

  const byWorld = new Map<WorldFocus, number>();
  for (const act of inMonth) byWorld.set(act.world, (byWorld.get(act.world) ?? 0) + act.xp);
  let topWorld: WorldFocus | null = null;
  for (const world of WORLDS) {
    if ((byWorld.get(world) ?? 0) > (topWorld ? byWorld.get(topWorld)! : 0)) topWorld = world;
  }

  const unlocked = compute(through, now).achievements
    .filter((item) => item.unlockedAt && monthOf(new Date(item.unlockedAt)) === month)
    .map((item) => item.id);

  const sum = (list: Act[]) => list.reduce((total, act) => total + act.xp, 0);
  return {
    xp: sum(inMonth),
    acts: counts,
    activeDays: new Set(inMonth.map((act) => jerusalemDay(act.at))).size,
    topWorld,
    achievements: unlocked,
    levelStart: levelFor(sum(before)).level,
    levelEnd: levelFor(sum(through)).level,
  };
}

export interface DepartmentMonth {
  month: string;
  earned: number;
  target: number;
  reached: boolean;
}

/**
 * The department's result per month, for the months before `month`, and how
 * many of the latest ones in a row reached the goal. Past targets use today's
 * headcount: membership history is not recorded, and saying so beats guessing.
 */
export function departmentHistory(
  acts: Act[],
  month: string,
  target: number,
  count: number,
): { history: DepartmentMonth[]; reachedRun: number } {
  const months = monthsBack(month, count + 1).slice(0, -1);
  const earned = new Map<string, number>();
  for (const act of acts) {
    const key = monthOf(act.at);
    earned.set(key, (earned.get(key) ?? 0) + act.xp);
  }
  const history = months.map((key) => {
    const value = earned.get(key) ?? 0;
    return { month: key, earned: value, target, reached: target > 0 && value >= target };
  });
  let reachedRun = 0;
  for (let index = history.length - 1; index >= 0 && history[index]!.reached; index -= 1) reachedRun += 1;
  return { history, reachedRun };
}

/**
 * A work anniversary near today: from a few days before the date to a week
 * after it, and only from the first full year.
 */
export function anniversary(startedAt: Date | null, now = new Date()): Moment | null {
  if (!startedAt) return null;
  const start = jerusalemDay(startedAt);
  const today = jerusalemDay(now);
  const year = Number(today.slice(0, 4));
  for (const candidateYear of [year - 1, year, year + 1]) {
    const years = candidateYear - Number(start.slice(0, 4));
    if (years < 1) continue;
    const [, month, day] = start.split("-").map(Number);
    // 29 February falls back to the 28th in a common year.
    const rolled = new Date(Date.UTC(candidateYear, month! - 1, day!));
    const valid =
      rolled.getUTCMonth() === month! - 1 ? rolled.toISOString().slice(0, 10) : `${candidateYear}-02-28`;
    const distance = daysBetween(today, valid);
    if (distance <= RULES.anniversaryWindow.before && -distance <= RULES.anniversaryWindow.after) {
      return { kind: "anniversary", years, date: valid };
    }
  }
  return null;
}
