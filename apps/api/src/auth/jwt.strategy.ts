import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { permissionsFor } from "@moch/contracts";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../common/prisma/prisma.service";
import type { AuthenticatedUser, JwtPayload } from "./types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET") ?? "dev-only-change-me",
    });
  }

  /**
   * The token is trusted for identity only. Roles and scope are re-read from the
   * database on every request, so revoking a role takes effect immediately
   * rather than whenever the access token happens to expire.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        roles: true,
        isActive: true,
        departmentId: true,
        districtId: true,
        organizationId: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("המשתמש אינו פעיל");
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      permissions: permissionsFor(user.roles),
      scope: {
        userId: user.id,
        departmentId: user.departmentId,
        districtId: user.districtId,
        organizationId: user.organizationId,
        roles: user.roles,
      },
    };
  }
}
