import { Controller, Get } from "@nestjs/common";
import type { JobsResponse } from "@moch/contracts";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  getJobs(@CurrentUser() user: AuthenticatedUser): Promise<JobsResponse> {
    return this.jobs.getJobs(user.scope);
  }
}
