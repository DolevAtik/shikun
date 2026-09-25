import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  EmployeeProgress,
  Mission,
  ProgressAct,
  ViewerScope,
  WorldActivity,
  WorldDetail,
  WorldFocus,
} from "@moch/contracts";
import type { Prisma } from "@prisma/client";
import { audienceWhere } from "../audience/audience";
import { PrismaService } from "../common/prisma/prisma.service";
import { BADGE_META } from "../home/badges";
import { jerusalemDay } from "../world/world-dates";
import { type Act, compute } from "./compute";
import { readMinutes, RULES, worldForChannel, xpForLevel } from "./rules";

const REGISTRABLE = ["EVENT", "TRAINING"] as const;

/**
 * The progression layer, derived on every request from rows that already
 * record what happened. There is no score column to drift out of truth:
 * cancel a registration and its XP is gone on the next read.
 */
@Injectable()
export class ProgressionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(viewer: ViewerScope): Promise<EmployeeProgress> {
    const now = new Date();
    const [acts, world, recognitions, department] = await Promise.all([
      this.actsFor([viewer.userId]),
      this.prisma.employeeWorld.findUnique({ where: { userId: viewer.userId }, select: { chosenWorld: true } }),
      this.recognitionsFor(viewer.userId),
      this.departmentQuest(viewer, now),
    ]);
    const mine = acts.get(viewer.userId) ?? [];
    const computed = compute(mine, now);
    const missions = await this.missionsFor(viewer, mine, now);
    const chosen = world?.chosenWorld;

    return {
      level: computed.level,
      stats: {
        acts: mine.length,
        achievements: computed.achievements.filter((item) => item.unlockedAt).length,
        streakDays: computed.streakDays,
        graceUsed: computed.graceUsed,
      },
      weekly: { filled: computed.weeklyFilled, total: RULES.weeklyTarget },
      missions,
      worlds: computed.worlds,
      achievements: computed.achievements,
      recognitions,
      department,
      unlocks: RULES.unlocks.map((unlock) => ({
        id: unlock.id,
        level: unlock.level,
        xpAt: xpForLevel(unlock.level),
        unlocked: computed.level.level >= unlock.level,
      })),
      chosenWorld: isWorld(chosen) ? chosen : null,
      rules: (Object.keys(RULES.xp) as ProgressAct[]).map((act) => ({ act, xp: RULES.xp[act] })),
    };
  }

  async world(viewer: ViewerScope, id: string): Promise<WorldDetail> {
    if (!isWorld(id)) throw new NotFoundException("העולם לא נמצא");
    const now = new Date();
    const acts = (await this.actsFor([viewer.userId])).get(viewer.userId) ?? [];
    const computed = compute(acts, now);
    const inWorld = acts.filter((act) => act.world === id).sort((a, b) => b.at.getTime() - a.at.getTime());

    const items = await this.prisma.contentItem.findMany({
      where: { id: { in: inWorld.map((act) => act.contentItemId) } },
      select: { id: true, title: true, event: { select: { startsAt: true } }, training: { select: { startsAt: true } } },
    });
    const byId = new Map(items.map((item) => [item.id, item]));

    const history: WorldActivity[] = inWorld.map((act) => {
      const item = byId.get(act.contentItemId);
      const startsAt = item?.event?.startsAt ?? item?.training?.startsAt ?? null;
      return {
        contentItemId: act.contentItemId,
        act: act.act,
        title: item?.title ?? "",
        xp: act.xp,
        at: act.at.toISOString(),
        startsAt: startsAt ? startsAt.toISOString() : null,
        cancellable: act.act !== "read" && startsAt !== null && startsAt > now,
      };
    });

    const opportunities = (await this.missionsFor(viewer, acts, now, 6)).filter((mission) => mission.world === id);

    return {
      world: computed.worlds.find((world) => world.id === id)!,
      history,
      opportunities,
      level: computed.level,
    };
  }

  async register(viewer: ViewerScope, contentItemId: string): Promise<EmployeeProgress> {
    const item = await this.prisma.contentItem.findFirst({
      where: {
        id: contentItemId,
        status: "PUBLISHED",
        kind: { in: [...REGISTRABLE] },
        ...(audienceWhere(viewer) as Prisma.ContentItemWhereInput),
      },
      select: {
        id: true,
        kind: true,
        event: { select: { startsAt: true, capacity: true } },
        training: { select: { startsAt: true, capacity: true } },
        _count: { select: { registrations: true } },
      },
    });
    // Outside the audience reads as absent, the same rule the feed follows.
    if (!item) throw new NotFoundException("הפריט לא נמצא");

    const detail = item.kind === "EVENT" ? item.event : item.training;
    if (!detail || detail.startsAt <= new Date()) throw new BadRequestException("ההרשמה נסגרה");

    const existing = await this.prisma.registration.findUnique({
      where: { userId_contentItemId: { userId: viewer.userId, contentItemId } },
    });
    if (!existing) {
      if (detail.capacity !== null && item._count.registrations >= detail.capacity) {
        throw new ConflictException("אין מקומות פנויים");
      }
      await this.prisma.registration.create({ data: { userId: viewer.userId, contentItemId } });
    }
    return this.get(viewer);
  }

  async unregister(viewer: ViewerScope, contentItemId: string): Promise<EmployeeProgress> {
    const item = await this.prisma.contentItem.findUnique({
      where: { id: contentItemId },
      select: { event: { select: { startsAt: true } }, training: { select: { startsAt: true } } },
    });
    const startsAt = item?.event?.startsAt ?? item?.training?.startsAt ?? null;
    if (startsAt && startsAt <= new Date()) throw new BadRequestException("אי אפשר לבטל אחרי שהמפגש התחיל");
    await this.prisma.registration.deleteMany({ where: { userId: viewer.userId, contentItemId } });
    return this.get(viewer);
  }

  private async actsFor(userIds: string[], since?: Date): Promise<Map<string, Act[]>> {
    const [reads, registrations] = await Promise.all([
      this.prisma.contentRead.findMany({
        where: { userId: { in: userIds }, contentItem: { kind: "FEED_POST" }, ...(since ? { readAt: { gte: since } } : {}) },
        select: {
          userId: true,
          contentItemId: true,
          readAt: true,
          contentItem: { select: { feedPost: { select: { channel: { select: { slug: true } } } } } },
        },
      }),
      this.prisma.registration.findMany({
        where: {
          userId: { in: userIds },
          contentItem: { kind: { in: [...REGISTRABLE] } },
          ...(since ? { createdAt: { gte: since } } : {}),
        },
        select: { userId: true, contentItemId: true, createdAt: true, contentItem: { select: { kind: true } } },
      }),
    ]);

    const byUser = new Map<string, Act[]>();
    const push = (userId: string, act: Act) => {
      const list = byUser.get(userId) ?? [];
      list.push(act);
      byUser.set(userId, list);
    };
    for (const read of reads) {
      push(read.userId, {
        contentItemId: read.contentItemId,
        act: "read",
        world: worldForChannel(read.contentItem.feedPost?.channel.slug ?? ""),
        xp: RULES.xp.read,
        at: read.readAt,
      });
    }
    for (const registration of registrations) {
      const act: ProgressAct = registration.contentItem.kind === "TRAINING" ? "training" : "event";
      push(registration.userId, {
        contentItemId: registration.contentItemId,
        act,
        world: RULES.actWorld[act],
        xp: RULES.xp[act],
        at: registration.createdAt,
      });
    }
    return byUser;
  }

  private async missionsFor(viewer: ViewerScope, acts: Act[], now: Date, perKind = 1): Promise<Mission[]> {
    const done = acts.map((act) => act.contentItemId);
    const visible = audienceWhere(viewer) as Prisma.ContentItemWhereInput;

    const [posts, trainings, events] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { kind: "FEED_POST", status: "PUBLISHED", id: { notIn: done }, ...visible },
        orderBy: { publishedAt: "desc" },
        take: Math.max(RULES.readMissions, perKind),
        select: {
          id: true,
          title: true,
          body: true,
          feedPost: { select: { channel: { select: { slug: true } } } },
        },
      }),
      this.prisma.contentItem.findMany({
        where: { kind: "TRAINING", status: "PUBLISHED", id: { notIn: done }, training: { startsAt: { gt: now } }, ...visible },
        orderBy: { training: { startsAt: "asc" } },
        take: perKind + 2,
        select: {
          id: true,
          title: true,
          training: { select: { startsAt: true, format: true, capacity: true } },
          _count: { select: { registrations: true } },
        },
      }),
      this.prisma.contentItem.findMany({
        where: { kind: "EVENT", status: "PUBLISHED", id: { notIn: done }, event: { startsAt: { gt: now } }, ...visible },
        orderBy: { event: { startsAt: "asc" } },
        take: perKind + 2,
        select: {
          id: true,
          title: true,
          event: { select: { startsAt: true, location: true, isOnline: true, capacity: true } },
          _count: { select: { registrations: true } },
        },
      }),
    ]);

    const seats = (capacity: number | null, taken: number) => (capacity === null ? null : Math.max(0, capacity - taken));

    const reads: Mission[] = posts.map((post) => ({
      id: `read:${post.id}`,
      act: "read",
      world: worldForChannel(post.feedPost?.channel.slug ?? ""),
      contentItemId: post.id,
      title: post.title ?? "",
      xp: RULES.xp.read,
      minutes: readMinutes(`${post.title ?? ""} ${post.body ?? ""}`),
      startsAt: null,
      place: null,
      seatsLeft: null,
    }));
    const trainingMissions: Mission[] = trainings
      .map((item) => ({ item, left: seats(item.training!.capacity, item._count.registrations) }))
      .filter(({ left }) => left === null || left > 0)
      .slice(0, perKind)
      .map(({ item, left }) => ({
        id: `training:${item.id}`,
        act: "training",
        world: RULES.actWorld.training,
        contentItemId: item.id,
        title: item.title ?? "",
        xp: RULES.xp.training,
        minutes: null,
        startsAt: item.training!.startsAt.toISOString(),
        place: item.training!.format,
        seatsLeft: left,
      }));
    const eventMissions: Mission[] = events
      .map((item) => ({ item, left: seats(item.event!.capacity, item._count.registrations) }))
      .filter(({ left }) => left === null || left > 0)
      .slice(0, perKind)
      .map(({ item, left }) => ({
        id: `event:${item.id}`,
        act: "event",
        world: RULES.actWorld.event,
        contentItemId: item.id,
        title: item.title ?? "",
        xp: RULES.xp.event,
        minutes: null,
        startsAt: item.event!.startsAt.toISOString(),
        place: item.event!.isOnline ? "ONLINE" : item.event!.location,
        seatsLeft: left,
      }));

    return [...reads, ...trainingMissions, ...eventMissions];
  }

  private async recognitionsFor(userId: string) {
    const rows = await this.prisma.recognition.findMany({
      where: { recipientId: userId },
      orderBy: { awardedAt: "desc" },
      take: 20,
      include: { giver: { select: { firstName: true, lastName: true, title: true } } },
    });
    return rows.map((row) => {
      const badge = BADGE_META[row.badge];
      return {
        id: row.id,
        badgeKey: row.badge,
        badgeNameHe: badge.nameHe,
        badgeNameEn: badge.nameEn,
        badgeColor: badge.color,
        reason: row.reason,
        giverName: row.giver ? `${row.giver.firstName} ${row.giver.lastName}` : null,
        giverTitle: row.giver?.title ?? null,
        awardedAt: row.awardedAt.toISOString(),
      };
    });
  }

  /** The whole department's XP this month. Counts only — never a name, never a rank. */
  private async departmentQuest(viewer: ViewerScope, now: Date): Promise<EmployeeProgress["department"]> {
    if (!viewer.departmentId) return null;
    const department = await this.prisma.department.findUnique({
      where: { id: viewer.departmentId },
      select: { nameHe: true, nameEn: true, users: { where: { isActive: true }, select: { id: true } } },
    });
    if (!department || department.users.length === 0) return null;

    const [year, month] = jerusalemDay(now).split("-").map(Number);
    const monthStart = new Date(Date.UTC(year!, month! - 1, 1));
    const daysInMonth = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
    const today = Number(jerusalemDay(now).slice(8, 10));

    const ids = department.users.map((user) => user.id);
    const acts = [...(await this.actsFor(ids, monthStart)).entries()];
    const all = acts.flatMap(([, list]) => list);
    const count = (act: ProgressAct) => all.filter((item) => item.act === act).length;

    return {
      nameHe: department.nameHe,
      nameEn: department.nameEn,
      earned: all.reduce((sum, act) => sum + act.xp, 0),
      target: RULES.departmentXpPerMember * ids.length,
      members: ids.length,
      daysLeft: daysInMonth - today + 1,
      reads: count("read"),
      trainings: count("training"),
      events: count("event"),
      mine: (acts.find(([id]) => id === viewer.userId)?.[1] ?? []).reduce((sum, act) => sum + act.xp, 0),
    };
  }
}

function isWorld(value: unknown): value is WorldFocus {
  return value === "know" || value === "feel" || value === "develop" || value === "participate";
}
