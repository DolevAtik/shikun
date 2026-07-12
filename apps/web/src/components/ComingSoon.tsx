import { EmptyState } from "@moch/ui";
import { getTranslations } from "next-intl/server";

/**
 * Services and Profile are scoped out of round one on purpose. A
 * placeholder that says so is more honest than a fake screen that implies the
 * module exists.
 */
export async function ComingSoon({ titleKey }: { titleKey: string }) {
  const t = await getTranslations();

  return (
    <div className="p-4 pt-8">
      <h1 className="mb-6 px-1 text-xl font-bold text-content">{t(titleKey as never)}</h1>
      <EmptyState title={t("common.comingSoon")} description={t("common.comingSoonHint")} />
    </div>
  );
}
