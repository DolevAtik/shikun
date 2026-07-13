import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminContentDetail,
  AdminContentListItem,
  AdminContentListQuery,
  AdminContentPage,
  BulkContentAction,
  BulkResult,
  CreateAdminContent,
  UpdateAdminContent,
} from "@moch/contracts";
import type { ContentItem, Prisma } from "@prisma/client";
import { manageableWhere } from "../audience/manageable";
import { toPage, skipTake } from "../common/pagination";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { AuditService } from "./audit.service";

/**
 * The single door to ContentItem from the admin namespace.
 *
 * Every read ANDs `manageableWhere`. Every write uses `updateMany` with the id
 * AND the scope filter and asserts `count === 1`, so "not yours" and "not found"
 * look the same — the same information-leak discipline FeedService already uses.
 *
 * `scripts/check-admin-scope.mjs` bans raw `prisma.contentItem` outside this file.
 */
@Injectable()
export class AdminContentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, query: AdminContentListQuery): Promise<AdminContentPage> {
    const where: Prisma.ContentItemWhereInput = {
      AND: [
        manageableWhere(user.scope) as Prisma.ContentItemWhereInput,
        {
          ...(query.kind?.length ? { kind: { in: query.kind } } : {}),
          ...(query.status?.length ? { status: { in: query.status } } : {}),
          ...(query.districtId ? { districtId: query.districtId } : {}),
          ...(query.q
            ? {
                OR: [
                  { title: { contains: query.q, mode: "insensitive" } },
                  { body: { contains: query.q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
      ],
    };

    const { skip, take } = skipTake(query.page, query.pageSize);
    const orderBy = orderFor(query.sort, query.dir);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.contentItem.count({ where }),
      this.prisma.contentItem.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          kind: true,
          status: true,
          title: true,
          isPinned: true,
          publishedAt: true,
          updatedAt: true,
          author: { select: { firstName: true, lastName: true } },
          district: { select: { nameHe: true, color: true } },
        },
      }),
    ]);

    return toPage(
      rows.map(
        (row): AdminContentListItem => ({
          id: row.id,
          kind: row.kind,
          status: row.status,
          title: row.title,
          isPinned: row.isPinned,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          updatedAt: row.updatedAt.toISOString(),
          authorName: row.author ? `${row.author.firstName} ${row.author.lastName}` : null,
          districtName: row.district?.nameHe ?? null,
          districtColor: row.district?.color ?? null,
        }),
      ),
      total,
      query.page,
      query.pageSize,
    );
  }

  async get(user: AuthenticatedUser, id: string): Promise<AdminContentDetail> {
    const row = await this.prisma.contentItem.findFirst({
      where: { id, ...(manageableWhere(user.scope) as Prisma.ContentItemWhereInput) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        district: { select: { id: true, nameHe: true } },
        announcement: true,
        feedPost: { include: { channel: true } },
        ceoMessage: true,
        alert: true,
      },
    });
    if (!row) throw new NotFoundException("התוכן לא נמצא");
    return toDetail(row);
  }

  async create(user: AuthenticatedUser, input: CreateAdminContent): Promise<AdminContentDetail> {
    const audience = input.audience ?? {
      departmentIds: [],
      districtIds: [],
      organizationIds: [],
      roles: [],
    };

    // District managers writing without an explicit district inherit theirs —
    // otherwise the item would be ministry-wide and immediately unmanageable by them.
    const districtId =
      input.districtId !== undefined
        ? input.districtId
        : user.scope.districtId;

    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    const status = publishedAt && publishedAt <= new Date() ? "PUBLISHED" : "DRAFT";

    const created = await this.prisma.contentItem.create({
      data: {
        kind: input.kind,
        status,
        title: input.title,
        body: input.body ?? null,
        authorId: user.id,
        districtId,
        publishedAt: status === "PUBLISHED" ? publishedAt ?? new Date() : publishedAt,
        audDepartmentIds: audience.departmentIds,
        audDistrictIds: audience.districtIds,
        audOrganizationIds: audience.organizationIds,
        audRoles: audience.roles,
        ...(input.kind === "ANNOUNCEMENT"
          ? {
              announcement: {
                create: { summary: input.summary ?? input.title, imageUrl: null },
              },
            }
          : {}),
        ...(input.kind === "FEED_POST" && input.channelSlug
          ? {
              feedPost: {
                create: {
                  channel: { connect: { slug: input.channelSlug } },
                },
              },
            }
          : {}),
        ...(input.kind === "CEO_MESSAGE"
          ? { ceoMessage: { create: { imageUrl: null, videoUrl: null } } }
          : {}),
        ...(input.kind === "ALERT"
          ? {
              alert: {
                create: { severity: "INFO", href: null, expiresAt: null },
              },
            }
          : {}),
      },
      include: detailInclude,
    });

    await this.audit.record(user, {
      action: "content.create",
      entityType: "ContentItem",
      entityId: created.id,
      summary: `נוצר ${labelKind(input.kind)}: ${input.title}`,
      after: { kind: input.kind, status, title: input.title },
    });

    return toDetail(created);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateAdminContent,
  ): Promise<AdminContentDetail> {
    const existing = await this.requireManageable(user, id);

    const data: Prisma.ContentItemUncheckedUpdateManyInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.body !== undefined) data.body = input.body;
    if (input.districtId !== undefined) data.districtId = input.districtId;
    if (input.isPinned !== undefined) data.isPinned = input.isPinned;
    if (input.publishedAt !== undefined) {
      data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    }
    if (input.audience) {
      data.audDepartmentIds = input.audience.departmentIds;
      data.audDistrictIds = input.audience.districtIds;
      data.audOrganizationIds = input.audience.organizationIds;
      data.audRoles = input.audience.roles;
    }

    const result = await this.prisma.contentItem.updateMany({
      where: { id, ...(manageableWhere(user.scope) as Prisma.ContentItemWhereInput) },
      data,
    });
    if (result.count !== 1) throw new NotFoundException("התוכן לא נמצא");

    if (input.summary !== undefined && existing.kind === "ANNOUNCEMENT") {
      await this.prisma.announcementDetail.update({
        where: { contentItemId: id },
        data: { summary: input.summary ?? existing.title ?? "" },
      });
    }

    await this.audit.record(user, {
      action: "content.update",
      entityType: "ContentItem",
      entityId: id,
      summary: `עודכן: ${input.title ?? existing.title ?? id}`,
      before: { title: existing.title, status: existing.status },
      after: input,
    });

    return this.get(user, id);
  }

  async setStatus(
    user: AuthenticatedUser,
    id: string,
    status: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "PENDING",
  ): Promise<AdminContentDetail> {
    const existing = await this.requireManageable(user, id);
    const publishedAt =
      status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt;

    const result = await this.prisma.contentItem.updateMany({
      where: { id, ...(manageableWhere(user.scope) as Prisma.ContentItemWhereInput) },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? publishedAt : existing.publishedAt,
      },
    });
    if (result.count !== 1) throw new NotFoundException("התוכן לא נמצא");

    await this.audit.record(user, {
      action: `content.${status.toLowerCase()}`,
      entityType: "ContentItem",
      entityId: id,
      summary: `${statusLabel(status)}: ${existing.title ?? id}`,
      before: { status: existing.status },
      after: { status },
    });

    return this.get(user, id);
  }

  async bulk(user: AuthenticatedUser, input: BulkContentAction): Promise<BulkResult> {
    const succeeded: string[] = [];
    const failed: { id: string; reason: string }[] = [];

    for (const id of input.ids) {
      try {
        switch (input.action) {
          case "archive":
            await this.setStatus(user, id, "ARCHIVED");
            break;
          case "publish":
            await this.setStatus(user, id, "PUBLISHED");
            break;
          case "unpublish":
            await this.setStatus(user, id, "DRAFT");
            break;
          case "pin":
            await this.update(user, id, { isPinned: true });
            break;
          case "unpin":
            await this.update(user, id, { isPinned: false });
            break;
        }
        succeeded.push(id);
      } catch {
        failed.push({ id, reason: "אין הרשאה או שהפריט לא נמצא" });
      }
    }

    return { succeeded, failed };
  }

  private async requireManageable(
    user: AuthenticatedUser,
    id: string,
  ): Promise<Pick<ContentItem, "id" | "kind" | "title" | "status" | "publishedAt">> {
    const row = await this.prisma.contentItem.findFirst({
      where: { id, ...(manageableWhere(user.scope) as Prisma.ContentItemWhereInput) },
      select: { id: true, kind: true, title: true, status: true, publishedAt: true },
    });
    if (!row) throw new NotFoundException("התוכן לא נמצא");
    return row;
  }
}

const detailInclude = {
  author: { select: { id: true, firstName: true, lastName: true } },
  district: { select: { id: true, nameHe: true } },
  announcement: true,
  feedPost: { include: { channel: true } },
  ceoMessage: true,
  alert: true,
} as const;

type DetailRow = Prisma.ContentItemGetPayload<{ include: typeof detailInclude }>;

function toDetail(row: DetailRow): AdminContentDetail {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    body: row.body,
    isPinned: row.isPinned,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    authorId: row.author?.id ?? null,
    authorName: row.author ? `${row.author.firstName} ${row.author.lastName}` : null,
    districtId: row.district?.id ?? null,
    districtName: row.district?.nameHe ?? null,
    audience: {
      departmentIds: row.audDepartmentIds,
      districtIds: row.audDistrictIds,
      organizationIds: row.audOrganizationIds,
      roles: row.audRoles,
    },
    summary: row.announcement?.summary ?? null,
    imageUrl:
      row.announcement?.imageUrl ??
      row.ceoMessage?.imageUrl ??
      row.alert?.href ??
      null,
    channelSlug: row.feedPost?.channel?.slug ?? null,
  };
}

function orderFor(
  sort: AdminContentListQuery["sort"],
  dir: "asc" | "desc",
): Prisma.ContentItemOrderByWithRelationInput {
  switch (sort) {
    case "title":
      return { title: dir };
    case "publishedAt":
      return { publishedAt: dir };
    case "createdAt":
      return { createdAt: dir };
    default:
      return { updatedAt: dir };
  }
}

function labelKind(kind: string): string {
  const labels: Record<string, string> = {
    ANNOUNCEMENT: "הודעה",
    FEED_POST: "פוסט",
    EVENT: "אירוע",
    CAREER: "משרה",
    TRAINING: "הדרכה",
    CEO_MESSAGE: "מסר מנכ״ל",
    VIDEO: "וידאו",
    ALERT: "התראה",
  };
  return labels[kind] ?? kind;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PUBLISHED: "פורסם",
    DRAFT: "הוחזר לטיוטה",
    ARCHIVED: "הועבר לארכיון",
    PENDING: "נשלח לאישור",
  };
  return labels[status] ?? status;
}
