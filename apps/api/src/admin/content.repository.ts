import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminContentDetail,
  AdminContentListItem,
  AdminContentListQuery,
  AdminContentPage,
  AdminSession,
  AdminSessionListQuery,
  AdminSessionPage,
  AdminSessionRegistrants,
  BulkContentAction,
  BulkResult,
  ContentKind,
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
      include: detailInclude,
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

    // Publishing with a future date is scheduling: the row is PUBLISHED and
    // employee queries (publishedAt <= now) keep it hidden until then.
    const status = input.publish ? "PUBLISHED" : "DRAFT";
    const publishedAt = input.publishedAt
      ? new Date(input.publishedAt)
      : status === "PUBLISHED"
        ? new Date()
        : null;

    const created = await this.prisma.contentItem.create({
      data: {
        kind: input.kind,
        status,
        title: input.title,
        body: input.body ?? null,
        authorId: user.id,
        districtId,
        isPinned: input.isPinned ?? false,
        publishedAt,
        audDepartmentIds: audience.departmentIds,
        audDistrictIds: audience.districtIds,
        audOrganizationIds: audience.organizationIds,
        audRoles: audience.roles,
        ...detailCreate(input),
      },
      include: detailInclude,
    });

    await this.audit.record(user, {
      action: "content.create",
      entityType: "ContentItem",
      entityId: created.id,
      summary: `נוצר ${labelKind(input.kind)}: ${input.title}`,
      after: { kind: input.kind, status, title: input.title, publishedAt: publishedAt?.toISOString() ?? null },
    });

    return toDetail(created);
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateAdminContent,
  ): Promise<AdminContentDetail> {
    const existing = await this.requireManageable(user, id);

    // Set explicitly so a change to detail fields alone still bumps the row —
    // and so the scoped updateMany below never runs with an empty `data`.
    const data: Prisma.ContentItemUncheckedUpdateManyInput = { updatedAt: new Date() };
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

    // The scoped write above is the authorization; detail rows follow it.
    await this.updateDetail(id, existing.kind, existing.title, input);

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

  /**
   * Events or trainings the viewer manages, with how many signed up and how
   * many said they came. Scoped exactly like the content list.
   */
  async sessions(
    user: AuthenticatedUser,
    query: AdminSessionListQuery,
    now = new Date(),
  ): Promise<AdminSessionPage> {
    const timing =
      query.when === "upcoming"
        ? { startsAt: { gte: now } }
        : query.when === "past"
          ? { startsAt: { lt: now } }
          : {};
    const where: Prisma.ContentItemWhereInput = {
      AND: [
        manageableWhere(user.scope) as Prisma.ContentItemWhereInput,
        { kind: query.kind, status: { not: "ARCHIVED" } },
        query.kind === "EVENT" ? { event: { is: timing } } : { training: { is: timing } },
        query.q ? { title: { contains: query.q, mode: "insensitive" } } : {},
      ],
    };
    const dir = query.when === "past" ? "desc" : "asc";
    const orderBy: Prisma.ContentItemOrderByWithRelationInput =
      query.kind === "EVENT" ? { event: { startsAt: dir } } : { training: { startsAt: dir } };

    const { skip, take } = skipTake(query.page, query.pageSize);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.contentItem.count({ where }),
      this.prisma.contentItem.findMany({ where, skip, take, orderBy, include: sessionInclude }),
    ]);

    const answers = await this.attendanceFor(rows.map((row) => row.id));
    return toPage(
      rows.map((row) => toSession(row, answers.get(row.id))),
      total,
      query.page,
      query.pageSize,
    );
  }

  /** Who signed up for one event or training, and what each said about attending. */
  async sessionRegistrants(user: AuthenticatedUser, id: string): Promise<AdminSessionRegistrants> {
    const row = await this.prisma.contentItem.findFirst({
      where: {
        id,
        kind: { in: ["EVENT", "TRAINING"] },
        ...(manageableWhere(user.scope) as Prisma.ContentItemWhereInput),
      },
      include: sessionInclude,
    });
    if (!row) throw new NotFoundException("המפגש לא נמצא");

    const registrations = await this.prisma.registration.findMany({
      where: { contentItemId: id },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: { select: { nameHe: true } },
            district: { select: { nameHe: true } },
          },
        },
      },
    });

    const answers = await this.attendanceFor([id]);
    return {
      session: toSession(row, answers.get(id)),
      items: registrations.map((registration) => ({
        userId: registration.user.id,
        fullName: `${registration.user.firstName} ${registration.user.lastName}`,
        email: registration.user.email,
        departmentName: registration.user.department?.nameHe ?? null,
        districtName: registration.user.district?.nameHe ?? null,
        registeredAt: registration.createdAt.toISOString(),
        attended: registration.attended,
      })),
    };
  }

  private async attendanceFor(
    ids: string[],
  ): Promise<Map<string, { attended: number; missed: number }>> {
    const result = new Map<string, { attended: number; missed: number }>();
    if (ids.length === 0) return result;
    const groups = await this.prisma.registration.groupBy({
      by: ["contentItemId", "attended"],
      where: { contentItemId: { in: ids }, attended: { not: null } },
      _count: { _all: true },
    });
    for (const group of groups) {
      const entry = result.get(group.contentItemId) ?? { attended: 0, missed: 0 };
      if (group.attended) entry.attended += group._count._all;
      else entry.missed += group._count._all;
      result.set(group.contentItemId, entry);
    }
    return result;
  }

  /** Writes the fields of the item's own detail table, and only those. */
  private async updateDetail(
    id: string,
    kind: ContentKind,
    title: string | null,
    input: UpdateAdminContent,
  ): Promise<void> {
    const defined = <T extends Record<string, unknown>>(value: T): Partial<T> =>
      Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
    const date = (value: string | null | undefined) =>
      value === undefined ? undefined : value === null ? null : new Date(value);
    const isEmpty = (value: object) => Object.keys(value).length === 0;

    switch (kind) {
      case "ANNOUNCEMENT": {
        const data = defined({
          summary: input.summary === undefined ? undefined : (input.summary ?? title ?? ""),
          imageUrl: input.imageUrl,
        });
        if (isEmpty(data)) return;
        await this.prisma.announcementDetail.upsert({
          where: { contentItemId: id },
          create: { contentItemId: id, summary: data.summary ?? title ?? "", imageUrl: data.imageUrl ?? null },
          update: data,
        });
        return;
      }
      case "FEED_POST": {
        if (!input.channelSlug) return;
        const channel = await this.prisma.channel.findUnique({ where: { slug: input.channelSlug } });
        if (!channel) throw new NotFoundException("ערוץ לא נמצא");
        await this.prisma.feedPostDetail.upsert({
          where: { contentItemId: id },
          create: { contentItemId: id, channelId: channel.id },
          update: { channelId: channel.id },
        });
        return;
      }
      case "CEO_MESSAGE": {
        const data = defined({ imageUrl: input.imageUrl, videoUrl: input.videoUrl });
        if (isEmpty(data)) return;
        await this.prisma.ceoMessageDetail.upsert({
          where: { contentItemId: id },
          create: { contentItemId: id, imageUrl: data.imageUrl ?? null, videoUrl: data.videoUrl ?? null },
          update: data,
        });
        return;
      }
      case "ALERT": {
        const data = defined({
          severity: input.severity,
          href: input.href,
          expiresAt: date(input.expiresAt),
        });
        if (isEmpty(data)) return;
        await this.prisma.alertDetail.upsert({
          where: { contentItemId: id },
          create: {
            contentItemId: id,
            severity: data.severity ?? "INFO",
            href: data.href ?? null,
            expiresAt: data.expiresAt ?? null,
          },
          update: data,
        });
        return;
      }
      case "EVENT": {
        const data = defined({
          startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
          endsAt: date(input.endsAt),
          location: input.location,
          isOnline: input.isOnline,
          imageUrl: input.imageUrl,
          capacity: input.capacity,
        });
        if (isEmpty(data)) return;
        await this.prisma.eventDetail.updateMany({ where: { contentItemId: id }, data });
        return;
      }
      case "TRAINING": {
        const data = defined({
          startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
          format: input.format,
          capacity: input.capacity,
        });
        if (isEmpty(data)) return;
        await this.prisma.trainingDetail.updateMany({ where: { contentItemId: id }, data });
        return;
      }
      case "CAREER": {
        const data = defined({
          departmentId: input.departmentId,
          isInternal: input.isInternal,
          href: input.href,
          closesAt: date(input.closesAt),
        });
        if (isEmpty(data)) return;
        await this.prisma.careerDetail.upsert({
          where: { contentItemId: id },
          create: {
            contentItemId: id,
            departmentId: data.departmentId ?? null,
            isInternal: data.isInternal ?? true,
            href: data.href ?? null,
            closesAt: data.closesAt ?? null,
          },
          update: data,
        });
        return;
      }
      case "VIDEO": {
        const data = defined({
          // A video without an address is not a video: a null keeps the old one.
          videoUrl: input.videoUrl || undefined,
          thumbnailUrl: input.thumbnailUrl,
          durationSeconds: input.durationSeconds,
          isVideoOfWeek: input.isVideoOfWeek,
        });
        if (isEmpty(data)) return;
        await this.prisma.videoDetail.updateMany({ where: { contentItemId: id }, data });
        return;
      }
    }
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

/** The nested create for the kind's own detail table. */
function detailCreate(
  input: CreateAdminContent,
): Pick<
  Prisma.ContentItemUncheckedCreateInput,
  "announcement" | "feedPost" | "ceoMessage" | "alert" | "event" | "training" | "career" | "video"
> {
  const date = (value: string | null | undefined) => (value ? new Date(value) : null);
  switch (input.kind) {
    case "ANNOUNCEMENT":
      return {
        announcement: {
          create: { summary: input.summary || input.title, imageUrl: input.imageUrl ?? null },
        },
      };
    case "FEED_POST":
      return {
        feedPost: {
          create: { channel: { connect: { slug: input.channelSlug ?? "organization" } } },
        },
      };
    case "CEO_MESSAGE":
      return {
        ceoMessage: {
          create: { imageUrl: input.imageUrl ?? null, videoUrl: input.videoUrl ?? null },
        },
      };
    case "ALERT":
      return {
        alert: {
          create: {
            severity: input.severity ?? "INFO",
            href: input.href ?? null,
            expiresAt: date(input.expiresAt),
          },
        },
      };
    case "EVENT":
      return {
        event: {
          create: {
            startsAt: new Date(input.startsAt!),
            endsAt: date(input.endsAt),
            location: input.location ?? null,
            isOnline: input.isOnline ?? false,
            imageUrl: input.imageUrl ?? null,
            capacity: input.capacity ?? null,
          },
        },
      };
    case "TRAINING":
      return {
        training: {
          create: {
            startsAt: new Date(input.startsAt!),
            format: input.format!,
            capacity: input.capacity ?? null,
          },
        },
      };
    case "CAREER":
      return {
        career: {
          create: {
            departmentId: input.departmentId ?? null,
            closesAt: date(input.closesAt),
            isInternal: input.isInternal ?? true,
            href: input.href ?? null,
          },
        },
      };
    case "VIDEO":
      return {
        video: {
          create: {
            videoUrl: input.videoUrl!,
            thumbnailUrl: input.thumbnailUrl ?? null,
            durationSeconds: input.durationSeconds ?? null,
            isVideoOfWeek: input.isVideoOfWeek ?? false,
          },
        },
      };
  }
}

const detailInclude = {
  author: { select: { id: true, firstName: true, lastName: true } },
  district: { select: { id: true, nameHe: true } },
  announcement: true,
  feedPost: { include: { channel: true } },
  ceoMessage: true,
  alert: true,
  event: true,
  training: true,
  career: true,
  video: true,
  _count: { select: { registrations: true } },
} as const;

type DetailRow = Prisma.ContentItemGetPayload<{ include: typeof detailInclude }>;

function toDetail(row: DetailRow): AdminContentDetail {
  const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    body: row.body,
    isPinned: row.isPinned,
    publishedAt: iso(row.publishedAt),
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
      row.announcement?.imageUrl ?? row.ceoMessage?.imageUrl ?? row.event?.imageUrl ?? null,
    channelSlug: row.feedPost?.channel?.slug ?? null,
    severity: row.alert?.severity ?? null,
    href: row.alert?.href ?? row.career?.href ?? null,
    expiresAt: iso(row.alert?.expiresAt),
    startsAt: iso(row.event?.startsAt ?? row.training?.startsAt),
    endsAt: iso(row.event?.endsAt),
    location: row.event?.location ?? null,
    isOnline: row.event?.isOnline ?? null,
    capacity: row.event?.capacity ?? row.training?.capacity ?? null,
    format: row.training?.format ?? null,
    departmentId: row.career?.departmentId ?? null,
    closesAt: iso(row.career?.closesAt),
    isInternal: row.career?.isInternal ?? null,
    videoUrl: row.video?.videoUrl ?? row.ceoMessage?.videoUrl ?? null,
    thumbnailUrl: row.video?.thumbnailUrl ?? null,
    durationSeconds: row.video?.durationSeconds ?? null,
    isVideoOfWeek: row.video?.isVideoOfWeek ?? null,
    registrationCount: row._count.registrations,
  };
}

const sessionInclude = {
  event: true,
  training: true,
  district: { select: { nameHe: true } },
  _count: { select: { registrations: true } },
} as const;

type SessionRow = Prisma.ContentItemGetPayload<{ include: typeof sessionInclude }>;

function toSession(row: SessionRow, answers?: { attended: number; missed: number }): AdminSession {
  const startsAt = row.event?.startsAt ?? row.training?.startsAt ?? row.createdAt;
  return {
    id: row.id,
    kind: row.kind === "TRAINING" ? "TRAINING" : "EVENT",
    title: row.title,
    status: row.status,
    startsAt: startsAt.toISOString(),
    endsAt: row.event?.endsAt?.toISOString() ?? null,
    location: row.event?.location ?? null,
    isOnline: row.event?.isOnline ?? null,
    format: row.training?.format ?? null,
    capacity: row.event?.capacity ?? row.training?.capacity ?? null,
    districtName: row.district?.nameHe ?? null,
    registrations: row._count.registrations,
    attended: answers?.attended ?? 0,
    missed: answers?.missed ?? 0,
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
