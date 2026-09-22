"use client";

import { Button, Card, cn } from "@moch/ui";
import { Check, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import type { Mission } from "./types";
import { WORLD_COLOR, worldTint } from "./world-tone";

const primaryLink =
  "inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-content-onbrand shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus";
const secondaryLink =
  "inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-content hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus";

interface MissionActionProps {
  mission: Mission;
  startLabel: string;
  detailsLabel: string;
  completedLabel: string;
  onComplete: (id: string) => void;
}

/** A confirmed step grants XP. Opening a page does not. */
export function MissionAction({ mission, startLabel, detailsLabel, completedLabel, onComplete }: MissionActionProps) {
  if (mission.completed) {
    return (
      <p className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-success">
        <Check aria-hidden="true" className="size-4" />
        {completedLabel}
      </p>
    );
  }

  if (mission.action === "view" && mission.href) {
    const label = mission.cta === "details" ? detailsLabel : startLabel;
    return (
      <Link href={mission.href} className={mission.cta === "details" ? secondaryLink : primaryLink}>
        {label}
      </Link>
    );
  }

  return (
    <Button type="button" size="md" onClick={() => onComplete(mission.id)}>
      {startLabel}
    </Button>
  );
}

interface MissionCardProps {
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

export function MissionCard({
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
}: MissionCardProps) {
  const t = useTranslations("myWorld");

  return (
    <Card className="relative flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full"
          style={
            mission.completed
              ? { color: "var(--success)", backgroundColor: "var(--success-soft)" }
              : worldTint(mission.world)
          }
        >
          {mission.completed ? <Check className="size-5" /> : <Icon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold leading-snug text-content">{mission.title}</h3>
            <Numeric className={cn("shrink-0 text-sm font-bold", mission.completed ? "text-content-muted" : "text-brand")}>
              +{formatXp(mission.xp, locale)} XP
            </Numeric>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-content-muted">{mission.description}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-content-muted">
            <span style={{ color: WORLD_COLOR[mission.world] }}>{worldLabel}</span>
            {mission.minutes != null ? (
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {t("duration", { count: mission.minutes })}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <MissionAction
          mission={mission}
          startLabel={startLabel}
          detailsLabel={detailsLabel}
          completedLabel={completedLabel}
          onComplete={onComplete}
        />
      </div>

      {showGain && !reducedMotion ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute end-4 top-3 animate-xp-float text-sm font-bold text-brand"
        >
          <Numeric>+{formatXp(mission.xp, locale)} XP</Numeric>
        </span>
      ) : null}
    </Card>
  );
}
