import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { AdminHomeSections, CurrentUser } from "@moch/contracts";
import { HomeLayoutEditor } from "@/components/home/HomeLayoutEditor";
import { serverFetch, serverFetchOrLogin } from "@/lib/api";
import { EmptyState } from "@/components/data/EmptyState";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("homeLayout");
  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);

  if (!user.permissions.includes("feeds:manage") && !user.permissions.includes("content:manage")) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("settingsTitle")}</h1>
        <div className="mt-8">
          <EmptyState title={t("noAccessTitle")} description={t("noAccessDescription")} />
        </div>
      </div>
    );
  }

  const sections = await serverFetch<AdminHomeSections>("/admin/home/sections");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("settingsTitle")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("settingsSubtitle")}</p>
      </div>
      <HomeLayoutEditor initial={sections} />
    </div>
  );
}
