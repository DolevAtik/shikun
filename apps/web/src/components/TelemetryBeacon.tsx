"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { enqueue, ensureSessionId, QUEUE_KEY, type QueuedEvent } from "@/lib/telemetry";

const FLUSH_MS = 5_000;
const MAX_BATCH = 20;

/**
 * Batched analytics beacon for the employee app.
 *
 * Without this, the admin Dashboard's DAU/MAU tiles stay permanently empty.
 * Failures are silent — telemetry must never interrupt reading an announcement.
 */
export function TelemetryBeacon() {
  const pathname = usePathname();

  React.useEffect(() => {
    const sessionId = ensureSessionId();
    enqueue({
      type: "screen.view",
      sessionId,
      props: { path: pathname },
      ts: new Date().toISOString(),
    });
  }, [pathname]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void flush();
    }, FLUSH_MS);

    function onVisibility() {
      if (document.visibilityState === "hidden") void flush();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      void flush();
    };
  }, []);

  return null;
}

async function flush() {
  let queue: QueuedEvent[] = [];
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    queue = raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
    if (queue.length === 0) return;
    sessionStorage.setItem(QUEUE_KEY, "[]");
  } catch {
    return;
  }

  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_BATCH);
    try {
      const response = await fetch("/api/proxy/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
      if (!response.ok && response.status !== 204) {
        // Put them back; the next interval retries.
        enqueueAll(batch.concat(queue));
        return;
      }
    } catch {
      enqueueAll(batch.concat(queue));
      return;
    }
  }
}

function enqueueAll(events: QueuedEvent[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    /* ignore */
  }
}
