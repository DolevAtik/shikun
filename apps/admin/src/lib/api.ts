import { cache } from "react";
import { redirect } from "next/navigation";
import { getAccessToken } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class UnauthorizedError extends Error {}

/**
 * Server-side fetch against the API, with the viewer's token attached.
 *
 * Wrapped in React `cache()` so layout + page asking for the same path in one
 * RSC tree share a single round-trip.
 *
 * `no-store` throughout, for a reason that is sharper here than in the employee
 * app: what an administrator may see depends on what they may *manage*, and two
 * administrators of different districts asking for the same list must not be
 * served each other's cache.
 */
export const serverFetch = cache(async function serverFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new UnauthorizedError();

  const response = await fetch(`${API_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (response.status === 401) throw new UnauthorizedError();
  if (!response.ok) {
    throw new Error(`API ${response.status} on ${path}: ${await response.text()}`);
  }

  return (await response.json()) as T;
});

/** Fetch, or send the viewer to the login screen. For pages, not for mutations. */
export async function serverFetchOrLogin<T>(path: string, locale: string): Promise<T> {
  try {
    return await serverFetch<T>(path);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect(`/${locale}/login`);
    throw error;
  }
}
