import { getTranslations, setRequestLocale } from "next-intl/server";
import { CityBackdrop } from "@/components/CityBackdrop";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const loginError = error === "credentials" || error === "unavailable" ? error : null;

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <CityBackdrop />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/ministry-logo.svg" alt="" className="mb-4 size-20" />
          <h1 className="text-xl font-bold text-content">{t("loginTitle")}</h1>
          <p className="mt-1 text-sm text-content-muted">{t("loginSubtitle")}</p>
        </div>

        <LoginForm locale={locale} error={loginError} />
      </div>
    </div>
  );
}
