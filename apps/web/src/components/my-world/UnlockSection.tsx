"use client";

import type { Unlock } from "@moch/contracts";
import { cn, IllustratedAvatar, SectionHeader } from "@moch/ui";
import { Check, ChevronLeft, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MiniBar } from "./MiniBar";
import { xpText } from "./progress";
import type { OpenDetail } from "./types";

export function UnlockSection({ items, total, onOpen }: { items: Unlock[]; total: number; onOpen: OpenDetail }) {
  const t = useTranslations("myWorld");

  return (
    <section id="unlocks" className="scroll-mt-20">
      <SectionHeader title={t("unlocks.title")} titleClassName="text-lg" />
      <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
        {items.map((unlock) => (
          <li key={unlock.id}>
            <UnlockCard unlock={unlock} total={total} onOpen={() => onOpen({ kind: "unlock", id: unlock.id })} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function UnlockCard({ unlock, total, onOpen }: { unlock: Unlock; total: number; onOpen: () => void }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const remaining = Math.max(0, unlock.xpAt - total);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-full w-full items-center gap-3 rounded-lg border px-3 py-3 text-start transition-shadow",
        "hover:shadow-md focus-visible:outline-none focus-visible:shadow-focus",
        unlock.unlocked ? "border-transparent bg-success-soft" : "border-dashed border-line bg-surface",
      )}
    >
      <span className={cn("size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-line", !unlock.unlocked && "opacity-60")}>
        <IllustratedAvatar level={unlock.level} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-content">{t(`unlocks.items.${unlock.id}.title`)}</span>
        <span className="block text-xs text-content-muted">
          {t("unlocks.atLevel", { level: unlock.level })}
          <span aria-hidden="true"> · </span>
          {unlock.unlocked ? t("unlocks.open") : t("unlocks.remaining", { xp: xpText(remaining, locale) })}
        </span>
        {unlock.unlocked ? null : <MiniBar value={total} max={unlock.xpAt} />}
      </span>
      {unlock.unlocked ? (
        <Check aria-hidden="true" className="size-4 shrink-0 text-success" />
      ) : (
        <Lock aria-hidden="true" className="size-4 shrink-0 text-content-muted" />
      )}
      <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-content-muted ltr:rotate-180" />
    </button>
  );
}
