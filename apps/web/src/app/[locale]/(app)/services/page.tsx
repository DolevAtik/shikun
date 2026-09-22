import type { ServicesResponse } from "@moch/contracts";
import { Card, SectionHeader } from "@moch/ui";
import { Briefcase } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { QuickActionsSection, QuickLinksSection } from "@/components/services/sections";
import { serverFetchOrLogin } from "@/lib/api";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const tJobs = await getTranslations("jobs");

  const services = await serverFetchOrLogin<ServicesResponse>("/services", locale);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <h1 className="px-4 pb-1 pt-6 text-2xl font-bold tracking-tight text-content">{t("title")}</h1>

      <section className="py-3">
        <SectionHeader title={t("jobsCategory")} className="px-4" />
        <div className="px-4">
          <Link href="/services/jobs" className="block rounded-lg focus-visible:outline-none focus-visible:shadow-focus">
            <Card interactive className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Briefcase aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-content">{tJobs("title")}</span>
                <span className="block text-sm text-content-muted">{t("jobsCategoryHint")}</span>
              </span>
            </Card>
          </Link>
        </div>
      </section>

      {/* An empty list is dropped rather than rendered as a heading over
          nothing — the same rule Home follows for its sections. */}
      {services.quickActions.length > 0 ? <QuickActionsSection items={services.quickActions} /> : null}
      {services.quickLinks.length > 0 ? <QuickLinksSection items={services.quickLinks} /> : null}
    </div>
  );
}
