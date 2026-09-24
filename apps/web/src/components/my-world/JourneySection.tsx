"use client";

import { SectionHeader, type WorldId } from "@moch/ui";
import { useTranslations } from "next-intl";
import { JourneyPath } from "./JourneyPath";
import type { Journey } from "./types";
import { WeeklyFocus } from "./WeeklyFocus";

export function JourneySection({
  journeys,
  chosenWorld,
  showFocus,
  onChoose,
}: {
  journeys: Journey[];
  chosenWorld: WorldId | null;
  showFocus: boolean;
  onChoose: (world: WorldId | null) => void;
}) {
  const t = useTranslations("myWorld");

  return (
    <section>
      <SectionHeader title={t("journeyTitle")} titleClassName="text-lg" />
      <p className="-mt-1 mb-4 px-1 text-sm text-content-muted">{t("journeyHint")}</p>
      {showFocus ? <WeeklyFocus chosen={chosenWorld} onChoose={onChoose} /> : null}
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
