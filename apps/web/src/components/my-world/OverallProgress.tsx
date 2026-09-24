"use client";

import { Card, SectionHeader } from "@moch/ui";
import { Award, Flame, Star, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import type { OverallStats } from "./types";

export function OverallProgress({ stats, graceAvailable }: { stats: OverallStats; graceAvailable: boolean }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  const tiles: { id: string; icon: LucideIcon; tint: string; value: string; label: string }[] = [
    { id: "xp", icon: Star, tint: "var(--accent-amber)", value: `${formatXp(stats.totalXp, locale)} XP`, label: t("stats.totalXp") },
    { id: "missions", icon: Target, tint: "var(--accent-teal)", value: formatXp(stats.missionsCompleted, locale), label: t("stats.missions") },
    { id: "achievements", icon: Award, tint: "var(--accent-violet)", value: formatXp(stats.achievementsUnlocked, locale), label: t("stats.achievements") },
    { id: "days", icon: Flame, tint: "var(--accent-red)", value: formatXp(stats.activeDays, locale), label: t("stats.activeDays") },
  ];

  return (
    <section>
      <SectionHeader title={t("progressTitle")} titleClassName="text-lg" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Card className="flex h-full flex-col items-center gap-1 px-2 py-4 text-center shadow-sm">
              <span
                aria-hidden="true"
                className="grid size-9 place-items-center rounded-full"
                style={{
                  color: tile.tint,
                  backgroundColor: `color-mix(in srgb, ${tile.tint} 14%, transparent)`,
                }}
              >
                <tile.icon className="size-4" />
              </span>
              <Numeric className="text-lg font-bold text-content">{tile.value}</Numeric>
              <p className="text-xs font-medium text-content-muted">{tile.label}</p>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-2 px-1 text-xs text-content-muted">{t("streakHint")}</p>
      {graceAvailable ? <p className="px-1 text-xs font-medium text-content">{t("graceAvailable")}</p> : null}
    </section>
  );
}
