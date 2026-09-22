"use client";

import { SectionHeader } from "@moch/ui";
import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { AchievementCard } from "./AchievementCard";
import type { Achievement } from "./types";

export function AchievementsSection({ items }: { items: Achievement[] }) {
  const t = useTranslations("myWorld");

  return (
    <section className="min-w-0">
      <SectionHeader title={t("achievementsTitle")} titleClassName="text-lg" />
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-6 py-6 text-center shadow-sm">
          <Award aria-hidden="true" className="size-5 text-content-muted" />
          <p className="font-semibold text-content">{t("achievementsEmpty")}</p>
          <p className="max-w-sm text-sm text-content-muted">{t("achievementsEmptyHint")}</p>
        </div>
      ) : (
        <ul className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto pb-1 lg:grid lg:max-w-none lg:grid-cols-3 lg:overflow-visible">
          {items.map((achievement) => (
            <li key={achievement.id} className="w-64 shrink-0 snap-start lg:w-auto">
              <AchievementCard achievement={achievement} lockedLabel={t("lockedAchievement")} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
