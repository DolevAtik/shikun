import { Injectable, Logger } from "@nestjs/common";
import type { AuditFacets, AuditListQuery, AuditLogItem, AuditLogPage } from "@moch/contracts";
import type { Prisma } from "@prisma/client";
import { toPage, skipTake } from "../common/pagination";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an administrative action.
   *
   * It never throws. An audit write that fails must not roll back the thing it
   * was describing — refusing to publish an announcement because the log was
   * momentarily unavailable is a worse outcome than a gap in the log, and the
   * gap gets an ERROR line so it is visible rather than silent.
   *
   * The reverse trade would be defensible for a bank. It is not right here.
   */
  async record(actor: AuthenticatedUser, entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          summary: entry.summary,
          before: (entry.before ?? undefined) as never,
          after: (entry.after ?? undefined) as never,
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(
        `AUDIT WRITE FAILED — ${actor.email} ${entry.action} ${entity(entry)}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * The read side. Deliberately NOT scoped by district or author: a partial
   * audit log is worse than none, and the gate (`analytics:view`) is what keeps
   * it to executives and admins. Append-only, newest first.
   */
  async list(query: AuditListQuery): Promise<AuditLogPage> {
    const where: Prisma.AuditLogWhereInput = {
      AND: [
        query.action ? { action: query.action } : {},
        query.entityType ? { entityType: query.entityType } : {},
        query.actorId ? { actorId: query.actorId } : {},
        query.from || query.to
          ? { createdAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } }
          : {},
        query.q
          ? {
              OR: [
                { summary: { contains: query.q, mode: "insensitive" } },
                { actorEmail: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const { skip, take } = skipTake(query.page, query.pageSize);
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    ]);

    return toPage(
      rows.map(
        (row): AuditLogItem => ({
          id: row.id,
          action: row.action,
          actorEmail: row.actorEmail,
          entityType: row.entityType,
          entityId: row.entityId,
          summary: row.summary,
          before: row.before ?? null,
          after: row.after ?? null,
          ip: row.ip,
          createdAt: row.createdAt.toISOString(),
        }),
      ),
      total,
      query.page,
      query.pageSize,
    );
  }

  /** Distinct action verbs and entity types, for the filter dropdowns. */
  async facets(): Promise<AuditFacets> {
    const [actions, entityTypes] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
      this.prisma.auditLog.findMany({
        distinct: ["entityType"],
        select: { entityType: true },
        orderBy: { entityType: "asc" },
      }),
    ]);
    return {
      actions: actions.map((a) => a.action),
      entityTypes: entityTypes.map((e) => e.entityType),
    };
  }
}

function entity(entry: AuditEntry): string {
  return `${entry.entityType}:${entry.entityId}`;
}
