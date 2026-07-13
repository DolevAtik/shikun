import { Injectable } from "@nestjs/common";
import type { HomeResponse, HomeSection, ViewerScope } from "@moch/contracts";
import type { HomeSectionConfig } from "@prisma/client";
import { audienceMatches, audienceWhere, toAudience } from "../audience/audience";
import { PrismaService } from "../common/prisma/prisma.service";
import { mapPool, TtlCache } from "../common/ttl-cache";
import { toUserSummary, USER_INCLUDE } from "../users/user.mapper";
import { BADGE_META } from "./badges";

/** Fallback item counts when a section config does not set its own. */
const DEFAULT_LIMITS: Record<string, number> = {
  ANNOUNCEMENTS: 4,
  EVENTS: 3,
  PROJECTS: 4,
  KEY_NUMBERS: 4,
  CAREERS: 3,
  TRAININGS: 3,
  BIRTHDAYS: 6,
  RECOGNITION: 3,
};

/** Home section layout is admin-edited rarely — cache the enabled rows briefly. */
const SECTION_CONFIG_TTL_MS = 30_000;

/** Cap parallel section queries so a morning login spike does not stampede Postgres. */
const SECTION_CONCURRENCY = 4;

@Injectable()
export class HomeService {
  private readonly sectionConfigCache = new TtlCache<HomeSectionConfig[]>(SECTION_CONFIG_TTL_MS);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * One request returns the whole of Home, already resolved against the viewer.
   *
   * Sections are rows, not code: an admin reorders Home by reordering
   * HomeSectionConfig, and the app picks it up without a release. Sections
   * themselves are audience-targeted too — a district manager can be shown a
   * section nobody else sees.
   */
  async getHome(viewer: ViewerScope, now = new Date()): Promise<HomeResponse> {
    const configs = await this.getEnabledSectionConfigs();

    const visible = configs.filter((config) => audienceMatches(toAudience(config), viewer));

    const sections = await mapPool(visible, SECTION_CONCURRENCY, (config) =>
      this.buildSection(config, viewer, now),
    );

    return {
      greeting: greetingFor(now),
      // A section that resolved to nothing is dropped rather than rendered
      // empty — an employee should never scroll past a box that says "none".
      sections: sections.filter((section): section is HomeSection => section !== null),
    };
  }

  private async getEnabledSectionConfigs(): Promise<HomeSectionConfig[]> {
    const cached = this.sectionConfigCache.get("enabled");
    if (cached) return cached;

    const configs = await this.prisma.homeSectionConfig.findMany({
      where: { isEnabled: true },
      orderBy: { order: "asc" },
    });
    this.sectionConfigCache.set("enabled", configs);
    return configs;
  }

  /** Called after an admin reorders or toggles sections so employees see the change. */
  invalidateSectionConfigCache(): void {
    this.sectionConfigCache.delete("enabled");
  }

  private async buildSection(
    config: HomeSectionConfig,
    viewer: ViewerScope,
    now: Date,
  ): Promise<HomeSection | null> {
    const base = { id: config.id, order: config.order, title: config.title };
    const limit = config.maxItems ?? DEFAULT_LIMITS[config.type] ?? 5;
    const visibleContent = { status: "PUBLISHED" as const, publishedAt: { lte: now }, ...audienceWhere(viewer) };

    switch (config.type) {
      case "GREETING":
        return { ...base, type: "GREETING", data: {} };

      case "EMERGENCY": {
        const rows = await this.prisma.contentItem.findMany({
          where: {
            kind: "ALERT",
            ...visibleContent,
            alert: { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          },
          include: { alert: true },
          orderBy: { publishedAt: "desc" },
          take: 3,
        });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "EMERGENCY",
          data: {
            alerts: rows.map((row) => ({
              id: row.id,
              severity: row.alert!.severity,
              title: row.title ?? "",
              body: row.body ?? "",
              publishedAt: iso(row.publishedAt),
              href: row.alert!.href,
            })),
          },
        };
      }

      case "ANNOUNCEMENTS": {
        const rows = await this.prisma.contentItem.findMany({
          where: { kind: "ANNOUNCEMENT", ...visibleContent },
          include: { announcement: true, author: { include: USER_INCLUDE }, district: true },
          orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
          take: limit,
        });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "ANNOUNCEMENTS",
          data: {
            items: rows.map((row) => ({
              id: row.id,
              title: row.title ?? "",
              summary: row.announcement?.summary ?? "",
              imageUrl: row.announcement?.imageUrl ?? null,
              isPinned: row.isPinned,
              publishedAt: iso(row.publishedAt),
              author: row.author ? toUserSummary(row.author) : null,
              districtName: row.district?.nameHe ?? null,
              districtColor: row.district?.color ?? null,
            })),
          },
        };
      }

      case "WEEKLY_SUMMARY": {
        const summary = await this.prisma.weeklySummary.findFirst({
          orderBy: { weekOf: "desc" },
        });
        if (!summary) return null;
        return {
          ...base,
          type: "WEEKLY_SUMMARY",
          data: {
            summary: {
              id: summary.id,
              weekOf: summary.weekOf.toISOString(),
              title: summary.title,
              teaser: summary.teaser,
              highlights: summary.highlights,
              href: `/weekly/${summary.id}`,
            },
          },
        };
      }

      case "EVENTS": {
        const rows = await this.prisma.contentItem.findMany({
          where: { kind: "EVENT", ...visibleContent, event: { startsAt: { gte: now } } },
          include: {
            event: true,
            _count: { select: { registrations: true } },
            registrations: { where: { userId: viewer.userId }, select: { id: true } },
          },
          orderBy: { event: { startsAt: "asc" } },
          take: limit,
        });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "EVENTS",
          data: {
            items: rows.map((row) => ({
              id: row.id,
              title: row.title ?? "",
              startsAt: row.event!.startsAt.toISOString(),
              endsAt: row.event!.endsAt?.toISOString() ?? null,
              location: row.event!.location,
              isOnline: row.event!.isOnline,
              imageUrl: row.event!.imageUrl,
              attendeeCount: row._count.registrations,
              isRegistered: row.registrations.length > 0,
            })),
          },
        };
      }

      case "CEO_MESSAGE": {
        const row = await this.prisma.contentItem.findFirst({
          where: { kind: "CEO_MESSAGE", ...visibleContent },
          include: { ceoMessage: true, author: { include: USER_INCLUDE } },
          orderBy: { publishedAt: "desc" },
        });
        if (!row?.author) return null;
        return {
          ...base,
          type: "CEO_MESSAGE",
          data: {
            message: {
              id: row.id,
              title: row.title ?? "",
              body: row.body ?? "",
              author: toUserSummary(row.author),
              publishedAt: iso(row.publishedAt),
              imageUrl: row.ceoMessage?.imageUrl ?? null,
              videoUrl: row.ceoMessage?.videoUrl ?? null,
            },
          },
        };
      }

      case "VIDEO_OF_WEEK": {
        const row = await this.prisma.contentItem.findFirst({
          where: { kind: "VIDEO", ...visibleContent, video: { isVideoOfWeek: true } },
          include: { video: true },
          orderBy: { publishedAt: "desc" },
        });
        if (!row?.video) return null;
        return {
          ...base,
          type: "VIDEO_OF_WEEK",
          data: {
            video: {
              id: row.id,
              title: row.title ?? "",
              description: row.body,
              videoUrl: row.video.videoUrl,
              thumbnailUrl: row.video.thumbnailUrl,
              durationSeconds: row.video.durationSeconds,
              viewCount: row.video.viewCount,
            },
          },
        };
      }

      case "PROJECTS": {
        // An employee cares about their own district first. Headquarters staff
        // have no district, so they see the Ministry-wide list in order.
        const rows = await this.prisma.project.findMany({
          where: viewer.districtId ? { districtId: viewer.districtId } : {},
          include: { district: true },
          orderBy: { order: "asc" },
          take: limit,
        });
        const items = rows.length > 0
          ? rows
          : await this.prisma.project.findMany({
              include: { district: true },
              orderBy: { order: "asc" },
              take: limit,
            });
        if (items.length === 0) return null;
        return {
          ...base,
          type: "PROJECTS",
          data: {
            items: items.map((project) => ({
              id: project.id,
              name: project.name,
              city: project.city,
              districtName: project.district.nameHe,
              districtColor: project.district.color,
              status: project.status,
              progress: project.progress,
              housingUnits: project.housingUnits,
              imageUrl: project.imageUrl,
            })),
          },
        };
      }

      case "KEY_NUMBERS": {
        const rows = await this.prisma.keyMetric.findMany({ orderBy: { order: "asc" }, take: limit });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "KEY_NUMBERS",
          data: {
            items: rows.map((metric) => ({
              id: metric.id,
              label: metric.label,
              value: metric.value,
              unit: metric.unit,
              changePct: metric.changePct,
              period: metric.period,
            })),
          },
        };
      }

      case "CAREERS": {
        const rows = await this.prisma.contentItem.findMany({
          where: {
            kind: "CAREER",
            ...visibleContent,
            career: { OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
          },
          include: { career: { include: { department: true } }, district: true },
          orderBy: { publishedAt: "desc" },
          take: limit,
        });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "CAREERS",
          data: {
            items: rows.map((row) => ({
              id: row.id,
              title: row.title ?? "",
              departmentName: row.career?.department?.nameHe ?? null,
              districtName: row.district?.nameHe ?? null,
              closesAt: row.career?.closesAt?.toISOString() ?? null,
              isInternal: row.career?.isInternal ?? true,
              href: row.career?.href ?? null,
            })),
          },
        };
      }

      case "TRAININGS": {
        const rows = await this.prisma.contentItem.findMany({
          where: { kind: "TRAINING", ...visibleContent, training: { startsAt: { gte: now } } },
          include: {
            training: true,
            _count: { select: { registrations: true } },
            registrations: { where: { userId: viewer.userId }, select: { id: true } },
          },
          orderBy: { training: { startsAt: "asc" } },
          take: limit,
        });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "TRAININGS",
          data: {
            items: rows.map((row) => ({
              id: row.id,
              title: row.title ?? "",
              startsAt: row.training!.startsAt.toISOString(),
              format: row.training!.format,
              seatsLeft:
                row.training!.capacity === null
                  ? null
                  : Math.max(0, row.training!.capacity - row._count.registrations),
              isRegistered: row.registrations.length > 0,
            })),
          },
        };
      }

      case "BIRTHDAYS": {
        const items = await this.upcomingBirthdays(now, limit);
        if (items.length === 0) return null;
        return { ...base, type: "BIRTHDAYS", data: { items } };
      }

      case "RECOGNITION": {
        const rows = await this.prisma.recognition.findMany({
          include: { recipient: { include: USER_INCLUDE } },
          orderBy: { awardedAt: "desc" },
          take: limit,
        });
        if (rows.length === 0) return null;
        return {
          ...base,
          type: "RECOGNITION",
          data: {
            items: rows.map((row) => ({
              id: row.id,
              recipient: toUserSummary(row.recipient),
              badge: BADGE_META[row.badge],
              reason: row.reason,
              awardedAt: row.awardedAt.toISOString(),
            })),
          },
        };
      }

      default:
        return null;
    }
  }

  /**
   * Birthdays in the next fortnight, wrapping across the end of the year.
   *
   * Computed in Node rather than SQL: the Ministry is a few thousand people, so
   * this is one small indexed read, and the day-of-year wrap is far easier to
   * get right — and to read — here than in a date expression.
   */
  private async upcomingBirthdays(now: Date, limit: number) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true, birthday: { not: null } },
      include: USER_INCLUDE,
    });

    const todayKey = monthDay(now);
    const withDistance = users
      .map((user) => {
        const key = monthDay(user.birthday!);
        return { user, key, distance: daysUntil(todayKey, key) };
      })
      .filter((entry) => entry.distance <= 14)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return withDistance.map((entry) => ({
      user: toUserSummary(entry.user),
      date: entry.key,
      isToday: entry.distance === 0,
    }));
  }
}

function iso(value: Date | null): string {
  return (value ?? new Date()).toISOString();
}

/** "MM-DD" — the year of birth is never read, so it is never rendered. */
function monthDay(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
}

function daysUntil(fromKey: string, toKey: string): number {
  const [fromMonth, fromDay] = fromKey.split("-").map(Number) as [number, number];
  const [toMonth, toDay] = toKey.split("-").map(Number) as [number, number];

  // A fixed non-leap reference year keeps the arithmetic stable; the 29th of
  // February collapses onto the 28th, which is what most systems do anyway.
  const reference = 2001;
  const from = Date.UTC(reference, fromMonth - 1, fromDay);
  let to = Date.UTC(reference, toMonth - 1, toDay);
  if (to < from) to = Date.UTC(reference + 1, toMonth - 1, toDay);

  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

function greetingFor(now: Date): "MORNING" | "AFTERNOON" | "EVENING" {
  const hour = now.getHours();
  if (hour < 12) return "MORNING";
  if (hour < 18) return "AFTERNOON";
  return "EVENING";
}
