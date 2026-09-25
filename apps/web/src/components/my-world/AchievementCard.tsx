"use client";

import type { Achievement, AchievementId } from "@moch/contracts";
import { cn } from "@moch/ui";
import { BookOpen, CalendarCheck, Compass, Flag, GraduationCap, Lock, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { MiniBar } from "./MiniBar";
import { Numeric } from "./Numeric";
import { remainingFor } from "./progress";

const ICONS: Record<AchievementId, LucideIcon> = {
  firstStep: Flag,
  reader: BookOpen,
  learner: GraduationCap,
  participant: Users,
  explorer: Compass,
  consistent: CalendarCheck,
  level5: Star,
};

export function AchievementIcon({ id, unlocked, size = "md" }: { id: AchievementId; unlocked: boolean; size?: "md" | "lg" }) {
  const Icon = unlocked ? ICONS[id] : Lock;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        size === "lg" ? "size-14" : "size-11",
        unlocked ? "text-accent-amber" : "bg-surface-tint text-content-muted",
      )}
      style={unlocked ? { backgroundColor: "color-mix(in srgb, var(--accent-amber) 16%, var(--surface))" } : undefined}
    >
      <Icon className={size === "lg" ? "size-6" : "size-5"} />
    </span>
  );
}

/** A button, because it opens the achievement's detail — condition, progress, date. */
export function AchievementCard({ achievement, onOpen }: { achievement: Achievement; onOpen: () => void }) {
  const t = useTranslations("myWorld");
  const unlocked = achievement.unlockedAt !== null;
  const remaining = remainingFor(achievement);
  const title = t(`achievements.items.${achievement.id}.title`);
  const ratio = t("achievements.progress", { current: achievement.current, target: achievement.target });

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-full w-full items-center gap-3 rounded-lg border p-3 text-start transition-shadow",
        "hover:shadow-md focus-visible:outline-none focus-visible:shadow-focus",
        unlocked ? "border-transparent bg-warning-soft" : "border-dashed border-line bg-surface",
      )}
    >
      <AchievementIcon id={achievement.id} unlocked={unlocked} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-content">{title}</span>
        <span className="sr-only">{unlocked ? t("achievements.unlocked") : t("achievements.locked")}</span>
        {unlocked ? (
          <span className="block text-sm text-content-muted">{t(`achievements.items.${achievement.id}.condition`)}</span>
        ) : (
          <>
            <span className="mt-0.5 flex items-baseline justify-between gap-2 text-sm text-content-muted">
              <span>
                {achievement.id === "level5"
                  ? t("achievements.remainingLevel", { count: remaining })
                  : t("achievements.remaining", { count: remaining })}
              </span>
              <Numeric className="text-xs">{ratio}</Numeric>
            </span>
            <MiniBar value={achievement.current} max={achievement.target} />
          </>
        )}
      </span>
    </button>
  );
}
