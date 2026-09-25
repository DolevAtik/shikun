"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useRef } from "react";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * The one dialog shell of העולם שלי. A native <dialog> gives focus trapping,
 * Escape, and an inert page for free. On a phone it rises from the bottom;
 * from `sm` up it is a centered card.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const t = useTranslations("myWorld");
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the dialog element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-2xl border border-line bg-surface p-0 text-content shadow-lg backdrop:bg-[rgb(36_24_15/0.45)] open:motion-safe:animate-fade-up sm:inset-0 sm:m-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[min(28rem,calc(100%-2rem))] sm:rounded-2xl"
    >
      {open ? (
        <div className="flex flex-col px-5 pb-6 pt-4 sm:px-6">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 id={titleId} className="pt-1.5 text-lg font-bold leading-snug text-content">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="-me-2 grid size-11 shrink-0 place-items-center rounded-full text-content-muted hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
