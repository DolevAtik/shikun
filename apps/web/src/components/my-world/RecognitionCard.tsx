"use client";

import { Card } from "@moch/ui";
import { Medal } from "lucide-react";
import type { Recognition } from "./types";

interface RecognitionCardProps {
  recognition: Recognition;
  fromLabel: string;
  whenLabel: string;
}

export function RecognitionCard({ recognition, fromLabel, whenLabel }: RecognitionCardProps) {
  return (
    <Card className="border-s-4 border-s-accent-amber p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full"
          style={{
            color: "var(--accent-amber)",
            backgroundColor: "color-mix(in srgb, var(--accent-amber) 14%, transparent)",
          }}
        >
          <Medal className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-content-muted">{recognition.badgeName}</p>
          <blockquote className="mt-1 text-base font-medium leading-relaxed text-content">
            {recognition.reason}
          </blockquote>
          <p className="mt-2 text-sm text-content-muted">
            {fromLabel}
            <span className="px-1.5" aria-hidden="true">
              ·
            </span>
            {whenLabel}
          </p>
        </div>
      </div>
    </Card>
  );
}
