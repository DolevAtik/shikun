import { z } from "zod";

export const WorldFocusSchema = z.enum(["know", "feel", "develop", "participate"]);
export type WorldFocus = z.infer<typeof WorldFocusSchema>;

/** What העולם שלי reads back. Absent row uses these same defaults. */
export const EmployeeWorldSchema = z.object({
  chosenWorld: WorldFocusSchema.nullable(),
  streakDays: z.number().int(),
  graceAvailable: z.boolean(),
  weeklyFilled: z.number().int(),
  weeklyTotal: z.literal(3),
  endowed: z.boolean(),
  bonusXp: z.number().int(),
  pulsePending: z.boolean(),
});
export type EmployeeWorld = z.infer<typeof EmployeeWorldSchema>;

export const UpdateEmployeeWorldSchema = z.object({
  chosenWorld: WorldFocusSchema.nullable().optional(),
  pulseSeen: z.boolean().optional(),
});
export type UpdateEmployeeWorld = z.infer<typeof UpdateEmployeeWorldSchema>;
