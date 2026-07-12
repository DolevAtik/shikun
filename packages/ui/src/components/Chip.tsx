import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export interface ChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** A CSS color — district colors and channel colors come from the API, and may be null. */
  color?: string | null;
}

/**
 * A district or channel label. The color is a tint of the entity's own color,
 * with the text in the full-strength version of it — which is why the accent
 * tokens are darkened enough to stay legible on their own tint.
 */
export function Chip({ className, color, style, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
        "text-xs font-medium",
        !color && "bg-surface-tint text-content-muted",
        className,
      )}
      style={
        color
          ? { color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, ...style }
          : style
      }
      {...props}
    >
      {children}
    </span>
  );
}
