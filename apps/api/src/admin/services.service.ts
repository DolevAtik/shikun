import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminQuickAction,
  AdminQuickLink,
  AdminServices,
  QuickActionInput,
  QuickLinkInput,
} from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { AuditService } from "./audit.service";

@Injectable()
export class AdminServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<AdminServices> {
    const [quickActions, quickLinks] = await Promise.all([
      this.prisma.quickAction.findMany({ orderBy: { order: "asc" } }),
      this.prisma.quickLink.findMany({ orderBy: { order: "asc" } }),
    ]);
    return { quickActions, quickLinks };
  }

  async createAction(user: AuthenticatedUser, input: QuickActionInput): Promise<AdminQuickAction> {
    const last = await this.prisma.quickAction.aggregate({ _max: { order: true } });
    const row = await this.prisma.quickAction.create({
      data: { ...input, order: (last._max.order ?? -1) + 1 },
    });
    await this.record(user, "service.action.create", "QuickAction", row.id, `נוספה פעולה מהירה: ${row.label}`, undefined, input);
    return row;
  }

  async updateAction(user: AuthenticatedUser, id: string, input: QuickActionInput): Promise<AdminQuickAction> {
    const before = await this.prisma.quickAction.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הפעולה לא נמצאה");
    const row = await this.prisma.quickAction.update({ where: { id }, data: input });
    await this.record(user, "service.action.update", "QuickAction", id, `עודכנה פעולה מהירה: ${row.label}`, { label: before.label, href: before.href }, input);
    return row;
  }

  async deleteAction(user: AuthenticatedUser, id: string): Promise<void> {
    const before = await this.prisma.quickAction.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הפעולה לא נמצאה");
    await this.prisma.quickAction.delete({ where: { id } });
    await this.record(user, "service.action.delete", "QuickAction", id, `הוסרה פעולה מהירה: ${before.label}`, { label: before.label, href: before.href });
  }

  async createLink(user: AuthenticatedUser, input: QuickLinkInput): Promise<AdminQuickLink> {
    const last = await this.prisma.quickLink.aggregate({ _max: { order: true } });
    const row = await this.prisma.quickLink.create({
      data: { ...input, icon: input.icon ?? null, order: (last._max.order ?? -1) + 1 },
    });
    await this.record(user, "service.link.create", "QuickLink", row.id, `נוסף קישור: ${row.label}`, undefined, input);
    return row;
  }

  async updateLink(user: AuthenticatedUser, id: string, input: QuickLinkInput): Promise<AdminQuickLink> {
    const before = await this.prisma.quickLink.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הקישור לא נמצא");
    const row = await this.prisma.quickLink.update({
      where: { id },
      data: { ...input, icon: input.icon ?? null },
    });
    await this.record(user, "service.link.update", "QuickLink", id, `עודכן קישור: ${row.label}`, { label: before.label, url: before.url }, input);
    return row;
  }

  async deleteLink(user: AuthenticatedUser, id: string): Promise<void> {
    const before = await this.prisma.quickLink.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("הקישור לא נמצא");
    await this.prisma.quickLink.delete({ where: { id } });
    await this.record(user, "service.link.delete", "QuickLink", id, `הוסר קישור: ${before.label}`, { label: before.label, url: before.url });
  }

  async reorder(user: AuthenticatedUser, list: "actions" | "links", ids: string[]): Promise<AdminServices> {
    if (list === "actions") {
      await this.prisma.$transaction(
        ids.map((id, order) => this.prisma.quickAction.updateMany({ where: { id }, data: { order } })),
      );
    } else {
      await this.prisma.$transaction(
        ids.map((id, order) => this.prisma.quickLink.updateMany({ where: { id }, data: { order } })),
      );
    }
    await this.record(
      user,
      `service.${list === "actions" ? "action" : "link"}.reorder`,
      list === "actions" ? "QuickAction" : "QuickLink",
      "order",
      list === "actions" ? "סודרו מחדש הפעולות המהירות" : "סודרו מחדש הקישורים",
      undefined,
      ids,
    );
    return this.list();
  }

  private record(
    user: AuthenticatedUser,
    action: string,
    entityType: string,
    entityId: string,
    summary: string,
    before?: unknown,
    after?: unknown,
  ): Promise<void> {
    return this.audit.record(user, { action, entityType, entityId, summary, before, after });
  }
}
