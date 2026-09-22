"use client";

import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { AchievementCard } from "./AchievementCard";
import type { Achievement } from "./types";

export function AchievementsSection({ items }: { items: Achievement[] }) {
  const t = useTranslations("myWorld");
  if (items.length === 0) return null;

  return (
    <section className="min-w-0">
      <SectionHeader title={t("achievementsTitle")} />
      <ul className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto pb-1 lg:grid lg:max-w-none lg:grid-cols-3 lg:overflow-visible">
        {items.map((achievement) => (
          <li key={achievement.id} className="w-64 shrink-0 snap-start lg:w-auto">
            <AchievementCard achievement={achievement} lockedLabel={t("lockedAchievement")} />
          </li>
        ))}
      </ul>
    </section>
  );
}
