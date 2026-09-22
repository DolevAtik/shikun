import type { WorldId } from "@moch/ui";
import type { JourneyStatus, MissionAction } from "./types";

/**
 * Presentation snapshot for the progression layer.
 *
 * GET /me/progress does not exist yet. This file is the only place these
 * numbers live. `loadMyWorld` maps them into `EmployeeGamification`, which is
 * the same shape an API response will fill — replacing this module does not
 * rewrite the screen.
 *
 * The signed-in person's name, role and department are NOT here. They come
 * from GET /auth/me. Recognition rows use the same badge names as colleague
 * recognition, and they are not converted into XP.
 */

export const DEMO_XP = {
  level: 4,
  current: 720,
  next: 1000,
  total: 720,
} as const;

export const DEMO_STATS = {
  totalXp: DEMO_XP.total,
  missionsCompleted: 12,
  achievementsUnlocked: 4,
} as const;

export const DEMO_MISSIONS: {
  id: "weekly" | "training" | "briefing";
  world: WorldId;
  xp: number;
  action: MissionAction;
  href: string | null;
}[] = [
  { id: "weekly", world: "know", xp: 20, action: "complete", href: null },
  { id: "training", world: "develop", xp: 40, action: "view", href: "/" },
  { id: "briefing", world: "participate", xp: 30, action: "complete", href: null },
];

export const DEMO_JOURNEYS: {
  id: WorldId;
  xp: number;
  target: number;
  completedActivities: number;
  status: JourneyStatus;
}[] = [
  { id: "know", xp: 130, target: 200, status: "active", completedActivities: 4 },
  { id: "feel", xp: 80, target: 200, status: "active", completedActivities: 2 },
  { id: "develop", xp: 110, target: 200, status: "active", completedActivities: 3 },
  { id: "participate", xp: 60, target: 200, status: "active", completedActivities: 1 },
];

export const DEMO_ACHIEVEMENTS: {
  id: "firstStep" | "knowledge" | "growth" | "consistent" | "closer" | "frame";
  unlocked: boolean;
}[] = [
  { id: "firstStep", unlocked: true },
  { id: "knowledge", unlocked: true },
  { id: "growth", unlocked: true },
  { id: "consistent", unlocked: true },
  { id: "closer", unlocked: false },
  { id: "frame", unlocked: false },
];

export const DEMO_RECOGNITIONS: {
  id: "collab" | "guide" | "day";
  giverName: string;
  badge: "knowledge" | "mentor" | "community";
  awardedAt: string;
}[] = [
  { id: "collab", giverName: "יעל רוזן", badge: "knowledge", awardedAt: "2026-09-16T08:00:00.000Z" },
  { id: "guide", giverName: "מיכל שפירא", badge: "mentor", awardedAt: "2026-09-08T08:00:00.000Z" },
  { id: "day", giverName: "אמיר פרידמן", badge: "community", awardedAt: "2026-08-27T08:00:00.000Z" },
];

/** Collective totals only. No employee names and no rank. */
export const DEMO_DEPARTMENT = {
  earned: 1240,
  target: 1500,
} as const;

export const DEMO_UNLOCKS: { id: "pin" | "skyline" | "frame"; level: number }[] = [
  { id: "pin", level: 5 },
  { id: "skyline", level: 10 },
  { id: "frame", level: 15 },
];
