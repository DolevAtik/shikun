import { cookies } from "next/headers";

export const ACCESS_COOKIE = "moch_at";
export const REFRESH_COOKIE = "moch_rt";

/**
 * Tokens live in httpOnly cookies, so no script on the page can read them —
 * an XSS bug should not become a session-theft bug. Client components never
 * touch the API directly; they go through the proxy route, which attaches the
 * token server-side.
 */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
