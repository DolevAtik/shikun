import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type {
  AdminHomeData,
  AdminKeyMetric,
  AdminProject,
  AdminWeeklySummary,
  KeyMetricInput,
  ProjectInput,
  WeeklySummaryInput,
} from "@moch/contracts";
import { Prisma } from "@prisma/client";
import type { KeyMetric, WeeklySummary } from "@prisma/client";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { AuditService } from "./audit.service";

/**
 * The rows behind Home's non-content sections: key numbers, projects, and the
 * weekly summary. None of them is audience-targeted — the section that shows
 * them is — so there is no row-level scope here, only the `feeds:manage` gate.
 */
@Injectable()
export class AdminHomeDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async all(): Promise<AdminHomeData> {
    const [metrics, projects, weekly] = await Promise.all([
      this.prisma.keyMetric.findMany({ orderBy: { order: "asc" } }),
      this.prisma.project.findMany({
        orderBy: { order: "asc" },
        include: { district: { select: { nameHe: true } } },
      }),
      this.prisma.weeklySummary.findMany({ orderBy: { weekOf: "desc" }, take: 20 }),
    ]);
    return {
      metrics: metrics.map(toMetric),
      projects: projects.map(toProject),
      weekly: weekly.map(toWeekly),
    };
  }

  // ─── Key numbers ───────────────────────────────────────────────────────────

  async createMetric(user: AuthenticatedUser, input: KeyMetricInput): Promise<AdminKeyMetric> {
    const last = await this.prisma.keyMetric.aggregate({ _max: { order: true } });
    const row = await this.prisma.keyMetric.create({
      data: {
        // The key only has to be unique; nothing reads it but the seed.
        key: `metric-${randomUUID().slice(0, 8)}`,
        label: input.label,
        value: input.value,
        unit: input.unit ?? null,
        changePct: input.changePct ?? null,
        period: input.period ?? null,
        order: (last._max.order ?? -1) + 1,
      },
    });
    await this.audit.record(user, {
      action: "home.metric.create",
      entityType: "KeyMetric",
      entityId: row.id,
      summary: `נוסף מספר מרכזי: ${row.label}`,
      after: input,
    });
    return toMetric(row);
  }

  async updateMetric(user: AuthenticatedUser, id: string, input: KeyMetricInput): Promise<AdminKeyMetric> {
    const before = await this.prisma.keyMetric.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("המספר לא נמצא");
    const row = await this.prisma.keyMetric.update({
      where: { id },
      data: {
        label: input.label,
        value: input.value,
        unit: input.unit ?? null,
        changePct: input.changePct ?? null,
        period: input.period ?? null,
      },
    });
    await this.audit.record(user, {
      action: "home.metric.update",
      entityType: "KeyMetric",
      entityId: id,
      summary: `עודכן מספר מרכזי: ${row.label}`,
      before: { label: before.label, value: before.value },
      after: input,
    });
    return toMetric(row);
  }

  async deleteMetric(user: AuthenticatedUser, id: string): Promise<void> {
    const before = await this.prisma.keyMetric.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("המספר לא נמצא");
    await this.prisma.keyMetric.delete({ where: { id } });
    await this.audit.record(user, {
      action: "home.metric.delete",
      entityType: "KeyMetric",
      entityId: id,
      summary: `הוסר מספר מרכזי: ${before.label}`,
      before: { label: before.label, value: before.value },
    });
  }

  async reorderMetrics(user: AuthenticatedUser, ids: string[]): Promise<AdminKeyMetric[]> {
    await this.prisma.$transaction(
      ids.map((id, order) => this.prisma.keyMetric.updateMany({ where: { id }, data: { order } })),
    );
    await this.audit.record(user, {
      action: "home.metric.reorder",
      entityType: "KeyMetric",
      entityId: "order",
      summary: "סודרו מחדש המספרים המרכזיים",
      after: ids,
    });
    const rows = await this.prisma.keyMetric.findMany({ orderBy: { order: "asc" } });
    return rows.map(toMetric);
  }

  // ─── Projects ──────────────────────────────────────────────────────────────

  async createProject(user: AuthenticatedUser, input: ProjectInput): Promise<AdminProject> {
    await this.requireDistrict(input.districtId);
    const last = await this.prisma.project.aggregate({ _max: { order: true } });
    const row = await this.prisma.project.create({
      data: { ...projectData(input), order: (last._max.order ?? -1) + 1 },
      include: { district: { select: { nameHe: true } } },
    });
    await this.audit.record(user, {
      action: "home.project.create",
      entityType: "Project",
      entityId: row.id,
      summary: `נוסף פרויקט: ${row.name}`,
      after: input,
    });
    return toProject(row);
  }

  async updateProject(user: AuthenticatedUser, id: string, input: ProjectInput): Promise<AdminProject> {
    const before = await this.prisma.project.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הפרויקט לא נמצא");
    await this.requireDistrict(input.districtId);
    const row = await this.prisma.project.update({
      where: { id },
      data: projectData(input),
      include: { district: { select: { nameHe: true } } },
    });
    await this.audit.record(user, {
      action: "home.project.update",
      entityType: "Project",
      entityId: id,
      summary: `עודכן פרויקט: ${row.name}`,
      before: { name: before.name, status: before.status, progress: before.progress },
      after: input,
    });
    return toProject(row);
  }

  async deleteProject(user: AuthenticatedUser, id: string): Promise<void> {
    const before = await this.prisma.project.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הפרויקט לא נמצא");
    await this.prisma.project.delete({ where: { id } });
    await this.audit.record(user, {
      action: "home.project.delete",
      entityType: "Project",
      entityId: id,
      summary: `הוסר פרויקט: ${before.name}`,
      before: { name: before.name },
    });
  }

  async reorderProjects(user: AuthenticatedUser, ids: string[]): Promise<AdminProject[]> {
    await this.prisma.$transaction(
      ids.map((id, order) => this.prisma.project.updateMany({ where: { id }, data: { order } })),
    );
    await this.audit.record(user, {
      action: "home.project.reorder",
      entityType: "Project",
      entityId: "order",
      summary: "סודרו מחדש הפרויקטים",
      after: ids,
    });
    const rows = await this.prisma.project.findMany({
      orderBy: { order: "asc" },
      include: { district: { select: { nameHe: true } } },
    });
    return rows.map(toProject);
  }

  // ─── Weekly summary ────────────────────────────────────────────────────────

  async createWeekly(user: AuthenticatedUser, input: WeeklySummaryInput): Promise<AdminWeeklySummary> {
    const row = await this.uniqueWeek(() =>
      this.prisma.weeklySummary.create({ data: weeklyData(input) }),
    );
    await this.audit.record(user, {
      action: "home.weekly.create",
      entityType: "WeeklySummary",
      entityId: row.id,
      summary: `פורסם סיכום שבועי: ${row.title}`,
      after: { weekOf: input.weekOf, title: input.title },
    });
    return toWeekly(row);
  }

  async updateWeekly(
    user: AuthenticatedUser,
    id: string,
    input: WeeklySummaryInput,
  ): Promise<AdminWeeklySummary> {
    const before = await this.prisma.weeklySummary.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הסיכום לא נמצא");
    const row = await this.uniqueWeek(() =>
      this.prisma.weeklySummary.update({ where: { id }, data: weeklyData(input) }),
    );
    await this.audit.record(user, {
      action: "home.weekly.update",
      entityType: "WeeklySummary",
      entityId: id,
      summary: `עודכן סיכום שבועי: ${row.title}`,
      before: { weekOf: dateOnly(before.weekOf), title: before.title },
      after: { weekOf: input.weekOf, title: input.title },
    });
    return toWeekly(row);
  }

  async deleteWeekly(user: AuthenticatedUser, id: string): Promise<void> {
    const before = await this.prisma.weeklySummary.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הסיכום לא נמצא");
    await this.prisma.weeklySummary.delete({ where: { id } });
    await this.audit.record(user, {
      action: "home.weekly.delete",
      entityType: "WeeklySummary",
      entityId: id,
      summary: `הוסר סיכום שבועי: ${before.title}`,
      before: { weekOf: dateOnly(before.weekOf), title: before.title },
    });
  }

  private async requireDistrict(id: string): Promise<void> {
    const district = await this.prisma.district.findUnique({ where: { id }, select: { id: true } });
    if (!district) throw new NotFoundException("המחוז לא נמצא");
  }

  /** `weekOf` is unique: a second summary for the same week is a 409, not a 500. */
  private async uniqueWeek<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("כבר קיים סיכום לשבוע הזה");
      }
      throw error;
    }
  }
}

function projectData(input: ProjectInput) {
  return {
    name: input.name,
    city: input.city ?? null,
    districtId: input.districtId,
    status: input.status,
    progress: input.progress,
    housingUnits: input.housingUnits ?? null,
    imageUrl: input.imageUrl || null,
  };
}

function weeklyData(input: WeeklySummaryInput) {
  return {
    weekOf: new Date(`${input.weekOf}T00:00:00.000Z`),
    title: input.title,
    teaser: input.teaser,
    highlights: input.highlights,
  };
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toMetric(row: KeyMetric): AdminKeyMetric {
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    unit: row.unit,
    changePct: row.changePct,
    period: row.period,
    order: row.order,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toProject(
  row: Prisma.ProjectGetPayload<{ include: { district: { select: { nameHe: true } } } }>,
): AdminProject {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    districtId: row.districtId,
    districtName: row.district.nameHe,
    status: row.status,
    progress: row.progress,
    housingUnits: row.housingUnits,
    imageUrl: row.imageUrl,
    order: row.order,
  };
}

function toWeekly(row: WeeklySummary): AdminWeeklySummary {
  return {
    id: row.id,
    weekOf: dateOnly(row.weekOf),
    title: row.title,
    teaser: row.teaser,
    highlights: row.highlights,
    publishedAt: row.publishedAt.toISOString(),
  };
}
