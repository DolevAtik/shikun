import { z } from "zod";

/**
 * The list contract every admin endpoint implements.
 *
 * It lives here, in the package both the API and the admin import, so that the
 * two cannot disagree about what `?page=2&status=DRAFT` means. The API parses a
 * request with the same schema the console used to build it.
 *
 * Offset pagination, deliberately — the feed uses cursors, and that is right for
 * an infinite mobile scroll and wrong for an admin table. An administrator needs
 * "page 7 of 43" and a total count, and needs to jump to the last page.
 */
export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  dir: z.enum(["asc", "desc"]).default("desc"),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

/**
 * Lifts a lone value into an array.
 *
 * `?status=DRAFT` arrives as a string and `?status=DRAFT&status=PENDING` as an
 * array. Without this, filtering by exactly one thing — the common case — throws.
 */
export const arrayParam = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    return Array.isArray(value) ? value : [value];
  }, z.array(schema).optional());

export const PageMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});
export type PageMeta = z.infer<typeof PageMetaSchema>;

export const pageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), meta: PageMetaSchema });

export type Page<T> = { items: T[]; meta: PageMeta };

/**
 * The result of a bulk action.
 *
 * Partial success is the normal case, not the edge case: a district manager
 * selects forty rows and two of them are not theirs to archive. An endpoint that
 * returns 200 or 500 has no way to say "38 archived, 2 refused", and the console
 * would have to lie to the user about one or the other.
 */
export const BulkResultSchema = z.object({
  succeeded: z.array(z.string()),
  failed: z.array(z.object({ id: z.string(), reason: z.string() })),
});
export type BulkResult = z.infer<typeof BulkResultSchema>;
