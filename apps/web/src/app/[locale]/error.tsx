"use client";

import { Button } from "@moch/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Catches a failure in the app shell (the layout's `/auth/me`, or a page under it).
 * Without this, Next replaces the screen with its generic "server-side exception" page.
 */
export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  // `reset()` alone only re-renders what the client already holds, so a failed
  // server render fails again. Refresh asks the server for a fresh render first.
  const retry = () =>
    startRetry(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface px-6 py-10 text-center shadow-md">
        <h1 className="text-lg font-semibold text-content">{t("loadErrorTitle")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-content-muted">{t("loadErrorHint")}</p>
        <Button type="button" className="mt-5" onClick={retry} disabled={retrying}>
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
