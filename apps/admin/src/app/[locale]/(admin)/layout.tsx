import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { CurrentUser } from "@moch/contracts";
import { AppShell } from "@/components/shell/AppShell";
import { serverFetchOrLogin } from "@/lib/api";
import { visibleNav } from "@/lib/nav";

/**
 * Authenticated admin chrome. Providers (QueryClient, direction, toasts) live
 * on the locale layout so login and no-access share the same client tree.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("app");
  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);

  if (!user.permissions.includes("admin:access")) {
    redirect(`/${locale}/no-access`);
  }

  const navIds = visibleNav(user.permissions).map((item) => item.id);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-medium focus:text-brand focus:shadow-lg"
      >
        {t("skipToContent")}
      </a>
      <AppShell user={user} navIds={navIds}>
        {children}
      </AppShell>
    </>
  );
}
