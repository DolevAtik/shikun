import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions, getRefreshToken } from "@/lib/session";

/**
 * The only path from client components to the API.
 *
 * The browser never holds a token: it calls `/api/proxy/...`, and this handler
 * attaches the httpOnly cookie server-side. It also handles the single-use
 * refresh rotation — on a 401 it redeems the refresh token, retries once, and
 * writes the new pair back as cookies.
 */
async function forward(request: NextRequest, path: string[]): Promise<NextResponse> {
  const target = `${API_URL}/api/${path.join("/")}${request.nextUrl.search}`;
  const body = request.method === "GET" || request.method === "DELETE" ? undefined : await request.text();

  const call = async (token: string | undefined) =>
    fetch(target, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      cache: "no-store",
    });

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let response = await call(accessToken);
  let refreshed: { accessToken: string; refreshToken: string } | null = null;

  if (response.status === 401) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        refreshed = await refreshResponse.json();
        response = await call(refreshed!.accessToken);
      }
    }
  }

  const payload = response.status === 204 ? null : await response.text();
  const result = new NextResponse(payload, {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });

  if (refreshed) {
    result.cookies.set(ACCESS_COOKIE, refreshed.accessToken, { ...cookieOptions, maxAge: 60 * 60 * 8 });
    result.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return result;
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  return forward(request, (await context.params).path);
}

export async function POST(request: NextRequest, context: Context) {
  return forward(request, (await context.params).path);
}

export async function DELETE(request: NextRequest, context: Context) {
  return forward(request, (await context.params).path);
}
