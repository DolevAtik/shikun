import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from "@nestjs/common";
import {
  QuickActionInputSchema,
  QuickLinkInputSchema,
  ReorderSchema,
  type AdminQuickAction,
  type AdminQuickLink,
  type AdminServices,
  type QuickActionInput,
  type QuickLinkInput,
  type Reorder,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { AdminServicesService } from "./services.service";

/** The employee Services screen: quick actions and the systems employees leave for. */
@Controller("admin/services")
@RequirePermissions("admin:access", "feeds:manage")
export class AdminServicesController {
  constructor(private readonly services: AdminServicesService) {}

  @Get()
  list(): Promise<AdminServices> {
    return this.services.list();
  }

  @Put("actions/order")
  reorderActions(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(ReorderSchema) body: Reorder,
  ): Promise<AdminServices> {
    return this.services.reorder(user, "actions", body.ids);
  }

  @Post("actions")
  createAction(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(QuickActionInputSchema) body: QuickActionInput,
  ): Promise<AdminQuickAction> {
    return this.services.createAction(user, body);
  }

  @Patch("actions/:id")
  updateAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(QuickActionInputSchema) body: QuickActionInput,
  ): Promise<AdminQuickAction> {
    return this.services.updateAction(user, id, body);
  }

  @Delete("actions/:id")
  @HttpCode(204)
  deleteAction(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    return this.services.deleteAction(user, id);
  }

  @Put("links/order")
  reorderLinks(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(ReorderSchema) body: Reorder,
  ): Promise<AdminServices> {
    return this.services.reorder(user, "links", body.ids);
  }

  @Post("links")
  createLink(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(QuickLinkInputSchema) body: QuickLinkInput,
  ): Promise<AdminQuickLink> {
    return this.services.createLink(user, body);
  }

  @Patch("links/:id")
  updateLink(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(QuickLinkInputSchema) body: QuickLinkInput,
  ): Promise<AdminQuickLink> {
    return this.services.updateLink(user, id, body);
  }

  @Delete("links/:id")
  @HttpCode(204)
  deleteLink(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    return this.services.deleteLink(user, id);
  }
}
