"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Toasts land bottom-centre.
 *
 * Not a style choice: bottom-right is wrong in Hebrew and bottom-left is wrong in
 * English, and a toast that has to know the direction is a toast that will one
 * day be in the wrong corner. Centre is correct in both, so the question never
 * comes up again.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group rounded-md border border-line bg-popover text-popover-foreground shadow-lg",
          description: "text-content-muted",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
          error: "border-danger bg-danger-soft text-danger",
          success: "border-success bg-success-soft text-success",
        },
      }}
    />
  );
}
