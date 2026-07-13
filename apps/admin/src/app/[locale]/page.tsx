import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { CurrentUser } from "@moch/contracts";
import { serverFetchOrLogin } from "@/lib/api";

/**
 * TEMPORARY — Phase 0 boot check.
 *
 * This route becomes the Dashboard in Phase 1, under an `(admin)` route group
 * whose layout carries the shell and this same gate. It exists today so that the
 * scaffold is verifiable end to end rather than merely compiling: signing in and
 * landing here proves the cookie, the proxy, the token attachment, and the
 * permission gate all work against the real API.
 *
 * The gate itself is not temporary, and it is not security either — the API's
 * PermissionsGuard is. This only decides what a browser is shown.
 */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);
  if (!user.permissions.includes("admin:access")) redirect(`/${locale}/no-access`);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-content">{user.fullName}</h1>
        <p className="mt-1 text-sm text-content-muted">{user.email}</p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-content-muted">תפקידים</dt>
            <dd className="text-content">{user.roles.join(", ")}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-content-muted">הרשאות</dt>
            <dd className="text-content">{user.permissions.length}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-content-muted">מחוז</dt>
            <dd className="text-content">{user.district?.nameHe ?? "מטה"}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
