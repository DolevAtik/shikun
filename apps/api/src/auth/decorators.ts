import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Permission } from "@moch/contracts";
import type { AuthenticatedUser } from "./types";

export const IS_PUBLIC_KEY = "isPublic";
/** Opt a route out of authentication. Everything else requires a valid token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const PERMISSIONS_KEY = "requiredPermissions";
/** Require every listed permission. Enforced by PermissionsGuard. */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    return context.switchToHttp().getRequest().user as AuthenticatedUser;
  },
);
