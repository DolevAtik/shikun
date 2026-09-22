"use client";

import { Award, Frame, Lock, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Numeric } from "./Numeric";
import type { Unlock } from "./types";

const ICONS: Record<string, LucideIcon> = {
  pin: Sparkles,
  badge: Award,
  frame: Frame,
};

export function UnlockCard({ unlock, levelLabel }: { unlock: Unlock; levelLabel: string }) {
  const Icon = ICONS[unlock.id] ?? Lock;

  return (
    <li className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-3">
      <span aria-hidden="true" className="mx-auto size-2.5 rounded-full bg-line-strong" />
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-tint text-content-muted"
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-content">
            {levelLabel} <Numeric>{unlock.level}</Numeric>
          </p>
          <p className="text-sm text-content-muted">{unlock.title}</p>
        </div>
        <Lock aria-hidden="true" className="ms-auto size-4 shrink-0 text-content-muted" />
      </div>
    </li>
  );
}
