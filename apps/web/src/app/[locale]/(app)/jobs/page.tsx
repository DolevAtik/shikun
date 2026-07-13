import type { JobsResponse } from "@moch/contracts";
import { EmptyState } from "@moch/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters, matchesScope, toScope } from "@/components/jobs/JobFilters";
import { serverFetchOrLogin } from "@/lib/api";

/**
 * The job board. The API returns every open position the viewer is allowed to
 * see, already ordered by deadline; this screen only decides how much of that
 * list the chosen filter lets through.
 */
export default async function JobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jobs");

  const scope = toScope((await searchParams).scope);
  const { items } = await serverFetchOrLogin<JobsResponse>("/jobs", locale);
  const visible = items.filter((job) => matchesScope(job, scope));

  return (
    <div className="flex flex-col">
      <header className="px-4 pb-2 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-content-muted">{t("subtitle")}</p>
      </header>

      {items.length === 0 ? (
        <div className="p-4 pt-4">
          <EmptyState title={t("empty")} description={t("emptyHint")} />
        </div>
      ) : (
        <>
          <JobFilters active={scope} items={items} />

          {/* Changing the filter is a navigation, so say out loud what came back
              — otherwise a screen reader user gets a silent, shorter list. */}
          <p aria-live="polite" className="px-4 pb-1 text-sm text-content-muted">
            {t("count", { count: visible.length })}
          </p>

          {visible.length === 0 ? (
            <div className="p-4">
              <EmptyState title={t("emptyFiltered")} />
            </div>
          ) : (
            <ul className="flex flex-col gap-3 px-4 pb-4 pt-2">
              {visible.map((job) => (
                <li key={job.id}>
                  <JobCard job={job} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
