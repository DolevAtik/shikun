"use client";

import type { Level } from "@moch/contracts";
import { ProgressBar } from "@moch/ui";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { useAnimatedNumber, usePrefersReducedMotion } from "./motion";
import { formatXp, xpText } from "./progress";

interface XpProgressProps {
  level: Level;
  /** XP that just landed, so the counter can show where the points came from. */
  gain: number | null;
}

export function XpProgress({ level, gain }: XpProgressProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const reduced = usePrefersReducedMotion();
  const shown = useAnimatedNumber(level.current, reduced);
  const ratio = `${formatXp(shown, locale)} / ${formatXp(level.next, locale)} XP`;

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-content">{t("xpLabel")}</span>
        <span className="inline-flex items-baseline gap-2">
          {gain && !reduced ? (
            <span aria-hidden="true" className="animate-xp-float text-sm font-bold text-brand">
              <Numeric>+{formatXp(gain, locale)} XP</Numeric>
            </span>
          ) : null}
          <Numeric className="text-sm font-semibold text-content">{ratio}</Numeric>
        </span>
      </div>
      <ProgressBar
        label={t("xpLabel")}
        hideLabel
        hideValue
        size="lg"
        value={level.current}
        max={level.next}
        valueText={`${formatXp(level.current, locale)} / ${formatXp(level.next, locale)} XP`}
      />
      <p className="mt-2 text-sm text-content-muted">
        {t("untilLevel", { xp: xpText(Math.max(0, level.next - shown), locale), level: level.level + 1 })}
      </p>
    </div>
  );
}
