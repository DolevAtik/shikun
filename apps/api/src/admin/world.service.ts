import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AdminQuests, DashboardRange, ProgressAct, WorldMetrics } from "@moch/contracts";
import { hasPermission, ProgressActSchema } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { monthFloor, monthOf } from "../progression/compute";
import { ProgressionService } from "../progression/progression.service";
import { RULES } from "../progression/rules";
import { jerusalemDay, sundayOf } from "../world/world-dates";
import { AuditService } from "./audit.service";

const DAY_MS = 86_400_000;
const RANGE_DAYS: Record<DashboardRange, number> = { "7d": 7, "30d": 30, "90d": 90 };
/** A mission counts as done when its act follows the open within this long. */
const COMPLETION_WINDOW_MS = 7 * DAY_MS;
/** Clock skew between the browser's event time and the server's row time. */
const SKEW_MS = 60_000;
const RECOGNITION_WEEKS = 8;

/**
 * העולם שלי from the console: what each department gets for reaching its
 * monthly goal, and whether the screen changes what people do.
 *
 * Everything here is an aggregate. No figure is broken down by person.
 */
@Injectable()
export class AdminWorldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
    private readonly audit: AuditService,
  ) {}

  /** Departments the viewer may set a reward for: all of them with `users:manage`, else their own. */
  async quests(user: AuthenticatedUser, now = new Date()): Promise<AdminQuests> {
    const month = monthOf(now);
    const everyDepartment = hasPermission(user.roles, "users:manage");
    if (!everyDepartment && !user.scope.departmentId) return { month, items: [] };

    const departments = await this.prisma.department.findMany({
      where: everyDepartment ? {} : { id: user.scope.departmentId! },
      orderBy: { nameHe: "asc" },
      select: {
        id: true,
        nameHe: true,
        nameEn: true,
        users: { where: { isActive: true }, select: { id: true } },
        questRewards: {
          where: { month },
          select: { reward: true, setBy: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    const members = departments.flatMap((department) => department.users.map((member) => member.id));
    const acts = await this.progression.actsFor(members, monthFloor(month));
    const earnedBy = (ids: string[]) =>
      ids.reduce(
        (sum, id) => sum + (acts.get(id) ?? []).filter((act) => monthOf(act.at) === month).reduce((s, act) => s + act.xp, 0),
        0,
      );

    return {
      month,
      items: departments.map((department) => {
        const ids = department.users.map((member) => member.id);
        const reward = department.questRewards[0];
        return {
          departmentId: department.id,
          nameHe: department.nameHe,
          nameEn: department.nameEn,
          month,
          members: ids.length,
          earned: earnedBy(ids),
          target: RULES.departmentXpPerMember * ids.length,
          reward: reward?.reward ?? null,
          rewardSetBy: reward?.setBy ? `${reward.setBy.firstName} ${reward.setBy.lastName}` : null,
        };
      }),
    };
  }

  async setReward(user: AuthenticatedUser, departmentId: string, reward: string | null, now = new Date()): Promise<AdminQuests> {
    if (!hasPermission(user.roles, "users:manage") && user.scope.departmentId !== departmentId) {
      throw new ForbiddenException("אפשר לקבוע פרס רק למחלקה שלך");
    }
    const department = await this.prisma.department.findUnique({ where: { id: departmentId }, select: { nameHe: true } });
    if (!department) throw new NotFoundException("המחלקה לא נמצאה");

    const month = monthOf(now);
    const key = { departmentId_month: { departmentId, month } };
    const before = await this.prisma.departmentQuestReward.findUnique({ where: key, select: { reward: true } });
    const text = reward?.trim() ? reward.trim() : null;
    if (text) {
      await this.prisma.departmentQuestReward.upsert({
        where: key,
        create: { departmentId, month, reward: text, setById: user.id },
        update: { reward: text, setById: user.id },
      });
    } else {
      await this.prisma.departmentQuestReward.deleteMany({ where: { departmentId, month } });
    }

    await this.audit.record(user, {
      action: "quest.reward",
      entityType: "Department",
      entityId: departmentId,
      summary: text ? `פרס יעד חודשי ל${department.nameHe}: ${text}` : `הוסר פרס יעד חודשי ל${department.nameHe}`,
      before: { month, reward: before?.reward ?? null },
      after: { month, reward: text },
    });
    return this.quests(user, now);
  }

  async metrics(range: DashboardRange, now = new Date()): Promise<WorldMetrics> {
    const start = new Date(now.getTime() - RANGE_DAYS[range] * DAY_MS);

    const [views, opens, users, attendanceRows, recognitions] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { type: "screen.view", ts: { gte: start }, userId: { not: null } },
        select: { userId: true, ts: true, props: true },
      }),
      this.prisma.analyticsEvent.findMany({
        where: { type: "mission.open", ts: { gte: start }, userId: { not: null } },
        select: { userId: true, ts: true, entityId: true, props: true },
      }),
      this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, profileCompletedAt: true, world: { select: { chosenWorld: true } } },
      }),
      this.prisma.registration.findMany({
        where: {
          OR: [
            { contentItem: { event: { startsAt: { gte: start, lte: now } } } },
            { contentItem: { training: { startsAt: { gte: start, lte: now } } } },
          ],
        },
        select: { attended: true },
      }),
      this.prisma.recognition.findMany({
        where: { giverId: { not: null }, awardedAt: { gte: new Date(now.getTime() - RECOGNITION_WEEKS * 7 * DAY_MS) } },
        select: { giverId: true, awardedAt: true },
      }),
    ]);

    // Visits to העולם שלי, and who came back within a week of their first.
    const worldViews = new Map<string, Date[]>();
    const active = new Set<string>();
    for (const view of views) {
      active.add(view.userId!);
      const path = typeof (view.props as { path?: unknown } | null)?.path === "string" ? (view.props as { path: string }).path : "";
      if (!/\/my-world(\/|$)/.test(path)) continue;
      const list = worldViews.get(view.userId!) ?? [];
      list.push(view.ts);
      worldViews.set(view.userId!, list);
    }
    let returnBase = 0;
    let returned = 0;
    for (const list of worldViews.values()) {
      list.sort((a, b) => a.getTime() - b.getTime());
      const first = list[0]!;
      if (now.getTime() - first.getTime() < COMPLETION_WINDOW_MS) continue;
      returnBase += 1;
      const firstDay = jerusalemDay(first);
      if (list.some((ts) => jerusalemDay(ts) !== firstDay && ts.getTime() - first.getTime() <= COMPLETION_WINDOW_MS)) {
        returned += 1;
      }
    }

    // Everyone's acts in range: the funnel, the focus split, and the totals read the same list.
    const acts = await this.progression.actsFor(
      users.map((user) => user.id),
      start,
    );
    const totals = Object.fromEntries(ProgressActSchema.options.map((act) => [act, 0])) as Record<ProgressAct, number>;
    for (const list of acts.values()) for (const act of list) totals[act.act] += 1;

    let missionCompleted = 0;
    for (const open of opens) {
      const act = (open.props as { act?: unknown } | null)?.act;
      const done = (acts.get(open.userId!) ?? []).some((item) => {
        const delta = item.at.getTime() - open.ts.getTime();
        if (delta < -SKEW_MS || delta > COMPLETION_WINDOW_MS) return false;
        if (act === "profile") return item.act === "profile";
        return item.act === act && item.contentItemId === open.entityId;
      });
      if (done) missionCompleted += 1;
    }

    const focus = { withFocus: { users: 0, acts: 0 }, withoutFocus: { users: 0, acts: 0 } };
    for (const user of users) {
      if (!active.has(user.id)) continue;
      const group = user.world?.chosenWorld ? focus.withFocus : focus.withoutFocus;
      group.users += 1;
      group.acts += (acts.get(user.id) ?? []).length;
    }

    const attendance = { attended: 0, missed: 0, unanswered: 0 };
    for (const row of attendanceRows) {
      if (row.attended === true) attendance.attended += 1;
      else if (row.attended === false) attendance.missed += 1;
      else attendance.unanswered += 1;
    }

    const thisWeek = sundayOf(jerusalemDay(now));
    const weeks: string[] = [];
    for (let back = RECOGNITION_WEEKS - 1; back >= 0; back -= 1) {
      const date = new Date(`${thisWeek}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() - back * 7);
      weeks.push(date.toISOString().slice(0, 10));
    }
    const recognitionWeeks = weeks.map((week) => {
      const inWeek = recognitions.filter((row) => sundayOf(jerusalemDay(row.awardedAt)) === week);
      return { week, given: inWeek.length, givers: new Set(inWeek.map((row) => row.giverId)).size };
    });

    return {
      range,
      visitors: worldViews.size,
      returnBase,
      returned,
      missionOpens: opens.length,
      missionCompleted,
      focus,
      acts: totals,
      attendance,
      recognitionWeeks,
    };
  }
}
