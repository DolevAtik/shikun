import type { AchievementId, Mission, UnlockId } from "@moch/contracts";

/** Switches an admin can later turn on and off without rewriting the screen. */
export interface MyWorldFlags {
  showStats: boolean;
  showMissions: boolean;
  showJourney: boolean;
  showFocus: boolean;
  showAchievements: boolean;
  showRecognition: boolean;
  showDepartment: boolean;
  showUnlocks: boolean;
}

export type XpTier = "starter" | "partner" | "leader" | "veteran";

/** Identity comes from GET /auth/me. Progress never carries a name. */
export interface MyWorldProfile {
  firstName: string;
  title: string | null;
}

/** Which detail is open. One dialog serves every section, so focus handling lives in one place. */
export type Detail =
  | { kind: "avatar" }
  | { kind: "rules" }
  | { kind: "achievement"; id: AchievementId }
  | { kind: "unlock"; id: UnlockId }
  | { kind: "recognition"; id: string }
  | { kind: "department" }
  | { kind: "register"; mission: Mission };

export type OpenDetail = (detail: Detail) => void;
