import { cache } from "react";
import { redirect } from "next/navigation";
import { getAccessToken } from "./session";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class UnauthorizedError extends Error {}

/** The API answered 404 — the item is absent, or outside the viewer's audience. Pages turn this into notFound(). */
export class NotFoundError extends Error {}

/**
 * Server-side fetch against the API, with the viewer's token attached.
 *
 * Wrapped in React `cache()` so a single RSC tree that asks for `/auth/me`
 * (layout + page) pays for one round-trip, not two.
 *
 * Everything is `no-store`: an employee experience platform that serves a
 * cached Home to the wrong person has leaked targeted content, and the whole
 * point of the audience model is that Home differs per viewer.
 *
 * A cold API (a fresh Vercel function instance, or a paused host) can take a while
 * to answer, so every call waits it out through `fetchThroughWake` — the shell skeleton stays on
 * screen meanwhile, instead of the error page after a couple of seconds.
 */
export const serverFetch = cache(async function serverFetch<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new UnauthorizedError();

  const response = await fetchThroughWake(`${API_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response) throw new Error(`API did not wake up in time on ${path}`);
  if (response.status === 401) throw new UnauthorizedError();
  if (response.status === 404) throw new NotFoundError(`API 404 on ${path}`);
  if (!response.ok) {
    throw new Error(`API ${response.status} on ${path}: ${await response.text()}`);
  }

  return (await response.json()) as T;
});

/** While it wakes, a host answers 502/503/504 or drops the connection. */
const WAKING_STATUS = new Set([502, 503, 504]);

/**
 * Covers a full cold wake, and stays under the 60-second `maxDuration` of the
 * functions that call this (the app layout and the login route).
 */
const WAKE_BUDGET_MS = 50_000;

/**
 * One attempt per few seconds until the API answers something other than a
 * waking status, or the budget runs out. Null means it never woke up. Any real
 * answer — 401, 404, 500 — comes back at once for the caller to handle.
 */
export async function fetchThroughWake(url: string, init: RequestInit): Promise<Response | null> {
  const deadline = Date.now() + WAKE_BUDGET_MS;
  for (let attempt = 0; ; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(Math.min(remaining, 30_000)) });
      if (!WAKING_STATUS.has(response.status)) return response;
    } catch {
      // Connection refused, reset, or this attempt timed out: the API is still waking.
    }
    const pause = Math.min(1_000 * 2 ** attempt, 5_000);
    if (Date.now() + pause >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, pause));
  }
}

/** Fetch, or send the viewer to the login screen. For pages, not for mutations. */
export async function serverFetchOrLogin<T>(path: string, locale: string): Promise<T> {
  try {
    return await serverFetch<T>(path);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect(`/${locale}/login`);
    throw error;
  }
}
