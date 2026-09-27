"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The login forms are document POSTs, so while the API wakes (up to a minute on
 * Render's free tier) the page would sit silent. This notices any submit on the
 * page and says what is happening. It never blocks or delays the submit itself.
 */
export function WakeNotice({ submitting, waking }: { submitting: string; waking: string }) {
  const [phase, setPhase] = useState<"idle" | "submitting" | "waking">("idle");

  useEffect(() => {
    let timer: number | undefined;
    const onSubmit = () => {
      setPhase("submitting");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setPhase("waking"), 3_000);
    };
    // Coming back through the browser cache (bfcache) must not show a stale spinner.
    const onShow = () => {
      window.clearTimeout(timer);
      setPhase("idle");
    };
    document.addEventListener("submit", onSubmit);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  return (
    <div role="status" aria-live="polite">
      {phase === "idle" ? null : (
        <p className="flex items-center gap-2 rounded-md bg-brand-soft px-3 py-2 text-sm font-medium text-brand">
          <Loader2 aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" />
          {phase === "waking" ? waking : submitting}
        </p>
      )}
    </div>
  );
}
