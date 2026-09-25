import type { Achievement, Mission, WorldFocus } from "@moch/contracts";
import { formatNumber } from "@/lib/format";
import type { XpTier } from "./types";

/** Keep these in step with the figure in `IllustratedAvatar`. */
export const AVATAR_STAGES = [1, 5, 10, 15] as const;

/** Levels 1–4 beginner, 5–9 partner, 10–14 lead, 15+ veteran. */
export function tierForLevel(level: number): XpTier {
  if (level >= 15) return "veteran";
  if (level >= 10) return "leader";
  if (level >= 5) return "partner";
  return "starter";
}

export function formatXp(value: number, locale: string): string {
  return formatNumber(value, locale);
}

/**
 * Bidi isolates (LRI … PDI). Dropped into a Hebrew sentence, "80 XP" and
 * "2 / 5" keep their own order instead of being reordered by the paragraph.
 */
const isolate = (text: string) => `\u2066${text}\u2069`;

/** "80 XP", or "+20 XP" with `signed`, as one isolated run for a sentence. */
export function xpText(value: number, locale: string, signed = false): string {
  return isolate(`${signed ? "+" : ""}${formatXp(value, locale)} XP`);
}

/** "2 / 5" as one isolated run for a sentence. */
export function ratioText(current: number, target: number, locale: string): string {
  return isolate(`${formatXp(current, locale)} / ${formatXp(target, locale)}`);
}

export function percentOf(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((Math.min(max, Math.max(0, value)) / max) * 100);
}

/** Acts per world milestone. Matches `RULES.worldMilestone` in the API. */
const MILESTONE_STEP = 5;

/** Acts inside the current milestone band, e.g. 7 acts toward a milestone of 10 → 2 of 5. */
export function milestoneProgress(acts: number, milestone: number): { done: number; target: number } {
  const start = Math.max(0, milestone - MILESTONE_STEP);
  return { done: Math.max(0, acts - start), target: milestone - start };
}

/** The mission to feature: the chosen world's first, else the API's order. */
export function orderMissions(missions: Mission[], chosen: WorldFocus | null): Mission[] {
  if (!chosen) return missions;
  return [...missions].sort((a, b) => Number(b.world === chosen) - Number(a.world === chosen));
}

export function remainingFor(achievement: Achievement): number {
  return Math.max(0, achievement.target - achievement.current);
}
