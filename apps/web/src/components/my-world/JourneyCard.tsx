"use client";

import { Card, ProgressBar, cn } from "@moch/ui";
import { BookOpen, GraduationCap, Heart, Lock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp, percentOf } from "./progress";
import type { Journey } from "./types";
import { WORLD_BAR, WORLD_COLOR, worldTint } from "./world-tone";

const ICONS: Record<Journey["id"], LucideIcon> = {
  know: BookOpen,
  feel: Heart,
  develop: GraduationCap,
  participate: Users,
};

interface JourneyCardProps {
  journey: Journey;
  activityLabel: string;
  statusLabel: string;
}

export function JourneyCard({ journey, activityLabel, statusLabel }: JourneyCardProps) {
  const locale = useLocale();
  const Icon = ICONS[journey.id];
  const locked = journey.status === "locked";
  const percent = percentOf(journey.xp, journey.target);

  return (
    <Card
      className={cn("flex h-full flex-col gap-3 border-s-4 p-4", locked && "border-dashed")}
      style={{ borderInlineStartColor: locked ? "var(--border-strong)" : WORLD_COLOR[journey.id] }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full"
          style={locked ? { color: "var(--text-muted)", backgroundColor: "var(--surface-tint)" } : worldTint(journey.id)}
        >
          {locked ? <Lock className="size-4" /> : <Icon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-content">{journey.name}</h3>
            {!locked ? (
              <span className="text-sm font-bold" style={{ color: WORLD_COLOR[journey.id] }}>
                <Numeric>
                  {formatXp(journey.xp, locale)} XP
                </Numeric>
              </span>
            ) : null}
          </div>
          <p className="text-sm text-content-muted">{journey.description}</p>
        </div>
      </div>

      {locked ? (
        <p className="text-sm font-medium text-content-muted">{statusLabel}</p>
      ) : (
        <>
          <ProgressBar
            label={journey.name}
            hideLabel
            hideValue
            value={journey.xp}
            max={journey.target}
            valueText={`${percent}%`}
            indicatorClassName={WORLD_BAR[journey.id]}
          />
          <p className="text-sm font-semibold text-content">
            <Numeric>{percent}%</Numeric>
          </p>
          <p className="text-sm text-content-muted">{activityLabel}</p>
        </>
      )}
    </Card>
  );
}
