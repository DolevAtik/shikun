"use client";

import { cn, type WorldId } from "@moch/ui";
import { useTranslations } from "next-intl";

const WORLDS: WorldId[] = ["know", "feel", "develop", "participate"];

interface WeeklyFocusProps {
  chosen: WorldId | null;
  onChoose: (world: WorldId | null) => void;
}

/** One tap, easy to skip. It only decides which mission is featured. */
export function WeeklyFocus({ chosen, onChoose }: WeeklyFocusProps) {
  const t = useTranslations("myWorld");

  return (
    <fieldset className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-content">{t("focusTitle")}</legend>
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
                "min-h-11 rounded-full border px-3 text-sm font-medium",
                "focus-visible:outline-none focus-visible:shadow-focus",
                selected
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-surface text-content hover:bg-surface-tint",
              )}
            >
              {t(`worlds.${world}.code`)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-content-muted">{t("focusHint")}</p>
    </fieldset>
  );
}
