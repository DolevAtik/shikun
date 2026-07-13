import type { JobPosting } from "@moch/contracts";
import { cn } from "@moch/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export const JOB_SCOPES = ["all", "internal", "external"] as const;
export type JobScope = (typeof JOB_SCOPES)[number];

/** The scope lives in the URL, so a filtered board is a link someone can send. */
export function toScope(value: string | undefined): JobScope {
  return JOB_SCOPES.includes(value as JobScope) ? (value as JobScope) : "all";
}

export function matchesScope(job: JobPosting, scope: JobScope): boolean {
  if (scope === "internal") return job.isInternal;
  if (scope === "external") return !job.isInternal;
  return true;
}

/**
 * Filtering is navigation, not state: three links, no JavaScript, and the board
 * still works with the back button. The count sits inside each chip so an
 * employee can see there is nothing behind a filter before spending a tap on it.
 */
export async function JobFilters({ active, items }: { active: JobScope; items: JobPosting[] }) {
  const t = await getTranslations("jobs");

  return (
    <nav aria-label={t("filterLabel")} className="flex gap-2 px-4 py-2">
      {JOB_SCOPES.map((scope) => {
        const isActive = scope === active;
        const count = items.filter((job) => matchesScope(job, scope)).length;

        return (
          <Link
            key={scope}
            href={scope === "all" ? "/jobs" : `/jobs?scope=${scope}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-full border px-3.5",
              "text-sm font-medium transition-colors duration-[--duration-fast]",
              isActive
                ? "border-transparent bg-brand text-content-onbrand"
                : "border-line bg-surface text-content-muted hover:text-content",
            )}
          >
            {t(`filters.${scope}` as never)}
            <span className={cn("numeric tabular-nums text-xs", !isActive && "text-content-muted")}>
              {count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
