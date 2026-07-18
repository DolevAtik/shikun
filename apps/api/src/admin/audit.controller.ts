import { Controller, Get } from "@nestjs/common";
import {
  AuditListQuerySchema,
  type AuditFacets,
  type AuditListQuery,
  type AuditLogPage,
} from "@moch/contracts";
import { RequirePermissions } from "../auth/decorators";
import { ZodQuery } from "../common/zod-body.decorator";
import { AuditService } from "./audit.service";

/**
 * The audit log, read side, under `/api/admin/audit`.
 *
 * Gated on `analytics:view` — executives and admins. The write side is the
 * `@Audited`-style interceptor and the direct `AuditService.record` calls in the
 * content repository; nothing here writes.
 */
@Controller("admin/audit")
@RequirePermissions("admin:access", "analytics:view")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@ZodQuery(AuditListQuerySchema) query: AuditListQuery): Promise<AuditLogPage> {
    return this.audit.list(query);
  }

  @Get("facets")
  facets(): Promise<AuditFacets> {
    return this.audit.facets();
  }
}
