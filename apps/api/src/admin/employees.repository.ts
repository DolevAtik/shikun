import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminEmployeeDetail,
  AdminEmployeeListItem,
  AdminEmployeeListQuery,
  AdminEmployeePage,
  AdminRoleCounts,
  UpdateAdminEmployee,
} from "@moch/contracts";
import { RoleSchema } from "@moch/contracts";
import type { Prisma } from "@prisma/client";
import { manageableUsersWhere } from "../audience/manageable";
import { toPage, skipTake } from "../common/pagination";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { AuditService } from "./audit.service";
import { employeeChangeProblem } from "./employee-rules";

/**
 * Employee reads for the admin console.
 *
 * Every query ANDs `manageableUsersWhere`: HR and ADMIN see everyone, a district
 * manager sees only their own district, and anyone else sees no one. The console
 * gate (`users:manage`) already keeps most roles out — this is the second wall,
 * so a hand-typed URL cannot page through the whole Ministry.
 */
@Injectable()
export class AdminEmployeesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, query: AdminEmployeeListQuery): Promise<AdminEmployeePage> {
    const scope = manageableUsersWhere(user.scope) as Prisma.UserWhereInput;

    const where: Prisma.UserWhereInput = {
      AND: [
        scope,
        { isActive: !query.inactive },
        query.districtId ? { districtId: query.districtId } : {},
        query.departmentId ? { departmentId: query.departmentId } : {},
        query.role?.length ? { roles: { hasSome: query.role } } : {},
        query.q
          ? {
              OR: [
                { firstName: { contains: query.q, mode: "insensitive" } },
                { lastName: { contains: query.q, mode: "insensitive" } },
                { email: { contains: query.q, mode: "insensitive" } },
                { title: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const { skip, take } = skipTake(query.page, query.pageSize);
    const orderBy: Prisma.UserOrderByWithRelationInput[] =
      query.sort === "startedAt"
        ? [{ startedAt: query.dir }, { lastName: "asc" }]
        : [{ lastName: query.dir }, { firstName: query.dir }];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: employeeSelect,
      }),
    ]);

    return toPage(rows.map(toListItem), total, query.page, query.pageSize);
  }

  async get(user: AuthenticatedUser, id: string): Promise<AdminEmployeeDetail> {
    const scope = manageableUsersWhere(user.scope) as Prisma.UserWhereInput;
    const row = await this.prisma.user.findFirst({
      where: { AND: [scope, { id }] },
      select: {
        ...employeeSelect,
        phone: true,
        bio: true,
        departmentId: true,
        districtId: true,
        organization: { select: { nameHe: true } },
        _count: { select: { authoredContent: true, comments: true } },
      },
    });
    // "Not yours" and "not found" look identical, on purpose.
    if (!row) throw new NotFoundException("העובד לא נמצא");

    return {
      ...toListItem(row),
      departmentId: row.departmentId,
      districtId: row.districtId,
      phone: row.phone,
      bio: row.bio,
      organizationName: row.organization?.nameHe ?? null,
      authoredCount: row._count.authoredContent,
      commentCount: row._count.comments,
    };
  }
  /**
   * Title, unit, district, roles, and whether the account is active.
   *
   * Scoped like the reads, then checked by `employeeChangeProblem`. Deactivating
   * revokes every refresh token, and the JWT strategy already refuses an inactive
   * user on the next request, so a deactivation takes effect within seconds.
   */
  async update(
    user: AuthenticatedUser,
    id: string,
    input: UpdateAdminEmployee,
  ): Promise<AdminEmployeeDetail> {
    const scope = manageableUsersWhere(user.scope) as Prisma.UserWhereInput;
    const before = await this.prisma.user.findFirst({
      where: { AND: [scope, { id }] },
      select: {
        id: true,
        email: true,
        title: true,
        roles: true,
        isActive: true,
        departmentId: true,
        districtId: true,
      },
    });
    if (!before) throw new NotFoundException("העובד לא נמצא");

    const problem = employeeChangeProblem({
      actorId: user.id,
      actorRoles: user.roles,
      targetId: id,
      rolesBefore: before.roles,
      rolesAfter: input.roles,
      isActiveAfter: input.isActive,
    });
    if (problem) throw new ForbiddenException(problem);

    if (input.departmentId) {
      const exists = await this.prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } });
      if (!exists) throw new BadRequestException("היחידה לא נמצאה");
    }
    if (input.districtId) {
      const exists = await this.prisma.district.findUnique({ where: { id: input.districtId }, select: { id: true } });
      if (!exists) throw new BadRequestException("המחוז לא נמצא");
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.title !== undefined) data.title = input.title || null;
    if (input.roles !== undefined) data.roles = [...new Set(input.roles)];
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.departmentId !== undefined) {
      data.department = input.departmentId ? { connect: { id: input.departmentId } } : { disconnect: true };
    }
    if (input.districtId !== undefined) {
      data.district = input.districtId ? { connect: { id: input.districtId } } : { disconnect: true };
    }

    await this.prisma.user.update({ where: { id }, data });

    if (input.isActive === false && before.isActive) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    const action =
      input.isActive === false && before.isActive
        ? "user.deactivate"
        : input.isActive === true && !before.isActive
          ? "user.activate"
          : input.roles !== undefined
            ? "user.roles"
            : "user.update";
    await this.audit.record(user, {
      action,
      entityType: "User",
      entityId: id,
      summary: summaryFor(action, before.email),
      before: {
        title: before.title,
        roles: before.roles,
        isActive: before.isActive,
        departmentId: before.departmentId,
        districtId: before.districtId,
      },
      after: input,
    });

    return this.get(user, id);
  }

  /** How many active employees hold each role — the Permissions page. */
  async roleCounts(): Promise<AdminRoleCounts> {
    const roles = RoleSchema.options;
    const counts = await this.prisma.$transaction(
      roles.map((role) => this.prisma.user.count({ where: { isActive: true, roles: { has: role } } })),
    );
    return { roles: roles.map((role, index) => ({ role, count: counts[index] ?? 0 })) };
  }
}

function summaryFor(action: string, email: string): string {
  switch (action) {
    case "user.deactivate":
      return `הושבת החשבון של ${email}`;
    case "user.activate":
      return `הופעל מחדש החשבון של ${email}`;
    case "user.roles":
      return `עודכנו התפקידים של ${email}`;
    default:
      return `עודכנו פרטי העובד ${email}`;
  }
}

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatarUrl: true,
  title: true,
  roles: true,
  isActive: true,
  startedAt: true,
  district: { select: { nameHe: true, color: true } },
  department: { select: { nameHe: true } },
} satisfies Prisma.UserSelect;

type EmployeeRow = Prisma.UserGetPayload<{ select: typeof employeeSelect }>;

function toListItem(row: EmployeeRow): AdminEmployeeListItem {
  return {
    id: row.id,
    fullName: `${row.firstName} ${row.lastName}`,
    initials: `${row.firstName[0] ?? ""}${row.lastName[0] ?? ""}`,
    email: row.email,
    avatarUrl: row.avatarUrl,
    title: row.title,
    roles: row.roles,
    districtName: row.district?.nameHe ?? null,
    districtColor: row.district?.color ?? null,
    departmentName: row.department?.nameHe ?? null,
    isActive: row.isActive,
    startedAt: row.startedAt?.toISOString() ?? null,
  };
}
