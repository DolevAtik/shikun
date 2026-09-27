import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from "@nestjs/common";
import {
  KeyMetricInputSchema,
  ProjectInputSchema,
  ReorderSchema,
  UpdateHomeSectionsSchema,
  WeeklySummaryInputSchema,
  type AdminHomeData,
  type AdminHomeSections,
  type AdminKeyMetric,
  type AdminProject,
  type AdminWeeklySummary,
  type KeyMetricInput,
  type ProjectInput,
  type Reorder,
  type UpdateHomeSections,
  type WeeklySummaryInput,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { AdminHomeDataService } from "./home-data.service";
import { AdminHomeService } from "./home.service";

/**
 * Everything Home shows that is not a content item: the layout itself, and the
 * key numbers, projects, and weekly summary its sections render. One gate for
 * all of it — `feeds:manage` — so whoever may arrange Home may also fill it.
 */
@Controller("admin/home")
@RequirePermissions("admin:access", "feeds:manage")
export class AdminHomeController {
  constructor(
    private readonly home: AdminHomeService,
    private readonly data: AdminHomeDataService,
  ) {}

  @Get("sections")
  list(): Promise<AdminHomeSections> {
    return this.home.listSections();
  }

  @Put("sections")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(UpdateHomeSectionsSchema) body: UpdateHomeSections,
  ): Promise<AdminHomeSections> {
    return this.home.updateSections(user, body);
  }

  @Get("data")
  all(): Promise<AdminHomeData> {
    return this.data.all();
  }

  // ─── Key numbers ───

  /** Declared before `:id` so "order" is not read as an id. */
  @Put("metrics/order")
  reorderMetrics(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(ReorderSchema) body: Reorder,
  ): Promise<AdminKeyMetric[]> {
    return this.data.reorderMetrics(user, body.ids);
  }

  @Post("metrics")
  createMetric(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(KeyMetricInputSchema) body: KeyMetricInput,
  ): Promise<AdminKeyMetric> {
    return this.data.createMetric(user, body);
  }

  @Patch("metrics/:id")
  updateMetric(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(KeyMetricInputSchema) body: KeyMetricInput,
  ): Promise<AdminKeyMetric> {
    return this.data.updateMetric(user, id, body);
  }

  @Delete("metrics/:id")
  @HttpCode(204)
  deleteMetric(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    return this.data.deleteMetric(user, id);
  }

  // ─── Projects ───

  @Put("projects/order")
  reorderProjects(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(ReorderSchema) body: Reorder,
  ): Promise<AdminProject[]> {
    return this.data.reorderProjects(user, body.ids);
  }

  @Post("projects")
  createProject(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(ProjectInputSchema) body: ProjectInput,
  ): Promise<AdminProject> {
    return this.data.createProject(user, body);
  }

  @Patch("projects/:id")
  updateProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(ProjectInputSchema) body: ProjectInput,
  ): Promise<AdminProject> {
    return this.data.updateProject(user, id, body);
  }

  @Delete("projects/:id")
  @HttpCode(204)
  deleteProject(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    return this.data.deleteProject(user, id);
  }

  // ─── Weekly summary ───

  @Post("weekly")
  createWeekly(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(WeeklySummaryInputSchema) body: WeeklySummaryInput,
  ): Promise<AdminWeeklySummary> {
    return this.data.createWeekly(user, body);
  }

  @Patch("weekly/:id")
  updateWeekly(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(WeeklySummaryInputSchema) body: WeeklySummaryInput,
  ): Promise<AdminWeeklySummary> {
    return this.data.updateWeekly(user, id, body);
  }

  @Delete("weekly/:id")
  @HttpCode(204)
  deleteWeekly(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    return this.data.deleteWeekly(user, id);
  }
}
