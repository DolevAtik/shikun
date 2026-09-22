import { cn } from "../cn";
import { WORLD_BORDER, type WorldId } from "../worlds";
import { Card } from "./Card";

export interface MissionCardProps {
  title: string;
  world: WorldId;
  worldLabel: string;
  xp: number;
  /** Spoken and shown when the mission is already done. */
  completedLabel?: string;
  completed?: boolean;
}

export function MissionCard({
  title,
  world,
  worldLabel,
  xp,
  completed = false,
  completedLabel,
}: MissionCardProps) {
  return (
    <Card className={cn("border-s-4 p-4", WORLD_BORDER[world])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-content">{title}</p>
          <p className="mt-0.5 text-sm text-content-muted">{worldLabel}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-brand">
          {completed ? completedLabel : `+${xp} נק׳`}
        </p>
      </div>
    </Card>
  );
}
