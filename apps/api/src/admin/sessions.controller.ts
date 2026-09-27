import { Controller, Get, Param } from "@nestjs/common";
import {
  AdminSessionListQuerySchema,
  type AdminSessionListQuery,
  type AdminSessionPage,
  type AdminSessionRegistrants,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodQuery } from "../common/zod-body.decorator";
import { AdminContentRepository } from "./content.repository";

/**
 * Events and trainings as sessions: dates, seats, sign-ups, and attendance.
 * Creating and editing one is ordinary content (`/admin/content`); this is the
 * organiser's view of who is coming. Rows are scoped by `manageableWhere`.
 */
@Controller("admin/sessions")
@RequirePermissions("admin:access")
export class AdminSessionsController {
  constructor(private readonly content: AdminContentRepository) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @ZodQuery(AdminSessionListQuerySchema) query: AdminSessionListQuery,
  ): Promise<AdminSessionPage> {
    return this.content.sessions(user, query);
  }

  @Get(":id/registrants")
  registrants(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminSessionRegistrants> {
    return this.content.sessionRegistrants(user, id);
  }
}
