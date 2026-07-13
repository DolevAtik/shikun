import { Controller, Get, Query } from "@nestjs/common";
import type { AdminDashboard, SearchResponse } from "@moch/contracts";
import { DashboardRangeSchema } from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
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
}
