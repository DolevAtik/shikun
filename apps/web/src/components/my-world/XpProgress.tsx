"use client";

import { ProgressBar } from "@moch/ui";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { useAnimatedNumber, usePrefersReducedMotion } from "./motion";
import { formatXp, xpRatio } from "./progress";
import type { XpProgress as XpProgressModel } from "./types";

interface XpProgressProps {
  xp: XpProgressModel;
  /** The grant just applied, so the counter can show where the points landed. */
  gain: number | null;
}

export function XpProgress({ xp, gain }: XpProgressProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const reduced = usePrefersReducedMotion();
  const shown = useAnimatedNumber(xp.current, reduced);
  const remaining = Math.max(0, xp.next - shown);

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
          <Numeric className="text-sm font-semibold text-content">{xpRatio(shown, xp.next, locale)}</Numeric>
        </span>
      </div>
      <ProgressBar
        label={t("xpLabel")}
        hideLabel
        hideValue
        value={xp.current}
        max={xp.next}
        valueText={xpRatio(xp.current, xp.next, locale)}
      />
      <p className="mt-2 text-sm text-content-muted">
        {remaining === 0 ? (
          t("levelReady")
        ) : (
          <>
            {t("untilPrefix") ? <>{t("untilPrefix")} </> : null}
            <Numeric>{formatXp(remaining, locale)} XP</Numeric> {t("untilLevel")}{" "}
            <Numeric>{xp.level + 1}</Numeric>
          </>
        )}
      </p>
    </div>
  );
}
