import { z } from "zod";

export const RoleSchema = z.enum([
  "EMPLOYEE",
  "MANAGER",
  "DISTRICT_MANAGER",
  "CONTENT_EDITOR",
  "HR",
  "EXECUTIVE",
  "ADMIN",
]);
export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.enum([
  "content:publish",
  "content:edit",
  "content:delete",
  "content:approve",
  "content:manage",
  "feeds:manage",
  "users:manage",
  "analytics:view",
]);
export type Permission = z.infer<typeof PermissionSchema>;

/**
 * The permissions matrix. The API guard is the enforcement point — the admin UI
 * that exercises these arrives in round two, but the rules are already real.
 *
 * DISTRICT_MANAGER and MANAGER can publish, but only within their own scope;
 * scope is enforced separately by the audience rules on the content itself.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  EMPLOYEE: [],
  MANAGER: ["content:publish", "content:edit"],
  DISTRICT_MANAGER: ["content:publish", "content:edit", "content:approve"],
  CONTENT_EDITOR: ["content:publish", "content:edit", "content:delete", "content:manage", "feeds:manage"],
  HR: ["content:publish", "content:edit", "users:manage"],
  EXECUTIVE: ["content:publish", "content:approve", "analytics:view"],
  ADMIN: [
    "content:publish",
    "content:edit",
    "content:delete",
    "content:approve",
    "content:manage",
    "feeds:manage",
    "users:manage",
    "analytics:view",
  ],
} as const;

export function hasPermission(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function permissionsFor(roles: readonly Role[]): Permission[] {
  const all = new Set<Permission>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role]) all.add(permission);
  }
  return [...all];
}
