import { Controller, Get } from "@nestjs/common";
import type { ServicesResponse } from "@moch/contracts";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  getServices(): Promise<ServicesResponse> {
    return this.services.getServices();
  }
}
