"use client";

import { SectionHeader } from "@moch/ui";
import { Medal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatRelative } from "@/lib/format";
import { RecognitionCard } from "./RecognitionCard";
import type { Recognition } from "./types";

export function RecognitionSection({ items }: { items: Recognition[] }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  return (
    <section>
      <SectionHeader title={t("recognitionTitle")} titleClassName="text-lg" />
      <p className="-mt-1 mb-3 px-1 text-sm text-content-muted">{t("recognitionNote")}</p>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-sm">
          <Medal aria-hidden="true" className="size-6 text-content-muted" />
          <p className="font-semibold text-content">{t("recognitionEmpty")}</p>
          <p className="max-w-sm text-sm text-content-muted">{t("recognitionEmptyHint")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((recognition) => (
            <li key={recognition.id}>
              <RecognitionCard
                recognition={recognition}
                fromLabel={t("recognitionFrom", { name: recognition.giverName })}
                whenLabel={formatRelative(recognition.awardedAt, locale)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
