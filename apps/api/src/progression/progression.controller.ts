import { Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { type EmployeeProgress, type Register, type WorldDetail, RegisterSchema } from "@moch/contracts";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { ProgressionService } from "./progression.service";

@Controller("me")
export class ProgressionController {
  constructor(private readonly progression: ProgressionService) {}

  @Get("progress")
  get(@CurrentUser() user: AuthenticatedUser): Promise<EmployeeProgress> {
    return this.progression.get(user.scope);
  }

  @Get("progress/worlds/:world")
  world(@CurrentUser() user: AuthenticatedUser, @Param("world") world: string): Promise<WorldDetail> {
    return this.progression.world(user.scope, world);
  }

  /** Idempotent. Answers with the new progress so the screen can move at once. */
  @Post("registrations")
  @HttpCode(200)
  register(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(RegisterSchema) body: Register,
  ): Promise<EmployeeProgress> {
    return this.progression.register(user.scope, body.contentItemId);
  }

  @Delete("registrations/:contentItemId")
  unregister(
    @CurrentUser() user: AuthenticatedUser,
    @Param("contentItemId") contentItemId: string,
  ): Promise<EmployeeProgress> {
    return this.progression.unregister(user.scope, contentItemId);
  }
}
