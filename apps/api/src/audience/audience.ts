import type { Audience, Role, ViewerScope } from "@moch/contracts";

/**
 * The one function that decides who sees what.
 *
 * Rules, in full:
 *   - An empty dimension means "no constraint on this dimension".
 *   - A non-empty dimension means the viewer must match at least one entry.
 *   - Dimensions are ANDed.
 *   - A viewer with no department cannot satisfy a department-constrained rule.
 *
 * Everything in the product — Home, Feed, search, notifications — reads
 * visibility through here. It is pure on purpose: it is the thing most worth
 * unit-testing, and a pure function is the thing easiest to test.
 */
export function audienceMatches(audience: Audience, viewer: ViewerScope): boolean {
  return (
    dimensionMatches(audience.departmentIds, viewer.departmentId) &&
    dimensionMatches(audience.districtIds, viewer.districtId) &&
    dimensionMatches(audience.organizationIds, viewer.organizationId) &&
    rolesMatch(audience.roles, viewer.roles)
  );
}

function dimensionMatches(allowed: readonly string[], viewerValue: string | null): boolean {
  if (allowed.length === 0) return true;
  if (viewerValue === null) return false;
  return allowed.includes(viewerValue);
}

function rolesMatch(allowed: readonly Role[], viewerRoles: readonly Role[]): boolean {
  if (allowed.length === 0) return true;
  return viewerRoles.some((role) => allowed.includes(role));
}

/** The audience columns as stored on a ContentItem or HomeSectionConfig row. */
export interface AudienceColumns {
  audDepartmentIds: string[];
  audDistrictIds: string[];
  audOrganizationIds: string[];
  audRoles: Role[];
}

export function toAudience(row: AudienceColumns): Audience {
  return {
    departmentIds: row.audDepartmentIds,
    districtIds: row.audDistrictIds,
    organizationIds: row.audOrganizationIds,
    roles: row.audRoles,
  };
}

/**
 * The same rule expressed as a Prisma filter, so targeting happens in the
 * database rather than by loading every row and filtering in Node.
 *
 * The in-memory `audienceMatches` above and this filter must agree — the tests
 * assert they do, because a divergence here leaks content to the wrong people.
 */
export function audienceWhere(viewer: ViewerScope): Record<string, unknown> {
  return {
    AND: [
      dimensionWhere("audDepartmentIds", viewer.departmentId),
      dimensionWhere("audDistrictIds", viewer.districtId),
      dimensionWhere("audOrganizationIds", viewer.organizationId),
      viewer.roles.length > 0
        ? { OR: [{ audRoles: { isEmpty: true } }, { audRoles: { hasSome: viewer.roles } }] }
        : { audRoles: { isEmpty: true } },
    ],
  };
}

function dimensionWhere(field: string, viewerValue: string | null): Record<string, unknown> {
  if (viewerValue === null) {
    return { [field]: { isEmpty: true } };
  }
  return {
    OR: [{ [field]: { isEmpty: true } }, { [field]: { has: viewerValue } }],
  };
}
