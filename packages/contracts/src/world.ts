import { z } from "zod";

export const WorldFocusSchema = z.enum(["know", "feel", "develop", "participate"]);
export type WorldFocus = z.infer<typeof WorldFocusSchema>;

/**
 * The one personal choice stored for העולם שלי: which world the employee is
 * focusing on this week. Everything else is computed — see `EmployeeProgress`.
 */
export const EmployeeWorldSchema = z.object({
  chosenWorld: WorldFocusSchema.nullable(),
});
export type EmployeeWorld = z.infer<typeof EmployeeWorldSchema>;

export const UpdateEmployeeWorldSchema = z.object({
  chosenWorld: WorldFocusSchema.nullable(),
});
export type UpdateEmployeeWorld = z.infer<typeof UpdateEmployeeWorldSchema>;
