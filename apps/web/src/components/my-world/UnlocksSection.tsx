"use client";

import { SectionHeader } from "@moch/ui";
import { useTranslations } from "next-intl";
import { UnlockCard } from "./UnlockCard";
import type { Unlock } from "./types";

export function UnlocksSection({ items }: { items: Unlock[] }) {
  const t = useTranslations("myWorld");
  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader title={t("unlocksTitle")} />
      <ul className="flex flex-col gap-2">
        {items.map((unlock) => (
          <UnlockCard key={unlock.id} unlock={unlock} levelLabel={t("levelLabel")} />
        ))}
      </ul>
    </section>
  );
}
