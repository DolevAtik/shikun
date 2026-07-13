import { z } from "zod";
import { UserSummarySchema } from "./user";

/**
 * Home is not a hardcoded screen. The server returns an ordered list of typed
 * sections, already resolved against the viewer's audience, in one request.
 * That is what lets round-two admins rearrange Home without a frontend release.
 *
 * `title` is an authored override. When null the client falls back to the
 * localized default for the section type, so the chrome stays translatable.
 */

export const HomeSectionTypeSchema = z.enum([
  "GREETING",
  "EMERGENCY",
  "ANNOUNCEMENTS",
  "WEEKLY_SUMMARY",
  "EVENTS",
  "CEO_MESSAGE",
  "VIDEO_OF_WEEK",
  "PROJECTS",
  "KEY_NUMBERS",
  "CAREERS",
  "TRAININGS",
  "BIRTHDAYS",
  "RECOGNITION",
]);
export type HomeSectionType = z.infer<typeof HomeSectionTypeSchema>;

export const AlertSeveritySchema = z.enum(["INFO", "WARNING", "CRITICAL"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const EmergencyAlertSchema = z.object({
  id: z.string(),
  severity: AlertSeveritySchema,
  title: z.string(),
  body: z.string(),
  publishedAt: z.string(),
  href: z.string().nullable(),
});

export const AnnouncementCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  imageUrl: z.string().nullable(),
  isPinned: z.boolean(),
  publishedAt: z.string(),
  author: UserSummarySchema.nullable(),
  /** Present when the announcement was targeted at a single district. */
  districtName: z.string().nullable(),
  districtColor: z.string().nullable(),
});

export const EventCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  location: z.string().nullable(),
  isOnline: z.boolean(),
  imageUrl: z.string().nullable(),
  attendeeCount: z.number(),
  isRegistered: z.boolean(),
});

export const ProjectCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  districtName: z.string().nullable(),
  districtColor: z.string().nullable(),
  status: z.enum(["PLANNING", "MARKETING", "BUILDING", "COMPLETED"]),
  /** 0–100. */
  progress: z.number().min(0).max(100),
  housingUnits: z.number().nullable(),
  imageUrl: z.string().nullable(),
});

export const KeyNumberSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string().nullable(),
  /** Percentage change against the previous period; null when not comparable. */
  changePct: z.number().nullable(),
  period: z.string().nullable(),
});

export const CareerCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  departmentName: z.string().nullable(),
  districtName: z.string().nullable(),
  closesAt: z.string().nullable(),
  isInternal: z.boolean(),
  href: z.string().nullable(),
});

export const TrainingCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string(),
  format: z.enum(["ONLINE", "IN_PERSON", "HYBRID"]),
  seatsLeft: z.number().nullable(),
  isRegistered: z.boolean(),
});

export const BirthdaySchema = z.object({
  user: UserSummarySchema,
  /** MM-DD; the year is never shown and never stored for display. */
  date: z.string(),
  isToday: z.boolean(),
});

export const BadgeSchema = z.object({
  key: z.enum([
    "COMMUNITY_CONTRIBUTOR",
    "INNOVATION_CHAMPION",
    "KNOWLEDGE_SHARER",
    "DISTRICT_AMBASSADOR",
    "VOLUNTEER",
    "MENTOR",
    "TOP_CONTRIBUTOR",
  ]),
  nameHe: z.string(),
  nameEn: z.string(),
  color: z.string(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const RecognitionCardSchema = z.object({
  id: z.string(),
  recipient: UserSummarySchema,
  badge: BadgeSchema,
  reason: z.string(),
  awardedAt: z.string(),
});

export const CeoMessageSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  author: UserSummarySchema,
  publishedAt: z.string(),
  imageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
});

export const VideoOfWeekSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  videoUrl: z.string(),
  thumbnailUrl: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  viewCount: z.number(),
});

export const WeeklySummaryTeaserSchema = z.object({
  id: z.string(),
  weekOf: z.string(),
  title: z.string(),
  teaser: z.string(),
  highlights: z.array(z.string()),
  href: z.string(),
});

const sectionBase = {
  id: z.string(),
  order: z.number(),
  title: z.string().nullable(),
};

export const HomeSectionSchema = z.discriminatedUnion("type", [
  z.object({ ...sectionBase, type: z.literal("GREETING"), data: z.object({}) }),
  z.object({
    ...sectionBase,
    type: z.literal("EMERGENCY"),
    data: z.object({ alerts: z.array(EmergencyAlertSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("ANNOUNCEMENTS"),
    data: z.object({ items: z.array(AnnouncementCardSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("WEEKLY_SUMMARY"),
    data: z.object({ summary: WeeklySummaryTeaserSchema.nullable() }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("EVENTS"),
    data: z.object({ items: z.array(EventCardSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("CEO_MESSAGE"),
    data: z.object({ message: CeoMessageSchema.nullable() }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("VIDEO_OF_WEEK"),
    data: z.object({ video: VideoOfWeekSchema.nullable() }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("PROJECTS"),
    data: z.object({ items: z.array(ProjectCardSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("KEY_NUMBERS"),
    data: z.object({ items: z.array(KeyNumberSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("CAREERS"),
    data: z.object({ items: z.array(CareerCardSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("TRAININGS"),
    data: z.object({ items: z.array(TrainingCardSchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("BIRTHDAYS"),
    data: z.object({ items: z.array(BirthdaySchema) }),
  }),
  z.object({
    ...sectionBase,
    type: z.literal("RECOGNITION"),
    data: z.object({ items: z.array(RecognitionCardSchema) }),
  }),
]);
export type HomeSection = z.infer<typeof HomeSectionSchema>;

export const HomeResponseSchema = z.object({
  /** Server-side time of day, so the greeting matches the user's clock, not the server's. */
  greeting: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  sections: z.array(HomeSectionSchema),
});
export type HomeResponse = z.infer<typeof HomeResponseSchema>;
