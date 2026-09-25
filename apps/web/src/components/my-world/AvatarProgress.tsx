"use client";

import { IllustratedAvatar } from "@moch/ui";
import { useTranslations } from "next-intl";
import { Numeric } from "./Numeric";

interface AvatarProgressProps {
  level: number;
  current: number;
  next: number;
  onOpen: () => void;
}

/** The figure with a ring that follows XP inside the level. A button: it opens the figure's stages. */
export function AvatarProgress({ level, current, next, onOpen }: AvatarProgressProps) {
  const t = useTranslations("myWorld");
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = next > 0 ? Math.min(1, Math.max(0, current / next)) : 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${t("openAvatar")} · ${t("levelLabel")} ${level}`}
      className="group relative block size-40 shrink-0 rounded-full focus-visible:outline-none focus-visible:shadow-focus sm:size-44"
    >
      <span aria-hidden="true" className="absolute inset-3 rounded-full opacity-80 blur-md" style={{ background: "var(--sky-glow)" }} />
      <svg aria-hidden="true" viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="5" className="stroke-surface-sunken" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-brand"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference * (1 - progress),
            transition: "stroke-dashoffset 700ms var(--ease)",
          }}
        />
      </svg>
      <span className="absolute inset-[11px] overflow-hidden rounded-full bg-brand-soft shadow-md ring-4 ring-surface transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none">
        <IllustratedAvatar level={level} />
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0.5 mx-auto w-fit rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-content-onbrand shadow-sm"
      >
        {t("levelLabel")} <Numeric>{level}</Numeric>
      </span>
    </button>
  );
}
