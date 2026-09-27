import { Controller, Get, Patch } from "@nestjs/common";
import { type EmployeeWorld, type UpdateEmployeeWorld, UpdateEmployeeWorldSchema } from "@moch/contracts";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { ProgressionService } from "../progression/progression.service";
import { WorldService } from "./world.service";

@Controller("me/world")
export class WorldController {
  constructor(
    private readonly world: WorldService,
    private readonly progression: ProgressionService,
  ) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<EmployeeWorld> {
    return this.world.get(user.id);
  }

  /** Only the fields sent change. An avatar choice needs the level that opens it. */
  @Patch()
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(UpdateEmployeeWorldSchema) body: UpdateEmployeeWorld,
  ): Promise<EmployeeWorld> {
    await this.progression.assertAvatarOpen(user.scope, body);
    return this.world.update(user.id, body);
  }
}
