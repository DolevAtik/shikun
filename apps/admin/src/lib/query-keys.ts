/**
 * Query keys, hierarchical and coarse-to-fine, so that
 * `invalidateQueries({ queryKey: qk.content.all })` clears every content list
 * *and* every content detail in one call.
 */

/**
 * Sorts keys and drops undefined.
 *
 * Without this, `{ page: 1, q: undefined }` and `{ q: undefined, page: 1 }` are
 * two different cache keys for one request, and the page fetches twice while
 * appearing to work perfectly.
 */
export function normalize(query: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(query).sort()) {
    const value = query[key];
    if (value !== undefined && value !== null && value !== "") result[key] = value;
  }
  return result;
}

export const qk = {
  me: ["me"] as const,

  dashboard: {
    all: ["dashboard"] as const,
    overview: (range: string) => ["dashboard", "overview", range] as const,
  },

  search: (term: string) => ["search", term] as const,

  content: {
    all: ["content"] as const,
    list: (query: Record<string, unknown>) => ["content", "list", normalize(query)] as const,
    detail: (id: string) => ["content", "detail", id] as const,
    versions: (id: string) => ["content", "detail", id, "versions"] as const,
  },

  employees: {
    all: ["employees"] as const,
    list: (query: Record<string, unknown>) => ["employees", "list", normalize(query)] as const,
    detail: (id: string) => ["employees", "detail", id] as const,
  },

  districts: {
    all: ["districts"] as const,
    list: ["districts", "list"] as const,
  },

  media: {
    all: ["media"] as const,
    list: (query: Record<string, unknown>) => ["media", "list", normalize(query)] as const,
  },

  org: {
    all: ["org"] as const,
    districts: ["org", "districts"] as const,
    departments: ["org", "departments"] as const,
    organizations: ["org", "organizations"] as const,
  },

  home: {
    all: ["home"] as const,
    sections: ["home", "sections"] as const,
  },

  audit: {
    all: ["audit"] as const,
    list: (query: Record<string, unknown>) => ["audit", "list", normalize(query)] as const,
    facets: ["audit", "facets"] as const,
  },
} as const;
