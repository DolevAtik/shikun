import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminChannel,
  AdminCommentPage,
  AdminRecognitionPage,
  ListQuery,
} from "@moch/contracts";
import type { Prisma } from "@prisma/client";
import { skipTake, toPage } from "../common/pagination";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { BADGE_META } from "../home/badges";
import { AuditService } from "./audit.service";

/**
 * Community moderation: channels at a glance, and a removal path for comments
 * and colleague thank-yous that should not be on a Ministry platform.
 *
 * Removal deletes the row, and the audit entry keeps the removed text and the
 * moderator's reason. That entry is the evidence of what was moderated — the
 * one place an audit record carries more than changed fields, on purpose.
 */
@Injectable()
export class AdminCommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async channels(): Promise<AdminChannel[]> {
    const rows = await this.prisma.channel.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { posts: true, follows: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      nameHe: row.nameHe,
      nameEn: row.nameEn,
      descriptionHe: row.descriptionHe,
      color: row.color,
      isMandatory: row.isMandatory,
      postCount: row._count.posts,
      followerCount: row._count.follows,
    }));
  }

  async comments(query: ListQuery): Promise<AdminCommentPage> {
    const where: Prisma.CommentWhereInput = query.q
      ? {
          OR: [
            { body: { contains: query.q, mode: "insensitive" } },
            { author: { firstName: { contains: query.q, mode: "insensitive" } } },
            { author: { lastName: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {};
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.dir },
        include: {
          author: { select: { firstName: true, lastName: true, email: true } },
          contentItem: { select: { id: true, title: true } },
          _count: { select: { likes: true } },
        },
      }),
    ]);
    return toPage(
      rows.map((row) => ({
        id: row.id,
        body: row.body,
        authorName: `${row.author.firstName} ${row.author.lastName}`,
        authorEmail: row.author.email,
        postId: row.contentItem.id,
        postTitle: row.contentItem.title,
        createdAt: row.createdAt.toISOString(),
        likeCount: row._count.likes,
      })),
      total,
      query.page,
      query.pageSize,
    );
  }

  async removeComment(user: AuthenticatedUser, id: string, reason: string): Promise<void> {
    const row = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: { select: { email: true } } },
    });
    if (!row) throw new NotFoundException("התגובה לא נמצאה");
    await this.prisma.comment.delete({ where: { id } });
    await this.audit.record(user, {
      action: "community.comment.remove",
      entityType: "Comment",
      entityId: id,
      summary: `הוסרה תגובה של ${row.author.email}: ${reason}`,
      before: { body: row.body, authorEmail: row.author.email, postId: row.contentItemId },
      after: { reason },
    });
  }

  async recognitions(query: ListQuery): Promise<AdminRecognitionPage> {
    const where: Prisma.RecognitionWhereInput = query.q
      ? {
          OR: [
            { reason: { contains: query.q, mode: "insensitive" } },
            { recipient: { firstName: { contains: query.q, mode: "insensitive" } } },
            { recipient: { lastName: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {};
    const { skip, take } = skipTake(query.page, query.pageSize);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.recognition.count({ where }),
      this.prisma.recognition.findMany({
        where,
        skip,
        take,
        orderBy: { awardedAt: query.dir },
        include: {
          giver: { select: { firstName: true, lastName: true } },
          recipient: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);
    return toPage(
      rows.map((row) => ({
        id: row.id,
        giverName: row.giver ? `${row.giver.firstName} ${row.giver.lastName}` : null,
        recipientName: `${row.recipient.firstName} ${row.recipient.lastName}`,
        badge: BADGE_META[row.badge].nameHe,
        reason: row.reason,
        awardedAt: row.awardedAt.toISOString(),
      })),
      total,
      query.page,
      query.pageSize,
    );
  }

  async removeRecognition(user: AuthenticatedUser, id: string, reason: string): Promise<void> {
    const row = await this.prisma.recognition.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("ההוקרה לא נמצאה");
    await this.prisma.recognition.delete({ where: { id } });
    await this.audit.record(user, {
      action: "community.recognition.remove",
      entityType: "Recognition",
      entityId: id,
      summary: `הוסרה הוקרה: ${reason}`,
      before: {
        reason: row.reason,
        badge: row.badge,
        giverId: row.giverId,
        recipientId: row.recipientId,
      },
      after: { reason },
    });
  }
}
