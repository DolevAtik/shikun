import type { CurrentUser } from "@moch/contracts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { CityBackdrop } from "@/components/CityBackdrop";
import { SideNav } from "@/components/SideNav";
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
    <div className="relative min-h-dvh lg:ps-56">
      <CityBackdrop />
      <SideNav />
      {/* The first thing a keyboard user hits. WCAG 2.4.1. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-medium focus:text-brand focus:shadow-lg"
      >
        {t("skipToContent")}
      </a>

      <AppHeader name={user.fullName} initials={user.initials} avatarUrl={user.avatarUrl} />

      <main id="main" className="relative z-10 mx-auto w-full max-w-5xl overflow-x-clip pb-28 lg:pb-10">
        {children}
      </main>

      <BottomNav />
      <TelemetryBeacon />
    </div>
  );
}
