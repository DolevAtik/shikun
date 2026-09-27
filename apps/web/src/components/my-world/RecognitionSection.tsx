"use client";

import type { EmployeeProgress, ReceivedRecognition } from "@moch/contracts";
import { Button, SectionHeader } from "@moch/ui";
import { HeartHandshake, Medal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { formatDate } from "@/lib/format";
import { RecognitionCard } from "./RecognitionCard";
import type { OpenDetail } from "./types";

const PREVIEW = 2;

interface RecognitionSectionProps {
  items: ReceivedRecognition[];
  giving: EmployeeProgress["giving"];
  /** A line after a thank-you went out. */
  sent: string | null;
  onOpen: OpenDetail;
}

export function RecognitionSection({ items, giving, sent, onOpen }: RecognitionSectionProps) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, PREVIEW);
  const left = Math.max(0, giving.limit - giving.used);

  return (
    <section id="recognition" className="scroll-mt-20">
      <SectionHeader title={t("recognition.title")} titleClassName="text-lg" />
      <p className="-mt-1 mb-3 px-1 text-sm text-content-muted">{t("recognition.note")}</p>

      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-surface-tint px-4 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-content">{t("give.prompt")}</p>
          <p className="text-sm text-content-muted">
            {left > 0 ? t("give.left", { count: left }) : t("give.none")}
          </p>
        </div>
        <Button type="button" onClick={() => onOpen({ kind: "give" })} disabled={left === 0} className="w-full sm:w-auto">
          <HeartHandshake aria-hidden="true" className="size-4" />
          {t("give.open")}
        </Button>
      </div>
      <div role="status" aria-live="polite">
        {sent ? <p className="mb-3 rounded-lg bg-success-soft px-4 py-3 text-sm font-semibold text-success">{sent}</p> : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-sm">
          <Medal aria-hidden="true" className="size-6 text-content-muted" />
          <p className="font-semibold text-content">{t("recognition.emptyTitle")}</p>
          <p className="max-w-sm text-sm text-content-muted">{t("recognition.emptyBody")}</p>
        </div>
      ) : (
        <>
          <ul id="recognition-list" className="flex flex-col gap-3">
            {shown.map((recognition) => (
              <li key={recognition.id}>
                <RecognitionCard recognition={recognition} onOpen={() => onOpen({ kind: "recognition", id: recognition.id })} />
              </li>
            ))}
          </ul>
          {items.length > PREVIEW ? (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="recognition-list"
              onClick={() => setExpanded((value) => !value)}
              className="mt-2 min-h-11 px-1 text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:shadow-focus"
            >
              {expanded ? t("recognition.showLess") : t("recognition.showAll", { count: items.length })}
            </button>
          ) : null}
        </>
      )}

      {giving.recent.length > 0 ? (
        <div className="mt-5">
          <h3 className="mb-2 px-1 text-sm font-semibold text-content-muted">{t("give.recentTitle")}</h3>
          <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
            {giving.recent.slice(0, 3).map((given) => (
              <li key={given.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <Medal aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: given.badgeColor }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-content">
                    {t("give.recentLine", {
                      badge: locale === "en" ? given.badgeNameEn : given.badgeNameHe,
                      name: given.recipientName,
                    })}
                  </span>
                  <span className="line-clamp-2 block text-content-muted">{given.reason}</span>
                </span>
                {/* A date, not "3 minutes ago": relative text can differ between the server render and hydration. */}
                <span className="shrink-0 text-xs text-content-muted">{formatDate(given.awardedAt, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
