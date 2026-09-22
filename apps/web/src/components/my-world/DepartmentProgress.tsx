"use client";

import { Card, ProgressBar, SectionHeader } from "@moch/ui";
import { Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp, percentOf } from "./progress";
import type { DepartmentProgress as DepartmentModel } from "./types";

export function DepartmentProgress({ department }: { department: DepartmentModel }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const remaining = Math.max(0, department.target - department.earned);
  const percent = percentOf(department.earned, department.target);

  return (
    <section>
      <SectionHeader title={t("departmentTitle")} />
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-content">{department.name}</h3>
            <p className="text-sm text-content-muted">{t("departmentHint")}</p>
          </div>
        </div>
        <ProgressBar
          label={department.name}
          hideLabel
          value={department.earned}
          max={department.target}
          valueText={`${percent}%`}
        />
        <p className="mt-3 text-sm text-content">
          <Numeric>{formatXp(department.earned, locale)} XP</Numeric> {t("departmentEarned")}
        </p>
        <p className="mt-1 text-sm text-content-muted">
          {remaining === 0 ? (
            t("departmentReached")
          ) : (
            <>
              {t("untilPrefix") ? <>{t("untilPrefix")} </> : null}
              <Numeric>{formatXp(remaining, locale)} XP</Numeric> {t("departmentGoal")}
            </>
          )}
        </p>
        <p className="mt-2 text-xs font-medium text-content-muted">
          {t("departmentMilestone")} <Numeric>{formatXp(department.target, locale)} XP</Numeric>
        </p>
      </Card>
    </section>
  );
}
