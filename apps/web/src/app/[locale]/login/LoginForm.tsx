import { Button, Card } from "@moch/ui";
import { AlertCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";

const DEMO_ACCOUNTS = [
  { email: "employee@moch.gov.il", label: "עובד/ת — מטה" },
  { email: "haifa.employee@moch.gov.il", label: "עובד/ת — מחוז חיפה" },
  { email: "haifa.manager@moch.gov.il", label: "מנהל/ת מחוז חיפה" },
  { email: "editor@moch.gov.il", label: "עורך/ת תוכן" },
  { email: "mankal@moch.gov.il", label: "לשכת המנכ״ל" },
];

const DEMO_PASSWORD = "Moch2026!";

export async function LoginForm({
  locale,
  error,
}: {
  locale: string;
  error: "credentials" | "unavailable" | null;
}) {
  const t = await getTranslations("auth");

  return (
    <>
      <Card className="p-6">
        {/* A document POST, so a click before hydration still reaches the API.
            The old client-only handler let the browser reload /login? instead. */}
        <form method="post" action="/api/auth/login" className="flex flex-col gap-4" noValidate>
          <input type="hidden" name="locale" value={locale} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-content">
              {t("email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              defaultValue="employee@moch.gov.il"
              className="h-11 rounded-md border border-line-strong bg-surface px-3 text-content"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-content">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              defaultValue={DEMO_PASSWORD}
              className="h-11 rounded-md border border-line-strong bg-surface px-3 text-content"
            />
          </div>

          <div role="alert" aria-live="assertive">
            {error ? (
              <p className="flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                {error === "unavailable" ? t("unavailable") : t("error")}
              </p>
            ) : null}
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full">
            {t("submit")}
          </Button>
        </form>
      </Card>

      <Card className="mt-4 bg-surface-tint p-4">
        <p className="mb-1 text-sm font-semibold text-content">{t("demoTitle")}</p>
        <p className="mb-3 text-xs text-content-muted">{t("demoHint", { password: DEMO_PASSWORD })}</p>
        <ul className="flex flex-col gap-1">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <form method="post" action="/api/auth/login">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="email" value={account.email} />
                <input type="hidden" name="password" value={DEMO_PASSWORD} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-start text-xs transition-colors hover:bg-surface"
                >
                  <span className="font-medium text-content">{account.label}</span>
                  <span className="text-content-muted">{account.email}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
