import { Injectable } from "@nestjs/common";
import type { EmployeeWorld, UpdateEmployeeWorld, WorldFocus } from "@moch/contracts";
import type { EmployeeWorld as EmployeeWorldRow } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import { dayToDate, daysBetween, jerusalemDay, sundayOf } from "./world-dates";

const WEEKLY_TOTAL = 3;
const STAMP_XP = 20;

const EMPTY: EmployeeWorld = {
  chosenWorld: null,
  streakDays: 3,
  graceAvailable: true,
  weeklyFilled: 2,
  weeklyTotal: WEEKLY_TOTAL,
  endowed: false,
  bonusXp: 0,
  pulsePending: false,
};

@Injectable()
export class WorldService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<EmployeeWorld> {
    const row = await this.prisma.employeeWorld.findUnique({ where: { userId } });
    if (!row) return EMPTY;
    const settled = await this.settle(row);
    return this.toView(settled);
  }

  async update(userId: string, input: UpdateEmployeeWorld): Promise<EmployeeWorld> {
    const today = jerusalemDay();
    const existing = await this.prisma.employeeWorld.findUnique({ where: { userId } });
    const base = existing ?? (await this.create(userId, today));
    const settled = await this.settle(base);

    const chosen =
      input.chosenWorld === undefined ? settled.chosenWorld : input.chosenWorld;
    const pulsePending = input.pulseSeen ? false : settled.pulsePending;

    const saved = await this.prisma.employeeWorld.update({
      where: { userId },
      data: { chosenWorld: chosen, pulsePending },
    });
    return this.toView(saved);
  }

  /**
   * A new full read of a post. Opening the feed, a like, and a second read of
   * the same post grant nothing. The first read of a post fills one stamp.
   */
  async noteRead(userId: string, contentItemId: string): Promise<void> {
    const already = await this.prisma.contentRead.findUnique({
      where: { userId_contentItemId: { userId, contentItemId } },
    });
    if (already) return;

    await this.prisma.contentRead.create({ data: { userId, contentItemId } });
    await this.grantStamp(userId);
  }

  private async grantStamp(userId: string): Promise<void> {
    const today = jerusalemDay();
    const existing = await this.prisma.employeeWorld.findUnique({ where: { userId } });
    const row = await this.settle(existing ?? (await this.create(userId, today)));
    const todayKey = jerusalemDay();
    const lastKey = row.lastActOn ? jerusalemDay(row.lastActOn) : null;
    const newDay = lastKey !== todayKey;
    const room = row.weeklyFilled < WEEKLY_TOTAL;

    await this.prisma.employeeWorld.update({
      where: { userId },
      data: {
        weeklyFilled: room ? row.weeklyFilled + 1 : row.weeklyFilled,
        bonusXp: room ? row.bonusXp + STAMP_XP : row.bonusXp,
        streakDays: newDay ? row.streakDays + 1 : row.streakDays,
        lastActOn: new Date(),
        pulsePending: room ? true : row.pulsePending,
      },
    });
  }

  private async create(userId: string, today: string): Promise<EmployeeWorldRow> {
    return this.prisma.employeeWorld.create({
      data: {
        userId,
        weekStart: dayToDate(sundayOf(today)),
        streakDays: EMPTY.streakDays,
        graceAvailable: EMPTY.graceAvailable,
        weeklyFilled: EMPTY.weeklyFilled,
      },
    });
  }

  /**
   * A new week resets the card. One missed day spends the grace day and keeps
   * the streak. A second miss resets the card and the streak, with no message.
   * A finished week refills the grace day.
   */
  private async settle(row: EmployeeWorldRow): Promise<EmployeeWorldRow> {
    const today = jerusalemDay();
    const thisSunday = sundayOf(today);
    const storedSunday = jerusalemDay(row.weekStart);
    let graceAvailable = row.graceAvailable;
    let streakDays = row.streakDays;
    let weeklyFilled = row.weeklyFilled;
    let weekStart = row.weekStart;
    let changed = false;

    if (storedSunday < thisSunday) {
      if (weeklyFilled >= WEEKLY_TOTAL) graceAvailable = true;
      weeklyFilled = 0;
      weekStart = dayToDate(thisSunday);
      changed = true;
    }

    if (row.lastActOn) {
      const gap = daysBetween(jerusalemDay(row.lastActOn), today);
      if (gap === 2 && graceAvailable) {
        graceAvailable = false;
        changed = true;
      } else if (gap > 2 || (gap === 2 && !row.graceAvailable)) {
        streakDays = 0;
        weeklyFilled = 0;
        changed = true;
      }
    }

    if (!changed) return row;
    return this.prisma.employeeWorld.update({
      where: { userId: row.userId },
      data: { graceAvailable, streakDays, weeklyFilled, weekStart },
    });
  }

  private toView(row: EmployeeWorldRow): EmployeeWorld {
    const chosen = row.chosenWorld;
    const focus = chosen === "know" || chosen === "feel" || chosen === "develop" || chosen === "participate"
      ? (chosen as WorldFocus)
      : null;
    return {
      chosenWorld: focus,
      streakDays: row.streakDays,
      graceAvailable: row.graceAvailable,
      weeklyFilled: row.weeklyFilled,
      weeklyTotal: WEEKLY_TOTAL,
      endowed: false,
      bonusXp: row.bonusXp,
      pulsePending: row.pulsePending,
    };
  }
}
