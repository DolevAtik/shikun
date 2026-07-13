import type { HomeSection } from "@moch/contracts";
import { Avatar, Card, Chip, SectionHeader } from "@moch/ui";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Cake,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ICONS } from "@/components/icons";
import { formatDate, formatDateTime, formatMonthDay, formatNumber, formatRelative } from "@/lib/format";

interface Props {
  section: HomeSection;
  locale: string;
  firstName: string;
  /** Resolved server-side, so the greeting matches the viewer's clock. */
  greeting: "MORNING" | "AFTERNOON" | "EVENING";
}

/**
 * Home is a list of typed sections that came from the server already resolved
 * against the viewer's audience. This file draws them; it decides nothing about
 * who sees what.
 */
export async function HomeSectionView({ section, locale, firstName, greeting }: Props) {
  const t = await getTranslations("home");

  // The greeting is the only section with no heading of its own — asking for one
  // would look up a message key that does not exist.
  const title =
    section.type === "GREETING" ? "" : (section.title ?? t(`sections.${section.type}` as never));

  switch (section.type) {
    case "GREETING":
      return (
        <section className="px-4 pb-2 pt-6">
          <h1 className="text-2xl font-bold tracking-tight text-content">
            {t(`greeting.${greeting}` as never, { name: firstName })}
          </h1>
          <p className="mt-1 text-content-muted">{t("greetingSub")}</p>
        </section>
      );

    case "EMERGENCY":
      return (
        <section className="px-4 py-2">
          <h2 className="sr-only">{title}</h2>
          <ul className="flex flex-col gap-2">
            {section.data.alerts.map((alert) => {
              const isCritical = alert.severity === "CRITICAL";
              return (
                <li key={alert.id}>
                  {/* Emergencies are announced, not just drawn. */}
                  <div
                    role="alert"
                    className={
                      isCritical
                        ? "flex gap-3 rounded-lg border-s-4 border-s-danger bg-danger-soft p-4"
                        : "flex gap-3 rounded-lg border-s-4 border-s-warning bg-warning-soft p-4"
                    }
                  >
                    <AlertTriangle
                      aria-hidden="true"
                      className={isCritical ? "size-5 shrink-0 text-danger" : "size-5 shrink-0 text-warning"}
                    />
                    <div className="min-w-0">
                      <p className={isCritical ? "font-semibold text-danger" : "font-semibold text-warning"}>
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-sm text-content">{alert.body}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      );

    case "ANNOUNCEMENTS":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="flex flex-col gap-3 px-4">
            {section.data.items.map((item) => (
              <li key={item.id}>
                <Card interactive className="overflow-hidden">
                  <div className="flex gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        {item.isPinned ? (
                          <Chip className="bg-brand-soft text-brand">{t("pinned")}</Chip>
                        ) : null}
                        {item.districtName ? (
                          <Chip color={item.districtColor}>{item.districtName}</Chip>
                        ) : null}
                      </div>
                      <h3 className="font-semibold leading-snug text-content">{item.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-content-muted">{item.summary}</p>
                      <p className="mt-2 text-xs text-content-muted">
                        {formatRelative(item.publishedAt, locale)}
                      </p>
                    </div>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-20 shrink-0 rounded-md object-cover"
                      />
                    ) : null}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );

    case "WEEKLY_SUMMARY": {
      const summary = section.data.summary;
      if (!summary) return null;

      return (
        <section className="px-4 py-3">
          <Card
            interactive
            className="overflow-hidden border-0 bg-gradient-to-bl from-[--hero-from] to-[--hero-to] text-content-onsurfacebrand"
          >
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                {formatDate(summary.weekOf, locale)}
              </p>
              <h2 className="mt-1 text-xl font-bold">{summary.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-90">{summary.teaser}</p>

              <ul className="mt-4 flex flex-col gap-2">
                {summary.highlights.slice(0, 3).map((highlight) => (
                  <li key={highlight} className="flex gap-2 text-sm">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-white/70" />
                    <span className="opacity-95">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </section>
      );
    }

    case "CEO_MESSAGE": {
      const message = section.data.message;
      if (!message) return null;

      return (
        <section className="px-4 py-3">
          <SectionHeader title={title} />
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Avatar
                name={message.author.fullName}
                initials={message.author.initials}
                src={message.author.avatarUrl}
                size="lg"
              />
              <div className="min-w-0">
                <p className="font-semibold text-content">{message.author.fullName}</p>
                <p className="truncate text-sm text-content-muted">{message.author.title}</p>
              </div>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-content">{message.title}</h3>
            {/* The Director-General writes in paragraphs. Respect them. */}
            <div className="mt-2 flex flex-col gap-3 text-[0.95rem] leading-relaxed text-content">
              {message.body.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-4 text-xs text-content-muted">
              {formatRelative(message.publishedAt, locale)}
            </p>
          </Card>
        </section>
      );
    }

    case "KEY_NUMBERS":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="grid grid-cols-2 gap-3 px-4">
            {section.data.items.map((metric) => {
              const isUp = (metric.changePct ?? 0) >= 0;
              const Trend = isUp ? TrendingUp : TrendingDown;

              return (
                <li key={metric.id}>
                  <Card className="h-full p-4">
                    <p className="numeric text-2xl font-bold tabular-nums text-content">
                      {formatNumber(metric.value, locale)}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-content-muted">{metric.label}</p>

                    {metric.changePct !== null ? (
                      <p
                        className={
                          isUp
                            ? "mt-2 flex items-center gap-1 text-xs font-medium text-success"
                            : "mt-2 flex items-center gap-1 text-xs font-medium text-danger"
                        }
                      >
                        <Trend aria-hidden="true" className="size-3.5" />
                        <span className="numeric tabular-nums">
                          {isUp ? "+" : ""}
                          {metric.changePct}%
                        </span>
                        {metric.period ? (
                          <span className="font-normal text-content-muted">{metric.period}</span>
                        ) : null}
                      </p>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      );

    case "EVENTS":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          {/* A sideways-scrolling rail whose cards are not themselves focusable
              has to be reachable by keyboard, or a keyboard user simply cannot
              read past the second card. WCAG 2.1.1. */}
          <ul className="rail" tabIndex={0} aria-label={title}>
            {section.data.items.map((event) => (
              <li key={event.id} className="w-64">
                <Card interactive className="flex h-full flex-col p-4">
                  <div className="flex items-start gap-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                      <CalendarDays aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-content">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-xs text-content-muted">
                        {formatDateTime(event.startsAt, locale)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {event.isOnline ? (
                      <Chip className="bg-success-soft text-success">{t("online")}</Chip>
                    ) : event.location ? (
                      <Chip>{event.location}</Chip>
                    ) : null}
                    {event.isRegistered ? (
                      <Chip className="bg-brand-soft text-brand">{t("registered")}</Chip>
                    ) : null}
                  </div>

                  <p className="mt-auto pt-3 text-xs text-content-muted">
                    {t("attendees", { count: event.attendeeCount })}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );

    case "PROJECTS":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="rail" tabIndex={0} aria-label={title}>
            {section.data.items.map((project) => (
              <li key={project.id} className="w-64">
                <Card interactive className="flex h-full flex-col overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-1.5">
                      {project.districtName ? (
                        <Chip color={project.districtColor}>{project.districtName}</Chip>
                      ) : null}
                      <Chip>{t(`projectStatus.${project.status}` as never)}</Chip>
                    </div>

                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-content">
                      {project.name}
                    </h3>
                    {project.city ? (
                      <p className="mt-0.5 text-xs text-content-muted">{project.city}</p>
                    ) : null}

                    {project.housingUnits ? (
                      <p className="mt-2 text-xs text-content-muted">
                        <span className="numeric tabular-nums font-medium text-content">
                          {formatNumber(project.housingUnits, locale)}
                        </span>{" "}
                        {t("housingUnits", { count: "" }).trim()}
                      </p>
                    ) : null}

                    <div className="mt-3">
                      {/* A progress bar that is also a value a screen reader can read. */}
                      <div
                        role="progressbar"
                        aria-valuenow={project.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t("progress", { percent: project.progress })}
                        className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                      >
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${project.progress}%`,
                            backgroundColor: project.districtColor ?? "var(--brand-blue)",
                          }}
                        />
                      </div>
                      <p className="mt-1.5 numeric text-xs tabular-nums text-content-muted">
                        {project.progress}%
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );

    case "VIDEO_OF_WEEK": {
      const video = section.data.video;
      if (!video) return null;

      return (
        <section className="px-4 py-3">
          <SectionHeader title={title} />
          <Card interactive className="overflow-hidden">
            <div className="relative aspect-video bg-surface-sunken">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt="" className="size-full object-cover" />
              ) : null}
              <div className="absolute inset-0 grid place-items-center bg-black/25">
                <span className="grid size-14 place-items-center rounded-full bg-white/95 shadow-lg">
                  <Play aria-hidden="true" className="ms-0.5 size-6 fill-brand text-brand" />
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-content">{video.title}</h3>
              {video.description ? (
                <p className="mt-1 text-sm text-content-muted">{video.description}</p>
              ) : null}
              <p className="mt-2 numeric text-xs tabular-nums text-content-muted">
                {t("views", { count: formatNumber(video.viewCount, locale) })}
              </p>
            </div>
          </Card>
        </section>
      );
    }

    case "TRAININGS": {
      const BookIcon: LucideIcon = ICONS.book ?? ExternalLink;

      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="flex flex-col gap-2 px-4">
            {section.data.items.map((training) => (
              <li key={training.id}>
                <Card interactive className="flex items-center gap-3 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-amber/10 text-accent-amber">
                    <BookIcon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-content">{training.title}</h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-content-muted">
                      <span>{formatDate(training.startsAt, locale)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t(`trainingFormat.${training.format}` as never)}</span>
                      {training.seatsLeft !== null ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{t("seatsLeft", { count: training.seatsLeft })}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  {training.isRegistered ? (
                    <Chip className="bg-success-soft text-success">{t("registered")}</Chip>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "CAREERS":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="flex flex-col gap-2 px-4">
            {section.data.items.map((career) => (
              <li key={career.id}>
                <Card interactive className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-snug text-content">{career.title}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-content-muted">
                      {career.departmentName ? <span>{career.departmentName}</span> : null}
                      {career.closesAt ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{t("closesAt", { date: formatDate(career.closesAt, locale) })}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <ArrowIcon locale={locale} />
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );

    case "BIRTHDAYS":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="rail" tabIndex={0} aria-label={title}>
            {section.data.items.map((birthday) => (
              <li key={birthday.user.id} className="w-36">
                <Card className="flex h-full flex-col items-center gap-2 p-4 text-center">
                  <div className="relative">
                    <Avatar
                      name={birthday.user.fullName}
                      initials={birthday.user.initials}
                      src={birthday.user.avatarUrl}
                      size="lg"
                    />
                    {birthday.isToday ? (
                      <span className="absolute -bottom-1 -end-1 grid size-6 place-items-center rounded-full bg-accent-red text-white">
                        <Cake aria-hidden="true" className="size-3.5" />
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-xs font-medium leading-tight text-content">
                    {birthday.user.fullName}
                  </p>
                  <p className="text-xs text-content-muted">
                    {birthday.isToday ? t("birthdayToday") : formatMonthDay(birthday.date, locale)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );

    case "RECOGNITION":
      return (
        <section className="py-3">
          <SectionHeader title={title} className="px-4" />
          <ul className="flex flex-col gap-2 px-4">
            {section.data.items.map((recognition) => (
              <li key={recognition.id}>
                <Card className="flex items-start gap-3 p-4">
                  <Avatar
                    name={recognition.recipient.fullName}
                    initials={recognition.recipient.initials}
                    src={recognition.recipient.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-content">
                        {recognition.recipient.fullName}
                      </p>
                      <Chip color={recognition.badge.color}>
                        {locale === "he" ? recognition.badge.nameHe : recognition.badge.nameEn}
                      </Chip>
                    </div>
                    <p className="mt-1 text-sm leading-snug text-content-muted">{recognition.reason}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      );

    default:
      return null;
  }
}

/** The arrow points the way the language reads. */
function ArrowIcon({ locale }: { locale: string }) {
  const Icon = locale === "he" ? ChevronLeft : ChevronRight;
  return <Icon aria-hidden="true" className="size-4 shrink-0 text-content-muted" />;
}

export { ArrowLeft, ArrowRight };
