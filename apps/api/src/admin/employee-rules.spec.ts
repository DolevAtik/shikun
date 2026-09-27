import { describe, expect, it } from "vitest";
import { employeeChangeProblem } from "./employee-rules";

const hr = { actorId: "hr", actorRoles: ["HR", "EMPLOYEE"] as const };
const admin = { actorId: "admin", actorRoles: ["ADMIN"] as const };

describe("employeeChangeProblem", () => {
  it("lets HR change an ordinary employee's roles and deactivate them", () => {
    expect(
      employeeChangeProblem({
        ...hr,
        targetId: "e1",
        rolesBefore: ["EMPLOYEE"],
        rolesAfter: ["EMPLOYEE", "MANAGER"],
        isActiveAfter: false,
      }),
    ).toBeNull();
  });

  it("refuses changing your own roles", () => {
    expect(
      employeeChangeProblem({ ...admin, targetId: "admin", rolesBefore: ["ADMIN"], rolesAfter: ["EMPLOYEE"] }),
    ).not.toBeNull();
  });

  it("allows saving your own profile when the roles are the same set", () => {
    expect(
      employeeChangeProblem({
        ...hr,
        targetId: "hr",
        rolesBefore: ["HR", "EMPLOYEE"],
        rolesAfter: ["EMPLOYEE", "HR"],
      }),
    ).toBeNull();
  });

  it("refuses deactivating yourself", () => {
    expect(
      employeeChangeProblem({ ...admin, targetId: "admin", rolesBefore: ["ADMIN"], isActiveAfter: false }),
    ).not.toBeNull();
  });

  it("refuses HR granting ADMIN", () => {
    expect(
      employeeChangeProblem({ ...hr, targetId: "e1", rolesBefore: ["EMPLOYEE"], rolesAfter: ["ADMIN"] }),
    ).not.toBeNull();
  });

  it("refuses HR touching an existing ADMIN, even without a role change", () => {
    expect(
      employeeChangeProblem({ ...hr, targetId: "a2", rolesBefore: ["ADMIN"], isActiveAfter: false }),
    ).not.toBeNull();
  });

  it("lets an ADMIN grant and remove ADMIN on someone else", () => {
    expect(
      employeeChangeProblem({ ...admin, targetId: "e1", rolesBefore: ["EMPLOYEE"], rolesAfter: ["ADMIN"] }),
    ).toBeNull();
    expect(
      employeeChangeProblem({ ...admin, targetId: "a2", rolesBefore: ["ADMIN"], rolesAfter: ["EMPLOYEE"] }),
    ).toBeNull();
  });
});
