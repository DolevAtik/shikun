"use client";

import { Card, cn } from "@moch/ui";
import { Check, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MissionAction } from "./MissionCard";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import type { Mission } from "./types";
import { WORLD_COLOR, worldTint, worldWash } from "./world-tone";

interface NextMissionProps {
  mission: Mission;
  worldLabel: string;
  icon: LucideIcon;
  locale: string;
  startLabel: string;
  detailsLabel: string;
  completedLabel: string;
  showGain: boolean;
  reducedMotion: boolean;
  onComplete: (id: string) => void;
}

/** The one open step worth doing next. The rest of the list stays quieter. */
export function NextMission({
  mission,
  worldLabel,
  icon: Icon,
  locale,
  startLabel,
  detailsLabel,
  completedLabel,
  showGain,
  reducedMotion,
  onComplete,
}: NextMissionProps) {
  const t = useTranslations("myWorld");

  return (
    <Card
      interactive
      className="relative overflow-hidden border-transparent p-5 shadow-md sm:p-6"
      style={{ backgroundColor: worldWash(mission.world) }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span
          aria-hidden="true"
          className="grid size-14 shrink-0 place-items-center rounded-full"
          style={worldTint(mission.world)}
        >
          <Icon className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide" style={{ color: WORLD_COLOR[mission.world] }}>
            {worldLabel}
          </p>
          <h3 className="mt-0.5 text-xl font-bold leading-snug text-content">{mission.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-content-muted">{mission.description}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {mission.minutes != null ? (
              <span className="inline-flex items-center gap-1.5 text-content-muted">
                <Clock aria-hidden="true" className="size-4" />
                {t("duration", { count: mission.minutes })}
              </span>
            ) : null}
            <Numeric className={cn("font-bold", mission.completed ? "text-content-muted" : "text-brand")}>
              +{formatXp(mission.xp, locale)} XP
            </Numeric>
          </p>
        </div>
        <div className="sm:self-center">
          <MissionAction
            mission={mission}
            startLabel={startLabel}
            detailsLabel={detailsLabel}
            completedLabel={completedLabel}
            onComplete={onComplete}
          />
        </div>
      </div>
      {showGain && !reducedMotion ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute end-5 top-4 inline-flex items-center gap-1 animate-xp-float text-sm font-bold text-brand"
        >
          <Check className="size-4" />
          <Numeric>+{formatXp(mission.xp, locale)} XP</Numeric>
        </span>
      ) : null}
    </Card>
  );
}
