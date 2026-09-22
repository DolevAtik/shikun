import { cn } from "../cn";

export interface ProgressBarProps {
  /** Named for the screen reader. Also shown, unless `hideLabel` is set. */
  label: string;
  value: number;
  max: number;
  /** Visible amount, e.g. "0 / 1,000 XP". Falls back to a percentage. */
  valueText?: string;
  hideLabel?: boolean;
  /** The amount stays available to assistive tech, but is not painted. */
  hideValue?: boolean;
  /** Replaces the brand fill, e.g. a world accent. */
  indicatorClassName?: string;
  className?: string;
  /** `lg` is the identity bar. Everything else stays the compact track. */
  size?: "md" | "lg";
}

/**
 * A bar is never the only indication of progress. The amount is written out
 * beside it, and the same words are the progressbar's accessible value.
 */
export function ProgressBar({
  label,
  value,
  max,
  valueText,
  hideLabel,
  hideValue,
  indicatorClassName,
  className,
  size = "md",
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const clamped = Math.min(safeMax, Math.max(0, value));
  const shown = valueText ?? `${Math.round((clamped / safeMax) * 100)}%`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-sm font-medium text-content", hideLabel && "sr-only")}>{label}</span>
        <span
          dir="ltr"
          className={cn(
            "inline-block text-sm tabular-nums text-content-muted [unicode-bidi:isolate]",
            hideValue && "sr-only",
          )}
        >
          {shown}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(clamped)}
        aria-valuetext={shown}
        aria-label={label}
        className={cn("overflow-hidden rounded-full bg-surface-sunken", size === "lg" ? "h-3" : "h-2")}
      >
        <div
          className={cn(
            "h-full rounded-full bg-brand motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-[--ease] motion-reduce:transition-none",
            indicatorClassName,
          )}
          style={{ width: `${(clamped / safeMax) * 100}%` }}
        />
      </div>
    </div>
  );
}
