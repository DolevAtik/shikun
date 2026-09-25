"use client";

import type { Mission } from "@moch/contracts";
import { Button, Card, cn } from "@moch/ui";
import { BookOpen, CalendarDays, Clock, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { formatDateTime } from "@/lib/format";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import { WORLD_COLOR, worldTint, worldWash } from "./world-tone";

export const MISSION_ICONS: Record<Mission["act"], LucideIcon> = {
  read: BookOpen,
  training: GraduationCap,
  event: CalendarDays,
};

const primaryLink =
  "inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-sm font-medium text-content-onbrand shadow-sm hover:bg-brand-hover focus-visible:outline-none focus-visible:shadow-focus";

/**
 * The one action a mission offers. A read opens the post itself — reading it
 * is what grants the XP. A registration opens the real registration sheet.
 */
export function MissionAction({
  mission,
  onRegister,
  className,
}: {
  mission: Mission;
  onRegister: (mission: Mission) => void;
  className?: string;
}) {
  const t = useTranslations("myWorld");

  if (mission.act === "read") {
    return (
      <Link href={`/feed/${mission.contentItemId}`} className={cn(primaryLink, className)}>
        {t("missions.start")}
      </Link>
    );
  }
  return (
    <Button type="button" onClick={() => onRegister(mission)} className={className}>
      {t("missions.details")}
    </Button>
  );
}

/** Kicker, meta line and body text, shared by the featured and the compact card. */
export function useMissionCopy(mission: Mission) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const kicker = `${t(`worlds.${mission.world}.name`)} · ${mission.act === "read" ? t("missions.read") : t("missions.register")}`;
  const body = t(`missions.${mission.act}Body` as "missions.readBody");
  const when = mission.startsAt ? formatDateTime(mission.startsAt, locale) : null;
  const duration = mission.minutes != null ? t("missions.duration", { count: mission.minutes }) : null;
  const xp = `+${formatXp(mission.xp, locale)} XP`;
  return { kicker, body, when, duration, xp };
}

export function MissionCard({ mission, onRegister }: { mission: Mission; onRegister: (mission: Mission) => void }) {
  const Icon = MISSION_ICONS[mission.act];
  const copy = useMissionCopy(mission);

  return (
    <Card className="flex h-full flex-col gap-3 p-4" style={{ backgroundColor: worldWash(mission.world) }}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full" style={worldTint(mission.world)}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold" style={{ color: WORLD_COLOR[mission.world] }}>
            {copy.kicker}
          </p>
          <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug text-content">{mission.title}</h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-content-muted">
            {copy.duration ? (
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {copy.duration}
              </span>
            ) : null}
            {copy.when ? (
              <span className="inline-flex items-center gap-1">
                <CalendarDays aria-hidden="true" className="size-3.5" />
                {copy.when}
              </span>
            ) : null}
            <Numeric className="font-bold text-brand">{copy.xp}</Numeric>
          </p>
        </div>
      </div>
      <div className="mt-auto">
        <MissionAction mission={mission} onRegister={onRegister} />
      </div>
    </Card>
  );
}
