import { Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import type { AdminDashboard, Audience, AudienceEstimate, SearchResponse } from "@moch/contracts";
import { AudienceEstimateRequestSchema, DashboardRangeSchema } from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { PrismaService } from "../common/prisma/prisma.service";
import { ZodBody } from "../common/zod-body.decorator";
import { DashboardService } from "./dashboard.service";
import { SearchService } from "./search.service";

/**
 * `/api/admin/*` is its own namespace, and never new verbs on the employee routes.
 *
 * The two have opposite authorization semantics — the employee endpoints filter
 * by `audienceWhere` ("what is targeted at me"), and these filter by
 * `manageableWhere` ("what am I responsible for"). Putting both on one controller
 * is precisely how the wrong one gets called and content leaks.
 *
 * `admin:access` is required at the class level, so a route added to this file
 * cannot be forgotten out of the gate.
 */
@Controller("admin")
@RequirePermissions("admin:access")
export class AdminController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly search: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("dashboard")
  getDashboard(@Query("range") range?: string): Promise<AdminDashboard> {
    const parsed = DashboardRangeSchema.catch("30d").parse(range);
    return this.dashboard.overview(parsed);
  }

  @Get("search")
  globalSearch(
    @CurrentUser() user: AuthenticatedUser,
    @Query("q") term?: string,
  ): Promise<SearchResponse> {
    return this.search.search(user, term ?? "");
  }

  /**
   * "This will reach about N employees" under the audience picker. The same
   * rule `audienceMatches` applies — empty dimension = no constraint, dimensions
   * ANDed — compiled against User rather than against content.
   */
  @Post("audience/estimate")
  @HttpCode(200)
  async estimateAudience(
    @ZodBody(AudienceEstimateRequestSchema) audience: Audience,
  ): Promise<AudienceEstimate> {
    const [count, total] = await Promise.all([
      this.prisma.user.count({
        where: {
          isActive: true,
          ...(audience.departmentIds.length ? { departmentId: { in: audience.departmentIds } } : {}),
          ...(audience.districtIds.length ? { districtId: { in: audience.districtIds } } : {}),
          ...(audience.organizationIds.length
            ? { organizationId: { in: audience.organizationIds } }
            : {}),
          ...(audience.roles.length ? { roles: { hasSome: audience.roles } } : {}),
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return { count, total };
  }
}
