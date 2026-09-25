"use client";

import type { EmployeeProgress } from "@moch/contracts";
import { Award, Flame, Star, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";

/** Four facts. They are not buttons, so they don't lift on hover. */
export function OverallProgress({ progress }: { progress: EmployeeProgress }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  const tiles: { id: string; icon: LucideIcon; tint: string; value: string; label: string }[] = [
    { id: "xp", icon: Star, tint: "var(--accent-amber)", value: formatXp(progress.level.total, locale), label: t("stats.xp") },
    { id: "acts", icon: Target, tint: "var(--accent-teal)", value: formatXp(progress.stats.acts, locale), label: t("stats.acts") },
    { id: "achievements", icon: Award, tint: "var(--accent-violet)", value: formatXp(progress.stats.achievements, locale), label: t("stats.achievements") },
    { id: "streak", icon: Flame, tint: "var(--accent-red)", value: formatXp(progress.stats.streakDays, locale), label: t("stats.streak") },
  ];

  return (
    <section aria-labelledby="my-world-stats">
      <h2 id="my-world-stats" className="sr-only">
        {t("stats.title")}
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.id} className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 py-4 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full"
              style={{ color: tile.tint, backgroundColor: `color-mix(in srgb, ${tile.tint} 14%, transparent)` }}
            >
              <tile.icon className="size-4" />
            </span>
            <dt className="order-3 text-xs font-medium text-content-muted">{tile.label}</dt>
            <dd className="order-2 text-lg font-bold text-content">
              <Numeric>{tile.value}</Numeric>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 px-1 text-xs text-content-muted">
        {progress.stats.graceUsed ? t("stats.graceUsed") : t("stats.streakHint")}
      </p>
    </section>
  );
}
