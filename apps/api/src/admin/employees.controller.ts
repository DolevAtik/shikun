import { Controller, Get, Param } from "@nestjs/common";
import {
  AdminEmployeeListQuerySchema,
  type AdminEmployeeDetail,
  type AdminEmployeeListQuery,
  type AdminEmployeePage,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodQuery } from "../common/zod-body.decorator";
import { AdminEmployeesRepository } from "./employees.repository";

/**
 * Employee directory under `/api/admin/employees`.
 *
 * `users:manage` is the class gate — HR, ADMIN, and (scoped to their district)
 * district managers. The repository's `manageableUsersWhere` does the row-level
 * scoping; this controller is deliberately read-only for now (deactivate, role
 * assignment and bulk import are the write surface, and they land in Phase 3).
 */
@Controller("admin/employees")
@RequirePermissions("admin:access", "users:manage")
export class EmployeesController {
  constructor(private readonly employees: AdminEmployeesRepository) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @ZodQuery(AdminEmployeeListQuerySchema) query: AdminEmployeeListQuery,
  ): Promise<AdminEmployeePage> {
    return this.employees.list(user, query);
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminEmployeeDetail> {
    return this.employees.get(user, id);
  }
}
