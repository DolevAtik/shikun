"use client";

import type { Booking, EmployeeProgress } from "@moch/contracts";
import { Button, SectionHeader } from "@moch/ui";
import { CalendarCheck, CalendarPlus, GraduationCap, MapPin, MonitorSmartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import { downloadIcs } from "@/lib/ics";
import { track } from "@/lib/telemetry";
import { xpText } from "./progress";
import { worldTint } from "./world-tone";

interface BookingsSectionProps {
  bookings: Booking[];
  /** Called with the progress the API computed after an attendance answer. */
  onAnswered: (progress: EmployeeProgress, booking: Booking, attended: boolean) => void;
}

/**
 * What I signed up for. Ahead: put it in my calendar. Just behind: was I
 * there? Only a "yes" adds the attendance XP, and nothing here is shown to anyone else.
 */
export function BookingsSection({ bookings, onAnswered }: BookingsSectionProps) {
  const t = useTranslations("myWorld");
  if (bookings.length === 0) return null;
  const waiting = bookings.filter((booking) => booking.status === "confirm").length;

  return (
    <section id="bookings" className="scroll-mt-20">
      <SectionHeader title={t("bookings.title")} titleClassName="text-lg" />
      <p className="-mt-1 mb-3 px-1 text-sm text-content-muted">
        {waiting > 0 ? t("bookings.waiting", { count: waiting }) : t("bookings.hint")}
      </p>
      <ul className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <li key={booking.contentItemId}>
            <BookingRow booking={booking} onAnswered={onAnswered} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BookingRow({ booking, onAnswered }: { booking: Booking; onAnswered: BookingsSectionProps["onAnswered"] }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const [pending, setPending] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const Icon = booking.act === "training" ? GraduationCap : CalendarCheck;
  const place =
    booking.place === null
      ? null
      : booking.place === "ONLINE"
        ? t("register.online")
        : booking.act === "training"
          ? t(`trainingFormat.${booking.place}` as never)
          : booking.place;
  // A training's place is its format, the same icon the registration sheet uses.
  const remote = booking.place === "ONLINE" || booking.act === "training";

  const answer = async (attended: boolean) => {
    setPending(attended ? "yes" : "no");
    setError(null);
    try {
      const progress = await clientFetch<EmployeeProgress>(`/me/registrations/${booking.contentItemId}/attendance`, {
        method: "POST",
        body: JSON.stringify({ attended }),
      });
      onAnswered(progress, booking, attended);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setPending(null);
    }
  };

  const addToCalendar = () => {
    downloadIcs(
      {
        uid: `${booking.contentItemId}@moch.gov.il`,
        title: booking.title,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        location: place,
      },
      booking.act === "training" ? "training" : "event",
    );
    track("booking.calendar", { entityType: "content", entityId: booking.contentItemId, props: { act: booking.act } });
  };

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center">
      <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full" style={worldTint(booking.world)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-content-muted">
          {booking.act === "training" ? t("act.training") : t("act.event")}
          <span aria-hidden="true"> · </span>
          {booking.status === "confirm" ? t("bookings.happened") : t("bookings.ahead")}
        </p>
        <h3 className="mt-0.5 font-semibold leading-snug text-content">{booking.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-content-muted">
          <span>{formatDateTime(booking.startsAt, locale)}</span>
          {place ? (
            <span className="inline-flex items-center gap-1">
              {remote ? <MonitorSmartphone aria-hidden="true" className="size-3.5" /> : <MapPin aria-hidden="true" className="size-3.5" />}
              {place}
            </span>
          ) : null}
        </p>
        {error ? (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {t("bookings.error", { message: error })}
          </p>
        ) : null}
      </div>
      {booking.status === "confirm" ? (
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-sm font-semibold text-content">{t("bookings.question")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => answer(true)} isLoading={pending === "yes"} disabled={pending !== null}>
              {t("bookings.yes", { xp: xpText(booking.attendXp, locale, true) })}
            </Button>
            <Button type="button" variant="secondary" onClick={() => answer(false)} isLoading={pending === "no"} disabled={pending !== null}>
              {t("bookings.no")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={addToCalendar} className="w-full sm:w-auto">
          <CalendarPlus aria-hidden="true" className="size-4" />
          {t("bookings.calendar")}
        </Button>
      )}
    </article>
  );
}
