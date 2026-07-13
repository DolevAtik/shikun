import { Injectable } from "@nestjs/common";
import type { JobsResponse, ViewerScope } from "@moch/contracts";
import { audienceWhere } from "../audience/audience";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every open position the viewer is allowed to see.
   *
   * The board reads the same CAREER items as Home's careers section, through the
   * same audience filter — Home shows the first few, this shows all of them. A
   * position drops off the board on its own the day its deadline passes; nobody
   * has to remember to unpublish it.
   *
   * Deadline first, and Postgres sorts NULLs last on an ascending sort, which is
   * exactly the order a board wants: closing soonest at the top, "open until
   * filled" at the bottom.
   */
  async getJobs(viewer: ViewerScope, now = new Date()): Promise<JobsResponse> {
    const rows = await this.prisma.contentItem.findMany({
      where: {
        kind: "CAREER",
        status: "PUBLISHED",
        publishedAt: { lte: now },
        career: { OR: [{ closesAt: null }, { closesAt: { gte: now } }] },
        ...audienceWhere(viewer),
      },
      include: { career: { include: { department: true } }, district: true },
      orderBy: [{ career: { closesAt: "asc" } }, { publishedAt: "desc" }],
    });

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title ?? "",
        summary: row.body ?? "",
        departmentName: row.career?.department?.nameHe ?? null,
        districtName: row.district?.nameHe ?? null,
        districtColor: row.district?.color ?? null,
        closesAt: row.career?.closesAt?.toISOString() ?? null,
        isInternal: row.career?.isInternal ?? true,
        href: row.career?.href ?? null,
        publishedAt: (row.publishedAt ?? row.createdAt).toISOString(),
      })),
    };
  }
}
