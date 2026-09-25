import { type AchievementId, type ChannelSlug, type ProgressAct, type UnlockId, type WorldFocus, XP_PER_ACT } from "@moch/contracts";

/**
 * Every rule of the progression layer, in one plain object.
 *
 * This is the shape a future admin table stores. Moving it to the database
 * changes the loader, not the service and not the screen.
 *
 * Only real acts earn XP: a first full read of a post, and a registration for
 * a training or an event. Opening the app, a like, a comment, or viewing a
 * screen earn nothing. Colleague recognition is never XP.
 */
export const RULES = {
  xp: XP_PER_ACT,

  /** Which world a read belongs to. Channels not listed are Know. */
  channelWorld: {
    people: "feel",
    "success-stories": "feel",
    learning: "develop",
  } as Partial<Record<ChannelSlug, WorldFocus>>,

  actWorld: { training: "develop", event: "participate" } as Record<Exclude<ProgressAct, "read">, WorldFocus>,

  /** Level 1 → 2 costs `base`; every level after costs `step` more. */
  curve: { base: 100, step: 20 },

  /** Acts per world milestone. The next one is always the next multiple. */
  worldMilestone: 5,

  achievements: [
    { id: "firstStep", target: 1, world: null },
    { id: "reader", target: 5, world: "know" },
    { id: "learner", target: 1, world: "develop" },
    { id: "participant", target: 2, world: "participate" },
    { id: "explorer", target: 4, world: null },
    { id: "consistent", target: 5, world: null },
    { id: "level5", target: 5, world: null },
  ] as { id: AchievementId; target: number; world: WorldFocus | null }[],

  /** Cosmetic stages. Keep in step with `IllustratedAvatar`. */
  unlocks: [
    { id: "pin", level: 5 },
    { id: "badge", level: 10 },
    { id: "frame", level: 15 },
  ] as { id: UnlockId; level: number }[],

  /** Monthly department goal, per member who has at least signed in once. */
  departmentXpPerMember: 80,

  weeklyTarget: 3,
  readMissions: 2,
  wordsPerMinute: 200,
} as const;

export const WORLDS: WorldFocus[] = ["know", "feel", "develop", "participate"];

/** XP a level costs in full. Level 1 costs `base`. */
export function levelCost(level: number): number {
  return RULES.curve.base + RULES.curve.step * (level - 1);
}

/** Lifetime XP at which `level` is reached. Level 1 is 0. */
export function xpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l += 1) total += levelCost(l);
  return total;
}

export function levelFor(total: number): { level: number; current: number; next: number; total: number } {
  let level = 1;
  let remaining = Math.max(0, total);
  while (remaining >= levelCost(level)) {
    remaining -= levelCost(level);
    level += 1;
  }
  return { level, current: remaining, next: levelCost(level), total: Math.max(0, total) };
}

export function worldForChannel(slug: string): WorldFocus {
  return RULES.channelWorld[slug as ChannelSlug] ?? "know";
}

/** A read estimate that never pretends a post takes zero minutes. */
export function readMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / RULES.wordsPerMinute));
}
