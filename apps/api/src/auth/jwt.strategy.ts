import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { permissionsFor } from "@moch/contracts";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../common/prisma/prisma.service";
import { TtlCache } from "../common/ttl-cache";
import type { AuthenticatedUser, JwtPayload } from "./types";

/** Role revoke lands within this window rather than on the next access-token expiry. */
const USER_CACHE_TTL_MS = 15_000;

type CachedUserRow = {
  id: string;
  email: string;
  roles: AuthenticatedUser["roles"];
  isActive: boolean;
  departmentId: string | null;
  districtId: string | null;
  organizationId: string | null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Per-process cache. Revoking a role can take up to TTL_MS to take effect on
   * a warm instance — documented tradeoff vs a DB hit on every request.
   */
  private readonly userCache = new TtlCache<CachedUserRow>(USER_CACHE_TTL_MS);

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
   * database (with a short TTL cache), so revoking a role takes effect within
   * seconds rather than whenever the access token happens to expire.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    let user = this.userCache.get(payload.sub);

    if (!user) {
      const row = await this.prisma.user.findUnique({
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

      if (!row) throw new UnauthorizedException("המשתמש אינו פעיל");
      user = row;
      this.userCache.set(payload.sub, user);
    }

    if (!user.isActive) {
      this.userCache.delete(payload.sub);
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
