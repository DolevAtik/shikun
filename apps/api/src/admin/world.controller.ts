import { Controller, Get, Param, Put, Query } from "@nestjs/common";
import {
  type AdminQuests,
  DashboardRangeSchema,
  type SetQuestReward,
  SetQuestRewardSchema,
  type WorldMetrics,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { AdminWorldService } from "./world.service";

/** Department goals: what a department gets for reaching its monthly goal. */
@Controller("admin/quests")
@RequirePermissions("admin:access", "quests:manage")
export class AdminQuestsController {
  constructor(private readonly world: AdminWorldService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<AdminQuests> {
    return this.world.quests(user);
  }

  @Put(":departmentId")
  set(
    @CurrentUser() user: AuthenticatedUser,
    @Param("departmentId") departmentId: string,
    @ZodBody(SetQuestRewardSchema) body: SetQuestReward,
  ): Promise<AdminQuests> {
    return this.world.setReward(user, departmentId, body.reward);
  }
}

/** Does העולם שלי change behaviour? Aggregates only. */
@Controller("admin/world")
@RequirePermissions("admin:access", "analytics:view")
export class AdminWorldMetricsController {
  constructor(private readonly world: AdminWorldService) {}

  @Get("metrics")
  metrics(@Query("range") range?: string): Promise<WorldMetrics> {
    return this.world.metrics(DashboardRangeSchema.catch("30d").parse(range));
  }
}
