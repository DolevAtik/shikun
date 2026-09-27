/**
 * A single-event iCalendar file, built in the browser from what the screen
 * already has. Outlook, Google Calendar and the phone's calendar all open it.
 */

export interface CalendarEvent {
  uid: string;
  title: string;
  startsAt: string;
  /** Without an end, the entry is an hour long. */
  endsAt: string | null;
  location: string | null;
  description?: string;
}

const HOUR_MS = 3_600_000;

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 text: escape the separators, and fold nothing — every line here is short. */
function text(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const start = new Date(event.startsAt);
  const endCandidate = event.endsAt ? new Date(event.endsAt) : null;
  const end = endCandidate && endCandidate > start ? endCandidate : new Date(start.getTime() + HOUR_MS);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ministry of Construction and Housing//Employee App//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${text(event.title)}`,
    ...(event.location ? [`LOCATION:${text(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${text(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

/** Hands the file to the browser, which opens the calendar on a phone and downloads it on a desktop. */
export function downloadIcs(event: CalendarEvent, filename: string) {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
