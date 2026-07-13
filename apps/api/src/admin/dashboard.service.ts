import { Injectable } from "@nestjs/common";
import type { AdminDashboard, DashboardRange, Stat } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";

const DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

/**
 * The Dashboard.
 *
 * Every number on this screen comes from a table that already holds real data.
 * The metrics the brief asks for that CANNOT be honestly computed today — daily
 * and monthly active users, most-*viewed* posts, unread announcements — are
 * returned with a null value and a `collectingSince` date, because nothing in
 * this platform has ever logged a page view and there is no history to show.
 *
 * The console says "collecting since <date>" and shows an empty state. It does
 * not show a plausible curve. A fabricated engagement chart in a government
 * executive dashboard is worse than an empty one, and it is the kind of thing
 * that gets found.
 *
 * Once `AnalyticsEvent` has been recording for a few weeks these tiles fill in
 * by themselves, and no screen has to change.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(range: DashboardRange): Promise<AdminDashboard> {
    const days = DAYS[range];
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // The equivalent window immediately before this one, for the % delta.
    const previousSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      headcount,
      newEmployees,
      newEmployeesPrevious,
      commentsNow,
      commentsPrevious,
      likesNow,
      likesPrevious,
      registrationsNow,
      registrationsPrevious,
      pendingReview,
      contentByStatus,
      communityActivity,
      topContent,
      topDistricts,
      topDepartments,
      upcomingEvents,
      recentActivity,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { startedAt: { gte: since } } }),
      this.prisma.user.count({ where: { startedAt: { gte: previousSince, lt: since } } }),

      this.prisma.comment.count({ where: { createdAt: { gte: since } } }),
      this.prisma.comment.count({ where: { createdAt: { gte: previousSince, lt: since } } }),

      this.prisma.interaction.count({ where: { type: "LIKE", createdAt: { gte: since } } }),
      this.prisma.interaction.count({
        where: { type: "LIKE", createdAt: { gte: previousSince, lt: since } },
      }),

      this.prisma.registration.count({ where: { createdAt: { gte: since } } }),
      this.prisma.registration.count({
        where: { createdAt: { gte: previousSince, lt: since } },
      }),

      this.prisma.contentItem.count({ where: { status: "PENDING" } }),

      this.prisma.contentItem.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),

      this.prisma.$queryRaw<{ date: Date; value: bigint }[]>`
        SELECT d::date AS date, COUNT(c.id) AS value
        FROM generate_series(${since}::date, ${now}::date, '1 day') AS d
        LEFT JOIN "Comment" c ON c."createdAt"::date = d::date
        GROUP BY d ORDER BY d ASC
      `,

      this.prisma.contentItem.findMany({
        where: { status: "PUBLISHED", publishedAt: { gte: since } },
        select: {
          id: true,
          title: true,
          kind: true,
          _count: { select: { comments: true, interactions: true } },
        },
        orderBy: { comments: { _count: "desc" } },
        take: 5,
      }),

      this.prisma.$queryRaw<{ id: string; name: string; color: string; score: bigint }[]>`
        SELECT d.id, d."nameHe" AS name, d.color, COUNT(*) AS score
        FROM "Interaction" i
        JOIN "User" u ON u.id = i."userId"
        JOIN "District" d ON d.id = u."districtId"
        WHERE i."createdAt" >= ${since}
        GROUP BY d.id, d."nameHe", d.color
        ORDER BY score DESC LIMIT 5
      `,

      this.prisma.$queryRaw<{ id: string; name: string; score: bigint }[]>`
        SELECT dep.id, dep."nameHe" AS name, COUNT(*) AS score
        FROM "Interaction" i
        JOIN "User" u ON u.id = i."userId"
        JOIN "Department" dep ON dep.id = u."departmentId"
        WHERE i."createdAt" >= ${since}
        GROUP BY dep.id, dep."nameHe"
        ORDER BY score DESC LIMIT 5
      `,

      this.prisma.contentItem.findMany({
        where: { kind: "EVENT", status: "PUBLISHED", event: { startsAt: { gte: now } } },
        select: {
          id: true,
          title: true,
          event: { select: { startsAt: true, location: true, capacity: true } },
          _count: { select: { registrations: true } },
        },
        orderBy: { event: { startsAt: "asc" } },
        take: 5,
      }),

      // The activity feed reads the audit log, which starts recording today. On
      // day one it is empty, and that is honest — it is not backfilled.
      this.prisma.auditLog.findMany({
        select: { id: true, action: true, actorEmail: true, summary: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // The real answer to "since when have we been counting?" — the oldest event
    // we actually hold, not a constant someone forgot to update. Null means we
    // have not started, and the tile says exactly that rather than showing a zero.
    const firstEvent = await this.prisma.analyticsEvent.findFirst({
      select: { ts: true },
      orderBy: { ts: "asc" },
    });
    const collectingSince = firstEvent ? firstEvent.ts.toISOString().slice(0, 10) : null;

    const stats: Stat[] = [
      stat("headcount", headcount),
      stat("newEmployees", newEmployees, newEmployeesPrevious),
      stat("comments", commentsNow, commentsPrevious),
      stat("likes", likesNow, likesPrevious),
      stat("registrations", registrationsNow, registrationsPrevious),
      stat("pendingReview", pendingReview),

      // Not yet measurable. See the class comment.
      pending("dau", collectingSince),
      pending("mau", collectingSince),
      pending("unreadAnnouncements", collectingSince),
    ];

    return {
      range,
      stats,
      communityActivity: communityActivity.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        value: Number(row.value),
      })),
      contentByStatus: contentByStatus.map((row) => {
        const count = row._count as { _all: number };
        return { status: row.status, count: count._all };
      }),
      topContent: topContent.map((item) => ({
        id: item.id,
        title: item.title ?? "—",
        kind: item.kind,
        comments: item._count.comments,
        likes: item._count.interactions,
      })),
      topDistricts: topDistricts.map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color,
        score: Number(row.score),
      })),
      topDepartments: topDepartments.map((row) => ({
        id: row.id,
        name: row.name,
        color: null,
        score: Number(row.score),
      })),
      upcomingEvents: upcomingEvents.map((item) => ({
        id: item.id,
        title: item.title ?? "—",
        startsAt: item.event!.startsAt.toISOString(),
        location: item.event!.location,
        registrations: item._count.registrations,
        capacity: item.event!.capacity,
      })),
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        action: entry.action,
        actor: entry.actorEmail,
        summary: entry.summary,
        at: entry.createdAt.toISOString(),
      })),
    };
  }
}

function stat(key: string, value: number, previous?: number): Stat {
  return {
    key,
    value,
    // A jump from zero is not "infinity percent"; it is not a percentage at all.
    changePct:
      previous === undefined || previous === 0
        ? null
        : Math.round(((value - previous) / previous) * 100),
    collectingSince: null,
  };
}

/**
 * A metric we cannot answer yet, and say so.
 *
 * `collectingSince` is the date of the oldest telemetry we actually hold — so
 * the Dashboard can say "collecting since 13.07.2026" and mean it. Null means
 * collection has not started at all.
 */
function pending(key: string, collectingSince: string | null): Stat {
  return { key, value: null, changePct: null, collectingSince };
}
