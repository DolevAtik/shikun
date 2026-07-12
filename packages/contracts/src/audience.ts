import { z } from "zod";
import { RoleSchema } from "./roles";

/**
 * The one idea the whole product rests on: every piece of content carries an
 * audience rule, and a single resolver decides who sees it.
 *
 * Semantics — deliberately simple, because targeting rules nobody understands
 * are targeting rules nobody uses:
 *
 *   - An empty list means "no constraint on this dimension".
 *   - A non-empty list means the viewer must match at least one entry.
 *   - Dimensions are ANDed: a viewer must satisfy every constrained dimension.
 *
 * So `{ districtIds: [haifa], roles: [] }` is "everyone in Haifa", and
 * `{ districtIds: [haifa], roles: [MANAGER] }` is "managers in Haifa".
 * An entirely empty audience is "the whole Ministry".
 */
export const AudienceSchema = z.object({
  departmentIds: z.array(z.string()).default([]),
  districtIds: z.array(z.string()).default([]),
  organizationIds: z.array(z.string()).default([]),
  roles: z.array(RoleSchema).default([]),
});
export type Audience = z.infer<typeof AudienceSchema>;

export const EMPTY_AUDIENCE: Audience = {
  departmentIds: [],
  districtIds: [],
  organizationIds: [],
  roles: [],
};

/** The viewer facts the resolver matches an audience against. */
export const ViewerScopeSchema = z.object({
  userId: z.string(),
  departmentId: z.string().nullable(),
  districtId: z.string().nullable(),
  organizationId: z.string().nullable(),
  roles: z.array(RoleSchema),
});
export type ViewerScope = z.infer<typeof ViewerScopeSchema>;
