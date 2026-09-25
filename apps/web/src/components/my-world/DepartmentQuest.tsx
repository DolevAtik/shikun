"use client";

import type { DepartmentQuest as DepartmentModel } from "@moch/contracts";
import { Button, Card, ProgressBar, SectionHeader } from "@moch/ui";
import { Building2, Users } from "lucide-react";
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
