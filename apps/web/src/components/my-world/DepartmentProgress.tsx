"use client";

import { Card, ProgressBar, SectionHeader } from "@moch/ui";
import { Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp, xpRatio } from "./progress";
import type { DepartmentProgress as DepartmentModel } from "./types";

export function DepartmentProgress({ department }: { department: DepartmentModel }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const remaining = Math.max(0, department.target - department.earned);
  const reached = remaining === 0;

  return (
    <section>
      <SectionHeader title={t("departmentTitle")} titleClassName="text-lg" />
      <Card className={reached ? "border-transparent bg-success-soft p-5 shadow-md sm:p-6" : "p-5 shadow-md sm:p-6"}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-content">{department.name}</h3>
            <p className="text-sm text-content-muted">{t("departmentHint")}</p>
          </div>
        </div>

        <p className="mt-5 text-2xl font-bold tracking-tight text-content">
          <Numeric>{xpRatio(department.earned, department.target, locale)}</Numeric>
        </p>
        {reached ? <p className="mt-2 text-lg font-bold text-content">{t("departmentReached")}</p> : null}

        <div className="mt-3">
          <ProgressBar
            label={department.name}
            hideLabel
            hideValue
            size="lg"
            value={department.earned}
            max={department.target}
            valueText={xpRatio(department.earned, department.target, locale)}
          />
        </div>

        <p className="mt-3 text-sm text-content-muted">
          {reached ? (
            t("departmentEarned")
          ) : (
            <>
              {t("untilPrefix") ? <>{t("untilPrefix")} </> : null}
              <Numeric>{formatXp(remaining, locale)} XP</Numeric> {t("departmentGoal")}
            </>
          )}
        </p>
      </Card>
    </section>
  );
}
