import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * Where an ordinary employee lands if they follow a link to the console.
 *
 * They are told why, in plain language, rather than being bounced to a login
 * screen they have already passed — a redirect loop is how a real person
 * concludes the system is broken and calls the help desk.
 */
export default async function NoAccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-4">
      <div className="max-w-md rounded-lg border border-line bg-surface p-8 text-center shadow-md">
        <h1 className="text-lg font-semibold text-content">{t("access.title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-content-muted">{t("access.description")}</p>
      </div>
    </main>
  );
}
