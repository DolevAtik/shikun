"use client";

import { IllustratedAvatar } from "@moch/ui";
import { Numeric } from "./Numeric";

interface AvatarCardProps {
  level: number;
  current: number;
  next: number;
}

/** The figure, a level pip, and a ring that follows XP inside the current level. */
export function AvatarCard({ level, current, next }: AvatarCardProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = next > 0 ? Math.min(1, Math.max(0, current / next)) : 0;

  return (
    <div className="relative size-36 shrink-0 sm:size-40">
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
      <div className="absolute inset-[10px] overflow-hidden rounded-full bg-brand-soft shadow-md ring-2 ring-surface">
        <IllustratedAvatar level={level} />
      </div>
      <span className="absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-content-onbrand shadow-sm">
        <Numeric>{level}</Numeric>
      </span>
    </div>
  );
}
