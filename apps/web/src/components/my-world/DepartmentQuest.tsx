"use client";

import type { DepartmentQuest as DepartmentModel } from "@moch/contracts";
import { Button, Card, ProgressBar, SectionHeader } from "@moch/ui";
import { Building2, Flame, Gift, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Numeric } from "./Numeric";
import { formatXp, xpText } from "./progress";
import type { OpenDetail } from "./types";

export function DepartmentQuest({ department, onOpen }: { department: DepartmentModel | null; onOpen: OpenDetail }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();

  if (!department) {
    return (
      <section id="department" className="scroll-mt-20">
        <SectionHeader title={t("department.title")} titleClassName="text-lg" />
        <p className="flex items-start gap-3 rounded-xl border border-line bg-surface px-5 py-4 text-sm text-content-muted shadow-sm">
          <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {t("department.none")}
        </p>
      </section>
    );
  }

  const name = locale === "en" ? department.nameEn : department.nameHe;
  const remaining = Math.max(0, department.target - department.earned);
  const ratio = t("department.ratio", {
    earned: formatXp(department.earned, locale),
    target: formatXp(department.target, locale),
  });

  return (
    <section id="department" className="scroll-mt-20">
      <SectionHeader title={t("department.title")} titleClassName="text-lg" />
      <Card className={remaining === 0 ? "border-transparent bg-success-soft p-5 shadow-md sm:p-6" : "p-5 shadow-md sm:p-6"}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
            <Users className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-content">{name}</h3>
            <p className="text-sm text-content-muted">{t("department.hint")}</p>
          </div>
        </div>

        <p className="mt-5 text-2xl font-bold tracking-tight text-content">
          <Numeric>{ratio}</Numeric>
        </p>
        <ProgressBar
          className="mt-3"
          label={name}
          hideLabel
          hideValue
          size="lg"
          value={department.earned}
          max={department.target}
          valueText={ratio}
        />
        <p className="mt-3 text-sm font-medium text-content">{t("department.mine", { xp: xpText(department.mine, locale) })}</p>
        {department.reward ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-tint px-3 py-2.5 text-sm text-content">
            <Gift aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              <span className="font-semibold">{remaining === 0 ? t("department.rewardEarned") : t("department.rewardLabel")}</span>{" "}
              {department.reward}
            </span>
          </p>
        ) : null}
        {department.reachedRun > 0 ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <Flame aria-hidden="true" className="size-4" />
            {t("department.run", { count: department.reachedRun })}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-sm text-content-muted">
            {remaining === 0 ? t("department.reached") : t("department.remaining", { xp: xpText(remaining, locale) })}
            <span aria-hidden="true"> · </span>
            {t("department.daysLeft", { count: department.daysLeft })}
          </p>
          <Button type="button" variant="secondary" onClick={() => onOpen({ kind: "department" })}>
            {t("department.details")}
          </Button>
        </div>
      </Card>
    </section>
  );
}
