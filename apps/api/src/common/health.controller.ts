import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "../auth/decorators";
import { PrismaService } from "./prisma/prisma.service";

/**
 * What a hosting platform polls, and the first thing to open by hand after a
 * deploy. It touches the database on purpose: a process that is up but cannot
 * reach Postgres is not healthy, and that is the failure worth catching early.
 */
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  async check(): Promise<{ status: string; database: string }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "up" };
  }
}
