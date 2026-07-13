import { getTranslations, setRequestLocale } from "next-intl/server";
import type { NavSectionId } from "@/lib/nav";
import { EmptyState } from "@/components/data/EmptyState";

/**
 * Shared shell for sections whose CRUD API arrives in a later phase.
 * Not a fake dashboard — a real empty state inside the real admin chrome,
 * so navigation and permissions are already exercised end-to-end.
 */
export function createSectionPage(section: NavSectionId) {
  return async function SectionPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    const t = await getTranslations();

    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t(`nav.${section}`)}</h1>
        <div className="mt-8">
          <EmptyState
            title={t("section.readyTitle")}
            description={t("section.readyDescription")}
          />
        </div>
      </div>
    );
  };
}
