import { z } from "zod";

/**
 * Services is the "get something done" screen: the handful of tasks an employee
 * starts by tapping, and the systems they leave the app for.
 *
 * Unlike Home, this screen is not a list of audience-resolved sections. Both
 * lists are plain admin-ordered rows that every employee sees, so the response
 * is the two lists rather than a section union.
 */

export const QuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  href: z.string(),
});
export type QuickAction = z.infer<typeof QuickActionSchema>;

export const QuickLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
  icon: z.string().nullable(),
  isExternal: z.boolean(),
});
export type QuickLink = z.infer<typeof QuickLinkSchema>;

export const ServicesResponseSchema = z.object({
  quickActions: z.array(QuickActionSchema),
  quickLinks: z.array(QuickLinkSchema),
});
export type ServicesResponse = z.infer<typeof ServicesResponseSchema>;
