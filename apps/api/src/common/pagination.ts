import type { Page, PageMeta } from "@moch/contracts";

/** Shared offset-pagination maths for every admin list endpoint. */
export function pageMeta(total: number, page: number, pageSize: number): PageMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1 && totalPages > 0,
  };
}

export function toPage<T>(items: T[], total: number, page: number, pageSize: number): Page<T> {
  return { items, meta: pageMeta(total, page, pageSize) };
}

export function skipTake(page: number, pageSize: number): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
