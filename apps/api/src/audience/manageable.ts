import type { ContentKind, Permission, Role, ViewerScope } from "@moch/contracts";
import { hasPermission } from "@moch/contracts";

/**
 * Who may *change* a piece of content.
 *
 * Read `audience.ts` first, then read this — and hold the difference in your head,
 * because it is the single easiest thing in this system to get backwards:
 *
 *   audienceWhere(viewer)    answers "may I SEE this?"
 *                            an empty dimension means EVERYONE.
 *
 *   manageableWhere(viewer)  answers "may I CHANGE this?"
 *                            an empty dimension means NOBODY but a ministry-wide manager.
 *
 * They are not inverses. They are different questions, and the same empty array
 * means the opposite thing in each. Concretely: a ministry-wide announcement
 * (empty audience) is VISIBLE to the Haifa district manager in the employee app,
 * and is NOT MANAGEABLE by them here. That is correct. `{ has: x }` excludes
 * empty arrays, which is exactly the behaviour we want and exactly the behaviour
 * that looks like a bug if you skim it.
 *
 * No admin list endpoint may ever call `audienceWhere`. An administrator manages
 * what they are responsible for, not what is targeted at them.
 *
 * Like its sibling this exists in two forms — a pure predicate and a compiled
 * Prisma filter — and `manageable.spec.ts` asserts they agree over a fixture
 * matrix. A divergence here does not leak content; it silently grants edit rights.
 */

/** The columns `canManage` needs to decide. A subset of a real ContentItem row. */
export interface ManageableRow {
  authorId: string | null;
  districtId: string | null;
  audDistrictIds: string[];
  kind: ContentKind;
}

/** Kinds a role may manage regardless of district. HR owns hiring and training. */
const KIND_SCOPE: Partial<Record<Role, readonly ContentKind[]>> = {
  HR: ["CAREER", "TRAINING"],
};

/**
 * The viewer's management scope, derived in ONE place.
 *
 * Phase 4 introduces custom roles with per-assignment scope
 * (`UserRoleAssignment.scopeDistrictIds`), and when it does, only the body of
 * this function changes — not the two implementations below, and not their call
 * sites. That is the entire reason it exists as its own function today.
 */
export interface ManageScope {
  /** Unrestricted: may manage every item in the Ministry. */
  global: boolean;
  /** May manage items belonging to, or targeted at, this district. */
  districtId: string | null;
  /** May manage these kinds anywhere. */
  kinds: readonly ContentKind[];
}

export function scopeFor(viewer: ViewerScope): ManageScope {
  const can = (permission: Permission) => hasPermission(viewer.roles, permission);

  const kinds = new Set<ContentKind>();
  for (const role of viewer.roles) {
    for (const kind of KIND_SCOPE[role] ?? []) kinds.add(kind);
  }

  return {
    global: can("content:manage"),
    // A district manager without a district manages nothing by district — the
    // null is not "all districts", it is "no district".
    districtId: can("content:approve") ? viewer.districtId : null,
    kinds: [...kinds],
  };
}

/** Pure. The in-memory twin of `manageableWhere`. */
export function canManage(row: ManageableRow, viewer: ViewerScope): boolean {
  const scope = scopeFor(viewer);
  if (scope.global) return true;

  // You may always manage what you wrote.
  if (row.authorId !== null && row.authorId === viewer.userId) return true;

  if (scope.districtId !== null) {
    if (row.districtId === scope.districtId) return true;
    // `.includes` on a non-empty array — an EMPTY audience is deliberately not a
    // match. Ministry-wide content is not a district manager's to edit.
    if (row.audDistrictIds.includes(scope.districtId)) return true;
  }

  if (scope.kinds.includes(row.kind)) return true;

  return false;
}

/**
 * The same rule, compiled to a Prisma `where`, so scoping happens in Postgres.
 *
 * Callers AND this with their own filters. It is never optional: `AdminContentRepository`
 * applies it to every read and every write, and `scripts/check-admin-scope.mjs`
 * fails the build if anything else touches `prisma.contentItem` directly.
 */
export function manageableWhere(viewer: ViewerScope): Record<string, unknown> {
  const scope = scopeFor(viewer);
  if (scope.global) return {};

  const clauses: Record<string, unknown>[] = [{ authorId: viewer.userId }];

  if (scope.districtId !== null) {
    clauses.push({ districtId: scope.districtId });
    clauses.push({ audDistrictIds: { has: scope.districtId } });
  }

  if (scope.kinds.length > 0) {
    clauses.push({ kind: { in: scope.kinds } });
  }

  return { OR: clauses };
}

/**
 * Employees. HR and ADMIN see everyone; a district manager sees their district.
 * Deliberately simpler than content: there is no "authored by me" notion here.
 */
export function manageableUsersWhere(viewer: ViewerScope): Record<string, unknown> {
  if (hasPermission(viewer.roles, "users:manage")) return {};
  if (hasPermission(viewer.roles, "content:approve") && viewer.districtId !== null) {
    return { districtId: viewer.districtId };
  }
  // A never-match clause. They cannot reach the console at all (admin:access),
  // but a repository must still be safe when called by mistake.
  return { id: { in: [] } };
}
