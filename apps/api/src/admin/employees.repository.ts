import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminEmployeeDetail,
  AdminEmployeeListItem,
  AdminEmployeeListQuery,
  AdminEmployeePage,
} from "@moch/contracts";
import type { Prisma } from "@prisma/client";
import { manageableUsersWhere } from "../audience/manageable";
import { toPage, skipTake } from "../common/pagination";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";

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
  constructor(private readonly prisma: PrismaService) {}

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
        organization: { select: { nameHe: true } },
        _count: { select: { authoredContent: true, comments: true } },
      },
    });
    // "Not yours" and "not found" look identical, on purpose.
    if (!row) throw new NotFoundException("העובד לא נמצא");

    return {
      ...toListItem(row),
      phone: row.phone,
      bio: row.bio,
      organizationName: row.organization?.nameHe ?? null,
      authoredCount: row._count.authoredContent,
      commentCount: row._count.comments,
    };
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
