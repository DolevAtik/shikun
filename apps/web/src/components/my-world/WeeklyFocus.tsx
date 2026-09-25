"use client";

import type { WorldFocus } from "@moch/contracts";
import { cn } from "@moch/ui";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { WORLD_COLOR } from "./world-tone";

const WORLDS: WorldFocus[] = ["know", "feel", "develop", "participate"];

interface WeeklyFocusProps {
  chosen: WorldFocus | null;
  error: boolean;
  onChoose: (world: WorldFocus | null) => void;
}

/** One tap, easy to skip. It is saved, and it decides which mission is featured. */
export function WeeklyFocus({ chosen, error, onChoose }: WeeklyFocusProps) {
  const t = useTranslations("myWorld");

  return (
    <fieldset className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-content">{t("journey.focusTitle")}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {WORLDS.map((world) => {
          const selected = chosen === world;
          return (
            <button
              key={world}
              type="button"
              aria-pressed={selected}
              onClick={() => onChoose(selected ? null : world)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
                "focus-visible:outline-none focus-visible:shadow-focus",
                selected ? "text-content" : "border-line bg-surface text-content hover:bg-surface-tint",
              )}
              style={
                selected
                  ? {
                      borderColor: WORLD_COLOR[world],
                      backgroundColor: `color-mix(in srgb, ${WORLD_COLOR[world]} 12%, var(--surface))`,
                    }
                  : undefined
              }
            >
              {selected ? <Check aria-hidden="true" className="size-4" style={{ color: WORLD_COLOR[world] }} /> : null}
              {t(`worlds.${world}.name`)}
            </button>
          );
        })}
      </div>
      <p className={cn("mt-2 text-xs", error ? "font-medium text-danger" : "text-content-muted")} role={error ? "alert" : undefined}>
        {error ? t("journey.focusSaveError") : t("journey.focusHint")}
      </p>
    </fieldset>
  );
}
