/**
 * The client-side API surface. Everything goes through the Next proxy, which
 * attaches the httpOnly token server-side and transparently rotates the
 * single-use refresh token on a 401. The browser never holds a token.
 */

export type ApiIssue = { path: string; message: string };

/**
 * A typed error, not a string.
 *
 * `issues` is what lets a form put the server's complaint on the field it is
 * about rather than in a generic toast — see `applyServerIssues`. A 400 that
 * lands in a toast is a 400 the user has to guess about.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues: ApiIssue[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/proxy${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      payload?.message ?? `הבקשה נכשלה (${response.status})`,
      // The API's HttpExceptionFilter emits { statusCode, message, errors: [...] }
      // from the zod pipe. Those are the per-field issues.
      Array.isArray(payload?.errors) ? payload.errors : [],
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/**
 * Maps the API's per-field zod issues onto a react-hook-form `setError`, so a
 * 400 lands on the right input instead of in a generic toast.
 */
export function applyServerIssues(
  error: unknown,
  setError: (name: string, error: { type: string; message: string }) => void,
): boolean {
  if (!(error instanceof ApiError) || error.issues.length === 0) return false;
  for (const issue of error.issues) {
    if (!issue.path) continue;
    setError(issue.path, { type: "server", message: issue.message });
  }
  return true;
}

/** Serialize a list query to a search string, dropping empties and expanding arrays. */
export function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      // Repeated keys — ?status=DRAFT&status=PENDING — which is what the API's
      // zod schema expects.
      for (const item of value) params.append(key, String(item));
    } else if (value instanceof Date) {
      params.set(key, value.toISOString());
    } else {
      params.set(key, String(value));
    }
  }

  return params.toString();
}
