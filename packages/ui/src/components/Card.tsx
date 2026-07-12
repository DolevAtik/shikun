import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface shadow-sm",
        interactive &&
          "transition-shadow duration-[--duration] ease-[--ease] hover:shadow-md focus-within:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

/**
 * The heading above each Home section. It renders a real <h2>, so a screen
 * reader user can jump between sections instead of scrolling through them.
 */
export function SectionHeader({ title, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3 px-1", className)}>
      <h2 className="text-base font-semibold text-content">{title}</h2>
      {action}
    </div>
  );
}
