"use client";

import { SectionHeader, type WorldId } from "@moch/ui";
import { BookOpen, GraduationCap, Megaphone, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MissionCard } from "./MissionCard";
import type { Mission } from "./types";

const ICONS: Record<WorldId, LucideIcon> = {
  know: BookOpen,
  feel: Sparkles,
  develop: GraduationCap,
  participate: Users,
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
  const open = missions.some((mission) => !mission.completed);

  return (
    <section id="missions" className="scroll-mt-20">
      <SectionHeader title={t("missionsTitle")} />
      {missions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-6 py-10 text-center shadow-sm">
          <Sparkles aria-hidden="true" className="size-6 text-brand" />
          <p className="text-lg font-semibold text-content">{t("missionsEmptyTitle")}</p>
          <p className="max-w-sm text-sm text-content-muted">{t("missionsEmpty")}</p>
          <p className="max-w-sm text-sm text-content-muted">{t("missionsEmptyHint")}</p>
          <Link
            href="/"
            className="mt-2 inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-content hover:bg-surface-tint"
          >
            {t("explore")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {missions.map((mission) => (
              <li key={mission.id}>
                <MissionCard
                  mission={mission}
                  worldLabel={t(`worlds.${mission.world}.name`)}
                  icon={mission.id === "briefing" ? Megaphone : ICONS[mission.world]}
                  locale={locale}
                  completeLabel={t("complete")}
                  viewLabel={t("view")}
                  completedLabel={t("completed")}
                  showGain={gainId === mission.id}
                  reducedMotion={reducedMotion}
                  onComplete={onComplete}
                />
              </li>
            ))}
          </ul>
          {!open ? (
            <p className="mt-3 px-1 text-sm text-content-muted">{t("missionsDone")}</p>
          ) : null}
        </>
      )}
    </section>
  );
}
