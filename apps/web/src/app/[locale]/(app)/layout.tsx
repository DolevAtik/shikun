import type { CurrentUser } from "@moch/contracts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { TelemetryBeacon } from "@/components/TelemetryBeacon";
import { serverFetchOrLogin } from "@/lib/api";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);

  return (
    <div className="min-h-dvh">
      {/* The first thing a keyboard user hits. WCAG 2.4.1. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-medium focus:text-brand focus:shadow-lg"
      >
        {t("skipToContent")}
      </a>

      <AppHeader name={user.fullName} initials={user.initials} avatarUrl={user.avatarUrl} />

      <main id="main" className="mx-auto max-w-2xl pb-24">
        {children}
      </main>

      <BottomNav />
      <TelemetryBeacon />
    </div>
  );
}
