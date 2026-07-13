"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useDirection } from "@radix-ui/react-direction";
import { cn } from "@/lib/cn";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  // Portalled content is rendered outside <html dir>, so it does not inherit the
  // direction. Radix's DirectionProvider tells us what it is; we put it back on
  // the node. Without this, a popover's contents lay themselves out LTR inside a
  // Hebrew page — and it looks *almost* right, which is how it survives review.
  const direction = useDirection();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        dir={direction}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-72 rounded-sm border border-line bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
