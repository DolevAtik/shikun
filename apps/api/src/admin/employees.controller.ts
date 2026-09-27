import { Controller, Get, Param, Patch } from "@nestjs/common";
import {
  AdminEmployeeListQuerySchema,
  UpdateAdminEmployeeSchema,
  type AdminRoleCounts,
  type UpdateAdminEmployee,
  type AdminEmployeeDetail,
  type AdminEmployeeListQuery,
  type AdminEmployeePage,
} from "@moch/contracts";
import { CurrentUser, RequirePermissions } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { ZodBody, ZodQuery } from "../common/zod-body.decorator";
import { AdminEmployeesRepository } from "./employees.repository";

/**
 * Employee directory under `/api/admin/employees`.
 *
 * `users:manage` is the class gate — HR, ADMIN, and (scoped to their district)
 * district managers. The repository's `manageableUsersWhere` does the row-level
 * scoping, and `employeeChangeProblem` keeps anyone from locking themselves
 * out or handing out ADMIN without being one. Bulk import is still to come.
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

  /** Declared before `:id` so it is not read as an id. */
  @Get("role-counts")
  roleCounts(): Promise<AdminRoleCounts> {
    return this.employees.roleCounts();
  }

  @Get(":id")
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<AdminEmployeeDetail> {
    return this.employees.get(user, id);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @ZodBody(UpdateAdminEmployeeSchema) body: UpdateAdminEmployee,
  ): Promise<AdminEmployeeDetail> {
    return this.employees.update(user, id, body);
  }
}
