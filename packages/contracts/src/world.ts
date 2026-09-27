import { z } from "zod";

export const WorldFocusSchema = z.enum(["know", "feel", "develop", "participate"]);
export type WorldFocus = z.infer<typeof WorldFocusSchema>;

const AvatarBackdrop = z.enum(["sand", "sky", "olive", "dusk"]);
const AvatarOutfit = z.enum(["terracotta", "navy", "olive", "plum"]);

/**
 * The personal choices stored for העולם שלי: which world the employee is
 * focusing on this week, and how their figure looks. Everything else is
 * computed — see `EmployeeProgress`.
 */
export const EmployeeWorldSchema = z.object({
  chosenWorld: WorldFocusSchema.nullable(),
  avatarBackdrop: AvatarBackdrop,
  avatarOutfit: AvatarOutfit,
});
export type EmployeeWorld = z.infer<typeof EmployeeWorldSchema>;

/** A partial update: only the fields sent change. Avatar choices need the level that opens them. */
export const UpdateEmployeeWorldSchema = z.object({
  chosenWorld: WorldFocusSchema.nullable().optional(),
  avatarBackdrop: AvatarBackdrop.optional(),
  avatarOutfit: AvatarOutfit.optional(),
});
export type UpdateEmployeeWorld = z.infer<typeof UpdateEmployeeWorldSchema>;
