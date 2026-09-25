"use client";

import type { Mission } from "@moch/contracts";
import { CalendarDays, Clock, Target } from "lucide-react";
import { MISSION_ICONS, MissionAction, useMissionCopy } from "./MissionCard";
import { Numeric } from "./Numeric";
import { WORLD_COLOR, worldTint, worldWash } from "./world-tone";

/** The one open step worth doing next. Not a clickable card — the single button is the action. */
export function NextMission({ mission, onRegister }: { mission: Mission; onRegister: (mission: Mission) => void }) {
  const Icon = MISSION_ICONS[mission.act];
  const copy = useMissionCopy(mission);

  return (
    <article
      className="relative overflow-hidden rounded-xl border border-transparent p-5 shadow-md sm:p-6"
      style={{ backgroundColor: worldWash(mission.world) }}
    >
      <Target
        aria-hidden="true"
        className="pointer-events-none absolute -end-6 -top-6 size-32 opacity-[0.06]"
        style={{ color: WORLD_COLOR[mission.world] }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl" style={worldTint(mission.world)}>
          <Icon className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide" style={{ color: WORLD_COLOR[mission.world] }}>
            {copy.kicker}
          </p>
          <h3 className="mt-0.5 text-xl font-bold leading-snug text-content">{mission.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-content-muted">{copy.body}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {copy.duration ? (
              <span className="inline-flex items-center gap-1.5 text-content-muted">
                <Clock aria-hidden="true" className="size-4" />
                {copy.duration}
              </span>
            ) : null}
            {copy.when ? (
              <span className="inline-flex items-center gap-1.5 text-content-muted">
                <CalendarDays aria-hidden="true" className="size-4" />
                {copy.when}
              </span>
            ) : null}
            <Numeric className="font-bold text-brand">{copy.xp}</Numeric>
          </p>
        </div>
        <MissionAction mission={mission} onRegister={onRegister} className="w-full sm:w-auto" />
      </div>
    </article>
  );
}
