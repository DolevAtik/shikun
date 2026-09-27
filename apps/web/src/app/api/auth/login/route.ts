import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/session";

/**
 * Render's free API sleeps when idle and takes up to about a minute to wake.
 * Let this function wait that long instead of Vercel's short default.
 */
export const maxDuration = 60;

/** While it wakes, Render answers 502/503/504 or drops the connection. */
const WAKING_STATUS = new Set([502, 503, 504]);
const WAKE_BUDGET_MS = 55_000;

type Credentials = {
  email: string;
  password: string;
  locale: "he" | "en";
  asJson: boolean;
};

/**
 * The login screen posts a real form, not only a client fetch. A click that
 * lands before the page has hydrated used to reload `/login?` and never reach
 * the API, so the demo accounts looked rejected. A document POST still logs in.
 */
export async function POST(request: Request) {
  const creds = await readCredentials(request);
  if (!creds) {
    return NextResponse.json({ message: "Login failed" }, { status: 400 });
  }

  const response = await loginWithWake(creds);
  if (!response) return fail(request, creds, "unavailable", 503);

  if (!response.ok) {
    const kind = response.status === 401 || response.status === 400 ? "credentials" : "unavailable";
    return fail(request, creds, kind, response.status);
  }

  const { tokens, user } = await response.json();
  const result = creds.asJson
    ? NextResponse.json({ user })
    : NextResponse.redirect(new URL(`/${creds.locale}`, request.url), 303);

  result.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: 60 * 60 * 8 });
  result.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });

  return result;
}

/**
 * One login attempt per few seconds until the API answers or the budget runs
 * out. Wrong credentials (401/400) come back at once — only a sleeping or
 * unreachable API is retried. Null means it never woke up.
 */
async function loginWithWake(creds: Credentials): Promise<Response | null> {
  const deadline = Date.now() + WAKE_BUDGET_MS;
  for (let attempt = 0; ; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: creds.email, password: creds.password }),
        signal: AbortSignal.timeout(Math.min(remaining, 30_000)),
      });
      if (!WAKING_STATUS.has(response.status)) return response;
    } catch {
      // Connection refused, reset, or this attempt timed out: the API is still waking.
    }
    const pause = Math.min(1_000 * 2 ** attempt, 5_000);
    if (Date.now() + pause >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, pause));
  }
}

async function readCredentials(request: Request): Promise<Credentials | null> {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { email?: unknown; password?: unknown };
      return {
        email: String(body.email ?? "").trim(),
        password: String(body.password ?? ""),
        locale: "he",
        asJson: true,
      };
    }

    const form = await request.formData();
    return {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      locale: form.get("locale") === "en" ? "en" : "he",
      asJson: false,
    };
  } catch {
    return null;
  }
}

function fail(request: Request, creds: Credentials, error: "credentials" | "unavailable", status: number) {
  if (creds.asJson) {
    return NextResponse.json({ message: error }, { status });
  }

  const url = new URL(`/${creds.locale}/login`, request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url, 303);
}
