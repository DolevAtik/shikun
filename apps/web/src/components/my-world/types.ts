import type { WorldId } from "@moch/ui";

/** Switches an admin can later turn on and off without rewriting the screen. */
export interface MyWorldFlags {
  showMissions: boolean;
  showDailyStep: boolean;
  showWeeklyCard: boolean;
  showFocus: boolean;
  showJourney: boolean;
  showOverallProgress: boolean;
  showAchievements: boolean;
  showRecognition: boolean;
  showDepartmentProgress: boolean;
  showDistrictLeaderboard: boolean;
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

/** What the button says. Only `complete` grants XP — a link never does. */
export type MissionCta = "start" | "details";

export interface Mission {
  id: string;
  title: string;
  description: string;
  world: WorldId;
  xp: number;
  /** Minutes the real action takes. Null when there is no honest estimate. */
  minutes: number | null;
  action: MissionAction;
  cta: MissionCta;
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
  activityTarget: number;
  /** Activities still needed for the next badge. Null when none is in reach. */
  activitiesUntilBadge: number | null;
  /** Where "continue" goes. Null hides the link. */
  href: string | null;
  status: JourneyStatus;
}

export type WorldChange = "badge" | "department" | "step";

/** Three stamps. Close enough to pull a person back this week. */
export interface WeeklyCard {
  filled: number;
  total: number;
  /** The first stamp was given, and the screen says so. */
  endowed: boolean;
}

export interface OverallStats {
  totalXp: number;
  missionsCompleted: number;
  achievementsUnlocked: number;
  /** Days with a meaningful action. Opening the app does not count. */
  activeDays: number;
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

/**
 * One district in the race. Collective XP only — never an employee name.
 * `isMine` is the signed-in person's district. Headquarters has none.
 */
export interface DistrictStanding {
  code: "NORTH" | "HAIFA" | "CENTER" | "JERUSALEM" | "SOUTH";
  name: string;
  /** A theme token, e.g. var(--district-haifa). */
  color: string;
  xp: number;
  isMine: boolean;
}

export interface Unlock {
  id: string;
  level: number;
  title: string;
}

/**
 * Cosmetic stage of the figure. A future picker can set `customizationId`
 * without changing the screen: null means "the stage that matches the level".
 */
export interface AvatarProgress {
  level: number;
  stage: "base" | "upgrade" | "badge" | "frame";
  customizationId: string | null;
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
  districts: DistrictStanding[];
  unlocks: Unlock[];
  weekly: WeeklyCard;
  /** Null when nothing moved and nothing is waiting. No invented urgency. */
  change: WorldChange | null;
  graceAvailable: boolean;
  chosenWorld: WorldId | null;
  /** The three-step first week replaces the stamp card. */
  firstWeek: boolean;
  /** Level the next figure is drawn at. Null when nothing cosmetic remains. */
  nextAvatarLevel: number | null;
}

/** The slice a mission completion is allowed to change. */
export interface ProgressSnapshot {
  xp: XpProgress;
  missions: Mission[];
  journeys: Journey[];
  stats: OverallStats;
  department: DepartmentProgress | null;
  districts: DistrictStanding[];
}
