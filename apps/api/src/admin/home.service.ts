import { Injectable } from "@nestjs/common";
import type {
  AdminHomeSection,
  AdminHomeSections,
  UpdateHomeSections,
} from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser } from "../auth/types";
import { HomeService } from "../home/home.service";
import { AuditService } from "./audit.service";

@Injectable()
export class AdminHomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly home: HomeService,
    private readonly audit: AuditService,
  ) {}

  async listSections(): Promise<AdminHomeSections> {
    const rows = await this.prisma.homeSectionConfig.findMany({
      orderBy: { order: "asc" },
    });

    return {
      sections: rows.map(
        (row): AdminHomeSection => ({
          id: row.id,
          type: row.type,
          order: row.order,
          title: row.title,
          isEnabled: row.isEnabled,
          maxItems: row.maxItems,
          audience: {
            departmentIds: row.audDepartmentIds,
            districtIds: row.audDistrictIds,
            organizationIds: row.audOrganizationIds,
            roles: row.audRoles,
          },
        }),
      ),
    };
  }

  async updateSections(
    user: AuthenticatedUser,
    input: UpdateHomeSections,
  ): Promise<AdminHomeSections> {
    await this.prisma.$transaction(
      input.sections.map((section) =>
        this.prisma.homeSectionConfig.update({
          where: { id: section.id },
          data: {
            order: section.order,
            isEnabled: section.isEnabled,
            ...(section.title !== undefined ? { title: section.title } : {}),
            ...(section.maxItems !== undefined ? { maxItems: section.maxItems } : {}),
          },
        }),
      ),
    );

    this.home.invalidateSectionConfigCache();

    await this.audit.record(user, {
      action: "home.sections.update",
      entityType: "HomeSectionConfig",
      entityId: "layout",
      summary: `עודכנה פריסת מסך הבית (${input.sections.length} מקטעים)`,
      after: input.sections,
    });

    return this.listSections();
  }
}
