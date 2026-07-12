import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AuthTokens, LoginResponse } from "@moch/contracts";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../common/prisma/prisma.service";
import { toCurrentUser, USER_INCLUDE } from "../users/user.mapper";
import { AUTH_PROVIDER, type AuthProvider } from "./providers/auth-provider";
import type { JwtPayload } from "./types";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private readonly authProvider: AuthProvider,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const verified = await this.authProvider.verify(email, password);
    if (!verified) {
      throw new UnauthorizedException("כתובת דוא״ל או סיסמה שגויים");
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: verified.id },
      include: USER_INCLUDE,
    });

    const tokens = await this.issueTokens({ sub: user.id, email: user.email, roles: user.roles });
    return { tokens, user: toCurrentUser(user) };
  }

  /**
   * Refresh tokens are single-use: presenting one revokes it and issues a new
   * pair. A replayed token is therefore already revoked and gets rejected.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException("תוקף החיבור פג, יש להתחבר מחדש");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens({
      sub: stored.user.id,
      email: stored.user.email,
      roles: stored.user.roles,
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>("JWT_SECRET") ?? "dev-only-change-me",
      expiresIn: this.config.get<string>("JWT_ACCESS_TTL") ?? "15m",
    });

    // The refresh token is opaque — a random string we store hashed. It carries
    // no claims, so it cannot be read or forged, only presented and checked.
    const refreshToken = randomBytes(48).toString("base64url");
    const ttlDays = parseTtlDays(this.config.get<string>("JWT_REFRESH_TTL") ?? "7d");

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function parseTtlDays(ttl: string): number {
  const match = /^(\d+)d$/.exec(ttl);
  return match?.[1] ? Number(match[1]) : 7;
}
