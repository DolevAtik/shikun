"use client";

import { cn } from "@moch/ui";
import { useTranslations } from "next-intl";
import { JourneyCard } from "./JourneyCard";
import type { Journey } from "./types";
import { WORLD_COLOR } from "./world-tone";

/** A path, not a menu. The worlds stay independent — the line is only the feeling of a journey. */
export function JourneyPath({ journeys }: { journeys: Journey[] }) {
  const t = useTranslations("myWorld");
  const steps = [{ id: "start" as const }, ...journeys.map((journey) => ({ id: journey.id, journey }))];

  return (
    <ol className="m-0 flex list-none flex-col gap-3 p-0">
      {steps.map((step, index) => {
        const first = index === 0;
        const last = index === steps.length - 1;
        return (
          <li key={step.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
            <div className="relative flex justify-center">
              <span
                aria-hidden="true"
                className={cn("absolute w-px bg-line", first ? "top-3 bottom-0" : last ? "top-0 h-5" : "inset-y-0")}
              />
              <span
                aria-hidden="true"
                className="relative z-10 mt-6 size-3.5 rounded-full ring-4 ring-bg"
                style={{ backgroundColor: step.id === "start" ? "var(--success)" : WORLD_COLOR[step.id] }}
              />
            </div>
            {step.id === "start" ? (
              <p className="self-center py-2 text-sm font-semibold text-content-muted">{t("journeyStart")}</p>
            ) : (
              <JourneyCard
                journey={step.journey}
                code={t(`worlds.${step.journey.id}.code`)}
                activitiesLabel={t("activitiesDoneLabel")}
                milestoneLabel={
                  step.journey.activitiesUntilBadge
                    ? t("untilBadge", { count: step.journey.activitiesUntilBadge })
                    : null
                }
                continueLabel={t("continueJourney")}
                statusLabel={t(`journeyStatus.${step.journey.status}`)}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
