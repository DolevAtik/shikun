import { Controller, Get, Put } from "@nestjs/common";
import {
  UpdateHomeSectionsSchema,
  type AdminHomeSections,
  type UpdateHomeSections,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { AdminHomeService } from "./home.service";

@Controller("admin/home")
@RequirePermissions("admin:access")
export class AdminHomeController {
  constructor(private readonly home: AdminHomeService) {}

  @Get("sections")
  @RequirePermissions("admin:access", "feeds:manage")
  list(): Promise<AdminHomeSections> {
    return this.home.listSections();
  }

  @Put("sections")
  @RequirePermissions("admin:access", "feeds:manage")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(UpdateHomeSectionsSchema) body: UpdateHomeSections,
  ): Promise<AdminHomeSections> {
    return this.home.updateSections(user, body);
  }
}
