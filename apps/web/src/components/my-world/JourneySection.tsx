"use client";

import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { JourneyCard } from "./JourneyCard";
import type { Journey } from "./types";

export function JourneySection({ journeys }: { journeys: Journey[] }) {
  const t = useTranslations("myWorld");

  return (
    <section>
      <SectionHeader title={t("journeyTitle")} />
      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {journeys.map((journey) => (
          <li key={journey.id}>
            <JourneyCard
              journey={journey}
              activityLabel={t("activities", { count: journey.completedActivities })}
              statusLabel={t(`journeyStatus.${journey.status}`)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
