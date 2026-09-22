import type { CurrentUser } from "@moch/contracts";
import { getMyWorldFlags } from "./flags";
import {
  DEMO_ACHIEVEMENTS,
  DEMO_DEPARTMENT,
  DEMO_JOURNEYS,
  DEMO_MISSIONS,
  DEMO_RECOGNITIONS,
  DEMO_STATS,
  DEMO_UNLOCKS,
  DEMO_XP,
} from "./demo-catalog";
import { tierForLevel } from "./progress";
import type { EmployeeGamification } from "./types";

type Copy = (key: string, values?: Record<string, string | number>) => string;

/**
 * Assembles the personal space.
 *
 * Identity is the signed-in user. Progression is the demo catalog until
 * GET /me/progress exists — swap the catalog mapping below for an API mapper
 * that returns `EmployeeGamification`. Components do not know which one ran.
 */
export function loadMyWorld(user: CurrentUser, locale: string, t: Copy): EmployeeGamification {
  const departmentName = user.department
    ? locale === "en"
      ? user.department.nameEn
      : user.department.nameHe
    : null;

  return {
    source: "demo",
    flags: getMyWorldFlags(),
    profile: {
      firstName: user.firstName,
      title: user.title,
      departmentName,
    },
    xp: {
      level: DEMO_XP.level,
      current: DEMO_XP.current,
      next: DEMO_XP.next,
      total: DEMO_XP.total,
      tier: tierForLevel(DEMO_XP.level),
    },
    missions: DEMO_MISSIONS.map((mission) => ({
      ...mission,
      title: t(`missions.${mission.id}.title`),
      description: t(`missions.${mission.id}.description`),
      completed: false,
    })),
    journeys: DEMO_JOURNEYS.map((journey) => ({
      ...journey,
      name: t(`worlds.${journey.id}.name`),
      description: t(`worlds.${journey.id}.description`),
    })),
    stats: { ...DEMO_STATS },
    achievements: DEMO_ACHIEVEMENTS.map((achievement) => ({
      id: achievement.id,
      title: t(`achievements.${achievement.id}.title`),
      description: t(`achievements.${achievement.id}.description`),
      unlocked: achievement.unlocked,
      hint: achievement.unlocked ? null : t(`achievements.${achievement.id}.hint`),
    })),
    recognitions: DEMO_RECOGNITIONS.map((recognition) => ({
      id: recognition.id,
      giverName: recognition.giverName,
      badgeName: t(`recognitionBadges.${recognition.badge}`),
      reason: t(`recognitions.${recognition.id}.reason`),
      awardedAt: recognition.awardedAt,
    })),
    department: {
      name: departmentName ?? t("headquarters"),
      earned: DEMO_DEPARTMENT.earned,
      target: DEMO_DEPARTMENT.target,
    },
    unlocks: DEMO_UNLOCKS.map((unlock) => ({
      id: unlock.id,
      level: unlock.level,
      title: t(`unlocks.${unlock.id}`),
    })),
  };
}
