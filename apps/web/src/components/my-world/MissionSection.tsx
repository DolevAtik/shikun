"use client";

import { SectionHeader, type WorldId } from "@moch/ui";
import { BookOpen, CalendarDays, GraduationCap, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MissionCard } from "./MissionCard";
import { NextMission } from "./NextMission";
import type { Mission } from "./types";

const ICONS: Record<string, LucideIcon> = {
  weekly: BookOpen,
  training: GraduationCap,
  activity: CalendarDays,
};

const WORLD_ICONS: Record<WorldId, LucideIcon> = {
  know: BookOpen,
  feel: Sparkles,
  develop: GraduationCap,
  participate: CalendarDays,
};

interface MissionSectionProps {
  missions: Mission[];
  gainId: string | null;
  reducedMotion: boolean;
  onComplete: (id: string) => void;
}

export function MissionSection({ missions, gainId, reducedMotion, onComplete }: MissionSectionProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const next = missions.find((mission) => !mission.completed) ?? null;
  const rest = next ? missions.filter((mission) => mission.id !== next.id) : missions;

  const iconFor = (mission: Mission) => ICONS[mission.id] ?? WORLD_ICONS[mission.world];
  const labels = {
    startLabel: t("start"),
    detailsLabel: t("details"),
    completedLabel: t("completed"),
  };

  return (
    <section id="missions" className="scroll-mt-20">
      <SectionHeader title={t("missionsTitle")} titleClassName="text-lg" />
      {missions.length === 0 ? (
        <MissionsEmpty exploreLabel={t("explore")} title={t("missionsEmptyTitle")} body={t("missionsEmpty")} hint={t("missionsEmptyHint")} />
      ) : (
        <div className="flex flex-col gap-4">
          {next ? (
            <NextMission
              mission={next}
              worldLabel={t(`worlds.${next.world}.name`)}
              icon={iconFor(next)}
              locale={locale}
              showGain={gainId === next.id}
              reducedMotion={reducedMotion}
              onComplete={onComplete}
              {...labels}
            />
          ) : (
            <MissionsEmpty
              exploreLabel={t("explore")}
              title={t("missionsEmptyTitle")}
              body={t("missionsEmpty")}
              hint={t("missionsEmptyHint")}
            />
          )}
          {rest.length > 0 ? (
            <div>
              <h3 className="mb-2 px-1 text-sm font-semibold text-content-muted">
                {next ? t("moreMissions") : t("missionsDone")}
              </h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {rest.map((mission) => (
                  <li key={mission.id}>
                    <MissionCard
                      mission={mission}
                      worldLabel={t(`worlds.${mission.world}.name`)}
                      icon={iconFor(mission)}
                      locale={locale}
                      showGain={gainId === mission.id}
                      reducedMotion={reducedMotion}
                      onComplete={onComplete}
                      {...labels}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MissionsEmpty({
  title,
  body,
  hint,
  exploreLabel,
}: {
  title: string;
  body: string;
  hint: string;
  exploreLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-6 py-6 text-center shadow-sm">
      <span aria-hidden="true" className="mb-1 grid size-10 place-items-center rounded-full bg-brand-soft text-brand">
        <Sparkles className="size-5" />
      </span>
      <p className="text-lg font-semibold text-content">{title}</p>
      <p className="max-w-sm text-sm text-content-muted">{body}</p>
      <p className="max-w-sm text-sm text-content-muted">{hint}</p>
      <Link
        href="/"
        className="mt-3 inline-flex h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-content-onbrand shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus"
      >
        {exploreLabel}
      </Link>
    </div>
  );
}
