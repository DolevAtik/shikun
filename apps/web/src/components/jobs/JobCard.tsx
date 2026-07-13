import type { JobPosting } from "@moch/contracts";
import { Card, Chip } from "@moch/ui";
import { Briefcase, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { daysUntil, formatDate } from "@/lib/format";

/** A deadline inside this window is called out. Past it, it is just a date. */
const CLOSING_SOON_DAYS = 7;

/**
 * One open position. The card is a link only when there is somewhere to apply —
 * a card that looks clickable and does nothing is worse than one that does not.
 */
export async function JobCard({ job, locale }: { job: JobPosting; locale: string }) {
  const t = await getTranslations("jobs");

  const days = job.closesAt === null ? null : daysUntil(job.closesAt);
  const isClosingSoon = days !== null && days <= CLOSING_SOON_DAYS;
  // An http link leaves the app; anything else is a route inside it.
  const leavesTheApp = job.href?.startsWith("http") ?? false;

  const content = (
    <Card interactive={job.href !== null} className="h-full p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
          <Briefcase aria-hidden="true" className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug text-content">{job.title}</h3>
          {job.departmentName ? (
            <p className="mt-0.5 text-xs text-content-muted">{job.departmentName}</p>
          ) : null}
        </div>

        {job.href ? (
          leavesTheApp ? (
            <>
              <ExternalLink aria-hidden="true" className="size-4 shrink-0 text-content-muted" />
              {/* Tell a screen reader the link leaves the app. WCAG 3.2.5. */}
              <span className="sr-only">{t("opensInNewWindow")}</span>
            </>
          ) : (
            <Arrow locale={locale} />
          )
        ) : null}
      </div>

      {job.summary ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-content-muted">{job.summary}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Chip className={job.isInternal ? "bg-brand-soft text-brand" : "bg-surface-tint"}>
          {job.isInternal ? t("internal") : t("external")}
        </Chip>

        {job.districtName ? <Chip color={job.districtColor}>{job.districtName}</Chip> : null}

        {days === null ? (
          <Chip>{t("openUntilFilled")}</Chip>
        ) : isClosingSoon ? (
          <Chip className="bg-warning-soft text-warning">{t("closingIn", { days })}</Chip>
        ) : (
          <Chip>{t("closesAt", { date: formatDate(job.closesAt!, locale) })}</Chip>
        )}
      </div>
    </Card>
  );

  if (!job.href) return content;

  return (
    <a
      href={job.href}
      target={leavesTheApp ? "_blank" : undefined}
      rel={leavesTheApp ? "noopener noreferrer" : undefined}
      className="block rounded-lg"
    >
      {content}
    </a>
  );
}

/** The arrow points the way the language reads. */
function Arrow({ locale }: { locale: string }) {
  const Icon = locale === "he" ? ChevronLeft : ChevronRight;
  return <Icon aria-hidden="true" className="size-4 shrink-0 text-content-muted" />;
}
