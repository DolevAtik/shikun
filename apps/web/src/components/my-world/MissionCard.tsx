"use client";

import { Button, Card, cn } from "@moch/ui";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import type { Mission } from "./types";
import { WORLD_COLOR, worldTint } from "./world-tone";

interface MissionCardProps {
  mission: Mission;
  worldLabel: string;
  icon: LucideIcon;
  locale: string;
  completeLabel: string;
  viewLabel: string;
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
  completeLabel,
  viewLabel,
  completedLabel,
  showGain,
  reducedMotion,
  onComplete,
}: MissionCardProps) {
  return (
    <Card
      className={cn("relative flex h-full flex-col gap-3 border-s-4 p-4", mission.completed && "bg-surface")}
      style={{ borderInlineStartColor: WORLD_COLOR[mission.world] }}
    >
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
          <p className="mt-1 text-xs font-medium" style={{ color: WORLD_COLOR[mission.world] }}>
            {worldLabel}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        {mission.completed ? (
          <p className="inline-flex min-h-11 items-center text-sm font-semibold text-success">{completedLabel}</p>
        ) : mission.action === "view" && mission.href ? (
          <Link
            href={mission.href}
            className="inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-content hover:bg-surface-tint"
          >
            {viewLabel}
          </Link>
        ) : (
          <Button type="button" size="md" onClick={() => onComplete(mission.id)}>
            {completeLabel}
          </Button>
        )}
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
