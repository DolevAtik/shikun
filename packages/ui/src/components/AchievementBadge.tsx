import { Card } from "./Card";

export interface AchievementBadgeProps {
  title: string;
  description?: string;
}

/**
 * An automatic achievement. Visually a card, not a Chip — recognition from a
 * colleague stays a Chip so the two never look like the same thing.
 */
export function AchievementBadge({ title, description }: AchievementBadgeProps) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
      >
        <svg viewBox="0 0 16 16" className="size-4 fill-current">
          <path d="M8 1.2 9.4 6.6 14.8 8 9.4 9.4 8 14.8 6.6 9.4 1.2 8 6.6 6.6 8 1.2Z" />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-content">{title}</p>
        {description ? <p className="text-sm text-content-muted">{description}</p> : null}
      </div>
    </Card>
  );
}
