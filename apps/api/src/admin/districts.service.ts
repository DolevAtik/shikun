import { Injectable } from "@nestjs/common";
import type { AdminDistrict, AdminDistricts } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";

/**
 * The districts overview: the five מחוזות with live counts.
 *
 * These are global aggregates — how many employees, content items, and projects
 * belong to each district, Ministry-wide — which is org context, not content
 * management. That is why `scripts/check-admin-scope.mjs` allowlists this file:
 * it reads `prisma.contentItem` for a count grouped by district, exactly as the
 * Dashboard does, and never for row-level access.
 */
@Injectable()
export class AdminDistrictsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminDistricts> {
    const districts = await this.prisma.district.findMany({
      orderBy: { nameHe: "asc" },
      select: {
        id: true,
        code: true,
        nameHe: true,
        nameEn: true,
        color: true,
        _count: { select: { users: true, projects: true } },
      },
    });

    // Content count by district (a global aggregate) and the district manager.
    // Raw SQL for the count mirrors the Dashboard's district aggregation and
    // sidesteps a groupBy typing quirk; the file is allowlisted for exactly this.
    const [contentCounts, managers] = await this.prisma.$transaction([
      this.prisma.$queryRaw<{ districtId: string; count: bigint }[]>`
        SELECT "districtId", COUNT(*) AS count
        FROM "ContentItem"
        WHERE "districtId" IS NOT NULL
        GROUP BY "districtId"
      `,
      this.prisma.user.findMany({
        where: { roles: { has: "DISTRICT_MANAGER" }, districtId: { not: null }, isActive: true },
        select: { firstName: true, lastName: true, districtId: true },
      }),
    ]);

    const contentByDistrict = new Map(contentCounts.map((c) => [c.districtId, Number(c.count)]));
    const managerByDistrict = new Map(
      managers.map((m) => [m.districtId, `${m.firstName} ${m.lastName}`]),
    );

    const result: AdminDistrict[] = districts.map((d) => ({
      id: d.id,
      code: d.code,
      nameHe: d.nameHe,
      nameEn: d.nameEn,
      color: d.color,
      employeeCount: d._count.users,
      projectCount: d._count.projects,
      contentCount: contentByDistrict.get(d.id) ?? 0,
      managerName: managerByDistrict.get(d.id) ?? null,
    }));

    return { districts: result };
  }
}
