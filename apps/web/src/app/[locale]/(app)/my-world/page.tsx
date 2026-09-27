import type { CurrentUser, EmployeeProgress, MonthlyRecap } from "@moch/contracts";
import { setRequestLocale } from "next-intl/server";
import { MyWorldExperience } from "@/components/my-world/MyWorldExperience";
import { serverFetch, serverFetchOrLogin } from "@/lib/api";

export default async function MyWorldPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [user, progress, recap] = await Promise.all([
    serverFetchOrLogin<CurrentUser>("/auth/me", locale),
    serverFetchOrLogin<EmployeeProgress>("/me/progress", locale),
    // The recap is a look back, not the screen: if it fails, the rest still renders.
    serverFetch<MonthlyRecap>("/me/progress/recap").catch(() => null),
  ]);

  return (
    <div className="min-w-0 overflow-x-clip px-4 pb-8 pt-4 sm:px-6">
      <MyWorldExperience profile={{ firstName: user.firstName, title: user.title }} initial={progress} recap={recap} />
    </div>
  );
}
