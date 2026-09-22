import type { CurrentUser } from "@moch/contracts";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadMyWorld } from "@/components/my-world/load-my-world";
import { MyWorldExperience } from "@/components/my-world/MyWorldExperience";
import { serverFetchOrLogin } from "@/lib/api";

export default async function MyWorldPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("myWorld");
  const user = await serverFetchOrLogin<CurrentUser>("/auth/me", locale);

  return (
    <div className="min-w-0 overflow-x-clip px-4 pb-8 pt-4 sm:px-6">
      <MyWorldExperience initial={loadMyWorld(user, locale, t)} />
    </div>
  );
}
