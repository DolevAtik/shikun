import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

const Breadcrumb = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"nav">>(
  ({ ...props }, ref) => <nav ref={ref} aria-label="נתיב ניווט" {...props} />,
);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn("flex flex-wrap items-center gap-1.5 text-sm text-content-muted", className)}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<"a">>(
  ({ className, ...props }, ref) => (
    <a ref={ref} className={cn("transition-colors hover:text-content", className)} {...props} />
  ),
);
BreadcrumbLink.displayName = "BreadcrumbLink";

/** The current page. `aria-current` is what makes it the *current* one, not the styling. */
const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-medium text-content", className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

/**
 * The separator points the way the reader travels: left in Hebrew, right in
 * English. `aria-hidden` because a screen reader gets the structure from the
 * list, and hearing "chevron" four times is noise.
 */
const BreadcrumbSeparator = ({ className, ...props }: React.ComponentProps<"li">) => (
  <li role="presentation" aria-hidden className={cn("[&>svg]:size-3.5", className)} {...props}>
    <ChevronLeft className="rtl:rotate-180" />
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
