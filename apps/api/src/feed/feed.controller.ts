import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import {
  type Channel,
  type Comment,
  type CreatePost,
  type FeedPage,
  type FeedPost,
  type ToggleResponse,
  CreateCommentSchema,
  CreatePostSchema,
  FeedQuerySchema,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { FeedService } from "./feed.service";

@Controller("feed")
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get("channels")
  listChannels(@CurrentUser() user: AuthenticatedUser): Promise<Channel[]> {
    return this.feed.listChannels(user.scope);
  }

  @Post("channels/:slug/follow")
  follow(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string): Promise<ToggleResponse> {
    return this.feed.setFollow(user.scope, slug, true);
  }

  @Delete("channels/:slug/follow")
  unfollow(@CurrentUser() user: AuthenticatedUser, @Param("slug") slug: string): Promise<ToggleResponse> {
    return this.feed.setFollow(user.scope, slug, false);
  }

  @Get("posts")
  getFeed(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: Record<string, string>,
  ): Promise<FeedPage> {
    return this.feed.getFeed(user.scope, FeedQuerySchema.parse(query));
  }

  @Get("posts/:id")
  getPost(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<FeedPost> {
    return this.feed.getPost(user.scope, id);
  }

  /** An EMPLOYEE hitting this gets 403 — the roles matrix is enforced here, not in the UI. */
  @Post("posts")
  @RequirePermissions("content:publish")
  createPost(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(CreatePostSchema) body: CreatePost,
  ): Promise<FeedPost> {
    return this.feed.createPost(user.scope, body);
  }

  @Post("posts/:id/like")
  like(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<ToggleResponse> {
    return this.feed.toggleInteraction(user.scope, id, "LIKE");
  }

  @Post("posts/:id/bookmark")
  bookmark(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<ToggleResponse> {
    return this.feed.toggleInteraction(user.scope, id, "BOOKMARK");
  }

  @Get("posts/:id/comments")
  listComments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<Comment[]> {
    return this.feed.listComments(user.scope, id);
  }

  @Post("posts/:id/comments")
  createComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(CreateCommentSchema) body: { body: string },
  ): Promise<Comment> {
    return this.feed.createComment(user.scope, id, body.body);
  }

  @Delete("comments/:commentId")
  deleteComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("commentId") commentId: string,
  ): Promise<void> {
    return this.feed.deleteComment(user.scope, commentId);
  }
}
