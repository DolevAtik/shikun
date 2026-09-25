import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

/** An item that is gone, or outside the viewer's audience, reads as absent — with a way back. */
export default async function AppNotFound() {
  const t = await getTranslations("common");

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface px-6 py-10 text-center shadow-md">
        <h1 className="text-lg font-semibold text-content">{t("notFoundTitle")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-content-muted">{t("notFoundHint")}</p>
        <Link
          href="/"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-content-onbrand shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus"
        >
          {t("notFoundCta")}
        </Link>
      </div>
    </div>
  );
}
