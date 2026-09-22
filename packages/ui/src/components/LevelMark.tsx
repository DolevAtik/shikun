export interface LevelMarkProps {
  /** Already translated, e.g. "רמה 1". */
  levelLabel: string;
  tier: string;
}

export function LevelMark({ levelLabel, tier }: LevelMarkProps) {
  return (
    <div>
      <p className="text-lg font-bold text-content">{levelLabel}</p>
      <p className="text-sm text-content-muted">{tier}</p>
    </div>
  );
}
