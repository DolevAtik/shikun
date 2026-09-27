/**
 * The queue `TelemetryBeacon` flushes. Any component can add an event with
 * `track`; the beacon sends it in the next batch. Failures are silent —
 * telemetry must never interrupt what the person is doing.
 */

const SESSION_KEY = "moch_sid";
export const QUEUE_KEY = "moch_telemetry_q";

export type QueuedEvent = {
  type: string;
  sessionId: string;
  entityType?: string;
  entityId?: string;
  props?: Record<string, unknown>;
  ts: string;
};

export function ensureSessionId(): string {
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

export function enqueue(event: QueuedEvent) {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const queue: QueuedEvent[] = raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
    queue.push(event);
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));
  } catch {
    /* ignore */
  }
}

/** Record one product event, e.g. `track("mission.open", { entityType: "content", entityId, props })`. */
export function track(type: string, fields: Omit<QueuedEvent, "type" | "sessionId" | "ts"> = {}) {
  enqueue({ type, sessionId: ensureSessionId(), ts: new Date().toISOString(), ...fields });
}
