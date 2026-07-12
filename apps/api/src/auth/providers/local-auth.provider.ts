import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../../common/prisma/prisma.service";
import type { AuthProvider } from "./auth-provider";

@Injectable()
export class LocalAuthProvider implements AuthProvider {
  readonly name = "local";

  constructor(private readonly prisma: PrismaService) {}

  async verify(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.isActive) {
      // Hash anyway so a missing account and a wrong password take the same
      // time — otherwise the response time enumerates who works here.
      await argon2.verify(DUMMY_HASH, password).catch(() => false);
      return null;
    }

    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    return ok ? user : null;
  }
}

/** An argon2 hash of a value nobody knows, used only to equalize timing. */
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$Qy8kFJ0zJ0J5H4dLTt4gVfP6mZ4Rr8pQeF3Yw1KcXqA";
