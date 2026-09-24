import { Controller, Get, Patch } from "@nestjs/common";
import { type EmployeeWorld, type UpdateEmployeeWorld, UpdateEmployeeWorldSchema } from "@moch/contracts";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { WorldService } from "./world.service";

@Controller("me/world")
export class WorldController {
  constructor(private readonly world: WorldService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<EmployeeWorld> {
    return this.world.get(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(UpdateEmployeeWorldSchema) body: UpdateEmployeeWorld,
  ): Promise<EmployeeWorld> {
    return this.world.update(user.id, body);
  }
}
