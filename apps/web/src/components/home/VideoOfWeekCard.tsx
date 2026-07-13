"use client";

import type { VideoOfWeek } from "@moch/contracts";
import { Card } from "@moch/ui";
import { Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

/**
 * The video of the week plays inside the app, in a modal, rather than throwing
 * the viewer out to YouTube and losing their place on Home.
 *
 * The player is only mounted while the modal is open. That is not a nicety: an
 * iframe left in the DOM keeps loading, keeps tracking, and — once it has been
 * played — keeps playing behind a closed dialog.
 */
export function VideoOfWeekCard({ video, locale }: { video: VideoOfWeek; locale: string }) {
  const t = useTranslations("home");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const youtube = youtubeId(video.videoUrl);
  const thumbnailUrl =
    video.thumbnailUrl ?? (youtube ? `https://img.youtube.com/vi/${youtube}/hqdefault.jpg` : null);

  // showModal() is what buys us the whole dialog contract for free: Escape to
  // dismiss, focus moved in and restored on close, and the rest of the page
  // made inert. Reimplementing that by hand is how modals become inaccessible.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <>
      <Card interactive className="overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={t("playVideo", { title: video.title })}
          className="group block w-full text-start"
        >
          <div className="relative aspect-video bg-surface-sunken">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="size-full object-cover" />
            ) : null}
            <div className="absolute inset-0 grid place-items-center bg-black/25 transition-colors duration-[--duration] group-hover:bg-black/10">
              <span className="grid size-14 place-items-center rounded-full bg-white/95 shadow-lg transition-transform duration-[--duration] group-hover:scale-110">
                <Play aria-hidden="true" className="ms-0.5 size-6 fill-brand text-brand" />
              </span>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-semibold text-content group-hover:underline">{video.title}</h3>
            {video.description ? (
              <p className="mt-1 text-sm text-content-muted">{video.description}</p>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="numeric text-xs tabular-nums text-content-muted">
                {t("views", { count: formatNumber(video.viewCount, locale) })}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">
                <Play aria-hidden="true" className="size-3.5 fill-current" />
                {t("watchVideo")}
              </span>
            </div>
          </div>
        </button>
      </Card>

      <dialog
        ref={dialogRef}
        onClose={() => setIsOpen(false)}
        // Clicking the backdrop is a click on the dialog itself — the content
        // sits in a child, so anything that lands on the element is outside it.
        onClick={(event) => {
          if (event.target === dialogRef.current) setIsOpen(false);
        }}
        aria-label={video.title}
        className="m-auto w-[min(56rem,92vw)] overflow-hidden rounded-xl border border-line bg-surface p-0 text-content shadow-lg backdrop:bg-black/70"
      >
        {isOpen ? (
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-line p-3 ps-4">
              <h2 className="truncate text-sm font-semibold">{video.title}</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={t("close")}
                className="grid size-9 shrink-0 place-items-center rounded-md text-content-muted transition-colors hover:bg-surface-tint hover:text-content"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              {youtube ? (
                <iframe
                  // nocookie: the same video, without YouTube's ad cookies being
                  // set on an employee who only wanted to watch a Ministry clip.
                  src={`https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0&hl=${locale}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="size-full border-0"
                />
              ) : (
                // Anything that is not a YouTube link is a plain file we host.
                <video src={video.videoUrl} controls autoPlay className="size-full">
                  <track kind="captions" />
                </video>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}

/** The 11-character id in a YouTube watch, embed or youtu.be link; null for anything else. */
function youtubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return match?.[1] ?? null;
}
