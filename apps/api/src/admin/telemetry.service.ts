import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";

export interface IncomingEvent {
  type: string;
  sessionId: string;
  entityType?: string;
  entityId?: string;
  props?: Record<string, unknown>;
  /** Client-supplied, so it is not trusted for anything but ordering. */
  ts?: string;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ingests a batch of events from the employee app.
   *
   * The district and department are taken from the authenticated viewer, not
   * from the payload — a client that can name its own district can forge the
   * "most active district" chart. They are written onto every row so that a
   * later aggregation never joins User, and so that an employee transferring
   * district does not silently rewrite last quarter's history.
   */
  async ingest(user: AuthenticatedUser, events: IncomingEvent[]): Promise<void> {
    if (events.length === 0) return;

    try {
      await this.prisma.analyticsEvent.createMany({
        data: events.map((event) => ({
          ts: event.ts ? new Date(event.ts) : new Date(),
          userId: user.id,
          sessionId: event.sessionId,
          type: event.type,
          entityType: event.entityType,
          entityId: event.entityId,
          props: (event.props ?? undefined) as never,
          districtId: user.scope.districtId,
          departmentId: user.scope.departmentId,
        })),
      });
    } catch (error) {
      // Telemetry is never worth a 500 to the person trying to read an
      // announcement. Drop it, and say so in the log.
      this.logger.warn(`Telemetry ingest dropped ${events.length} events: ${String(error)}`);
    }
  }
}
