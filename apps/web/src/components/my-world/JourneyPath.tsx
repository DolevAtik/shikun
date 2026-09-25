"use client";

import type { EmployeeProgress, WorldFocus } from "@moch/contracts";
import { cn, IllustratedAvatar } from "@moch/ui";
import { ChevronLeft, Flag, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { JourneyCard } from "./JourneyCard";
import { xpText } from "./progress";
import type { OpenDetail } from "./types";
import { WORLD_COLOR } from "./world-tone";

interface JourneyPathProps {
  progress: EmployeeProgress;
  chosen: WorldFocus | null;
  onOpen: OpenDetail;
}

/**
 * START → the four worlds → the next level → the next unlock.
 * The worlds stay independent; the line is only the feeling of a journey.
 */
export function JourneyPath({ progress, chosen, onOpen }: JourneyPathProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const nextUnlock = progress.unlocks.find((unlock) => !unlock.unlocked) ?? null;
  const toLevel = progress.level.next - progress.level.current;

  return (
    <ol className="m-0 flex list-none flex-col p-0">
      <Step dot={<Flag className="size-3" />} dotColor="var(--success)" first>
        <p className="py-2 text-sm">
          <span className="font-semibold text-content">{t("journey.start")}</span>
          <span className="text-content-muted"> · {t("journey.startDetail", { count: progress.stats.acts })}</span>
        </p>
      </Step>

      {progress.worlds.length > 0 ? (
        <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3">
          <Rail />
          <ul className="m-0 grid list-none gap-3 p-0 pb-3 md:grid-cols-2">
            {progress.worlds.map((world) => (
              <li key={world.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -start-7 top-7 size-3 rounded-full ring-4 ring-bg md:hidden"
                  style={{ backgroundColor: WORLD_COLOR[world.id] }}
                />
                <JourneyCard world={world} focused={chosen === world.id} />
              </li>
            ))}
          </ul>
        </li>
      ) : null}

      <Step dot={<Star className="size-3" />} dotColor="var(--brand-blue)">
        <p className="py-2 text-sm">
          <span className="font-semibold text-content">{t("journey.nextLevel", { level: progress.level.level + 1 })}</span>
          <span className="text-content-muted"> · {t("journey.nextLevelDetail", { xp: xpText(toLevel, locale) })}</span>
        </p>
      </Step>

      {nextUnlock ? (
        <Step dot={<span className="block size-2 rounded-full bg-content-muted" />} dotColor="var(--surface-sunken)" last>
          <button
            type="button"
            onClick={() => onOpen({ kind: "unlock", id: nextUnlock.id })}
            className="flex w-full items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-3 py-2.5 text-start hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus"
          >
            <span className="size-10 shrink-0 overflow-hidden rounded-full opacity-70 ring-2 ring-line">
              <IllustratedAvatar level={nextUnlock.level} />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-semibold text-content">{t("journey.nextUnlock")}</span>
              <span className="block text-content-muted">
                {t("journey.nextUnlockDetail", { title: t(`unlocks.items.${nextUnlock.id}.title`), level: nextUnlock.level })}
              </span>
            </span>
            <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-content-muted ltr:rotate-180" />
          </button>
        </Step>
      ) : null}
    </ol>
  );
}

function Rail() {
  return (
    <div aria-hidden="true" className="relative flex justify-center">
      <span className="absolute inset-y-0 w-px bg-line" />
    </div>
  );
}

function Step({
  dot,
  dotColor,
  first,
  last,
  children,
}: {
  dot: ReactNode;
  dotColor: string;
  first?: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-3">
      <div aria-hidden="true" className="relative flex justify-center">
        <span className={cn("absolute w-px bg-line", first ? "bottom-0 top-4" : last ? "top-0 h-4" : "inset-y-0")} />
        <span
          className="relative z-10 mt-2.5 grid size-5 place-items-center rounded-full text-white ring-4 ring-bg"
          style={{ backgroundColor: dotColor }}
        >
          {dot}
        </span>
      </div>
      <div className="min-w-0">{children}</div>
    </li>
  );
}
