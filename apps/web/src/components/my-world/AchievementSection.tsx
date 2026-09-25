"use client";

import type { Achievement } from "@moch/contracts";
import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { AchievementCard } from "./AchievementCard";
import type { OpenDetail } from "./types";

export function AchievementSection({ items, onOpen }: { items: Achievement[]; onOpen: OpenDetail }) {
  const t = useTranslations("myWorld");
  const unlocked = items.filter((item) => item.unlockedAt !== null).length;
  // Open first, then the ones closest to opening — the nearest goal is the useful one.
  const sorted = [...items].sort((a, b) => {
    const aOpen = a.unlockedAt !== null;
    const bOpen = b.unlockedAt !== null;
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    return a.target - a.current - (b.target - b.current);
  });

  return (
    <section id="achievements" className="min-w-0 scroll-mt-20">
      <SectionHeader
        title={t("achievements.title")}
        titleClassName="text-lg"
        action={<span className="text-sm text-content-muted">{t("achievements.summary", { unlocked, total: items.length })}</span>}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((achievement) => (
          <li key={achievement.id}>
            <AchievementCard achievement={achievement} onOpen={() => onOpen({ kind: "achievement", id: achievement.id })} />
          </li>
        ))}
      </ul>
    </section>
  );
}
