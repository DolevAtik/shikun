import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // aria-hidden: a screen reader should hear "loading" once, from an aria-busy
  // region, not a dozen empty boxes.
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-muted", className)} {...props} />;
}

export { Skeleton };
