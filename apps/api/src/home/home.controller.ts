import { Controller, Get } from "@nestjs/common";
import type { HomeResponse } from "@moch/contracts";
import { CurrentUser } from "../auth/decorators";
import type { AuthenticatedUser } from "../auth/types";
import { HomeService } from "./home.service";

@Controller("home")
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get()
  getHome(@CurrentUser() user: AuthenticatedUser): Promise<HomeResponse> {
    return this.home.getHome(user.scope);
  }
}
