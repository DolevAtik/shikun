import type { WorldId } from "@moch/ui";

/** Switches an admin can later turn on and off without rewriting the screen. */
export interface MyWorldFlags {
  showMissions: boolean;
  showJourney: boolean;
  showOverallProgress: boolean;
  showAchievements: boolean;
  showRecognition: boolean;
  showDepartmentProgress: boolean;
  showUnlocks: boolean;
}

export type XpTier = "starter" | "partner" | "leader" | "veteran";

export interface XpProgress {
  level: number;
  tier: XpTier;
  /** XP earned inside the current level. */
  current: number;
  /** XP required to finish the current level. */
  next: number;
  /** Lifetime XP. */
  total: number;
}

export type MissionAction = "complete" | "view";

export interface Mission {
  id: string;
  title: string;
  description: string;
  world: WorldId;
  xp: number;
  action: MissionAction;
  /** Set when the mission sends the employee somewhere that already exists. */
  href: string | null;
  completed: boolean;
}

export type JourneyStatus = "locked" | "active" | "completed";

export interface Journey {
  id: WorldId;
  name: string;
  description: string;
  xp: number;
  target: number;
  completedActivities: number;
  status: JourneyStatus;
}

export interface OverallStats {
  totalXp: number;
  missionsCompleted: number;
  achievementsUnlocked: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  /** Why a locked badge is still closed. Null once it is open. */
  hint: string | null;
}

/**
 * Colleague appreciation. Never XP, never an achievement.
 * The badge names match the recognition catalog, and that is the only link.
 */
export interface Recognition {
  id: string;
  badgeName: string;
  reason: string;
  giverName: string;
  awardedAt: string;
}

export interface DepartmentProgress {
  name: string;
  earned: number;
  target: number;
}

export interface Unlock {
  id: string;
  level: number;
  title: string;
}

/**
 * Everything העולם שלי renders. Components never fetch and never branch on
 * where a string came from — a future GET /me/progress maps into this shape.
 */
export interface EmployeeGamification {
  /** "demo" until the progression ledger exists. Identity is still the real user. */
  source: "demo" | "api";
  flags: MyWorldFlags;
  profile: {
    firstName: string;
    title: string | null;
    departmentName: string | null;
  };
  xp: XpProgress;
  missions: Mission[];
  journeys: Journey[];
  stats: OverallStats;
  achievements: Achievement[];
  recognitions: Recognition[];
  department: DepartmentProgress | null;
  unlocks: Unlock[];
}

/** The slice a mission completion is allowed to change. */
export interface ProgressSnapshot {
  xp: XpProgress;
  missions: Mission[];
  journeys: Journey[];
  stats: OverallStats;
  department: DepartmentProgress | null;
}
