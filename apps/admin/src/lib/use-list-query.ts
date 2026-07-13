"use client";

import { useQueryStates, parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs";

/**
 * URL-backed list state. The same params the server prefetched are what the
 * client query key is built from — so RSC and TanStack Query stay in sync.
 */
export function useListQuery() {
  return useQueryStates({
    page: parseAsInteger.withDefault(1),
    pageSize: parseAsInteger.withDefault(20),
    q: parseAsString.withDefault(""),
    dir: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
    sort: parseAsString.withDefault(""),
  });
}
