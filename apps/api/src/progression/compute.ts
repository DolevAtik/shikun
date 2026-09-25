import type { Achievement, ProgressAct, WorldFocus, WorldProgress } from "@moch/contracts";
import { daysBetween, jerusalemDay, sundayOf } from "../world/world-dates";
import { levelFor, RULES, WORLDS, xpForLevel } from "./rules";

/** One thing the employee did that earns XP. */
export interface Act {
  contentItemId: string;
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
      case "learner":
        current = sorted.filter((act) => act.act === "training").length;
        unlockedAt = nth((act) => act.act === "training", target);
        break;
      case "participant":
        current = sorted.filter((act) => act.act === "event").length;
        unlockedAt = nth((act) => act.act === "event", target);
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
