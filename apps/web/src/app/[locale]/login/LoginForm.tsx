"use client";

import { Button, Card } from "@moch/ui";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
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

    // A document navigation, not `router.push`. This is measured, not stylistic.
    //
    // On a soft navigation the client router fetches the RSC payload for Home
    // and commits it in one piece, so nothing is drawn until the whole server
    // render is done — the login button just sits on "מתחבר…" for the duration.
    // A `loading.tsx` does not help there: its fallback only becomes an *instant*
    // state for a route whose shell is already prefetched, and Home cannot be
    // prefetched from here because we are not signed in yet.
    //
    // A document request streams. Next flushes the app shell and the loading
    // skeleton in the first chunk and streams Home in behind it, so the viewer is
    // out of the login form in a few hundred milliseconds and watching the app
    // arrive, instead of watching a spinner and wondering.
    //
    // Signing in is also the right moment to pay for a full load: it is a new
    // session, and it leaves nothing of the last one in the router cache.
    window.location.assign(`/${locale}`);
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
