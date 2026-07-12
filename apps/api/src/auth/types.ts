import type { Permission, Role, ViewerScope } from "@moch/contracts";

/** What the JWT strategy attaches to the request. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  scope: ViewerScope;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}
