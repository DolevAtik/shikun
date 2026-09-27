import type { Role } from "@moch/contracts";

export interface EmployeeChange {
  actorId: string;
  actorRoles: readonly Role[];
  targetId: string;
  rolesBefore: readonly Role[];
  rolesAfter?: readonly Role[];
  isActiveAfter?: boolean;
}

/**
 * Why an employee change is refused, or null when it is allowed. Pure, so the
 * rules that keep the console from locking people out are tested on their own.
 *
 *  - Nobody changes their own roles or deactivates themselves: the one mistake
 *    that cannot be undone from inside the console.
 *  - Only an ADMIN grants or removes ADMIN, and only an ADMIN changes anything
 *    about an existing ADMIN — HR manages people, not the system's owners.
 */
export function employeeChangeProblem(change: EmployeeChange): string | null {
  const self = change.actorId === change.targetId;
  const rolesChanged =
    change.rolesAfter !== undefined && !sameRoles(change.rolesBefore, change.rolesAfter);

  if (self && rolesChanged) return "אי אפשר לשנות את התפקידים של עצמך";
  if (self && change.isActiveAfter === false) return "אי אפשר להשבית את החשבון של עצמך";

  const actorIsAdmin = change.actorRoles.includes("ADMIN");
  if (!actorIsAdmin) {
    if (change.rolesBefore.includes("ADMIN")) return "רק מנהל מערכת יכול לשנות מנהל מערכת";
    if (change.rolesAfter?.includes("ADMIN")) return "רק מנהל מערכת יכול להעניק הרשאת מנהל מערכת";
  }

  return null;
}

function sameRoles(a: readonly Role[], b: readonly Role[]): boolean {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((role) => right.has(role));
}
