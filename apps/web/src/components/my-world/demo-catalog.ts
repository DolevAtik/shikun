import type { WorldId } from "@moch/ui";
import type { JourneyStatus, MissionAction, MissionCta } from "./types";

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
 *
 * XP is granted only by `action: "complete"` — a confirmed meaningful step.
 * `action: "view"` shows the reward the real action is worth, and the click
 * only opens a page that already exists. Login, likes and opening a screen
 * are not missions.
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
  activeDays: 3,
} as const;

export const DEMO_MISSIONS: {
  id: "weekly" | "training" | "activity";
  world: WorldId;
  xp: number;
  minutes: number | null;
  action: MissionAction;
  cta: MissionCta;
  href: string | null;
}[] = [
  { id: "weekly", world: "know", xp: 20, minutes: 2, action: "view", cta: "start", href: "/feed" },
  { id: "training", world: "develop", xp: 40, minutes: 10, action: "view", cta: "start", href: "/services" },
  { id: "activity", world: "participate", xp: 50, minutes: null, action: "view", cta: "details", href: "/feed" },
];

export const DEMO_JOURNEYS: {
  id: WorldId;
  xp: number;
  target: number;
  completedActivities: number;
  activityTarget: number;
  activitiesUntilBadge: number | null;
  href: string;
  status: JourneyStatus;
}[] = [
  { id: "know", xp: 120, target: 185, completedActivities: 4, activityTarget: 6, activitiesUntilBadge: 2, href: "/feed", status: "active" },
  { id: "feel", xp: 80, target: 200, completedActivities: 2, activityTarget: 5, activitiesUntilBadge: 3, href: "/", status: "active" },
  { id: "develop", xp: 150, target: 273, completedActivities: 3, activityTarget: 5, activitiesUntilBadge: null, href: "/services", status: "active" },
  { id: "participate", xp: 100, target: 333, completedActivities: 2, activityTarget: 6, activitiesUntilBadge: null, href: "/feed", status: "active" },
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

/** Collective totals only. No employee names and no personal rank. */
export const DEMO_DEPARTMENT = {
  earned: 1640,
  target: 2000,
} as const;

/**
 * The five districts, ranked by shared activity. No employee names.
 * Names match the org chart. A future API replaces the XP column.
 */
export const DEMO_DISTRICTS: {
  code: "NORTH" | "HAIFA" | "CENTER" | "JERUSALEM" | "SOUTH";
  nameHe: string;
  nameEn: string;
  color: string;
  xp: number;
}[] = [
  { code: "CENTER", nameHe: "מחוז מרכז", nameEn: "Center District", color: "var(--district-center)", xp: 18400 },
  { code: "HAIFA", nameHe: "מחוז חיפה", nameEn: "Haifa District", color: "var(--district-haifa)", xp: 16240 },
  { code: "JERUSALEM", nameHe: "מחוז ירושלים", nameEn: "Jerusalem District", color: "var(--district-jerusalem)", xp: 14110 },
  { code: "NORTH", nameHe: "מחוז צפון", nameEn: "North District", color: "var(--district-north)", xp: 12880 },
  { code: "SOUTH", nameHe: "מחוז דרום", nameEn: "South District", color: "var(--district-south)", xp: 10950 },
];

export const DEMO_UNLOCKS: { id: "pin" | "badge" | "frame"; level: number }[] = [
  { id: "pin", level: 5 },
  { id: "badge", level: 10 },
  { id: "frame", level: 15 },
];
