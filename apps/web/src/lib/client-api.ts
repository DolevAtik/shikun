/**
 * Client-side calls go through the Next proxy, never straight to the API — the
 * token lives in an httpOnly cookie and the browser is not allowed to see it.
 */
export async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(body.message ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
