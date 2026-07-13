import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Locale routing only. The admin is NOT protected here.
 *
 * Protection lives in `(admin)/layout.tsx`, which awaits /auth/me and redirects
 * on 401, then checks the `admin:access` permission. That is the same pattern
 * the employee app uses, and it keeps the gate next to the data rather than in a
 * middleware that cannot see the viewer's roles without a network call on every
 * request — including every static asset.
 */
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
