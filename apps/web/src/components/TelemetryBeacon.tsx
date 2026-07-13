"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "moch_sid";
const QUEUE_KEY = "moch_telemetry_q";
const FLUSH_MS = 5_000;
const MAX_BATCH = 20;

type QueuedEvent = {
  type: string;
  sessionId: string;
  entityType?: string;
  entityId?: string;
  props?: Record<string, unknown>;
  ts: string;
};

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

function ensureSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "anon";
  }
}

function enqueue(event: QueuedEvent) {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const queue: QueuedEvent[] = raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
    queue.push(event);
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    /* ignore */
  }
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
