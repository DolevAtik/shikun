"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import type { AdminHomeData, AdminHomeSections } from "@moch/contracts";
import { api } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { HomeLayoutEditor } from "@/components/home/HomeLayoutEditor";
import { KeyMetricsEditor, ProjectsEditor, WeeklyEditor } from "@/components/home/HomeDataEditors";

const TABS = ["layout", "numbers", "projects", "weekly"] as const;
type Tab = (typeof TABS)[number];

/**
 * The employee Home screen from the console: the order and visibility of its
 * sections, and the rows behind the three sections that are not content items.
 * The active tab lives in the URL, so a link can open a specific one.
 */
export function HomeScreenManager({
  sections,
  data: initialData,
}: {
  sections: AdminHomeSections;
  data: AdminHomeData;
}) {
  const t = useTranslations("homeScreen");
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum([...TABS]).withDefault("layout"));

  const data = useQuery({
    queryKey: qk.home.data,
    queryFn: () => api.get<AdminHomeData>("/admin/home/data"),
    initialData,
  }).data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
        <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
      </div>

      <div role="tablist" aria-label={t("title")} className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((value) => (
          <button
            key={value}
            id={`tab-${value}`}
            type="button"
            role="tab"
            aria-selected={tab === value}
            aria-controls={`panel-${value}`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => void setTab(value)}
            onKeyDown={(event) => {
              // Arrow keys move between tabs; in RTL "next" is to the left.
              const rtl = document.documentElement.dir === "rtl";
              const step = event.key === "ArrowLeft" ? (rtl ? 1 : -1) : event.key === "ArrowRight" ? (rtl ? -1 : 1) : 0;
              if (!step) return;
              event.preventDefault();
              const next = TABS[(TABS.indexOf(value) + step + TABS.length) % TABS.length]!;
              void setTab(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === value
                ? "border-primary text-content"
                : "border-transparent text-content-muted hover:text-content",
            )}
          >
            {t(`tabs.${value}`)}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "layout" && <HomeLayoutEditor initial={sections} onOpenTab={(next) => void setTab(next as Tab)} />}
        {tab === "numbers" && <KeyMetricsEditor metrics={data.metrics} />}
        {tab === "projects" && <ProjectsEditor projects={data.projects} />}
        {tab === "weekly" && <WeeklyEditor weekly={data.weekly} />}
      </div>
    </div>
  );
}
