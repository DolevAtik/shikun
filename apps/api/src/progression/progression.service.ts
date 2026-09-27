import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AvatarBackdrop,
  AvatarOutfit,
  Booking,
  EmployeeProgress,
  Mission,
  MonthlyRecap,
  ProfileResult,
  ProgressAct,
  UpdateProfile,
  ViewerScope,
  WorldActivity,
  WorldDetail,
  WorldFocus,
} from "@moch/contracts";
import { ATTENDANCE_WINDOW_DAYS, PROFILE_BIO_MIN, ProgressActSchema } from "@moch/contracts";
import type { Prisma } from "@prisma/client";
import { audienceWhere } from "../audience/audience";
import { PrismaService } from "../common/prisma/prisma.service";
import { BADGE_META } from "../home/badges";
import { jerusalemDay } from "../world/world-dates";
import { type Act, anniversary, compute, departmentHistory, monthFloor, monthOf, monthsBack, recapCounts } from "./compute";
import { RecognitionService } from "./recognition.service";
import { readMinutes, RULES, worldForChannel, xpForLevel } from "./rules";

const REGISTRABLE = ["EVENT", "TRAINING"] as const;
const DAY_MS = 86_400_000;
/** Unread posts considered for read missions, before ranking by follows and focus. */
const POST_POOL = 30;
/** How far back the recap offers months. */
const RECAP_MONTHS = 12;

/**
 * The progression layer, derived on every request from rows that already
 * record what happened. There is no score column to drift out of truth:
 * cancel a registration, answer "I wasn't there", or clear a bio, and its XP
 * is gone on the next read.
 */
@Injectable()
export class ProgressionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recognition: RecognitionService,
  ) {}

  async get(viewer: ViewerScope): Promise<EmployeeProgress> {
    const now = new Date();
    const [acts, world, user, recognitions, giving, department, bookings] = await Promise.all([
      this.actsFor([viewer.userId]),
      this.prisma.employeeWorld.findUnique({
        where: { userId: viewer.userId },
        select: { chosenWorld: true, avatarBackdrop: true, avatarOutfit: true },
      }),
      this.prisma.user.findUnique({ where: { id: viewer.userId }, select: { startedAt: true, bio: true } }),
      this.recognitionsFor(viewer.userId),
      this.recognition.giving(viewer.userId, now),
      this.departmentQuest(viewer, now),
      this.bookingsFor(viewer.userId, now),
    ]);
    const mine = acts.get(viewer.userId) ?? [];
    const computed = compute(mine, now);
    const chosen = isWorld(world?.chosenWorld) ? world.chosenWorld : null;
    const profileComplete = bioCounts(user?.bio);
    const missions = await this.missionsFor(viewer, mine, now, { chosen, profileComplete });

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
      chosenWorld: chosen,
      rules: ProgressActSchema.options.map((act) => ({ act, xp: RULES.xp[act] })),
      bookings,
      giving,
      avatar: avatarStyle(world, computed.level.level),
      moment: anniversary(user?.startedAt ?? null, now),
      profileComplete,
    };
  }

  async world(viewer: ViewerScope, id: string): Promise<WorldDetail> {
    if (!isWorld(id)) throw new NotFoundException("העולם לא נמצא");
    const now = new Date();
    const [acts, user] = await Promise.all([
      this.actsFor([viewer.userId]),
      this.prisma.user.findUnique({ where: { id: viewer.userId }, select: { bio: true } }),
    ]);
    const mine = acts.get(viewer.userId) ?? [];
    const computed = compute(mine, now);
    const inWorld = mine.filter((act) => act.world === id).sort((a, b) => b.at.getTime() - a.at.getTime());

    const ids = inWorld.flatMap((act) => (act.contentItemId ? [act.contentItemId] : []));
    const items = await this.prisma.contentItem.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, event: { select: { startsAt: true } }, training: { select: { startsAt: true } } },
    });
    const byId = new Map(items.map((item) => [item.id, item]));

    const history: WorldActivity[] = inWorld.map((act) => {
      const item = act.contentItemId ? byId.get(act.contentItemId) : undefined;
      const startsAt = item?.event?.startsAt ?? item?.training?.startsAt ?? null;
      return {
        contentItemId: act.contentItemId,
        act: act.act,
        title: item?.title ?? "",
        xp: act.xp,
        at: act.at.toISOString(),
        startsAt: startsAt ? startsAt.toISOString() : null,
        cancellable: (act.act === "training" || act.act === "event") && startsAt !== null && startsAt > now,
      };
    });

    const opportunities = (
      await this.missionsFor(viewer, mine, now, { chosen: id, profileComplete: bioCounts(user?.bio), perKind: 6, world: id })
    ).filter((mission) => mission.world === id);

    return {
      world: computed.worlds.find((world) => world.id === id)!,
      history,
      opportunities,
      level: computed.level,
    };
  }

  async recap(viewer: ViewerScope, requested?: string): Promise<MonthlyRecap> {
    const now = new Date();
    const current = monthOf(now);
    const [acts, user, received, given] = await Promise.all([
      this.actsFor([viewer.userId]),
      this.prisma.user.findUnique({ where: { id: viewer.userId }, select: { createdAt: true } }),
      this.prisma.recognition.findMany({ where: { recipientId: viewer.userId }, select: { awardedAt: true } }),
      this.prisma.recognition.findMany({ where: { giverId: viewer.userId }, select: { awardedAt: true } }),
    ]);
    const mine = acts.get(viewer.userId) ?? [];

    // Months from the first sign of the employee here, up to this one.
    const earliest = [user?.createdAt, ...mine.map((act) => act.at), ...received.map((row) => row.awardedAt)]
      .filter((date): date is Date => date instanceof Date)
      .map(monthOf)
      .sort()[0];
    const months = monthsBack(current, RECAP_MONTHS)
      .filter((month) => !earliest || month >= earliest)
      .reverse();
    if (months.length === 0) months.push(current);

    if (requested && !months.includes(requested)) throw new NotFoundException("החודש לא זמין");
    const month = requested ?? current;

    const counts = recapCounts(mine, month, now);
    const inMonth = (rows: { awardedAt: Date }[]) => rows.filter((row) => monthOf(row.awardedAt) === month).length;
    return {
      month,
      ...counts,
      recognitionsReceived: inMonth(received),
      recognitionsGiven: inMonth(given),
      months,
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

  /**
   * "Were you there?" — answered by the employee once the session has started,
   * for a month after. The answer can change inside that window; a "yes" keeps
   * the moment it was first given, so the XP does not jump days.
   */
  async attendance(viewer: ViewerScope, contentItemId: string, attended: boolean): Promise<EmployeeProgress> {
    const registration = await this.prisma.registration.findUnique({
      where: { userId_contentItemId: { userId: viewer.userId, contentItemId } },
      select: {
        id: true,
        attended: true,
        attendanceAt: true,
        contentItem: { select: { event: { select: { startsAt: true } }, training: { select: { startsAt: true } } } },
      },
    });
    if (!registration) throw new NotFoundException("לא נמצאה הרשמה");
    const startsAt = registration.contentItem.event?.startsAt ?? registration.contentItem.training?.startsAt ?? null;
    const now = new Date();
    if (!startsAt || startsAt > now) throw new BadRequestException("המפגש עוד לא התחיל");
    if (now.getTime() - startsAt.getTime() > ATTENDANCE_WINDOW_DAYS * DAY_MS) {
      throw new BadRequestException("עבר הזמן לאישור השתתפות");
    }

    const keep = attended && registration.attended === true && registration.attendanceAt;
    await this.prisma.registration.update({
      where: { id: registration.id },
      data: { attended, attendanceAt: keep ? registration.attendanceAt : now },
    });
    return this.get(viewer);
  }

  /**
   * The bio and phone the employee writes about themselves. The first bio long
   * enough to introduce someone is an act; clearing it takes the act away.
   */
  async updateProfile(viewer: ViewerScope, input: UpdateProfile): Promise<ProfileResult> {
    const current = await this.prisma.user.findUnique({
      where: { id: viewer.userId },
      select: { profileCompletedAt: true },
    });
    const bio = input.bio ? input.bio : null;
    const phone = input.phone ? input.phone : null;
    const complete = bioCounts(bio);
    const firstTime = complete && !current?.profileCompletedAt;

    const saved = await this.prisma.user.update({
      where: { id: viewer.userId },
      data: {
        bio,
        phone,
        profileCompletedAt: complete ? (current?.profileCompletedAt ?? new Date()) : null,
      },
      select: { bio: true, phone: true },
    });
    return { ...saved, profileComplete: complete, xp: firstTime ? RULES.xp.profile : null };
  }

  /** Refuses an avatar choice the viewer's level has not opened yet. Saving is `WorldService`'s. */
  async assertAvatarOpen(
    viewer: ViewerScope,
    input: { avatarBackdrop?: AvatarBackdrop; avatarOutfit?: AvatarOutfit },
  ): Promise<void> {
    if (input.avatarBackdrop === undefined && input.avatarOutfit === undefined) return;
    const acts = (await this.actsFor([viewer.userId])).get(viewer.userId) ?? [];
    const level = compute(acts).level.level;
    const opens = (id: "backdrop" | "outfit") => RULES.unlocks.find((unlock) => unlock.id === id)!.level;
    if (input.avatarBackdrop !== undefined && level < opens("backdrop")) {
      throw new BadRequestException(`הרקע נפתח ברמה ${opens("backdrop")}`);
    }
    if (input.avatarOutfit !== undefined && level < opens("outfit")) {
      throw new BadRequestException(`הלבוש נפתח ברמה ${opens("outfit")}`);
    }
  }

  /**
   * Every act of these users, oldest to newest per user. With `since`, only
   * acts on or after it — a registration made earlier still counts its
   * attendance if that was confirmed after `since`.
   */
  async actsFor(userIds: string[], since?: Date): Promise<Map<string, Act[]>> {
    const [reads, registrations, profiles] = await Promise.all([
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
          ...(since ? { OR: [{ createdAt: { gte: since } }, { attendanceAt: { gte: since } }] } : {}),
        },
        select: {
          userId: true,
          contentItemId: true,
          createdAt: true,
          attended: true,
          attendanceAt: true,
          contentItem: { select: { kind: true } },
        },
      }),
      this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          profileCompletedAt: since ? { gte: since } : { not: null },
        },
        select: { id: true, bio: true, profileCompletedAt: true },
      }),
    ]);

    const byUser = new Map<string, Act[]>();
    const push = (userId: string, act: Act) => {
      if (since && act.at < since) return;
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
      const training = registration.contentItem.kind === "TRAINING";
      const act: ProgressAct = training ? "training" : "event";
      push(registration.userId, {
        contentItemId: registration.contentItemId,
        act,
        world: RULES.actWorld[act],
        xp: RULES.xp[act],
        at: registration.createdAt,
      });
      if (registration.attended === true && registration.attendanceAt) {
        const attended: ProgressAct = training ? "trainingAttended" : "eventAttended";
        push(registration.userId, {
          contentItemId: registration.contentItemId,
          act: attended,
          world: RULES.actWorld[attended],
          xp: RULES.xp[attended],
          at: registration.attendanceAt,
        });
      }
    }
    for (const profile of profiles) {
      if (!profile.profileCompletedAt || !bioCounts(profile.bio)) continue;
      push(profile.id, {
        contentItemId: null,
        act: "profile",
        world: RULES.actWorld.profile,
        xp: RULES.xp.profile,
        at: profile.profileCompletedAt,
      });
    }
    for (const list of byUser.values()) list.sort((a, b) => a.at.getTime() - b.at.getTime());
    return byUser;
  }

  /**
   * Sessions still ahead, and the ones just behind that wait for "were you
   * there?". The ones waiting come first: they are the only ones asking something.
   */
  private async bookingsFor(userId: string, now: Date): Promise<Booking[]> {
    const windowStart = new Date(now.getTime() - ATTENDANCE_WINDOW_DAYS * DAY_MS);
    const rows = await this.prisma.registration.findMany({
      where: {
        userId,
        contentItem: {
          kind: { in: [...REGISTRABLE] },
          OR: [{ event: { startsAt: { gte: windowStart } } }, { training: { startsAt: { gte: windowStart } } }],
        },
      },
      select: {
        attended: true,
        contentItem: {
          select: {
            id: true,
            kind: true,
            title: true,
            event: { select: { startsAt: true, endsAt: true, location: true, isOnline: true } },
            training: { select: { startsAt: true, format: true } },
          },
        },
      },
    });

    const bookings: Booking[] = [];
    for (const row of rows) {
      const item = row.contentItem;
      const training = item.kind === "TRAINING";
      const startsAt = training ? item.training?.startsAt : item.event?.startsAt;
      if (!startsAt) continue;
      const upcoming = startsAt > now;
      if (!upcoming && row.attended !== null) continue;
      bookings.push({
        contentItemId: item.id,
        act: training ? "training" : "event",
        world: RULES.actWorld[training ? "training" : "event"],
        title: item.title ?? "",
        startsAt: startsAt.toISOString(),
        endsAt: item.event?.endsAt ? item.event.endsAt.toISOString() : null,
        place: training ? (item.training?.format ?? null) : item.event?.isOnline ? "ONLINE" : (item.event?.location ?? null),
        status: upcoming ? "upcoming" : "confirm",
        attendXp: RULES.xp[training ? "trainingAttended" : "eventAttended"],
      });
    }
    return bookings.sort((a, b) =>
      a.status === b.status ? a.startsAt.localeCompare(b.startsAt) : a.status === "confirm" ? -1 : 1,
    );
  }

  private async missionsFor(
    viewer: ViewerScope,
    acts: Act[],
    now: Date,
    options: { chosen: WorldFocus | null; profileComplete: boolean; perKind?: number; world?: WorldFocus },
  ): Promise<Mission[]> {
    const perKind = options.perKind ?? 1;
    const done = acts.flatMap((act) => (act.contentItemId ? [act.contentItemId] : []));
    const visible = audienceWhere(viewer) as Prisma.ContentItemWhereInput;

    const [posts, follows, trainings, events] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { kind: "FEED_POST", status: "PUBLISHED", id: { notIn: done }, ...visible },
        orderBy: { publishedAt: "desc" },
        take: POST_POOL,
        select: {
          id: true,
          title: true,
          body: true,
          feedPost: { select: { channelId: true, channel: { select: { slug: true } } } },
        },
      }),
      this.prisma.follow.findMany({ where: { userId: viewer.userId }, select: { channelId: true } }),
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

    // A read mission prefers channels the employee follows, then the world they
    // chose, then the newest. The pool is already newest first, so the sort is stable on it.
    const followed = new Set(follows.map((follow) => follow.channelId));
    const ranked = posts
      .map((post, index) => {
        const world = worldForChannel(post.feedPost?.channel.slug ?? "");
        const score =
          (post.feedPost && followed.has(post.feedPost.channelId) ? 2 : 0) + (world === options.chosen ? 1 : 0);
        return { post, world, score, index };
      })
      .filter((entry) => !options.world || entry.world === options.world)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, Math.max(RULES.readMissions, perKind));

    const reads: Mission[] = ranked.map(({ post, world }) => ({
      id: `read:${post.id}`,
      act: "read",
      world,
      contentItemId: post.id,
      title: post.title ?? "",
      xp: RULES.xp.read,
      minutes: readMinutes(`${post.title ?? ""} ${post.body ?? ""}`),
      startsAt: null,
      place: null,
      seatsLeft: null,
    }));
    const profile: Mission[] = options.profileComplete
      ? []
      : [
          {
            id: "profile",
            act: "profile",
            world: RULES.actWorld.profile,
            contentItemId: null,
            // The screen writes the title; it is the same sentence for everyone.
            title: "",
            xp: RULES.xp.profile,
            minutes: 2,
            startsAt: null,
            place: null,
            seatsLeft: null,
          },
        ];
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

    return [...reads, ...profile, ...trainingMissions, ...eventMissions];
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

  /** The whole department's XP this month and the months before. Counts only — never a name, never a rank. */
  async departmentQuest(viewer: ViewerScope, now: Date): Promise<EmployeeProgress["department"]> {
    if (!viewer.departmentId) return null;
    const month = monthOf(now);
    const [department, reward] = await Promise.all([
      this.prisma.department.findUnique({
        where: { id: viewer.departmentId },
        select: { nameHe: true, nameEn: true, users: { where: { isActive: true }, select: { id: true } } },
      }),
      this.prisma.departmentQuestReward.findUnique({
        where: { departmentId_month: { departmentId: viewer.departmentId, month } },
        select: { reward: true },
      }),
    ]);
    if (!department || department.users.length === 0) return null;

    const [year, monthIndex] = month.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year!, monthIndex!, 0)).getUTCDate();
    const today = Number(jerusalemDay(now).slice(8, 10));

    const ids = department.users.map((user) => user.id);
    const target = RULES.departmentXpPerMember * ids.length;
    const first = monthsBack(month, RULES.departmentHistoryMonths + 1)[0]!;
    const byUser = await this.actsFor(ids, monthFloor(first));
    const all = [...byUser.values()].flat();
    const thisMonth = all.filter((act) => monthOf(act.at) === month);
    const count = (...kinds: ProgressAct[]) => thisMonth.filter((item) => kinds.includes(item.act)).length;
    const { history, reachedRun } = departmentHistory(all, month, target, RULES.departmentHistoryMonths);

    return {
      nameHe: department.nameHe,
      nameEn: department.nameEn,
      earned: thisMonth.reduce((sum, act) => sum + act.xp, 0),
      target,
      members: ids.length,
      daysLeft: daysInMonth - today + 1,
      reads: count("read"),
      trainings: count("training", "trainingAttended"),
      events: count("event", "eventAttended"),
      mine: (byUser.get(viewer.userId) ?? [])
        .filter((act) => monthOf(act.at) === month)
        .reduce((sum, act) => sum + act.xp, 0),
      history,
      reachedRun,
      reward: reward?.reward ?? null,
    };
  }
}

function isWorld(value: unknown): value is WorldFocus {
  return value === "know" || value === "feel" || value === "develop" || value === "participate";
}

function bioCounts(bio: string | null | undefined): boolean {
  return (bio ?? "").trim().length >= PROFILE_BIO_MIN;
}

/**
 * The stored look, but only what the level has opened: a choice made before a
 * level was lost (say, a registration cancelled) falls back to the default.
 */
function avatarStyle(
  world: { avatarBackdrop: string | null; avatarOutfit: string | null } | null,
  level: number,
): EmployeeProgress["avatar"] {
  const opens = (id: "backdrop" | "outfit") => RULES.unlocks.find((unlock) => unlock.id === id)!.level;
  const backdrop = RULES.avatar.backdrops.find((value) => value === world?.avatarBackdrop);
  const outfit = RULES.avatar.outfits.find((value) => value === world?.avatarOutfit);
  return {
    backdrop: backdrop && level >= opens("backdrop") ? backdrop : RULES.avatar.backdrops[0]!,
    outfit: outfit && level >= opens("outfit") ? outfit : RULES.avatar.outfits[0]!,
  };
}
