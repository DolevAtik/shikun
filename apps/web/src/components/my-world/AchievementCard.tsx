"use client";

import { Card } from "@moch/ui";
import { Award, BookOpen, CalendarCheck, Flag, Lock, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Achievement } from "./types";

const ICONS: Record<string, LucideIcon> = {
  firstStep: Flag,
  knowledge: BookOpen,
  growth: Rocket,
  consistent: CalendarCheck,
};

interface AchievementCardProps {
  achievement: Achievement;
  lockedLabel: string;
}

export function AchievementCard({ achievement, lockedLabel }: AchievementCardProps) {
  const Icon = ICONS[achievement.id] ?? Award;

  if (!achievement.unlocked) {
    return (
      <Card className="flex h-full items-center gap-3 border-dashed p-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-tint text-content-muted"
        >
          <Lock className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="sr-only">{lockedLabel}</p>
          <p className="text-sm font-semibold leading-snug text-content">{achievement.hint}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full items-center gap-3 p-3">
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold leading-snug text-content">{achievement.title}</p>
        <p className="text-sm text-content-muted">{achievement.description}</p>
      </div>
    </Card>
  );
}
