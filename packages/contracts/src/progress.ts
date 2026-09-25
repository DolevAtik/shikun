import { z } from "zod";
import { WorldFocusSchema } from "./world";

/**
 * The personal progression layer, computed from what the employee actually
 * did: reads (`ContentRead`) and registrations (`Registration`). Nothing here
 * is stored as a score — every number can be traced back to a row.
 */

export const ProgressActSchema = z.enum(["read", "training", "event"]);
export type ProgressAct = z.infer<typeof ProgressActSchema>;

/** XP per real act. The API computes with these; screens quote them. */
export const XP_PER_ACT: Record<ProgressAct, number> = { read: 20, training: 40, event: 30 };

export const LevelSchema = z.object({
  level: z.number().int(),
  /** XP earned inside the current level. */
  current: z.number().int(),
  /** XP the current level costs in full. */
  next: z.number().int(),
  total: z.number().int(),
});
export type Level = z.infer<typeof LevelSchema>;

export const MissionSchema = z.object({
  id: z.string(),
  act: ProgressActSchema,
  world: WorldFocusSchema,
  /** The content item this mission is about. */
  contentItemId: z.string(),
  title: z.string(),
  xp: z.number().int(),
  /** Honest estimate for a read; null for a registration. */
  minutes: z.number().int().nullable(),
  /** ISO start time for events and trainings. */
  startsAt: z.string().nullable(),
  /** Location, "online", or a training format — shown in the register dialog. */
  place: z.string().nullable(),
  seatsLeft: z.number().int().nullable(),
});
export type Mission = z.infer<typeof MissionSchema>;

export const WorldProgressSchema = z.object({
  id: WorldFocusSchema,
  xp: z.number().int(),
  acts: z.number().int(),
  /** Acts for this world's next milestone. */
  milestone: z.number().int(),
});
export type WorldProgress = z.infer<typeof WorldProgressSchema>;

export const AchievementIdSchema = z.enum([
  "firstStep",
  "reader",
  "learner",
  "participant",
  "explorer",
  "consistent",
  "level5",
]);
export type AchievementId = z.infer<typeof AchievementIdSchema>;

export const AchievementSchema = z.object({
  id: AchievementIdSchema,
  current: z.number().int(),
  target: z.number().int(),
  unlockedAt: z.string().nullable(),
  /** The world this achievement belongs to, when there is one. */
  world: WorldFocusSchema.nullable(),
});
export type Achievement = z.infer<typeof AchievementSchema>;

export const ReceivedRecognitionSchema = z.object({
  id: z.string(),
  badgeKey: z.string(),
  badgeNameHe: z.string(),
  badgeNameEn: z.string(),
  badgeColor: z.string(),
  reason: z.string(),
  giverName: z.string().nullable(),
  giverTitle: z.string().nullable(),
  awardedAt: z.string(),
});
export type ReceivedRecognition = z.infer<typeof ReceivedRecognitionSchema>;

export const DepartmentQuestSchema = z.object({
  nameHe: z.string(),
  nameEn: z.string(),
  earned: z.number().int(),
  target: z.number().int(),
  members: z.number().int(),
  /** Whole days left in the month, today included. */
  daysLeft: z.number().int(),
  /** Collective counts this month. Never who. */
  reads: z.number().int(),
  trainings: z.number().int(),
  events: z.number().int(),
  /** XP the viewer added this month — their own share, never anyone else's. */
  mine: z.number().int(),
});
export type DepartmentQuest = z.infer<typeof DepartmentQuestSchema>;

export const UnlockIdSchema = z.enum(["pin", "badge", "frame"]);
export type UnlockId = z.infer<typeof UnlockIdSchema>;

export const UnlockSchema = z.object({
  id: UnlockIdSchema,
  level: z.number().int(),
  /** Lifetime XP at which this opens. */
  xpAt: z.number().int(),
  unlocked: z.boolean(),
});
export type Unlock = z.infer<typeof UnlockSchema>;

export const XpRuleSchema = z.object({
  act: ProgressActSchema,
  xp: z.number().int(),
});
export type XpRule = z.infer<typeof XpRuleSchema>;

export const EmployeeProgressSchema = z.object({
  level: LevelSchema,
  stats: z.object({
    acts: z.number().int(),
    achievements: z.number().int(),
    streakDays: z.number().int(),
    /** True when today's streak is being held by the one forgiven day. */
    graceUsed: z.boolean(),
  }),
  weekly: z.object({ filled: z.number().int(), total: z.number().int() }),
  missions: z.array(MissionSchema),
  worlds: z.array(WorldProgressSchema),
  achievements: z.array(AchievementSchema),
  recognitions: z.array(ReceivedRecognitionSchema),
  department: DepartmentQuestSchema.nullable(),
  unlocks: z.array(UnlockSchema),
  chosenWorld: WorldFocusSchema.nullable(),
  rules: z.array(XpRuleSchema),
});
export type EmployeeProgress = z.infer<typeof EmployeeProgressSchema>;

export const WorldActivitySchema = z.object({
  contentItemId: z.string(),
  act: ProgressActSchema,
  title: z.string(),
  xp: z.number().int(),
  at: z.string(),
  /** Future registrations can still be cancelled. */
  cancellable: z.boolean(),
  startsAt: z.string().nullable(),
});
export type WorldActivity = z.infer<typeof WorldActivitySchema>;

export const WorldDetailSchema = z.object({
  world: WorldProgressSchema,
  history: z.array(WorldActivitySchema),
  opportunities: z.array(MissionSchema),
  level: LevelSchema,
});
export type WorldDetail = z.infer<typeof WorldDetailSchema>;

export const RegisterSchema = z.object({ contentItemId: z.string().min(1) });
export type Register = z.infer<typeof RegisterSchema>;
