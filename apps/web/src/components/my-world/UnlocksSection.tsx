"use client";

import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { UnlockCard } from "./UnlockCard";
import type { Unlock } from "./types";

export function UnlocksSection({ items }: { items: Unlock[] }) {
  const t = useTranslations("myWorld");

  return (
    <section>
      <SectionHeader title={t("unlocksTitle")} titleClassName="text-lg" />
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface px-5 py-5 text-sm text-content-muted shadow-sm">
          {t("unlocksEmpty")}
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">{items.map((unlock) => (
          <UnlockCard key={unlock.id} unlock={unlock} levelLabel={t("levelLabel")} />
        ))}</ol>
      )}
    </section>
  );
}
