"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@moch/ui";

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    }).catch(() => null);

    if (!response?.ok) {
      setError(t("auth.failed"));
      setIsSubmitting(false);
      return;
    }

    // A hard navigation, not router.push: the destination is a server component
    // that fetches /auth/me, and a document request streams its shell immediately
    // instead of leaving the button spinning through an RSC round-trip.
    window.location.assign(`/${locale}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-content">
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-content"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-content">
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-content"
        />
      </div>

      {/* Announced, not just shown — a screen-reader user must hear the failure. */}
      <div role="alert" aria-live="assertive" className="min-h-5">
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>

      <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} className="w-full">
        {isSubmitting ? t("auth.signingIn") : t("auth.submit")}
      </Button>
    </form>
  );
}
