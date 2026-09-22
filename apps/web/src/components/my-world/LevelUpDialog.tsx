"use client";

import { Button, IllustratedAvatar } from "@moch/ui";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { Numeric } from "./Numeric";

interface LevelUpDialogProps {
  level: number | null;
  onClose: () => void;
}

const COSMETIC_LEVELS = new Set([5, 10, 15]);

export function LevelUpDialog({ level, onClose }: LevelUpDialogProps) {
  const t = useTranslations("myWorld");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (level !== null && !dialog.open) dialog.showModal();
    if (level === null && dialog.open) dialog.close();
  }, [level]);

  const cosmetic = level !== null && COSMETIC_LEVELS.has(level);
  const detail =
    level !== null && cosmetic ? t(`levelUpDetail.${level}`) : t("levelUpDetail.default");

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100%-2rem))] rounded-xl border border-line bg-surface p-0 text-content shadow-lg backdrop:bg-[rgb(36_24_15/0.45)] open:motion-safe:animate-fade-up"
    >
      {level !== null ? (
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <div className="size-24 overflow-hidden rounded-full bg-brand-soft shadow-md ring-4 ring-[var(--sky-glow)]">
            <IllustratedAvatar level={level} />
          </div>
          <p aria-hidden="true" className="mt-4 text-lg">
            🎉
          </p>
          <h2 id={titleId} className="mt-1 text-2xl font-bold text-content">
            {t("levelUpTitle")}
          </h2>
          <p className="mt-2 text-content">
            {t("levelUpReached")} <Numeric>{level}</Numeric>
          </p>
          {cosmetic ? <p className="mt-3 text-sm font-semibold text-brand">{t("unlockedLabel")}</p> : null}
          <p className="mt-1 text-sm text-content-muted">{detail}</p>
          <Button type="button" className="mt-6 min-w-32" onClick={onClose}>
            {t("levelUpContinue")}
          </Button>
        </div>
      ) : null}
    </dialog>
  );
}
