import type { ReactNode } from "react";
import { cn } from "../cn";
import { WORLD_BORDER, type WorldId } from "../worlds";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";

export interface WorldCardProps {
  world: WorldId;
  name: string;
  description: string;
  /** XP earned toward `max` for this world. */
  value: number;
  max: number;
  valueText?: string;
  icon?: ReactNode;
}

export function WorldCard({ world, name, description, value, max, valueText, icon }: WorldCardProps) {
  return (
    <Card className={cn("border-s-4 p-4", WORLD_BORDER[world])}>
      <div className="mb-3 flex items-center gap-2">
        {icon ? (
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-tint text-brand">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="font-semibold text-content">{name}</h3>
          <p className="text-sm text-content-muted">{description}</p>
        </div>
      </div>
      <ProgressBar label={name} value={value} max={max} valueText={valueText} hideLabel />
    </Card>
  );
}
