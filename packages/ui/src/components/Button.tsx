import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-content-onbrand hover:bg-brand-hover shadow-sm",
  secondary: "bg-surface text-content border border-line-strong hover:bg-surface-tint",
  ghost: "bg-transparent text-brand hover:bg-brand-soft",
  danger: "bg-danger text-white hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  // 44px minimum touch target — WCAG 2.5.5. Nothing in this app is smaller.
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-4 text-[0.95rem] rounded-md",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", isLoading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-colors duration-[--duration-fast] ease-[--ease]",
        "focus-visible:outline-none focus-visible:shadow-focus",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner /> : null}
      {children}
    </button>
  );
});

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
