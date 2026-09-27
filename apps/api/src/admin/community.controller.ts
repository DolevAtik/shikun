import { Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import {
  ListQuerySchema,
  ModerationRemoveSchema,
  type AdminChannel,
  type AdminCommentPage,
  type AdminRecognitionPage,
  type ListQuery,
  type ModerationRemove,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody, ZodQuery } from "../common/zod-body.decorator";
import { AdminCommunityService } from "./community.service";

/**
 * `content:manage` — the same people the employee app already lets delete any
 * comment (CONTENT_EDITOR and ADMIN). Moderation is Ministry-wide, not scoped.
 */
@Controller("admin/community")
@RequirePermissions("admin:access", "content:manage")
export class AdminCommunityController {
  constructor(private readonly community: AdminCommunityService) {}

  @Get("channels")
  channels(): Promise<AdminChannel[]> {
    return this.community.channels();
  }

  @Get("comments")
  comments(@ZodQuery(ListQuerySchema) query: ListQuery): Promise<AdminCommentPage> {
    return this.community.comments(query);
  }

  @Post("comments/:id/remove")
  @HttpCode(204)
  removeComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(ModerationRemoveSchema) body: ModerationRemove,
  ): Promise<void> {
    return this.community.removeComment(user, id, body.reason);
  }

  @Get("recognitions")
  recognitions(@ZodQuery(ListQuerySchema) query: ListQuery): Promise<AdminRecognitionPage> {
    return this.community.recognitions(query);
  }

  @Post("recognitions/:id/remove")
  @HttpCode(204)
  removeRecognition(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(ModerationRemoveSchema) body: ModerationRemove,
  ): Promise<void> {
    return this.community.removeRecognition(user, id, body.reason);
  }
}
