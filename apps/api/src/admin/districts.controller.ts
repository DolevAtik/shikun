import { Controller, Get } from "@nestjs/common";
import type { AdminDistricts } from "@moch/contracts";
import { RequirePermissions } from "../auth/decorators";
import { AdminDistrictsService } from "./districts.service";

/**
 * Districts overview under `/api/admin/districts`.
 *
 * Only `admin:access` — the counts and names here are general org context (the
 * same figures the Dashboard already shows any console user), not a sensitive or
 * district-scoped surface.
 */
@Controller("admin/districts")
@RequirePermissions("admin:access")
export class DistrictsController {
  constructor(private readonly districts: AdminDistrictsService) {}

  @Get()
  list(): Promise<AdminDistricts> {
    return this.districts.list();
  }
}
