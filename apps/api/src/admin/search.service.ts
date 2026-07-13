import { Injectable } from "@nestjs/common";
import type { SearchResponse } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { manageableWhere } from "../audience/manageable";

const PER_GROUP = 5;

/**
 * One endpoint, results grouped by what they are.
 *
 * Content hits are filtered through `manageableWhere` — an administrator
 * searching for "הודעה" must not see ministry-wide drafts they cannot edit,
 * even though those drafts are visible to them in the employee app.
 */
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(user: AuthenticatedUser, term: string): Promise<SearchResponse> {
    const q = term.trim();
    if (q.length < 2) return { groups: [] };

    const contains = { contains: q, mode: "insensitive" as const };
    const manageFilter = manageableWhere(user.scope);

    const [content, employees, districts, departments, media] = await Promise.all([
      this.prisma.contentItem.findMany({
        where: { AND: [manageFilter, { OR: [{ title: contains }, { body: contains }] }] },
        select: { id: true, title: true, kind: true },
        take: PER_GROUP,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.user.findMany({
        where: {
          isActive: true,
          OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
          department: { select: { nameHe: true } },
        },
        take: PER_GROUP,
        orderBy: { lastName: "asc" },
      }),
      this.prisma.district.findMany({
        where: { OR: [{ nameHe: contains }, { nameEn: contains }] },
        select: { id: true, nameHe: true },
        take: PER_GROUP,
      }),
      this.prisma.department.findMany({
        where: { OR: [{ nameHe: contains }, { nameEn: contains }] },
        select: { id: true, nameHe: true },
        take: PER_GROUP,
      }),
      this.prisma.media.findMany({
        where: { OR: [{ alt: contains }, { fileName: contains }, { url: contains }] },
        select: { id: true, alt: true, fileName: true, kind: true },
        take: PER_GROUP,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const groups: SearchResponse["groups"] = [];

    if (content.length) {
      groups.push({
        group: "content",
        items: content.map((item) => ({
          id: item.id,
          title: item.title ?? item.kind,
          subtitle: item.kind,
          href: `/content/${item.id}`,
        })),
      });
    }

    if (employees.length) {
      groups.push({
        group: "employees",
        items: employees.map((person) => ({
          id: person.id,
          title: `${person.firstName} ${person.lastName}`,
          subtitle: person.title ?? person.department?.nameHe ?? null,
          href: `/employees/${person.id}`,
        })),
      });
    }

    if (districts.length) {
      groups.push({
        group: "districts",
        items: districts.map((district) => ({
          id: district.id,
          title: district.nameHe,
          subtitle: null,
          href: `/districts/${district.id}`,
        })),
      });
    }

    if (departments.length) {
      groups.push({
        group: "departments",
        items: departments.map((department) => ({
          id: department.id,
          title: department.nameHe,
          subtitle: null,
          href: `/districts?department=${department.id}`,
        })),
      });
    }

    if (media.length) {
      groups.push({
        group: "media",
        items: media.map((file) => ({
          id: file.id,
          title: file.alt ?? file.fileName ?? file.id,
          subtitle: file.kind,
          href: `/media?id=${file.id}`,
        })),
      });
    }

    return { groups };
  }
}
