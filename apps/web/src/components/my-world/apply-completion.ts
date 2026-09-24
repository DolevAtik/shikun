import { tierForLevel } from "./progress";
import type { DepartmentProgress, DistrictStanding, Journey, Mission, ProgressSnapshot, XpProgress } from "./types";

export interface CompletionResult {
  snapshot: ProgressSnapshot;
  /** The level just reached, when this grant crossed a threshold. */
  leveledUpTo: number | null;
  xpGained: number;
}

/**
 * Applies one mission grant to the view model. Pure: the screen owns the
 * state, and a future POST /me/missions/:id/complete can return the same
 * snapshot instead of calling this.
 */
export function applyMissionCompletion(
  snapshot: ProgressSnapshot,
  missionId: string,
): CompletionResult | null {
  const mission = snapshot.missions.find((item) => item.id === missionId);
  if (!mission || mission.completed) return null;

  const xp = grant(snapshot.xp, mission.xp);
  const missions = snapshot.missions.map((item) =>
    item.id === missionId ? { ...item, completed: true } : item,
  );

  return {
    xpGained: mission.xp,
    leveledUpTo: xp.level > snapshot.xp.level ? xp.level : null,
    snapshot: {
      xp,
      missions,
      journeys: snapshot.journeys.map((journey) => addToJourney(journey, mission)),
      stats: {
        ...snapshot.stats,
        totalXp: snapshot.stats.totalXp + mission.xp,
        missionsCompleted: snapshot.stats.missionsCompleted + 1,
      },
      department: addToDepartment(snapshot.department, mission.xp),
      districts: addToMyDistrict(snapshot.districts, mission.xp),
    },
  };
}

function grant(xp: XpProgress, amount: number): XpProgress {
  let level = xp.level;
  let current = xp.current + amount;
  while (current >= xp.next) {
    current -= xp.next;
    level += 1;
  }
  return {
    ...xp,
    level,
    current,
    total: xp.total + amount,
    tier: tierForLevel(level),
  };
}

function addToJourney(journey: Journey, mission: Mission): Journey {
  if (journey.id !== mission.world || journey.status === "locked") return journey;
  const xp = journey.xp + mission.xp;
  const done = xp >= journey.target;
  return {
    ...journey,
    xp,
    completedActivities: journey.completedActivities + 1,
    activitiesUntilBadge:
      journey.activitiesUntilBadge == null ? null : Math.max(0, journey.activitiesUntilBadge - 1),
    status: done ? "completed" : "active",
  };
}

function addToMyDistrict(districts: DistrictStanding[], amount: number): DistrictStanding[] {
  return districts.map((district) => (district.isMine ? { ...district, xp: district.xp + amount } : district));
}

function addToDepartment(
  department: DepartmentProgress | null,
  amount: number,
): DepartmentProgress | null {
  if (!department) return null;
  return { ...department, earned: Math.min(department.target, department.earned + amount) };
}
