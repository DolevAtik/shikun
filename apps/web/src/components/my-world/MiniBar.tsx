import { cn } from "@moch/ui";
import { percentOf } from "./progress";

/**
 * A decorative track for inside buttons and cards. The amount is always written
 * next to it, so it is hidden from assistive tech; <span> keeps it valid inside a <button>.
 */
export function MiniBar({ value, max, color, className }: { value: number; max: number; color?: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-sunken", className)}>
      <span
        className="block h-full rounded-full bg-brand motion-safe:transition-[width] motion-safe:duration-700"
        style={{ width: `${percentOf(value, max)}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </span>
  );
}
