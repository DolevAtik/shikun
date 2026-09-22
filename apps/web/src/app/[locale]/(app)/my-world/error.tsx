"use client";

import { Button } from "@moch/ui";
import { useTranslations } from "next-intl";

export default function MyWorldError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("myWorld");

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-md rounded-xl border border-line bg-surface px-6 py-10 text-center shadow-md">
        <h1 className="text-lg font-semibold text-content">{t("errorTitle")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-content-muted">{t("errorHint")}</p>
        <Button type="button" className="mt-5" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
