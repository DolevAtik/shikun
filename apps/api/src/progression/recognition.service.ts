import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Colleague, GiveRecognition, RecognitionGiving } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import { BADGE_META } from "../home/badges";
import { initialsOf } from "../users/user.mapper";
import { jerusalemDay, sundayOf } from "../world/world-dates";
import { RULES } from "./rules";

const DAY_MS = 86_400_000;
const PICKER_LIMIT = 8;

/**
 * Colleague recognition: a thank-you with a badge and a reason, from one
 * employee to another. It is never XP, for either side.
 *
 * A weekly limit keeps each one worth reading, and the same colleague can be
 * thanked once a week, so it stays a thank-you and not a tally.
 */
@Injectable()
export class RecognitionService {
  constructor(private readonly prisma: PrismaService) {}

  async giving(userId: string, now = new Date()): Promise<RecognitionGiving> {
    const rows = await this.prisma.recognition.findMany({
      where: { giverId: userId },
      orderBy: { awardedAt: "desc" },
      take: 10,
      include: { recipient: { select: { firstName: true, lastName: true } } },
    });
    const week = sundayOf(jerusalemDay(now));
    return {
      used: rows.filter((row) => jerusalemDay(row.awardedAt) >= week).length,
      limit: RULES.recognitionsPerWeek,
      recent: rows.slice(0, 5).map((row) => {
        const badge = BADGE_META[row.badge];
        return {
          id: row.id,
          recipientName: `${row.recipient.firstName} ${row.recipient.lastName}`,
          badgeKey: row.badge,
          badgeNameHe: badge.nameHe,
          badgeNameEn: badge.nameEn,
          badgeColor: badge.color,
          reason: row.reason,
          awardedAt: row.awardedAt.toISOString(),
        };
      }),
    };
  }

  async give(giverId: string, input: GiveRecognition, now = new Date()): Promise<void> {
    if (input.recipientId === giverId) throw new BadRequestException("הוקרה נותנים לעמית/ה, לא לעצמך");

    const recipient = await this.prisma.user.findFirst({
      where: { id: input.recipientId, isActive: true },
      select: { id: true },
    });
    if (!recipient) throw new NotFoundException("העמית/ה לא נמצא/ה");

    // Eight days back covers any Jerusalem week; the day compare is exact.
    const week = sundayOf(jerusalemDay(now));
    const recent = await this.prisma.recognition.findMany({
      where: { giverId, awardedAt: { gte: new Date(now.getTime() - 8 * DAY_MS) } },
      select: { recipientId: true, awardedAt: true },
    });
    const thisWeek = recent.filter((row) => jerusalemDay(row.awardedAt) >= week);
    if (thisWeek.length >= RULES.recognitionsPerWeek) {
      throw new ConflictException(`אפשר לתת ${RULES.recognitionsPerWeek} הוקרות בשבוע. המכסה מתחדשת ביום ראשון`);
    }
    if (thisWeek.some((row) => row.recipientId === input.recipientId)) {
      throw new ConflictException("כבר הוקרת את העמית/ה הזה/ו השבוע");
    }

    await this.prisma.recognition.create({
      data: { recipientId: input.recipientId, giverId, badge: input.badge, reason: input.reason.trim(), awardedAt: now },
    });
  }

  /** Active colleagues whose name matches, for the picker. Never the viewer. */
  async colleagues(viewerId: string, query: string): Promise<Colleague[]> {
    const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 3);
    if (words.join("").length < 2) return [];

    const rows = await this.prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: viewerId },
        AND: words.map((word) => ({
          OR: [
            { firstName: { contains: word, mode: "insensitive" as const } },
            { lastName: { contains: word, mode: "insensitive" as const } },
          ],
        })),
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: PICKER_LIMIT,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        avatarUrl: true,
        bio: true,
        department: { select: { nameHe: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      fullName: `${row.firstName} ${row.lastName}`,
      initials: initialsOf(row.firstName, row.lastName),
      title: row.title,
      avatarUrl: row.avatarUrl,
      departmentName: row.department?.nameHe ?? null,
      bio: row.bio,
    }));
  }
}
