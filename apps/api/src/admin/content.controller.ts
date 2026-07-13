import { Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  AdminContentListQuerySchema,
  BulkContentActionSchema,
  CreateAdminContentSchema,
  UpdateAdminContentSchema,
  type AdminContentDetail,
  type AdminContentListQuery,
  type AdminContentPage,
  type BulkContentAction,
  type BulkResult,
  type CreateAdminContent,
  type UpdateAdminContent,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { AdminContentRepository } from "./content.repository";

/**
 * Content CRUD under `/api/admin/content`.
 *
 * Method-level `@RequirePermissions` *overrides* the class metadata
 * (`getAllAndOverride`), so every write lists `admin:access` again alongside
 * the content verb. List/get keep only the class gate — `manageableWhere` is
 * what scopes the rows.
 */
@Controller("admin/content")
@RequirePermissions("admin:access")
export class ContentController {
  constructor(private readonly content: AdminContentRepository) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() raw: Record<string, unknown>,
  ): Promise<AdminContentPage> {
    const query = AdminContentListQuerySchema.parse(raw) as AdminContentListQuery;
    return this.content.list(user, query);
  }

  /** Must be declared before `:id` routes so "bulk" is not parsed as an id. */
  @Post("bulk")
  @HttpCode(200)
  @RequirePermissions("admin:access", "content:edit")
  bulk(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(BulkContentActionSchema) body: BulkContentAction,
  ): Promise<BulkResult> {
    return this.content.bulk(user, body);
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminContentDetail> {
    return this.content.get(user, id);
  }

  @Post()
  @RequirePermissions("admin:access", "content:publish")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(CreateAdminContentSchema) body: CreateAdminContent,
  ): Promise<AdminContentDetail> {
    const payload =
      body.kind === "FEED_POST" && !body.channelSlug
        ? { ...body, channelSlug: "organization" as const }
        : body;
    return this.content.create(user, payload);
  }

  @Patch(":id")
  @RequirePermissions("admin:access", "content:edit")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(UpdateAdminContentSchema) body: UpdateAdminContent,
  ): Promise<AdminContentDetail> {
    return this.content.update(user, id, body);
  }

  @Post(":id/publish")
  @HttpCode(200)
  @RequirePermissions("admin:access", "content:publish")
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminContentDetail> {
    return this.content.setStatus(user, id, "PUBLISHED");
  }

  @Post(":id/unpublish")
  @HttpCode(200)
  @RequirePermissions("admin:access", "content:edit")
  unpublish(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminContentDetail> {
    return this.content.setStatus(user, id, "DRAFT");
  }

  @Post(":id/archive")
  @HttpCode(200)
  @RequirePermissions("admin:access", "content:edit")
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminContentDetail> {
    return this.content.setStatus(user, id, "ARCHIVED");
  }
}
