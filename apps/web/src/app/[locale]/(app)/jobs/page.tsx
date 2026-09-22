import { redirect } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { toScope } from "@/components/jobs/JobFilters";

/** Backup for the redirect in next.config. Old links land on Services. */
export default async function LegacyJobsRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const scope = toScope((await searchParams).scope);
  redirect({
    href: scope === "all" ? "/services/jobs" : `/services/jobs?scope=${scope}`,
    locale,
  });
}
