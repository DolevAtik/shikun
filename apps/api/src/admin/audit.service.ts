import { Injectable, Logger } from "@nestjs/common";
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
}

function entity(entry: AuditEntry): string {
  return `${entry.entityType}:${entry.entityId}`;
}
