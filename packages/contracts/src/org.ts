import { z } from "zod";

/**
 * The Ministry has exactly five districts (מחוזות). There is no Tel Aviv
 * district — the org chart is five, and the district map must draw five.
 */
export const DistrictCodeSchema = z.enum(["NORTH", "HAIFA", "CENTER", "JERUSALEM", "SOUTH"]);
export type DistrictCode = z.infer<typeof DistrictCodeSchema>;

export const DistrictSchema = z.object({
  id: z.string(),
  code: DistrictCodeSchema,
  nameHe: z.string(),
  nameEn: z.string(),
  /** Accent color used on the district map and on district-tagged content. */
  color: z.string(),
});
export type District = z.infer<typeof DistrictSchema>;

/**
 * A unit inside the Ministry itself: a senior division (אגף בכיר), an
 * administration (מינהל), or the legal bureau.
 */
export const DepartmentKindSchema = z.enum(["SENIOR_DIVISION", "ADMINISTRATION", "BUREAU"]);
export type DepartmentKind = z.infer<typeof DepartmentKindSchema>;

export const DepartmentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  kind: DepartmentKindSchema,
  nameHe: z.string(),
  nameEn: z.string(),
});
export type Department = z.infer<typeof DepartmentSchema>;

/**
 * Subordinate bodies (רשות מקרקעי ישראל, עמידר, חלמיש …) are separate legal
 * entities, not departments. Modeling them as a first-class relation now means
 * scoping access to their staff later is a query, not a migration.
 */
export const OrganizationSchema = z.object({
  id: z.string(),
  slug: z.string(),
  nameHe: z.string(),
  nameEn: z.string(),
  /** True for the Ministry itself; false for subordinate bodies. */
  isMinistry: z.boolean(),
});
export type Organization = z.infer<typeof OrganizationSchema>;
