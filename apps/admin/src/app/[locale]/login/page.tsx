import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="grid min-h-dvh place-items-center bg-gradient-to-b from-[var(--hero-from)] to-[var(--hero-to)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-content-onbrand">{t("app.title")}</h1>
          <p className="mt-1 text-sm text-content-onbrand/80">{t("app.ministry")}</p>
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-lg">
          <h2 className="mb-4 text-base font-semibold text-content">{t("auth.signIn")}</h2>
          <LoginForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
