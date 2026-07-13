import { z } from "zod";
import { AudienceSchema } from "./audience";
import { UserSummarySchema } from "./user";

/**
 * Feeds are channels an employee chooses to follow — not one undifferentiated
 * news page. Following is the signal that keeps the volume survivable.
 */
export const ChannelSlugSchema = z.enum([
  "organization",
  "districts",
  "projects",
  "people",
  "leadership",
  "innovation",
  "learning",
  "career",
  "videos",
  "success-stories",
]);
export type ChannelSlug = z.infer<typeof ChannelSlugSchema>;

export const ChannelSchema = z.object({
  id: z.string(),
  slug: ChannelSlugSchema,
  nameHe: z.string(),
  nameEn: z.string(),
  descriptionHe: z.string(),
  descriptionEn: z.string(),
  icon: z.string(),
  color: z.string(),
  postCount: z.number(),
  followerCount: z.number(),
  isFollowing: z.boolean(),
  /** Channels every employee is subscribed to and cannot unfollow (e.g. Organization). */
  isMandatory: z.boolean(),
});
export type Channel = z.infer<typeof ChannelSchema>;

export const MediaKindSchema = z.enum(["IMAGE", "VIDEO", "DOCUMENT"]);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaSchema = z.object({
  id: z.string(),
  kind: MediaKindSchema,
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
  /** Required on images for WCAG; enforced at publish time, not at render time. */
  alt: z.string().nullable(),
  fileName: z.string().nullable(),
  sizeBytes: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  durationSeconds: z.number().nullable(),
});
export type Media = z.infer<typeof MediaSchema>;

export const TagSchema = z.object({
  id: z.string(),
  slug: z.string(),
  label: z.string(),
});
export type Tag = z.infer<typeof TagSchema>;

export const ContentStatusSchema = z.enum(["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"]);
export type ContentStatus = z.infer<typeof ContentStatusSchema>;

/**
 * Mirrors the Prisma `ContentKind` enum. The employee app never needed it — it
 * consumes already-typed sections — but the admin edits content *by kind*, so
 * the kind has to cross the wire. These two lists must stay in step; the API
 * will not compile if they drift, because Prisma's enum is the parameter type.
 */
export const ContentKindSchema = z.enum([
  "ANNOUNCEMENT",
  "FEED_POST",
  "EVENT",
  "CAREER",
  "TRAINING",
  "CEO_MESSAGE",
  "VIDEO",
  "ALERT",
]);
export type ContentKind = z.infer<typeof ContentKindSchema>;

export const FeedPostSchema = z.object({
  id: z.string(),
  channel: z.object({
    id: z.string(),
    slug: ChannelSlugSchema,
    nameHe: z.string(),
    nameEn: z.string(),
    color: z.string(),
  }),
  title: z.string().nullable(),
  /**
   * On list responses this may be truncated to the excerpt length. Call
   * `GET /feed/posts/:id` (or expand in the client) when `isTruncated` is true.
   */
  body: z.string(),
  excerpt: z.string(),
  /** True when `body` is a truncated preview of the full post. */
  isTruncated: z.boolean().default(false),
  author: UserSummarySchema.nullable(),
  media: z.array(MediaSchema),
  tags: z.array(TagSchema),
  districtName: z.string().nullable(),
  districtColor: z.string().nullable(),
  publishedAt: z.string(),
  likeCount: z.number(),
  commentCount: z.number(),
  isLiked: z.boolean(),
  isBookmarked: z.boolean(),
});
export type FeedPost = z.infer<typeof FeedPostSchema>;

export const CommentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  author: UserSummarySchema,
  body: z.string(),
  createdAt: z.string(),
  likeCount: z.number(),
  isLiked: z.boolean(),
  isMine: z.boolean(),
});
export type Comment = z.infer<typeof CommentSchema>;

/** Cursor pagination — offsets drift when new posts land mid-scroll. */
export const FeedQuerySchema = z.object({
  channel: ChannelSlugSchema.optional(),
  tag: z.string().optional(),
  districtId: z.string().optional(),
  q: z.string().optional(),
  /** Only posts from channels the viewer follows. */
  following: z.coerce.boolean().optional(),
  bookmarked: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});
export type FeedQuery = z.infer<typeof FeedQuerySchema>;

export const FeedPageSchema = z.object({
  items: z.array(FeedPostSchema),
  nextCursor: z.string().nullable(),
});
export type FeedPage = z.infer<typeof FeedPageSchema>;

/** Comments on a post — cursor pages, oldest first (same order as before). */
export const CommentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});
export type CommentsQuery = z.infer<typeof CommentsQuerySchema>;

export const CommentsPageSchema = z.object({
  items: z.array(CommentSchema),
  nextCursor: z.string().nullable(),
});
export type CommentsPage = z.infer<typeof CommentsPageSchema>;

export const CreateCommentSchema = z.object({
  body: z.string().min(1, "לא ניתן לפרסם תגובה ריקה").max(2000, "התגובה ארוכה מדי"),
});
export type CreateComment = z.infer<typeof CreateCommentSchema>;

export const ToggleResponseSchema = z.object({
  active: z.boolean(),
  count: z.number(),
});
export type ToggleResponse = z.infer<typeof ToggleResponseSchema>;

/**
 * Publishing a post. Requires the `content:publish` permission — an Employee
 * calling this gets a 403, which is the round-one proof that the roles matrix
 * is real and not decorative.
 */
export const CreatePostSchema = z.object({
  channelSlug: ChannelSlugSchema,
  title: z.string().max(200).optional(),
  body: z.string().min(1, "לא ניתן לפרסם פוסט ריק"),
  tags: z.array(z.string()).default([]),
  districtId: z.string().optional(),
  audience: AudienceSchema.optional(),
  media: z
    .array(
      z.object({
        kind: MediaKindSchema,
        url: z.string(),
        // Alt text is required on images at publish time, not patched in later:
        // an inaccessible image that is already live is an inaccessible image.
        alt: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        fileName: z.string().optional(),
      }),
    )
    .default([])
    .superRefine((media, ctx) => {
      media.forEach((item, index) => {
        if (item.kind === "IMAGE" && !item.alt?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, "alt"],
            message: "נדרש טקסט חלופי לתמונה (נגישות)",
          });
        }
      });
    }),
});
export type CreatePost = z.infer<typeof CreatePostSchema>;
