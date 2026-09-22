"use client";

import { cn } from "@moch/ui";
import type { ReactNode } from "react";

/** Isolates a number so Hebrew does not reorder a ratio or a percent. */
export function Numeric({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={cn("numeric tabular-nums", className)}>
      {children}
    </span>
  );
}
