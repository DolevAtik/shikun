import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-b from-surface-tint to-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/ministry-logo.svg" alt="" className="mb-4 size-20" />
          <h1 className="text-xl font-bold text-content">{t("loginTitle")}</h1>
          <p className="mt-1 text-sm text-content-muted">{t("loginSubtitle")}</p>
        </div>

        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
