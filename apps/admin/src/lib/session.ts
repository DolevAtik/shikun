import { cookies } from "next/headers";

/**
 * The admin's cookies are deliberately NOT the employee app's `moch_at`/`moch_rt`.
 *
 * Today both apps sit on *.vercel.app, which is on the public suffix list, so
 * cookies cannot cross between them and the names are merely tidy. The day they
 * move to admin.moch.gov.il and app.moch.gov.il, a shared `moch_at` scoped to the
 * apex would mean an ordinary employee's session silently authenticates the admin
 * console. Renaming now costs nothing; renaming after that migration is a breach.
 *
 * For the same reason: never set a `Domain` attribute on these.
 */
export const ACCESS_COOKIE = "moch_admin_at";
export const REFRESH_COOKIE = "moch_admin_rt";

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
