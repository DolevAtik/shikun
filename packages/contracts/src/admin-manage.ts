import { z } from "zod";
import { AudienceSchema } from "./audience";
import { ContentStatusSchema } from "./feed";
import { ListQuerySchema, pageOf } from "./list";
import { RoleSchema } from "./roles";
import { TrainingFormatSchema } from "./admin";

/**
 * The console's write surface beyond content: what Home shows, the Services
 * screen, events and trainings, community moderation, and people.
 */

/** A new order for a list of rows, top to bottom. */
export const ReorderSchema = z.object({
  ids: z.array(z.string()).min(1).max(200),
});
export type Reorder = z.infer<typeof ReorderSchema>;

// ─── Home data ───────────────────────────────────────────────────────────────

export const AdminKeyMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string().nullable(),
  changePct: z.number().nullable(),
  period: z.string().nullable(),
  order: z.number(),
  updatedAt: z.string(),
});
export type AdminKeyMetric = z.infer<typeof AdminKeyMetricSchema>;

export const KeyMetricInputSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.number().finite(),
  unit: z.string().trim().max(20).nullable().optional(),
  changePct: z.number().finite().min(-1000).max(1000).nullable().optional(),
  period: z.string().trim().max(40).nullable().optional(),
});
export type KeyMetricInput = z.infer<typeof KeyMetricInputSchema>;

export const ProjectStatusSchema = z.enum(["PLANNING", "MARKETING", "BUILDING", "COMPLETED"]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const AdminProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  districtId: z.string(),
  districtName: z.string(),
  status: ProjectStatusSchema,
  progress: z.number(),
  housingUnits: z.number().nullable(),
  imageUrl: z.string().nullable(),
  order: z.number(),
});
export type AdminProject = z.infer<typeof AdminProjectSchema>;

export const ProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(80).nullable().optional(),
  districtId: z.string().min(1),
  status: ProjectStatusSchema,
  progress: z.number().int().min(0).max(100),
  housingUnits: z.number().int().min(0).max(1_000_000).nullable().optional(),
  imageUrl: z.string().trim().max(2_000).nullable().optional(),
});
export type ProjectInput = z.infer<typeof ProjectInputSchema>;

export const AdminWeeklySummarySchema = z.object({
  id: z.string(),
  /** YYYY-MM-DD, the Sunday the week starts on. */
  weekOf: z.string(),
  title: z.string(),
  teaser: z.string(),
  highlights: z.array(z.string()),
  publishedAt: z.string(),
});
export type AdminWeeklySummary = z.infer<typeof AdminWeeklySummarySchema>;

export const WeeklySummaryInputSchema = z.object({
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך בפורמט YYYY-MM-DD"),
  title: z.string().trim().min(1).max(120),
  teaser: z.string().trim().min(1).max(400),
  highlights: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
});
export type WeeklySummaryInput = z.infer<typeof WeeklySummaryInputSchema>;

export const AdminHomeDataSchema = z.object({
  metrics: z.array(AdminKeyMetricSchema),
  projects: z.array(AdminProjectSchema),
  weekly: z.array(AdminWeeklySummarySchema),
});
export type AdminHomeData = z.infer<typeof AdminHomeDataSchema>;

// ─── Services ────────────────────────────────────────────────────────────────

/**
 * The icons the employee app can draw for a service (apps/web components/icons.ts).
 * A name outside this list would render the fallback, so the console offers only these.
 */
export const SERVICE_ICON_KEYS = [
  "award",
  "book",
  "book-open",
  "briefcase",
  "building",
  "clock",
  "file-plus",
  "file-text",
  "graduation-cap",
  "home",
  "landmark",
  "lightbulb",
  "map",
  "megaphone",
  "phone",
  "play",
  "receipt",
  "scroll-text",
  "user-round",
  "users",
  "wallet",
] as const;
export const ServiceIconSchema = z.enum(SERVICE_ICON_KEYS);
export type ServiceIcon = z.infer<typeof ServiceIconSchema>;

export const AdminQuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  href: z.string(),
  order: z.number(),
});
export type AdminQuickAction = z.infer<typeof AdminQuickActionSchema>;

export const AdminQuickLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  icon: z.string().nullable(),
  isExternal: z.boolean(),
  order: z.number(),
});
export type AdminQuickLink = z.infer<typeof AdminQuickLinkSchema>;

export const AdminServicesSchema = z.object({
  quickActions: z.array(AdminQuickActionSchema),
  quickLinks: z.array(AdminQuickLinkSchema),
});
export type AdminServices = z.infer<typeof AdminServicesSchema>;

/** An in-app path or a full https address; never `javascript:` or another scheme. */
const safeHref = z
  .string()
  .trim()
  .min(1)
  .max(2_000)
  .refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value) || /^mailto:|^tel:/i.test(value), {
    message: "קישור חייב להתחיל ב-/ או ב-https://",
  });

export const QuickActionInputSchema = z.object({
  label: z.string().trim().min(1).max(60),
  icon: ServiceIconSchema,
  href: safeHref,
});
export type QuickActionInput = z.infer<typeof QuickActionInputSchema>;

export const QuickLinkInputSchema = z.object({
  label: z.string().trim().min(1).max(60),
  url: safeHref,
  icon: ServiceIconSchema.nullable().optional(),
  isExternal: z.boolean().default(true),
});
export type QuickLinkInput = z.infer<typeof QuickLinkInputSchema>;

// ─── Events and trainings ────────────────────────────────────────────────────

export const AdminSessionKindSchema = z.enum(["EVENT", "TRAINING"]);
export type AdminSessionKind = z.infer<typeof AdminSessionKindSchema>;

export const AdminSessionListQuerySchema = ListQuerySchema.extend({
  kind: AdminSessionKindSchema,
  when: z.enum(["upcoming", "past", "all"]).default("upcoming"),
});
export type AdminSessionListQuery = z.infer<typeof AdminSessionListQuerySchema>;

export const AdminSessionSchema = z.object({
  id: z.string(),
  kind: AdminSessionKindSchema,
  title: z.string().nullable(),
  status: ContentStatusSchema,
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  location: z.string().nullable(),
  isOnline: z.boolean().nullable(),
  format: TrainingFormatSchema.nullable(),
  capacity: z.number().nullable(),
  districtName: z.string().nullable(),
  registrations: z.number(),
  attended: z.number(),
  missed: z.number(),
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;

export const AdminSessionPageSchema = pageOf(AdminSessionSchema);
export type AdminSessionPage = z.infer<typeof AdminSessionPageSchema>;

export const AdminRegistrantSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  email: z.string(),
  departmentName: z.string().nullable(),
  districtName: z.string().nullable(),
  registeredAt: z.string(),
  /** The employee's own answer after the session; null when not answered. */
  attended: z.boolean().nullable(),
});
export type AdminRegistrant = z.infer<typeof AdminRegistrantSchema>;

export const AdminSessionRegistrantsSchema = z.object({
  session: AdminSessionSchema,
  items: z.array(AdminRegistrantSchema),
});
export type AdminSessionRegistrants = z.infer<typeof AdminSessionRegistrantsSchema>;

// ─── Community ───────────────────────────────────────────────────────────────

export const AdminChannelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameHe: z.string(),
  nameEn: z.string(),
  descriptionHe: z.string(),
  color: z.string(),
  isMandatory: z.boolean(),
  postCount: z.number(),
  followerCount: z.number(),
});
export type AdminChannel = z.infer<typeof AdminChannelSchema>;

export const AdminCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  authorName: z.string(),
  authorEmail: z.string(),
  postId: z.string(),
  postTitle: z.string().nullable(),
  createdAt: z.string(),
  likeCount: z.number(),
});
export type AdminComment = z.infer<typeof AdminCommentSchema>;

export const AdminCommentPageSchema = pageOf(AdminCommentSchema);
export type AdminCommentPage = z.infer<typeof AdminCommentPageSchema>;

export const AdminRecognitionSchema = z.object({
  id: z.string(),
  giverName: z.string().nullable(),
  recipientName: z.string(),
  badge: z.string(),
  reason: z.string(),
  awardedAt: z.string(),
});
export type AdminRecognition = z.infer<typeof AdminRecognitionSchema>;

export const AdminRecognitionPageSchema = pageOf(AdminRecognitionSchema);
export type AdminRecognitionPage = z.infer<typeof AdminRecognitionPageSchema>;

/** Why a moderator removed something. It goes into the audit log with the text removed. */
export const ModerationRemoveSchema = z.object({
  reason: z.string().trim().min(2, "נא לציין סיבה").max(300),
});
export type ModerationRemove = z.infer<typeof ModerationRemoveSchema>;

// ─── People ──────────────────────────────────────────────────────────────────

export const UpdateAdminEmployeeSchema = z.object({
  title: z.string().trim().max(120).nullable().optional(),
  departmentId: z.string().nullable().optional(),
  districtId: z.string().nullable().optional(),
  roles: z.array(RoleSchema).min(1).max(7).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAdminEmployee = z.infer<typeof UpdateAdminEmployeeSchema>;

export const AdminRoleCountsSchema = z.object({
  roles: z.array(z.object({ role: RoleSchema, count: z.number() })),
});
export type AdminRoleCounts = z.infer<typeof AdminRoleCountsSchema>;

/** How many active employees an audience rule reaches right now. */
export const AudienceEstimateSchema = z.object({
  count: z.number(),
  total: z.number(),
});
export type AudienceEstimate = z.infer<typeof AudienceEstimateSchema>;

export const AudienceEstimateRequestSchema = AudienceSchema;
