"use client";

import { Card, SectionHeader } from "@moch/ui";
import { Award, Star, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import type { OverallStats } from "./types";

export function OverallProgress({ stats }: { stats: OverallStats }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  const tiles: { id: string; icon: LucideIcon; value: string; label: string }[] = [
    { id: "xp", icon: Star, value: `${formatXp(stats.totalXp, locale)} XP`, label: t("stats.totalXp") },
    { id: "missions", icon: Target, value: formatXp(stats.missionsCompleted, locale), label: t("stats.missions") },
    { id: "achievements", icon: Award, value: formatXp(stats.achievementsUnlocked, locale), label: t("stats.achievements") },
  ];

  return (
    <section>
      <SectionHeader title={t("progressTitle")} />
      <ul className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Card className="flex h-full flex-col items-center gap-1 px-2 py-4 text-center">
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-brand-soft text-brand">
                <tile.icon className="size-4" />
              </span>
              <Numeric className="text-lg font-bold text-content">{tile.value}</Numeric>
              <p className="text-xs font-medium text-content-muted">{tile.label}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
