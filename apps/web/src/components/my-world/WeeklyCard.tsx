"use client";

import type { EmployeeProgress, Mission } from "@moch/contracts";
import { cn } from "@moch/ui";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Numeric } from "./Numeric";
import { ratioText } from "./progress";
import type { OpenDetail } from "./types";

/** Three meaningful acts this week, written out, not color alone. No endowed stamp: every mark is real. */
export function WeeklyCard({ weekly }: { weekly: EmployeeProgress["weekly"] }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const filled = Math.max(0, Math.min(weekly.total, weekly.filled));
  const done = filled >= weekly.total;

  return (
    <div className="mt-4 rounded-lg bg-surface/80 px-3 py-3 text-start shadow-sm ring-1 ring-line">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-content">{done ? t("weekly.done") : t("weekly.title")}</span>
        <span className="font-semibold text-content">{t("weekly.count", { ratio: ratioText(filled, weekly.total, locale) })}</span>
      </p>
      <ol className="mt-2 flex list-none gap-2 p-0" aria-hidden="true">
        {Array.from({ length: weekly.total }, (_, index) => (
          <li key={index} className={cn("h-2 flex-1 rounded-full", index < filled ? "bg-brand" : "bg-surface-sunken")} />
        ))}
      </ol>
      <p className="sr-only">{t("weekly.label", { filled, total: weekly.total })}</p>
      <p className="mt-2 text-xs text-content-muted">{t("weekly.hint")}</p>
    </div>
  );
}

/** Three real first acts, each one a live step. Shown instead of the weekly card until the first act lands. */
export function FirstSteps({
  progress,
  onRegister,
  onOpen,
}: {
  progress: EmployeeProgress;
  onRegister: (mission: Mission) => void;
  onOpen: OpenDetail;
}) {
  const t = useTranslations("myWorld");
  const read = progress.missions.find((mission) => mission.act === "read");
  const registration = progress.missions.find((mission) => mission.act !== "read");
  const link = "font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-focus";

  const steps = [
    {
      id: "read",
      node: read ? (
        <Link href={`/feed/${read.contentItemId}`} className={link}>
          {t("firstWeek.read")}
        </Link>
      ) : (
        <Link href="/feed" className={link}>
          {t("firstWeek.read")}
        </Link>
      ),
    },
    {
      id: "register",
      node: registration ? (
        <button type="button" onClick={() => onRegister(registration)} className={cn(link, "text-start")}>
          {t("firstWeek.register")}
        </button>
      ) : (
        <Link href="/my-world/participate" className={link}>
          {t("firstWeek.register")}
        </Link>
      ),
    },
    {
      id: "achievement",
      node: (
        <button type="button" onClick={() => onOpen({ kind: "achievement", id: "firstStep" })} className={cn(link, "text-start")}>
          {t("firstWeek.achievement")}
        </button>
      ),
    },
  ];

  return (
    <div className="mt-4 rounded-lg bg-surface/80 px-3 py-3 text-start shadow-sm ring-1 ring-line">
      <p className="text-sm font-semibold text-content">{t("firstWeek.title")}</p>
      <ol className="mt-2 flex list-none flex-col gap-1 p-0">
        {steps.map((step, index) => (
          <li key={step.id} className="flex min-h-11 items-center gap-2 text-sm">
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-sunken text-content-muted">
              <Numeric>{index + 1}</Numeric>
            </span>
            {step.node}
          </li>
        ))}
      </ol>
    </div>
  );
}
