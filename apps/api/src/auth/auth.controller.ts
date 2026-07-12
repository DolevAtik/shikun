import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import {
  type CurrentUser as CurrentUserDto,
  type LoginResponse,
  LoginRequestSchema,
  RefreshRequestSchema,
} from "@moch/contracts";
import { ZodBody } from "../common/zod-body.decorator";
import { PrismaService } from "../common/prisma/prisma.service";
import { toCurrentUser, USER_INCLUDE } from "../users/user.mapper";
import { AuthService } from "./auth.service";
import { CurrentUser, Public } from "./decorators";
import type { AuthenticatedUser } from "./types";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  login(@ZodBody(LoginRequestSchema) body: { email: string; password: string }): Promise<LoginResponse> {
    return this.auth.login(body.email, body.password);
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  refresh(@ZodBody(RefreshRequestSchema) body: { refreshToken: string }) {
    return this.auth.refresh(body.refreshToken);
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  async logout(@Body() body: { refreshToken?: string }): Promise<void> {
    if (body.refreshToken) await this.auth.logout(body.refreshToken);
  }

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser): Promise<CurrentUserDto> {
    const found = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: USER_INCLUDE,
    });
    return toCurrentUser(found);
  }
}
