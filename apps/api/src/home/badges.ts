import type { Badge } from "@moch/contracts";
import type { BadgeKey } from "@prisma/client";

/**
 * Recognition, not gamification. Seven badges, no points, no streaks, no
 * levelling — a badge names a contribution a colleague actually made.
 *
 * Colors come from the Ministry logo's houses, which is what keeps the wall of
 * recognition looking like this organization rather than like a fitness app.
 */
export const BADGE_META: Record<BadgeKey, Badge> = {
  COMMUNITY_CONTRIBUTOR: {
    key: "COMMUNITY_CONTRIBUTOR",
    nameHe: "תורם/ת לקהילה",
    nameEn: "Community Contributor",
    color: "var(--accent-blue)",
  },
  INNOVATION_CHAMPION: {
    key: "INNOVATION_CHAMPION",
    nameHe: "מוביל/ת חדשנות",
    nameEn: "Innovation Champion",
    color: "var(--accent-violet)",
  },
  KNOWLEDGE_SHARER: {
    key: "KNOWLEDGE_SHARER",
    nameHe: "משתף/ת ידע",
    nameEn: "Knowledge Sharer",
    color: "var(--accent-teal)",
  },
  DISTRICT_AMBASSADOR: {
    key: "DISTRICT_AMBASSADOR",
    nameHe: "שגריר/ת מחוז",
    nameEn: "District Ambassador",
    color: "var(--accent-green)",
  },
  VOLUNTEER: {
    key: "VOLUNTEER",
    nameHe: "מתנדב/ת",
    nameEn: "Volunteer",
    color: "var(--accent-red)",
  },
  MENTOR: {
    key: "MENTOR",
    nameHe: "מנטור/ית",
    nameEn: "Mentor",
    color: "var(--accent-amber)",
  },
  TOP_CONTRIBUTOR: {
    key: "TOP_CONTRIBUTOR",
    nameHe: "תורם/ת מצטיין/ת",
    nameEn: "Top Contributor",
    color: "var(--brand-blue)",
  },
};
