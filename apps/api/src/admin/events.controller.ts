import { Controller, HttpCode, Post } from "@nestjs/common";
import { IngestEventsSchema, type IngestEventsRequest } from "@moch/contracts";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody } from "../common/zod-body.decorator";
import { TelemetryService } from "./telemetry.service";

/**
 * Batched beacon from the employee app.
 *
 * Lives next to the admin services because the Dashboard is the consumer, but
 * the route is `/api/events` — not under `/api/admin` — so an ordinary employee
 * can post without holding `admin:access`.
 */
@Controller("events")
export class EventsController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post()
  @HttpCode(204)
  async ingest(
    @CurrentUser() user: AuthenticatedUser,
    @ZodBody(IngestEventsSchema) body: IngestEventsRequest,
  ): Promise<void> {
    await this.telemetry.ingest(user, body.events);
  }
}
