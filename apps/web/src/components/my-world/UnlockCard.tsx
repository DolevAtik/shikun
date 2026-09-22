"use client";

import { Lock } from "lucide-react";
import { Numeric } from "./Numeric";
import type { Unlock } from "./types";

export function UnlockCard({ unlock, levelLabel }: { unlock: Unlock; levelLabel: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-dashed border-line bg-surface px-4 py-3">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-tint text-content-muted"
      >
        <Lock className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-content">
          {levelLabel} <Numeric>{unlock.level}</Numeric>
        </p>
        <p className="text-sm text-content-muted">{unlock.title}</p>
      </div>
    </li>
  );
}
