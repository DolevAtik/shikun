import { formatNumber } from "@/lib/format";
import type { AvatarProgress, XpTier } from "./types";

/** Keep these in step with the figure in `IllustratedAvatar`. */
const AVATAR_UPGRADE = 5;
const AVATAR_BADGE = 10;
const AVATAR_FRAME = 15;

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

/** The next cosmetic cut, or null when the current figure is the last one. */
export function nextAvatarLevel(level: number): number | null {
  if (level < AVATAR_UPGRADE) return AVATAR_UPGRADE;
  if (level < AVATAR_BADGE) return AVATAR_BADGE;
  if (level < AVATAR_FRAME) return AVATAR_FRAME;
  return null;
}

export function avatarProgress(level: number): AvatarProgress {
  const stage =
    level >= AVATAR_FRAME ? "frame" : level >= AVATAR_BADGE ? "badge" : level >= AVATAR_UPGRADE ? "upgrade" : "base";
  return { level, stage, customizationId: null };
}
