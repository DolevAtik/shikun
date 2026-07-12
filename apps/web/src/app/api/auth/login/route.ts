import { NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Login failed" }));
    return NextResponse.json(error, { status: response.status });
  }

  const { tokens, user } = await response.json();

  // The tokens are set here and never reach the browser's JavaScript.
  const result = NextResponse.json({ user });
  result.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: 60 * 60 * 8 });
  result.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
  });

  return result;
}
