import type { ContentKind, Role, ViewerScope } from "@moch/contracts";
import { describe, expect, it } from "vitest";
import { canManage, manageableWhere, type ManageableRow } from "./manageable";

const HAIFA = "district-haifa";
const JERUSALEM = "district-jerusalem";

function viewer(roles: Role[], partial: Partial<ViewerScope> = {}): ViewerScope {
  return {
    userId: "viewer",
    departmentId: null,
    districtId: null,
    organizationId: null,
    roles,
    ...partial,
  };
}

function row(partial: Partial<ManageableRow> = {}): ManageableRow {
  return {
    authorId: "someone-else",
    districtId: null,
    audDistrictIds: [],
    kind: "ANNOUNCEMENT",
    ...partial,
  };
}

describe("canManage", () => {
  it("lets content:manage roles manage everything", () => {
    for (const role of ["ADMIN", "CONTENT_EDITOR"] as Role[]) {
      expect(canManage(row(), viewer([role]))).toBe(true);
      expect(canManage(row({ districtId: JERUSALEM }), viewer([role]))).toBe(true);
    }
  });

  it("lets anyone manage what they authored", () => {
    const author = viewer(["MANAGER"], { userId: "me" });
    expect(canManage(row({ authorId: "me" }), author)).toBe(true);
    expect(canManage(row({ authorId: "someone-else" }), author)).toBe(false);
  });

  it("scopes a district manager to their own district", () => {
    const haifa = viewer(["DISTRICT_MANAGER"], { districtId: HAIFA });
    expect(canManage(row({ districtId: HAIFA }), haifa)).toBe(true);
    expect(canManage(row({ audDistrictIds: [HAIFA] }), haifa)).toBe(true);
    expect(canManage(row({ districtId: JERUSALEM }), haifa)).toBe(false);
    expect(canManage(row({ audDistrictIds: [JERUSALEM] }), haifa)).toBe(false);
  });

  /**
   * The one that matters.
   *
   * An empty audience means "the whole Ministry", and in the employee app the
   * Haifa district manager can SEE that announcement — audienceWhere treats an
   * empty dimension as unconstrained. Here the same empty array must mean the
   * opposite: it is not theirs to edit. If this test ever goes green with the
   * assertion flipped, every district manager can rewrite ministry-wide content.
   */
  it("does NOT let a district manager manage ministry-wide content", () => {
    const haifa = viewer(["DISTRICT_MANAGER"], { districtId: HAIFA });
    expect(canManage(row({ districtId: null, audDistrictIds: [] }), haifa)).toBe(false);
  });

  it("gives a district manager with no district no district scope", () => {
    const homeless = viewer(["DISTRICT_MANAGER"], { districtId: null });
    expect(canManage(row({ districtId: HAIFA }), homeless)).toBe(false);
    expect(canManage(row({ districtId: null }), homeless)).toBe(false);
  });

  it("scopes HR by kind, across every district", () => {
    const hr = viewer(["HR"]);
    expect(canManage(row({ kind: "CAREER", districtId: JERUSALEM }), hr)).toBe(true);
    expect(canManage(row({ kind: "TRAINING" }), hr)).toBe(true);
    expect(canManage(row({ kind: "ANNOUNCEMENT" }), hr)).toBe(false);
  });

  it("gives an employee nothing", () => {
    expect(canManage(row(), viewer(["EMPLOYEE"]))).toBe(false);
  });
});

/**
 * The two implementations must agree.
 *
 * `canManage` runs in Node; `manageableWhere` runs in Postgres. Nothing forces
 * them to say the same thing — so this evaluates the compiled where-clause in
 * memory against the same fixtures and asserts, cell by cell, that it does.
 * `audience.spec.ts` does exactly this for the visibility rule, for exactly the
 * same reason.
 */
function matchesWhere(where: Record<string, unknown>, r: ManageableRow, viewerId: string): boolean {
  // {} — the unconstrained clause returned for content:manage.
  if (Object.keys(where).length === 0) return true;

  const clauses = (where.OR ?? []) as Record<string, any>[];

  return clauses.some((clause) => {
    if ("authorId" in clause) return r.authorId === clause.authorId && clause.authorId === viewerId;
    if ("districtId" in clause) return r.districtId === clause.districtId;
    if ("audDistrictIds" in clause) return r.audDistrictIds.includes(clause.audDistrictIds.has);
    if ("kind" in clause) return (clause.kind.in as ContentKind[]).includes(r.kind);
    return false;
  });
}

describe("manageableWhere agrees with canManage", () => {
  const viewers: ViewerScope[] = [
    viewer(["ADMIN"]),
    viewer(["CONTENT_EDITOR"]),
    viewer(["DISTRICT_MANAGER"], { districtId: HAIFA, userId: "dm" }),
    viewer(["DISTRICT_MANAGER"], { districtId: null, userId: "dm" }),
    viewer(["HR"], { userId: "hr" }),
    viewer(["MANAGER"], { userId: "mgr" }),
    viewer(["EMPLOYEE"], { userId: "emp" }),
  ];

  const kinds: ContentKind[] = ["ANNOUNCEMENT", "CAREER", "TRAINING", "EVENT"];
  const authors = ["dm", "hr", "mgr", "emp", "someone-else", null];
  const districts = [HAIFA, JERUSALEM, null];
  const audiences = [[], [HAIFA], [JERUSALEM], [HAIFA, JERUSALEM]];

  const rows: ManageableRow[] = [];
  for (const kind of kinds) {
    for (const authorId of authors) {
      for (const districtId of districts) {
        for (const audDistrictIds of audiences) {
          rows.push({ kind, authorId, districtId, audDistrictIds });
        }
      }
    }
  }

  it(`agrees on every combination`, () => {
    for (const v of viewers) {
      const where = manageableWhere(v);
      for (const r of rows) {
        expect(
          matchesWhere(where, r, v.userId),
          `disagreement for roles=${v.roles} district=${v.districtId} on ${JSON.stringify(r)}`,
        ).toBe(canManage(r, v));
      }
    }
  });
});
