import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/session";

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

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: creds.email, password: creds.password }),
    });
  } catch {
    return fail(request, creds, "unavailable", 503);
  }

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
