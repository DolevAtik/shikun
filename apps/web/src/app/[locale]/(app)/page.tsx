import type { CurrentUser, HomeResponse } from "@moch/contracts";
import { EmptyState } from "@moch/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeSectionView } from "@/components/home/sections";
import { serverFetchOrLogin } from "@/lib/api";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  // One request for the whole screen. The server has already resolved which
  // sections this viewer gets and what goes in them.
  const [home, user] = await Promise.all([
    serverFetchOrLogin<HomeResponse>("/home", locale),
    serverFetchOrLogin<CurrentUser>("/auth/me", locale),
  ]);

  if (home.sections.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 pt-8">
        <EmptyState title={t("empty")} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      {home.sections.map((section) => (
        <HomeSectionView
          key={section.id}
          section={section}
          locale={locale}
          firstName={user.firstName}
          greeting={home.greeting}
        />
      ))}
    </div>
  );
}
