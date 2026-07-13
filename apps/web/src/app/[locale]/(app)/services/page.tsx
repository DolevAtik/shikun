import type { ServicesResponse } from "@moch/contracts";
import { EmptyState } from "@moch/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { QuickActionsSection, QuickLinksSection } from "@/components/services/sections";
import { serverFetchOrLogin } from "@/lib/api";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");

  const services = await serverFetchOrLogin<ServicesResponse>("/services", locale);

  const isEmpty = services.quickActions.length === 0 && services.quickLinks.length === 0;

  return (
    <div className="flex flex-col">
      <h1 className="px-4 pb-1 pt-6 text-2xl font-bold tracking-tight text-content">{t("title")}</h1>

      {isEmpty ? (
        <div className="p-4 pt-6">
          <EmptyState title={t("empty")} />
        </div>
      ) : (
        <>
          {/* An empty list is dropped rather than rendered as a heading over
              nothing — the same rule Home follows for its sections. */}
          {services.quickActions.length > 0 ? (
            <QuickActionsSection items={services.quickActions} />
          ) : null}
          {services.quickLinks.length > 0 ? <QuickLinksSection items={services.quickLinks} /> : null}
        </>
      )}
    </div>
  );
}
