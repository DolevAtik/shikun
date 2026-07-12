/**
 * Hebrew dates and numbers.
 *
 * Numbers are wrapped in `.numeric` at the call site where they sit inside RTL
 * prose, because a bare "1,240" inside Hebrew text renders its comma on the
 * wrong side. Dates use the Israeli calendar conventions and the Jerusalem
 * timezone, not the server's.
 */
const TZ = "Asia/Jerusalem";

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-GB").format(value);
}

/** "לפני 3 ימים" — built on Intl so it reads naturally in both languages. */
export function formatRelative(iso: string, locale: string): string {
  const formatter = new Intl.RelativeTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    numeric: "auto",
  });

  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, "day");

  return formatter.format(Math.round(diffDays / 30), "month");
}

/** "12-03" (MM-DD) → a localized "12 במרץ", with no year to leak someone's age. */
export function formatMonthDay(monthDay: string, locale: string): string {
  const [month, day] = monthDay.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    day: "numeric",
    month: "long",
  }).format(new Date(2001, (month ?? 1) - 1, day ?? 1));
}
