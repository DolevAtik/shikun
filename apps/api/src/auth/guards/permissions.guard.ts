import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Permission } from "@moch/contracts";
import { PERMISSIONS_KEY } from "../decorators";
import type { AuthenticatedUser } from "../types";

/**
 * The API is the enforcement point for the permissions matrix. The admin UI
 * that exercises these rules ships in round two — the rules are already live.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as AuthenticatedUser | undefined;
    if (!user) throw new ForbiddenException("נדרשת הזדהות");

    const missing = required.filter((permission) => !user.permissions.includes(permission));
    if (missing.length > 0) {
      throw new ForbiddenException(`אין לך הרשאה לפעולה זו (${missing.join(", ")})`);
    }

    return true;
  }
}
