import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  Audience,
  Channel,
  Comment,
  CreatePost,
  FeedPage,
  FeedPost,
  FeedQuery,
  ToggleResponse,
  ViewerScope,
} from "@moch/contracts";
import type { InteractionType, Prisma } from "@prisma/client";
import { audienceWhere } from "../audience/audience";
import { PrismaService } from "../common/prisma/prisma.service";
import { toUserSummary, USER_INCLUDE } from "../users/user.mapper";

const POST_INCLUDE = {
  feedPost: { include: { channel: true } },
  author: { include: USER_INCLUDE },
  district: true,
  media: { orderBy: { order: "asc" } },
  tags: true,
  _count: { select: { comments: true } },
} satisfies Prisma.ContentItemInclude;

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async listChannels(viewer: ViewerScope): Promise<Channel[]> {
    const channels = await this.prisma.channel.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: { select: { posts: true, follows: true } },
        follows: { where: { userId: viewer.userId }, select: { id: true } },
      },
    });

    return channels.map((channel) => ({
      id: channel.id,
      slug: channel.slug as Channel["slug"],
      nameHe: channel.nameHe,
      nameEn: channel.nameEn,
      descriptionHe: channel.descriptionHe,
      descriptionEn: channel.descriptionEn,
      icon: channel.icon,
      color: channel.color,
      postCount: channel._count.posts,
      followerCount: channel._count.follows,
      // Mandatory channels read as followed even without a Follow row — nobody
      // should have to opt in to Ministry-wide announcements.
      isFollowing: channel.isMandatory || channel.follows.length > 0,
      isMandatory: channel.isMandatory,
    }));
  }

  async setFollow(viewer: ViewerScope, slug: string, following: boolean): Promise<ToggleResponse> {
    const channel = await this.prisma.channel.findUnique({ where: { slug } });
    if (!channel) throw new NotFoundException("ערוץ לא נמצא");
    if (channel.isMandatory && !following) {
      throw new ForbiddenException("לא ניתן להסיר מעקב מערוץ חובה");
    }

    if (following) {
      await this.prisma.follow.upsert({
        where: { userId_channelId: { userId: viewer.userId, channelId: channel.id } },
        create: { userId: viewer.userId, channelId: channel.id },
        update: {},
      });
    } else {
      await this.prisma.follow.deleteMany({
        where: { userId: viewer.userId, channelId: channel.id },
      });
    }

    const count = await this.prisma.follow.count({ where: { channelId: channel.id } });
    return { active: following, count };
  }

  async getFeed(viewer: ViewerScope, query: FeedQuery): Promise<FeedPage> {
    const where = await this.buildWhere(viewer, query);

    const rows = await this.prisma.contentItem.findMany({
      where,
      include: POST_INCLUDE,
      // A unique tiebreaker after the sort key, or the cursor drifts when two
      // posts share a publish time.
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;

    const ids = page.map((row) => row.id);
    const [interactions, likeCounts] = await Promise.all([
      this.interactionsFor(viewer, ids),
      this.likeCountsFor(ids),
    ]);

    return {
      items: page.map((row) =>
        this.toFeedPost({ ...row, likeCount: likeCounts.get(row.id) ?? 0 }, interactions),
      ),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }

  /** One grouped query for the whole page's like counts, not one count per post. */
  private async likeCountsFor(contentIds: string[]): Promise<Map<string, number>> {
    if (contentIds.length === 0) return new Map();

    const rows = await this.prisma.interaction.groupBy({
      by: ["contentItemId"],
      where: { contentItemId: { in: contentIds }, type: "LIKE" },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.contentItemId, row._count._all]));
  }

  private async buildWhere(viewer: ViewerScope, query: FeedQuery): Promise<Prisma.ContentItemWhereInput> {
    const where: Prisma.ContentItemWhereInput = {
      kind: "FEED_POST",
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
      ...(audienceWhere(viewer) as Prisma.ContentItemWhereInput),
    };

    if (query.channel) {
      where.feedPost = { channel: { slug: query.channel } };
    }

    if (query.following) {
      const follows = await this.prisma.follow.findMany({
        where: { userId: viewer.userId },
        select: { channelId: true },
      });
      const mandatory = await this.prisma.channel.findMany({
        where: { isMandatory: true },
        select: { id: true },
      });
      const channelIds = [
        ...new Set([...follows.map((f) => f.channelId), ...mandatory.map((c) => c.id)]),
      ];
      where.feedPost = { ...(where.feedPost as object), channelId: { in: channelIds } };
    }

    if (query.bookmarked) {
      where.interactions = { some: { userId: viewer.userId, type: "BOOKMARK" } };
    }

    if (query.tag) {
      where.tags = { some: { slug: query.tag } };
    }

    if (query.districtId) {
      where.districtId = query.districtId;
    }

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { body: { contains: query.q, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /** One query for the viewer's likes and bookmarks across the page, not one per post. */
  private async interactionsFor(viewer: ViewerScope, contentIds: string[]) {
    if (contentIds.length === 0) return new Map<string, Set<InteractionType>>();

    const rows = await this.prisma.interaction.findMany({
      where: { userId: viewer.userId, contentItemId: { in: contentIds } },
      select: { contentItemId: true, type: true },
    });

    const map = new Map<string, Set<InteractionType>>();
    for (const row of rows) {
      const set = map.get(row.contentItemId) ?? new Set<InteractionType>();
      set.add(row.type);
      map.set(row.contentItemId, set);
    }
    return map;
  }

  private toFeedPost(
    row: Prisma.ContentItemGetPayload<{ include: typeof POST_INCLUDE }> & { likeCount?: number },
    interactions: Map<string, Set<InteractionType>>,
  ): FeedPost {
    const mine = interactions.get(row.id);
    const channel = row.feedPost!.channel;

    return {
      id: row.id,
      channel: {
        id: channel.id,
        slug: channel.slug as FeedPost["channel"]["slug"],
        nameHe: channel.nameHe,
        nameEn: channel.nameEn,
        color: channel.color,
      },
      title: row.title,
      body: row.body ?? "",
      excerpt: excerptOf(row.body ?? ""),
      author: row.author ? toUserSummary(row.author) : null,
      media: row.media.map((media) => ({
        id: media.id,
        kind: media.kind,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        alt: media.alt,
        fileName: media.fileName,
        sizeBytes: media.sizeBytes,
        width: media.width,
        height: media.height,
        durationSeconds: media.durationSeconds,
      })),
      tags: row.tags.map((tag) => ({ id: tag.id, slug: tag.slug, label: tag.label })),
      districtName: row.district?.nameHe ?? null,
      districtColor: row.district?.color ?? null,
      publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
      likeCount: row.likeCount ?? 0,
      commentCount: row._count.comments,
      isLiked: mine?.has("LIKE") ?? false,
      isBookmarked: mine?.has("BOOKMARK") ?? false,
    };
  }

  async getPost(viewer: ViewerScope, id: string): Promise<FeedPost> {
    const row = await this.prisma.contentItem.findFirst({
      where: {
        id,
        status: "PUBLISHED",
        ...(audienceWhere(viewer) as Prisma.ContentItemWhereInput),
      },
      include: POST_INCLUDE,
    });

    // A post the viewer's audience excludes is not "forbidden", it is absent.
    // Saying otherwise confirms the content exists, which is itself a leak.
    if (!row?.feedPost) throw new NotFoundException("הפוסט לא נמצא");

    const interactions = await this.interactionsFor(viewer, [row.id]);
    const likeCount = await this.prisma.interaction.count({
      where: { contentItemId: row.id, type: "LIKE" },
    });

    return this.toFeedPost({ ...row, likeCount }, interactions);
  }

  async toggleInteraction(
    viewer: ViewerScope,
    contentItemId: string,
    type: InteractionType,
  ): Promise<ToggleResponse> {
    const visible = await this.prisma.contentItem.findFirst({
      where: {
        id: contentItemId,
        status: "PUBLISHED",
        ...(audienceWhere(viewer) as Prisma.ContentItemWhereInput),
      },
      select: { id: true },
    });
    if (!visible) throw new NotFoundException("הפוסט לא נמצא");

    const existing = await this.prisma.interaction.findUnique({
      where: {
        userId_contentItemId_type: { userId: viewer.userId, contentItemId, type },
      },
    });

    if (existing) {
      await this.prisma.interaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.interaction.create({
        data: { userId: viewer.userId, contentItemId, type },
      });
    }

    const count = await this.prisma.interaction.count({ where: { contentItemId, type } });
    return { active: !existing, count };
  }

  /**
   * Publishing. Guarded by `content:publish` at the controller.
   *
   * A post with no audience is Ministry-wide. A MANAGER or DISTRICT_MANAGER who
   * omits an audience is silently scoped to their own district — a manager
   * cannot accidentally address the whole Ministry, which is the failure mode
   * that makes organizations turn publishing off entirely.
   */
  async createPost(viewer: ViewerScope, input: CreatePost): Promise<FeedPost> {
    const channel = await this.prisma.channel.findUnique({ where: { slug: input.channelSlug } });
    if (!channel) throw new NotFoundException("ערוץ לא נמצא");

    const audience = this.scopedAudience(viewer, input.audience);

    const tags = await Promise.all(
      input.tags.map((slug) =>
        this.prisma.tag.upsert({
          where: { slug },
          create: { slug, label: slug },
          update: {},
        }),
      ),
    );

    const created = await this.prisma.contentItem.create({
      data: {
        kind: "FEED_POST",
        status: "PUBLISHED",
        title: input.title ?? null,
        body: input.body,
        authorId: viewer.userId,
        districtId: input.districtId ?? null,
        publishedAt: new Date(),
        audDepartmentIds: audience.departmentIds,
        audDistrictIds: audience.districtIds,
        audOrganizationIds: audience.organizationIds,
        audRoles: audience.roles,
        feedPost: { create: { channelId: channel.id } },
        tags: { connect: tags.map((tag) => ({ id: tag.id })) },
        media: {
          create: input.media.map((item, index) => ({
            kind: item.kind,
            url: item.url,
            alt: item.alt ?? null,
            thumbnailUrl: item.thumbnailUrl ?? null,
            fileName: item.fileName ?? null,
            order: index,
          })),
        },
      },
      include: POST_INCLUDE,
    });

    return this.toFeedPost({ ...created, likeCount: 0 }, new Map());
  }

  private scopedAudience(viewer: ViewerScope, requested?: Audience): Audience {
    const audience: Audience = requested ?? {
      departmentIds: [],
      districtIds: [],
      organizationIds: [],
      roles: [],
    };

    const isMinistryWidePublisher = viewer.roles.some((role) =>
      ["ADMIN", "CONTENT_EDITOR", "EXECUTIVE", "HR"].includes(role),
    );

    if (!isMinistryWidePublisher && viewer.districtId && audience.districtIds.length === 0) {
      return { ...audience, districtIds: [viewer.districtId] };
    }

    return audience;
  }

  async listComments(viewer: ViewerScope, contentItemId: string): Promise<Comment[]> {
    await this.assertVisible(viewer, contentItemId);

    const rows = await this.prisma.comment.findMany({
      where: { contentItemId },
      include: {
        author: { include: USER_INCLUDE },
        _count: { select: { likes: true } },
        likes: { where: { userId: viewer.userId }, select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      postId: row.contentItemId,
      author: toUserSummary(row.author),
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      likeCount: row._count.likes,
      isLiked: row.likes.length > 0,
      isMine: row.authorId === viewer.userId,
    }));
  }

  async createComment(viewer: ViewerScope, contentItemId: string, body: string): Promise<Comment> {
    await this.assertVisible(viewer, contentItemId);

    const row = await this.prisma.comment.create({
      data: { contentItemId, authorId: viewer.userId, body },
      include: { author: { include: USER_INCLUDE } },
    });

    return {
      id: row.id,
      postId: row.contentItemId,
      author: toUserSummary(row.author),
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      likeCount: 0,
      isLiked: false,
      isMine: true,
    };
  }

  async deleteComment(viewer: ViewerScope, commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException("התגובה לא נמצאה");

    const canModerate = viewer.roles.some((role) =>
      ["ADMIN", "CONTENT_EDITOR"].includes(role),
    );
    if (comment.authorId !== viewer.userId && !canModerate) {
      throw new ForbiddenException("אין לך הרשאה למחוק תגובה זו");
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }

  private async assertVisible(viewer: ViewerScope, contentItemId: string): Promise<void> {
    const visible = await this.prisma.contentItem.findFirst({
      where: {
        id: contentItemId,
        status: "PUBLISHED",
        ...(audienceWhere(viewer) as Prisma.ContentItemWhereInput),
      },
      select: { id: true },
    });
    if (!visible) throw new NotFoundException("הפוסט לא נמצא");
  }
}

function excerptOf(body: string, max = 180): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trimEnd()}…`;
}
