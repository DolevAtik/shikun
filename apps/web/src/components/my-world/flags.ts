import type { MyWorldFlags } from "./types";

/**
 * Section switches for העולם שלי.
 *
 * Every section already checks its flag, so an admin config can replace this
 * function later and the components stay as they are. Nothing is hard-off:
 * the presentation shows the full personal space.
 */
export function getMyWorldFlags(): MyWorldFlags {
  return {
    showMissions: true,
    showDailyStep: true,
    showWeeklyCard: true,
    showFocus: true,
    showJourney: true,
    showOverallProgress: true,
    showAchievements: true,
    showRecognition: true,
    showDepartmentProgress: true,
    showDistrictLeaderboard: true,
    showUnlocks: true,
  };
}
