"use client";

import type { ReceivedRecognition } from "@moch/contracts";
import { Medal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatRelative } from "@/lib/format";

export function RecognitionCard({ recognition, onOpen }: { recognition: ReceivedRecognition; onOpen: () => void }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-lg border border-s-4 border-line bg-surface p-4 text-start shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:shadow-focus"
      style={{ borderInlineStartColor: recognition.badgeColor }}
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full"
        style={{ color: recognition.badgeColor, backgroundColor: `color-mix(in srgb, ${recognition.badgeColor} 14%, transparent)` }}
      >
        <Medal className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-content-muted">
          {locale === "en" ? recognition.badgeNameEn : recognition.badgeNameHe}
        </span>
        <span className="mt-1 line-clamp-2 block text-base font-medium leading-relaxed text-content">{recognition.reason}</span>
        <span className="mt-2 block text-sm text-content-muted">
          {recognition.giverName ? t("recognition.from", { name: recognition.giverName }) : t("recognition.fromUnknown")}
          <span aria-hidden="true"> · </span>
          {formatRelative(recognition.awardedAt, locale)}
        </span>
      </span>
    </button>
  );
}
