import { BadRequestException, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  type Attendance,
  AttendanceSchema,
  type Colleague,
  type EmployeeProgress,
  type GiveRecognition,
  GiveRecognitionSchema,
  MonthSchema,
  type MonthlyRecap,
  type ProfileResult,
  type Register,
  RegisterSchema,
  type UpdateProfile,
  UpdateProfileSchema,
  type WorldDetail,
} from "@moch/contracts";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { ProgressionService } from "./progression.service";
import { RecognitionService } from "./recognition.service";

@Controller("me")
export class ProgressionController {
  constructor(
    private readonly progression: ProgressionService,
    private readonly recognition: RecognitionService,
  ) {}

  @Get("progress")
  get(@CurrentUser() user: AuthenticatedUser): Promise<EmployeeProgress> {
    return this.progression.get(user.scope);
  }

  @Get("progress/worlds/:world")
  world(@CurrentUser() user: AuthenticatedUser, @Param("world") world: string): Promise<WorldDetail> {
    return this.progression.world(user.scope, world);
  }

  /** One month looked back on. Without `month`, this one. */
  @Get("progress/recap")
  recap(@CurrentUser() user: AuthenticatedUser, @Query("month") month?: string): Promise<MonthlyRecap> {
    if (month !== undefined && !MonthSchema.safeParse(month).success) throw new BadRequestException("חודש לא תקין");
    return this.progression.recap(user.scope, month);
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

  /** "Were you there?" after the session started. */
  @Post("registrations/:contentItemId/attendance")
  @HttpCode(200)
  attendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param("contentItemId") contentItemId: string,
    @ZodBody(AttendanceSchema) body: Attendance,
  ): Promise<EmployeeProgress> {
    return this.progression.attendance(user.scope, contentItemId, body.attended);
  }

  /** Thank a colleague. Answers with the viewer's progress, so the weekly count moves in place. */
  @Post("recognitions")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async give(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(GiveRecognitionSchema) body: GiveRecognition,
  ): Promise<EmployeeProgress> {
    await this.recognition.give(user.id, body);
    return this.progression.get(user.scope);
  }

  @Get("colleagues")
  colleagues(@CurrentUser() user: AuthenticatedUser, @Query("q") query?: string): Promise<Colleague[]> {
    return this.recognition.colleagues(user.id, (query ?? "").slice(0, 60));
  }

  @Patch("profile")
  profile(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(UpdateProfileSchema) body: UpdateProfile,
  ): Promise<ProfileResult> {
    return this.progression.updateProfile(user.scope, body);
  }
}
