import { Controller, Get } from "@nestjs/common";
import type { Department, District, Organization } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import { toDepartment, toDistrict, toOrganization } from "../users/user.mapper";

@Controller("org")
export class OrgController {
  constructor(private readonly prisma: PrismaService) {}

  /** The five districts. Feeds the district filter, and later the map. */
  @Get("districts")
  async districts(): Promise<District[]> {
    const rows = await this.prisma.district.findMany({ orderBy: { nameHe: "asc" } });
    return rows.map(toDistrict);
  }

  @Get("departments")
  async departments(): Promise<Department[]> {
    const rows = await this.prisma.department.findMany({ orderBy: { nameHe: "asc" } });
    return rows.map(toDepartment);
  }

  @Get("organizations")
  async organizations(): Promise<Organization[]> {
    const rows = await this.prisma.organization.findMany({ orderBy: { nameHe: "asc" } });
    return rows.map(toOrganization);
  }
}
