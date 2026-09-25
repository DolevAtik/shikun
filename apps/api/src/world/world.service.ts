import { Injectable } from "@nestjs/common";
import type { EmployeeWorld, UpdateEmployeeWorld, WorldFocus } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import { dayToDate, jerusalemDay, sundayOf } from "./world-dates";

/**
 * The stored half of העולם שלי: the week's chosen focus, and read receipts.
 *
 * XP, level, streak, and the weekly card are not stored. They are computed from
 * `ContentRead` and `Registration` by `ProgressionService`. The older counter
 * columns on `EmployeeWorld` are no longer read; dropping them is a separate
 * migration.
 */
@Injectable()
export class WorldService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<EmployeeWorld> {
    const row = await this.prisma.employeeWorld.findUnique({ where: { userId }, select: { chosenWorld: true } });
    return { chosenWorld: toFocus(row?.chosenWorld) };
  }

  async update(userId: string, input: UpdateEmployeeWorld): Promise<EmployeeWorld> {
    const saved = await this.prisma.employeeWorld.upsert({
      where: { userId },
      create: { userId, chosenWorld: input.chosenWorld, weekStart: dayToDate(sundayOf(jerusalemDay())) },
      update: { chosenWorld: input.chosenWorld },
      select: { chosenWorld: true },
    });
    return { chosenWorld: toFocus(saved.chosenWorld) };
  }

  /**
   * Records a full read of a post. Returns true only the first time — a second
   * read, a like, or opening the feed never counts again.
   */
  async noteRead(userId: string, contentItemId: string): Promise<boolean> {
    const result = await this.prisma.contentRead.createMany({
      data: [{ userId, contentItemId }],
      skipDuplicates: true,
    });
    return result.count > 0;
  }
}

function toFocus(value: string | null | undefined): WorldFocus | null {
  return value === "know" || value === "feel" || value === "develop" || value === "participate" ? value : null;
}
