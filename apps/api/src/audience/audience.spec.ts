import type { Audience, ViewerScope } from "@moch/contracts";
import { describe, expect, it } from "vitest";
import { audienceMatches } from "./audience";

const HAIFA = "district-haifa";
const JERUSALEM = "district-jerusalem";
const PLANNING = "dept-planning";
const FINANCE = "dept-finance";
const AMIDAR = "org-amidar";

function audience(partial: Partial<Audience> = {}): Audience {
  return { departmentIds: [], districtIds: [], organizationIds: [], roles: [], ...partial };
}

function viewer(partial: Partial<ViewerScope> = {}): ViewerScope {
  return {
    userId: "u1",
    departmentId: PLANNING,
    districtId: HAIFA,
    organizationId: null,
    roles: ["EMPLOYEE"],
    ...partial,
  };
}

describe("audienceMatches", () => {
  it("shows an unconstrained audience to everyone", () => {
    expect(audienceMatches(audience(), viewer())).toBe(true);
    expect(
      audienceMatches(
        audience(),
        viewer({ departmentId: null, districtId: null, organizationId: null, roles: [] }),
      ),
    ).toBe(true);
  });

  it("constrains by district", () => {
    const haifaOnly = audience({ districtIds: [HAIFA] });
    expect(audienceMatches(haifaOnly, viewer({ districtId: HAIFA }))).toBe(true);
    expect(audienceMatches(haifaOnly, viewer({ districtId: JERUSALEM }))).toBe(false);
  });

  it("matches any entry within a dimension (OR within, not AND)", () => {
    const twoDistricts = audience({ districtIds: [HAIFA, JERUSALEM] });
    expect(audienceMatches(twoDistricts, viewer({ districtId: JERUSALEM }))).toBe(true);
  });

  it("ANDs across dimensions — 'planners in Haifa' excludes planners elsewhere", () => {
    const plannersInHaifa = audience({ districtIds: [HAIFA], departmentIds: [PLANNING] });

    expect(audienceMatches(plannersInHaifa, viewer({ districtId: HAIFA, departmentId: PLANNING }))).toBe(true);
    expect(audienceMatches(plannersInHaifa, viewer({ districtId: JERUSALEM, departmentId: PLANNING }))).toBe(
      false,
    );
    expect(audienceMatches(plannersInHaifa, viewer({ districtId: HAIFA, departmentId: FINANCE }))).toBe(false);
  });

  it("excludes a viewer who has no value on a constrained dimension", () => {
    // A headquarters employee with no district must not receive district-targeted content.
    const haifaOnly = audience({ districtIds: [HAIFA] });
    expect(audienceMatches(haifaOnly, viewer({ districtId: null }))).toBe(false);
  });

  it("constrains by role, matching if the viewer holds any listed role", () => {
    const managersOnly = audience({ roles: ["MANAGER", "DISTRICT_MANAGER"] });

    expect(audienceMatches(managersOnly, viewer({ roles: ["EMPLOYEE"] }))).toBe(false);
    expect(audienceMatches(managersOnly, viewer({ roles: ["EMPLOYEE", "MANAGER"] }))).toBe(true);
  });

  it("constrains by organization, so subordinate-body staff are scoped out", () => {
    const ministryOnly = audience({ organizationIds: ["org-ministry"] });

    expect(audienceMatches(ministryOnly, viewer({ organizationId: "org-ministry" }))).toBe(true);
    expect(audienceMatches(ministryOnly, viewer({ organizationId: AMIDAR }))).toBe(false);
  });

  it("combines role and district — 'managers in Jerusalem' is exactly that", () => {
    const rule = audience({ districtIds: [JERUSALEM], roles: ["MANAGER"] });

    expect(audienceMatches(rule, viewer({ districtId: JERUSALEM, roles: ["MANAGER"] }))).toBe(true);
    expect(audienceMatches(rule, viewer({ districtId: JERUSALEM, roles: ["EMPLOYEE"] }))).toBe(false);
    expect(audienceMatches(rule, viewer({ districtId: HAIFA, roles: ["MANAGER"] }))).toBe(false);
  });
});
