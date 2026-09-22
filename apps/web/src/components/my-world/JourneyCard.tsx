"use client";

import { Card, ProgressBar, cn } from "@moch/ui";
import { ArrowLeft, BookOpen, GraduationCap, Heart, Lock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Numeric } from "./Numeric";
import { formatXp, percentOf } from "./progress";
import type { Journey } from "./types";
import { WORLD_BAR, WORLD_COLOR, worldTint, worldWash } from "./world-tone";

const ICONS: Record<Journey["id"], LucideIcon> = {
  know: BookOpen,
  feel: Heart,
  develop: GraduationCap,
  participate: Users,
};

interface JourneyCardProps {
  journey: Journey;
  code: string;
  activitiesLabel: string;
  milestoneLabel: string | null;
  continueLabel: string;
  statusLabel: string;
}

export function JourneyCard({
  journey,
  code,
  activitiesLabel,
  milestoneLabel,
  continueLabel,
  statusLabel,
}: JourneyCardProps) {
  const locale = useLocale();
  const Icon = ICONS[journey.id];
  const locked = journey.status === "locked";
  const percent = percentOf(journey.xp, journey.target);

  return (
    <Card
      className={cn("flex h-full flex-col gap-3 p-4 shadow-sm", locked && "border-dashed")}
      style={locked ? undefined : { backgroundColor: worldWash(journey.id) }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full"
          style={locked ? { color: "var(--text-muted)", backgroundColor: "var(--surface-tint)" } : worldTint(journey.id)}
        >
          {locked ? <Lock className="size-4" /> : <Icon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-bold tracking-[0.14em]" style={{ color: locked ? "var(--text-muted)" : WORLD_COLOR[journey.id] }}>
                <span dir="ltr">{code}</span>
              </p>
              <h3 className="font-semibold text-content">{journey.name}</h3>
            </div>
            {!locked ? (
              <span className="shrink-0 text-sm font-bold" style={{ color: WORLD_COLOR[journey.id] }}>
                <Numeric>
                  {formatXp(journey.xp, locale)} XP
                </Numeric>
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-content-muted">{journey.description}</p>
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
          <p className="text-sm text-content">
            <Numeric className="font-semibold">{percent}%</Numeric>
            <span className="px-1.5 text-content-muted" aria-hidden="true">
              ·
            </span>
            <Numeric>{formatXp(journey.completedActivities, locale)} / {formatXp(journey.activityTarget, locale)}</Numeric>{" "}
            <span className="text-content-muted">{activitiesLabel}</span>
          </p>
          {milestoneLabel ? <p className="text-sm font-medium text-content">{milestoneLabel}</p> : null}
          {journey.href ? (
            <Link
              href={journey.href}
              className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold focus-visible:outline-none focus-visible:shadow-focus"
              style={{ color: WORLD_COLOR[journey.id] }}
            >
              {continueLabel}
              <ArrowLeft aria-hidden="true" className="size-4 ltr:rotate-180" />
            </Link>
          ) : null}
        </>
      )}
    </Card>
  );
}
