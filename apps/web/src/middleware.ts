import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  let moved = false;

  const jobs = url.pathname.match(/^\/(he|en)\/jobs\/?$/);
  if (jobs) {
    url.pathname = `/${jobs[1]}/services/jobs`;
    moved = true;
  }

  // The employee app is Hebrew. An English address lands on the same screen in Hebrew.
  if (url.pathname === "/en" || url.pathname.startsWith("/en/")) {
    url.pathname = url.pathname.replace(/^\/en/, "/he");
    moved = true;
  }

  if (moved) return NextResponse.redirect(url);

  return handleI18n(request);
}

export const config = {
  // Everything except API routes, static files and the service worker.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
