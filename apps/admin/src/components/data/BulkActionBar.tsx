"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function BulkActionBar({
  count,
  label,
  actions,
  onClear,
}: {
  count: number;
  label: string;
  actions: ReactNode;
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label={label}
      className="sticky bottom-4 z-20 mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-md border border-line bg-popover px-4 py-3 shadow-lg"
    >
      <p className="text-sm font-medium text-content">
        <span className="numeric">{count}</span> {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          ביטול
        </Button>
      </div>
    </div>
  );
}
