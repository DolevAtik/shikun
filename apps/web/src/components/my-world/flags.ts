import type { MyWorldFlags } from "./types";

/**
 * Section switches for העולם שלי.
 *
 * Every section checks its flag, so an admin config can replace this function
 * later and the components stay as they are.
 */
export function getMyWorldFlags(): MyWorldFlags {
  return {
    showStats: true,
    showMissions: true,
    showJourney: true,
    showFocus: true,
    showAchievements: true,
    showRecognition: true,
    showDepartment: true,
    showUnlocks: true,
  };
}
