"use client";

import type { EmployeeProgress, WorldFocus } from "@moch/contracts";
import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { JourneyPath } from "./JourneyPath";
import type { OpenDetail } from "./types";
import { WeeklyFocus } from "./WeeklyFocus";

interface JourneySectionProps {
  progress: EmployeeProgress;
  chosen: WorldFocus | null;
  showFocus: boolean;
  focusError: boolean;
  onChoose: (world: WorldFocus | null) => void;
  onOpen: OpenDetail;
}

export function JourneySection({ progress, chosen, showFocus, focusError, onChoose, onOpen }: JourneySectionProps) {
  const t = useTranslations("myWorld");

  return (
    <section id="journey" className="scroll-mt-20">
      <SectionHeader title={t("journey.title")} titleClassName="text-lg" />
      <p className="-mt-1 mb-4 px-1 text-sm text-content-muted">{t("journey.hint")}</p>
      {showFocus ? <WeeklyFocus chosen={chosen} error={focusError} onChoose={onChoose} /> : null}
      <JourneyPath progress={progress} chosen={chosen} onOpen={onOpen} />
    </section>
  );
}
