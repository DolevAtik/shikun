"use client";

import type { Unlock } from "@moch/contracts";
import { Button, IllustratedAvatar } from "@moch/ui";
import { useTranslations } from "next-intl";
import { Sheet } from "./Sheet";

interface LevelUpDialogProps {
  level: number | null;
  /** The cosmetic stage this level opened, if any. */
  unlock: Unlock | null;
  onClose: () => void;
}

/** Short and dismissible. No confetti storm: the figure and the words carry it. */
export function LevelUpDialog({ level, unlock, onClose }: LevelUpDialogProps) {
  const t = useTranslations("myWorld");

  return (
    <Sheet open={level !== null} title={t("levelUp.title")} onClose={onClose}>
      {level !== null ? (
        <div className="flex flex-col items-center text-center">
          <div className="size-24 overflow-hidden rounded-full bg-brand-soft shadow-md ring-4 ring-[var(--sky-glow)]">
            <IllustratedAvatar level={level} />
          </div>
          <p className="mt-4 text-lg font-semibold text-content">{t("levelUp.reached", { level })}</p>
          <p className="mt-2 text-sm text-content-muted">
            {unlock ? t("levelUp.unlocked", { title: t(`unlocks.items.${unlock.id}.title`) }) : t("levelUp.default")}
          </p>
          <Button type="button" className="mt-6 w-full" onClick={onClose}>
            {t("levelUp.continue")}
          </Button>
        </div>
      ) : null}
    </Sheet>
  );
}
