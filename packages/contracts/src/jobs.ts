import { z } from "zod";

/**
 * The job board: every open position the viewer is allowed to see, on one screen.
 *
 * These are the same CAREER content items Home shows three of. The board is the
 * full list, not a second source of truth — one place publishes a position, and
 * both screens read it through the same audience filter.
 */

export const JobPostingSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  departmentName: z.string().nullable(),
  districtName: z.string().nullable(),
  districtColor: z.string().nullable(),
  /** Null when the position stays open until it is filled. */
  closesAt: z.string().nullable(),
  /** An internal role is open to Ministry staff; the rest are public tenders. */
  isInternal: z.boolean(),
  /** Where the application actually happens. Null when there is no link yet. */
  href: z.string().nullable(),
  publishedAt: z.string(),
});
export type JobPosting = z.infer<typeof JobPostingSchema>;

export const JobsResponseSchema = z.object({
  items: z.array(JobPostingSchema),
});
export type JobsResponse = z.infer<typeof JobsResponseSchema>;
