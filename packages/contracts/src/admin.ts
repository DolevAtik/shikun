import { z } from "zod";
import { AudienceSchema } from "./audience";
import { ChannelSlugSchema, ContentKindSchema, ContentStatusSchema } from "./feed";
import { HomeSectionTypeSchema } from "./home";
import { arrayParam, ListQuerySchema, pageOf } from "./list";

/**
 * A single number on the Dashboard.
 *
 * `value` is nullable, and that nullability is the point. Nothing in this
 * platform has ever logged a page view, so on the day the console ships there is
 * no honest answer to "daily active users" — there is only "we started counting
 * on Monday". A tile whose value is null carries `collectingSince` instead, and
 * the UI says so.
 *
 * The alternative — seeding a plausible-looking DAU curve — is the kind of thing
 * that ends a government project.
 */
export const StatSchema = z.object({
  key: z.string(),
  value: z.number().nullable(),
  /** Percentage change against the previous window of the same length. */
  changePct: z.number().nullable(),
  /** Set only when `value` is null because telemetry has not accumulated yet. */
  collectingSince: z.string().nullable(),
});
export type Stat = z.infer<typeof StatSchema>;

export const TimeSeriesPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

export const DashboardRangeSchema = z.enum(["7d", "30d", "90d"]);
export type DashboardRange = z.infer<typeof DashboardRangeSchema>;

export const TopContentSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: ContentKindSchema,
  comments: z.number(),
  likes: z.number(),
});

export const TopGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** A CSS custom property name, never a hex — see tokens.css. */
  color: z.string().nullable(),
  score: z.number(),
});

export const UpcomingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startsAt: z.string(),
  location: z.string().nullable(),
  registrations: z.number(),
  capacity: z.number().nullable(),
});

export const RecentActivitySchema = z.object({
  id: z.string(),
  action: z.string(),
  actor: z.string(),
  summary: z.string(),
  at: z.string(),
});

export const AdminDashboardSchema = z.object({
  range: DashboardRangeSchema,
  stats: z.array(StatSchema),
  communityActivity: z.array(TimeSeriesPointSchema),
  contentByStatus: z.array(z.object({ status: ContentStatusSchema, count: z.number() })),
  topContent: z.array(TopContentSchema),
  topDistricts: z.array(TopGroupSchema),
  topDepartments: z.array(TopGroupSchema),
  upcomingEvents: z.array(UpcomingEventSchema),
  recentActivity: z.array(RecentActivitySchema),
});
export type AdminDashboard = z.infer<typeof AdminDashboardSchema>;

/** Global search — one endpoint, results grouped by the thing they are. */
export const SearchHitSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  href: z.string(),
});

export const SearchGroupSchema = z.object({
  group: z.enum(["content", "employees", "districts", "departments", "media"]),
  items: z.array(SearchHitSchema),
});

export const SearchResponseSchema = z.object({
  groups: z.array(SearchGroupSchema),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/** One beacon event from the employee app. Cap the batch so a stuck tab cannot flood the API. */
export const AnalyticsEventInputSchema = z.object({
  type: z.string().min(1).max(64),
  sessionId: z.string().min(1).max(64),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(64).optional(),
  props: z.record(z.unknown()).optional(),
  ts: z.string().datetime().optional(),
});

export const IngestEventsSchema = z.object({
  events: z.array(AnalyticsEventInputSchema).min(1).max(50),
});
export type IngestEventsRequest = z.infer<typeof IngestEventsSchema>;

// ─── Content CMS ─────────────────────────────────────────────────────────────

export const AdminContentSortSchema = z.enum([
  "updatedAt",
  "publishedAt",
  "title",
  "createdAt",
]);
export type AdminContentSort = z.infer<typeof AdminContentSortSchema>;

export const AdminContentListQuerySchema = ListQuerySchema.extend({
  sort: AdminContentSortSchema.default("updatedAt"),
  kind: arrayParam(ContentKindSchema),
  status: arrayParam(ContentStatusSchema),
  districtId: z.string().optional(),
});
export type AdminContentListQuery = z.infer<typeof AdminContentListQuerySchema>;

export const AdminContentListItemSchema = z.object({
  id: z.string(),
  kind: ContentKindSchema,
  status: ContentStatusSchema,
  title: z.string().nullable(),
  isPinned: z.boolean(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
  authorName: z.string().nullable(),
  districtName: z.string().nullable(),
  districtColor: z.string().nullable(),
});
export type AdminContentListItem = z.infer<typeof AdminContentListItemSchema>;

export const AdminContentPageSchema = pageOf(AdminContentListItemSchema);
export type AdminContentPage = z.infer<typeof AdminContentPageSchema>;

export const AdminContentDetailSchema = z.object({
  id: z.string(),
  kind: ContentKindSchema,
  status: ContentStatusSchema,
  title: z.string().nullable(),
  body: z.string().nullable(),
  isPinned: z.boolean(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  districtId: z.string().nullable(),
  districtName: z.string().nullable(),
  audience: AudienceSchema,
  summary: z.string().nullable(),
  imageUrl: z.string().nullable(),
  channelSlug: z.string().nullable(),
});
export type AdminContentDetail = z.infer<typeof AdminContentDetailSchema>;

export const CreateAdminContentSchema = z.object({
  /** Phase-2 create supports kinds that do not need a complex detail form yet. */
  kind: z.enum(["ANNOUNCEMENT", "FEED_POST", "CEO_MESSAGE", "ALERT"]),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(20_000).optional(),
  summary: z.string().trim().max(500).optional(),
  districtId: z.string().nullable().optional(),
  audience: AudienceSchema.optional(),
  channelSlug: ChannelSlugSchema.optional(),
  /** When set in the future, the item stays invisible until then (employee queries already filter publishedAt <= now). */
  publishedAt: z.string().datetime().nullable().optional(),
});
export type CreateAdminContent = z.infer<typeof CreateAdminContentSchema>;

export const UpdateAdminContentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  body: z.string().trim().max(20_000).nullable().optional(),
  summary: z.string().trim().max(500).nullable().optional(),
  districtId: z.string().nullable().optional(),
  audience: AudienceSchema.optional(),
  isPinned: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});
export type UpdateAdminContent = z.infer<typeof UpdateAdminContentSchema>;

export const BulkContentActionSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(["archive", "publish", "unpublish", "pin", "unpin"]),
});
export type BulkContentAction = z.infer<typeof BulkContentActionSchema>;

// ─── Home layout ─────────────────────────────────────────────────────────────

export const AdminHomeSectionSchema = z.object({
  id: z.string(),
  type: HomeSectionTypeSchema,
  order: z.number(),
  title: z.string().nullable(),
  isEnabled: z.boolean(),
  maxItems: z.number().nullable(),
  audience: AudienceSchema,
});
export type AdminHomeSection = z.infer<typeof AdminHomeSectionSchema>;

export const AdminHomeSectionsSchema = z.object({
  sections: z.array(AdminHomeSectionSchema),
});
export type AdminHomeSections = z.infer<typeof AdminHomeSectionsSchema>;

export const UpdateHomeSectionsSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string(),
        order: z.number().int().min(0),
        isEnabled: z.boolean(),
        title: z.string().trim().max(100).nullable().optional(),
        maxItems: z.number().int().min(1).max(20).nullable().optional(),
      }),
    )
    .min(1),
});
export type UpdateHomeSections = z.infer<typeof UpdateHomeSectionsSchema>;
