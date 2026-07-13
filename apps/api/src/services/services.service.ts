import { Injectable } from "@nestjs/common";
import type { ServicesResponse } from "@moch/contracts";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The whole Services screen in one request, in the order an admin set.
   *
   * No audience filtering: a quick action is a task every employee can start
   * (report hours, file a request), and a quick link is a system they all have.
   * If a link ever needs to be targeted, it grows the same audience columns the
   * content tables already use — it does not need a different shape here.
   */
  async getServices(): Promise<ServicesResponse> {
    const [quickActions, quickLinks] = await Promise.all([
      this.prisma.quickAction.findMany({ orderBy: { order: "asc" } }),
      this.prisma.quickLink.findMany({ orderBy: { order: "asc" } }),
    ]);

    return { quickActions, quickLinks };
  }
}
