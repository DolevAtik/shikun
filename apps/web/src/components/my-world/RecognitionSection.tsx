"use client";

import type { ReceivedRecognition } from "@moch/contracts";
import { SectionHeader } from "@moch/ui";
import { Medal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RecognitionCard } from "./RecognitionCard";
import type { OpenDetail } from "./types";

const PREVIEW = 2;

export function RecognitionSection({ items, onOpen }: { items: ReceivedRecognition[]; onOpen: OpenDetail }) {
  const t = useTranslations("myWorld");
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? items : items.slice(0, PREVIEW);

  return (
    <section id="recognition" className="scroll-mt-20">
      <SectionHeader title={t("recognition.title")} titleClassName="text-lg" />
      <p className="-mt-1 mb-3 px-1 text-sm text-content-muted">{t("recognition.note")}</p>
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
    </section>
  );
}
