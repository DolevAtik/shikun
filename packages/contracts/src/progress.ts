import { z } from "zod";
import { WorldFocusSchema } from "./world";

/**
 * The personal progression layer, computed from what the employee actually
 * did: reads (`ContentRead`), registrations and the attendance the employee
 * confirmed afterwards (`Registration`), and a written bio (`User`). Nothing
 * here is stored as a score — every number can be traced back to a row.
 */

export const ProgressActSchema = z.enum(["read", "training", "event", "trainingAttended", "eventAttended", "profile"]);
export type ProgressAct = z.infer<typeof ProgressActSchema>;

/**
 * XP per real act. The API computes with these; screens quote them.
 *
 * Most of a session's XP comes from being there, not from signing up: a
 * registration is a promise, attendance is the act.
 */
export const XP_PER_ACT: Record<ProgressAct, number> = {
  read: 20,
  training: 10,
  event: 10,
  trainingAttended: 30,
  eventAttended: 20,
  profile: 30,
};

/** Acts a mission can ask for. Attendance is answered on a booking, not offered as a mission. */
export const MissionActSchema = z.enum(["read", "training", "event", "profile"]);
export type MissionAct = z.infer<typeof MissionActSchema>;

/** A bio this long or longer counts as an introduction. */
export const PROFILE_BIO_MIN = 20;

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
  act: MissionActSchema,
  world: WorldFocusSchema,
  /** The content item this mission is about. Null for the profile mission. */
  contentItemId: z.string().nullable(),
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

/** Badges a colleague can give. "Top contributor" is a ranking, so it stays an organizational award. */
export const PeerBadgeSchema = z.enum([
  "COMMUNITY_CONTRIBUTOR",
  "INNOVATION_CHAMPION",
  "KNOWLEDGE_SHARER",
  "DISTRICT_AMBASSADOR",
  "VOLUNTEER",
  "MENTOR",
]);
export type PeerBadge = z.infer<typeof PeerBadgeSchema>;

/** Thanks worth reading stays short, and a limit keeps each one meaningful. */
export const RECOGNITION_REASON_MIN = 10;
export const RECOGNITION_REASON_MAX = 280;
export const RECOGNITIONS_PER_WEEK = 3;

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

export const GivenRecognitionSchema = z.object({
  id: z.string(),
  recipientName: z.string(),
  badgeKey: z.string(),
  badgeNameHe: z.string(),
  badgeNameEn: z.string(),
  badgeColor: z.string(),
  reason: z.string(),
  awardedAt: z.string(),
});
export type GivenRecognition = z.infer<typeof GivenRecognitionSchema>;

export const RecognitionGivingSchema = z.object({
  /** Given this Jerusalem week (Sunday start). */
  used: z.number().int(),
  limit: z.number().int(),
  recent: z.array(GivenRecognitionSchema),
});
export type RecognitionGiving = z.infer<typeof RecognitionGivingSchema>;

export const GiveRecognitionSchema = z.object({
  recipientId: z.string().min(1),
  badge: PeerBadgeSchema,
  reason: z
    .string()
    .trim()
    .min(RECOGNITION_REASON_MIN, `כמה מילים לפחות: ${RECOGNITION_REASON_MIN} תווים`)
    .max(RECOGNITION_REASON_MAX, `עד ${RECOGNITION_REASON_MAX} תווים`),
});
export type GiveRecognition = z.infer<typeof GiveRecognitionSchema>;

/** A colleague in the recognition picker. The bio is there so you know who you are thanking. */
export const ColleagueSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  initials: z.string(),
  title: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  departmentName: z.string().nullable(),
  bio: z.string().nullable(),
});
export type Colleague = z.infer<typeof ColleagueSchema>;

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
  /** The months before this one, oldest first. Targets use today's headcount. */
  history: z.array(
    z.object({
      month: z.string(),
      earned: z.number().int(),
      target: z.number().int(),
      reached: z.boolean(),
    }),
  ),
  /** Consecutive months, ending last month, in which the goal was reached. */
  reachedRun: z.number().int(),
  /** What the department gets this month when it reaches the goal, if a manager set it. */
  reward: z.string().nullable(),
});
export type DepartmentQuest = z.infer<typeof DepartmentQuestSchema>;

export const UnlockIdSchema = z.enum(["backdrop", "pin", "outfit", "badge", "skyline", "frame"]);
export type UnlockId = z.infer<typeof UnlockIdSchema>;

export const UnlockSchema = z.object({
  id: UnlockIdSchema,
  level: z.number().int(),
  /** Lifetime XP at which this opens. */
  xpAt: z.number().int(),
  unlocked: z.boolean(),
});
export type Unlock = z.infer<typeof UnlockSchema>;

/** Avatar choices. Each list opens at a level; the first entry is the default look. */
export const AvatarBackdropSchema = z.enum(["sand", "sky", "olive", "dusk"]);
export type AvatarBackdrop = z.infer<typeof AvatarBackdropSchema>;
export const AvatarOutfitSchema = z.enum(["terracotta", "navy", "olive", "plum"]);
export type AvatarOutfit = z.infer<typeof AvatarOutfitSchema>;

export const AvatarStyleSchema = z.object({
  backdrop: AvatarBackdropSchema,
  outfit: AvatarOutfitSchema,
});
export type AvatarStyle = z.infer<typeof AvatarStyleSchema>;

/** A session the employee registered for: still ahead, or just behind and waiting for "were you there?". */
export const BookingSchema = z.object({
  contentItemId: z.string(),
  act: z.enum(["training", "event"]),
  world: WorldFocusSchema,
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  /** Location, "ONLINE", or a training format. */
  place: z.string().nullable(),
  status: z.enum(["upcoming", "confirm"]),
  /** XP that confirming attendance adds. */
  attendXp: z.number().int(),
});
export type Booking = z.infer<typeof BookingSchema>;

/** Days after a session starts in which attendance can still be confirmed. */
export const ATTENDANCE_WINDOW_DAYS = 30;

export const AttendanceSchema = z.object({ attended: z.boolean() });
export type Attendance = z.infer<typeof AttendanceSchema>;

/** A personal date worth a moment. Never XP. */
export const MomentSchema = z.object({
  kind: z.literal("anniversary"),
  years: z.number().int(),
  /** YYYY-MM-DD of this year's anniversary. */
  date: z.string(),
});
export type Moment = z.infer<typeof MomentSchema>;

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
  bookings: z.array(BookingSchema),
  giving: RecognitionGivingSchema,
  avatar: AvatarStyleSchema,
  moment: MomentSchema.nullable(),
  /** True once the bio is long enough to count as an introduction. */
  profileComplete: z.boolean(),
});
export type EmployeeProgress = z.infer<typeof EmployeeProgressSchema>;

export const WorldActivitySchema = z.object({
  /** Null for the profile act. */
  contentItemId: z.string().nullable(),
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

/** How many of each act. Every act is a key, so a count is never missing. */
export const ActCountsSchema = z.object({
  read: z.number().int(),
  training: z.number().int(),
  event: z.number().int(),
  trainingAttended: z.number().int(),
  eventAttended: z.number().int(),
  profile: z.number().int(),
});
export type ActCounts = z.infer<typeof ActCountsSchema>;

/** One month, looked back on. Counts only; the same rows the rest of the screen uses. */
export const MonthlyRecapSchema = z.object({
  /** YYYY-MM, Jerusalem calendar. */
  month: z.string(),
  xp: z.number().int(),
  acts: ActCountsSchema,
  activeDays: z.number().int(),
  /** The world with the most XP this month, when there was any. */
  topWorld: WorldFocusSchema.nullable(),
  recognitionsReceived: z.number().int(),
  recognitionsGiven: z.number().int(),
  achievements: z.array(AchievementIdSchema),
  levelStart: z.number().int(),
  levelEnd: z.number().int(),
  /** Months that can be opened, newest first. */
  months: z.array(z.string()),
});
export type MonthlyRecap = z.infer<typeof MonthlyRecapSchema>;

export const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const UpdateProfileSchema = z.object({
  bio: z.string().trim().max(500).nullable(),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s()]*$/, "מספר טלפון לא תקין")
    .nullable(),
});
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

export const ProfileResultSchema = z.object({
  bio: z.string().nullable(),
  phone: z.string().nullable(),
  profileComplete: z.boolean(),
  /** XP this save added — only when it completed the profile for the first time. */
  xp: z.number().int().nullable(),
});
export type ProfileResult = z.infer<typeof ProfileResultSchema>;

/** The admin view of one department's monthly goal and its reward. */
export const AdminQuestSchema = z.object({
  departmentId: z.string(),
  nameHe: z.string(),
  nameEn: z.string(),
  month: z.string(),
  members: z.number().int(),
  earned: z.number().int(),
  target: z.number().int(),
  reward: z.string().nullable(),
  rewardSetBy: z.string().nullable(),
});
export type AdminQuest = z.infer<typeof AdminQuestSchema>;

export const AdminQuestsSchema = z.object({ month: z.string(), items: z.array(AdminQuestSchema) });
export type AdminQuests = z.infer<typeof AdminQuestsSchema>;

export const SetQuestRewardSchema = z.object({
  reward: z.string().trim().max(160).nullable(),
});
export type SetQuestReward = z.infer<typeof SetQuestRewardSchema>;

/**
 * Does העולם שלי change behaviour? Aggregates only — never a name, never a
 * per-person row. Each figure says what it counts over.
 */
export const WorldMetricsSchema = z.object({
  range: z.enum(["7d", "30d", "90d"]),
  visitors: z.number().int(),
  /** Visitors whose first visit in range was 7+ days before its end. */
  returnBase: z.number().int(),
  /** Of those, how many came back on another day within 7 days. */
  returned: z.number().int(),
  missionOpens: z.number().int(),
  /** Mission opens followed by the act itself within 7 days. */
  missionCompleted: z.number().int(),
  focus: z.object({
    withFocus: z.object({ users: z.number().int(), acts: z.number().int() }),
    withoutFocus: z.object({ users: z.number().int(), acts: z.number().int() }),
  }),
  acts: ActCountsSchema,
  attendance: z.object({ attended: z.number().int(), missed: z.number().int(), unanswered: z.number().int() }),
  recognitionWeeks: z.array(z.object({ week: z.string(), given: z.number().int(), givers: z.number().int() })),
});
export type WorldMetrics = z.infer<typeof WorldMetricsSchema>;
