import * as React from "react";
import { cn } from "@/lib/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        // `border-input` is --border-strong: a real component boundary must clear
        // 3:1 against the surface (WCAG 1.4.11), which the decorative --border does not.
        "flex h-10 w-full rounded-sm border border-input bg-surface px-3 py-2 text-sm text-content",
        "placeholder:text-content-muted disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
