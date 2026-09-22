import { formatNumber } from "@/lib/format";
import type { XpTier } from "./types";

/** Levels 1–4 beginner, 5–9 partner, 10–14 lead, 15+ veteran. */
export function tierForLevel(level: number): XpTier {
  if (level >= 15) return "veteran";
  if (level >= 10) return "leader";
  if (level >= 5) return "partner";
  return "starter";
}

export function xpRatio(current: number, next: number, locale: string): string {
  return `${formatXp(current, locale)} / ${formatXp(next, locale)} XP`;
}

export function formatXp(value: number, locale: string): string {
  return formatNumber(value, locale);
}

export function percentOf(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((Math.min(max, Math.max(0, value)) / max) * 100);
}
