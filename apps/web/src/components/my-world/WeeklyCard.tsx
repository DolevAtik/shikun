"use client";

import { useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import type { WeeklyCard as WeeklyCardModel } from "./types";

/** A near prize: three stamps, written out, not color alone. */
export function WeeklyCard({ card }: { card: WeeklyCardModel }) {
  const t = useTranslations("myWorld");
  const filled = Math.max(0, Math.min(card.total, card.filled));

  return (
    <div className="mt-4 rounded-lg bg-surface/80 px-3 py-3 text-start shadow-sm ring-1 ring-line">
      <p className="text-sm font-semibold text-content">
        <Numeric>
          {filled} / {card.total}
        </Numeric>{" "}
        {t("thisWeek")}
      </p>
      <ol className="mt-2 flex list-none gap-2 p-0" aria-hidden="true">
        {Array.from({ length: card.total }, (_, index) => {
          const done = index < filled;
          return (
            <li
              key={index}
              className={done ? "h-2 flex-1 rounded-full bg-brand" : "h-2 flex-1 rounded-full bg-surface-sunken"}
            />
          );
        })}
      </ol>
      <p className="sr-only">
        {t("stampsFilled", { filled, total: card.total })}
      </p>
      {card.endowed ? <p className="mt-2 text-xs text-content-muted">{t("endowed")}</p> : null}
    </div>
  );
}
