"use client";

import type { WorldProgress } from "@moch/contracts";
import { BookOpen, ChevronLeft, GraduationCap, Heart, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MiniBar } from "./MiniBar";
import { Numeric } from "./Numeric";
import { formatXp, milestoneProgress, percentOf, ratioText } from "./progress";
import { WORLD_COLOR, worldTint, worldWash } from "./world-tone";

export const WORLD_ICONS: Record<WorldProgress["id"], LucideIcon> = {
  know: BookOpen,
  feel: Heart,
  develop: GraduationCap,
  participate: Users,
};

/** The whole card is the link to that world's page: history and what is open now. */
export function JourneyCard({ world, focused }: { world: WorldProgress; focused: boolean }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const Icon = WORLD_ICONS[world.id];
  const band = milestoneProgress(world.acts, world.milestone);
  const percent = percentOf(band.done, band.target);
  const name = t(`worlds.${world.id}.name`);

  return (
    <Link
      href={`/my-world/${world.id}`}
      aria-label={`${name}. ${t("journey.milestone", { ratio: ratioText(band.done, band.target, locale) })}. ${t("journey.open", { world: name })}`}
      className="group flex h-full flex-col gap-2 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:shadow-focus"
      style={{
        backgroundColor: worldWash(world.id),
        borderColor: focused ? WORLD_COLOR[world.id] : "transparent",
      }}
    >
      <span className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full" style={worldTint(world.id)}>
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span dir="ltr" className="block text-[0.7rem] font-bold tracking-[0.14em]" style={{ color: WORLD_COLOR[world.id] }}>
                {t(`worlds.${world.id}.code`)}
              </span>
              <span className="block font-semibold text-content">{name}</span>
            </span>
            <Numeric className="shrink-0 text-lg font-bold" >
              <span style={{ color: WORLD_COLOR[world.id] }}>{percent}%</span>
            </Numeric>
          </span>
          <span className="mt-0.5 block text-sm text-content-muted">{t(`worlds.${world.id}.description`)}</span>
        </span>
      </span>
      <MiniBar value={band.done} max={band.target} color={WORLD_COLOR[world.id]} className="h-2" />
      <span className="flex items-center justify-between gap-2 text-sm">
        <span className="text-content-muted">
          {t("journey.milestone", { ratio: ratioText(band.done, band.target, locale) })}
          <span aria-hidden="true"> · </span>
          <Numeric>{formatXp(world.xp, locale)} XP</Numeric>
        </span>
        <ChevronLeft
          aria-hidden="true"
          className="size-4 shrink-0 text-content-muted transition-transform group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
