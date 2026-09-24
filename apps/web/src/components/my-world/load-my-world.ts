import type { CurrentUser, EmployeeWorld } from "@moch/contracts";
import { getMyWorldFlags } from "./flags";
import {
  DEMO_ACHIEVEMENTS,
  DEMO_DEPARTMENT,
  DEMO_DISTRICTS,
  DEMO_JOURNEYS,
  DEMO_MISSIONS,
  DEMO_RECOGNITIONS,
  DEMO_STATS,
  DEMO_UNLOCKS,
  DEMO_XP,
} from "./demo-catalog";
import { nextAvatarLevel, tierForLevel } from "./progress";
import type { EmployeeGamification, WorldChange, XpProgress } from "./types";

type Copy = (key: string, values?: Record<string, string | number>) => string;

/**
 * Assembles the personal space.
 *
 * Identity is the signed-in user. Progression is the demo catalog until
 * GET /me/progress exists — swap the catalog mapping below for an API mapper
 * that returns `EmployeeGamification`. Components do not know which one ran.
 */
export function loadMyWorld(
  user: CurrentUser,
  locale: string,
  t: Copy,
  world: EmployeeWorld,
): EmployeeGamification {
  const departmentName = user.department
    ? locale === "en"
      ? user.department.nameEn
      : user.department.nameHe
    : null;

  const xp = addBonus(
    {
      level: DEMO_XP.level,
      current: DEMO_XP.current,
      next: DEMO_XP.next,
      total: DEMO_XP.total,
      tier: tierForLevel(DEMO_XP.level),
    },
    world.bonusXp,
  );
  const missions = DEMO_MISSIONS.map((mission) => ({
    ...mission,
    title: t(`missions.${mission.id}.title`),
    description: t(`missions.${mission.id}.description`),
    completed: mission.id === "weekly" && world.bonusXp > 0,
  }));
  const journeys = DEMO_JOURNEYS.map((journey) => ({
    ...journey,
    name: t(`worlds.${journey.id}.name`),
    description: t(`worlds.${journey.id}.description`),
  }));
  const missionsCompleted = DEMO_STATS.missionsCompleted + (world.bonusXp > 0 ? 1 : 0);
  const change: WorldChange | null = world.pulsePending
    ? "department"
    : journeys.some((journey) => journey.activitiesUntilBadge === 1)
      ? "badge"
      : missions.some((mission) => !mission.completed)
        ? "step"
        : null;

  return {
    source: "demo",
    flags: getMyWorldFlags(),
    profile: {
      firstName: user.firstName,
      title: user.title,
      departmentName,
    },
    xp,
    missions,
    journeys,
    stats: {
      ...DEMO_STATS,
      totalXp: xp.total,
      missionsCompleted,
      activeDays: world.streakDays,
    },
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
      earned: Math.min(DEMO_DEPARTMENT.target, DEMO_DEPARTMENT.earned + world.bonusXp),
      target: DEMO_DEPARTMENT.target,
    },
    districts: DEMO_DISTRICTS.map((district) => ({
      code: district.code,
      name: locale === "en" ? district.nameEn : district.nameHe,
      color: district.color,
      xp: district.xp + (user.district?.code === district.code ? world.bonusXp : 0),
      isMine: user.district?.code === district.code,
    })),
    unlocks: DEMO_UNLOCKS.map((unlock) => ({
      id: unlock.id,
      level: unlock.level,
      title: t(`unlocks.${unlock.id}`),
    })),
    weekly: {
      filled: world.weeklyFilled,
      total: world.weeklyTotal,
      endowed: world.endowed,
    },
    change,
    graceAvailable: world.graceAvailable,
    chosenWorld: world.chosenWorld,
    firstWeek: missionsCompleted === 0,
    nextAvatarLevel: nextAvatarLevel(xp.level),
  };
}

function addBonus(xp: XpProgress, amount: number): XpProgress {
  if (amount <= 0) return xp;
  let level = xp.level;
  let current = xp.current + amount;
  while (current >= xp.next) {
    current -= xp.next;
    level += 1;
  }
  return { ...xp, level, current, total: xp.total + amount, tier: tierForLevel(level) };
}
