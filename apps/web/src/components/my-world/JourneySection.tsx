"use client";

import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { JourneyPath } from "./JourneyPath";
import type { Journey } from "./types";

export function JourneySection({ journeys }: { journeys: Journey[] }) {
  const t = useTranslations("myWorld");

  return (
    <section>
      <SectionHeader title={t("journeyTitle")} titleClassName="text-lg" />
      <p className="-mt-1 mb-4 px-1 text-sm text-content-muted">{t("journeyHint")}</p>
      {journeys.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface px-5 py-6 text-center text-sm text-content-muted shadow-sm">
          {t("journeyEmpty")}
        </p>
      ) : (
        <JourneyPath journeys={journeys} />
      )}
    </section>
  );
}
