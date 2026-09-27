import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AdminHomeData, AdminHomeSections, CurrentUser } from "@moch/contracts";
import { HomeScreenManager } from "@/components/home/HomeScreenManager";
import { EmptyState } from "@/components/data/EmptyState";
import { serverFetch, serverFetchOrLogin } from "@/lib/api";

export default async function HomeScreenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("homeScreen");
  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);

  if (!user.permissions.includes("feeds:manage")) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <div className="mt-8">
          <EmptyState title={t("noAccessTitle")} description={t("noAccessDescription")} />
        </div>
      </div>
    );
  }

  const [sections, data] = await Promise.all([
    serverFetch<AdminHomeSections>("/admin/home/sections"),
    serverFetch<AdminHomeData>("/admin/home/data"),
  ]);

  return <HomeScreenManager sections={sections} data={data} />;
}
