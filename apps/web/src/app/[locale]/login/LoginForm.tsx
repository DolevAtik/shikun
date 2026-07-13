"use client";

import { Button, Card } from "@moch/ui";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  { email: "employee@moch.gov.il", label: "עובד/ת — מטה" },
  { email: "haifa.employee@moch.gov.il", label: "עובד/ת — מחוז חיפה" },
  { email: "haifa.manager@moch.gov.il", label: "מנהל/ת מחוז חיפה" },
  { email: "editor@moch.gov.il", label: "עורך/ת תוכן" },
  { email: "mankal@moch.gov.il", label: "לשכת המנכ״ל" },
];

const DEMO_PASSWORD = "Moch2026!";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [email, setEmail] = useState("employee@moch.gov.il");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      setError(t("error"));
      setIsSubmitting(false);
      return;
    }

    // `replace`, not `push`: Back from Home should leave the app, not return to
    // a login form the viewer has already passed.
    //
    // And no `refresh()` afterwards. It used to sit here to pick up the session
    // cookie, but the navigation already refetches Home with it — Home is
    // `no-store`, so there is no stale entry to invalidate. All the refresh did
    // was fire a second render of the same route, in parallel with the first,
    // at the one moment the API is already busy hashing a password.
    //
    // `isSubmitting` is deliberately left true: the page is on its way out, and
    // the button should not flick back to "sign in" underneath the viewer.
    router.replace(`/${locale}`);
  }

  return (
    <>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-content">
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-md border border-line-strong bg-surface px-3 text-content"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-content">
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-md border border-line-strong bg-surface px-3 text-content"
            />
          </div>

          {/* An assertive live region: a failed login must be announced, not
              just drawn. WCAG 3.3.1. */}
          <div role="alert" aria-live="assertive">
            {error ? (
              <p className="flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
                <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>

          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-1 w-full">
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Card>

      <Card className="mt-4 bg-surface-tint p-4">
        <p className="mb-1 text-sm font-semibold text-content">{t("demoTitle")}</p>
        <p className="mb-3 text-xs text-content-muted">{t("demoHint", { password: DEMO_PASSWORD })}</p>
        <ul className="flex flex-col gap-1">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-start text-xs transition-colors hover:bg-surface"
              >
                <span className="font-medium text-content">{account.label}</span>
                <span className="text-content-muted">{account.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
