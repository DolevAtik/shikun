"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

const STEPS = [
  { id: "read", href: "/feed" },
  { id: "service", href: "/services" },
  { id: "achievement", href: null },
] as const;

/** Three real first acts. Shown instead of the weekly card, not as a tour of the screen. */
export function FirstWeek({ readDone }: { readDone: boolean }) {
  const t = useTranslations("myWorld");
  const done = {
    read: readDone,
    service: false,
    achievement: readDone,
  };

  return (
    <div className="mt-4 rounded-lg bg-surface/80 px-3 py-3 text-start shadow-sm ring-1 ring-line">
      <p className="text-sm font-semibold text-content">{t("firstWeekTitle")}</p>
      <ol className="mt-2 flex list-none flex-col gap-2 p-0">
        {STEPS.map((step, index) => {
          const complete = done[step.id];
          return (
            <li key={step.id} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden="true"
                className={
                  complete
                    ? "grid size-6 shrink-0 place-items-center rounded-full bg-success-soft text-success"
                    : "grid size-6 shrink-0 place-items-center rounded-full bg-surface-sunken text-content-muted"
                }
              >
                {complete ? <Check className="size-3.5" /> : index + 1}
              </span>
              {step.href && !complete ? (
                <Link href={step.href} className="font-medium text-brand hover:underline">
                  {t(`firstWeekSteps.${step.id}`)}
                </Link>
              ) : (
                <span className={complete ? "text-content-muted" : "text-content"}>
                  {t(`firstWeekSteps.${step.id}`)}
                  {complete ? <span className="sr-only"> {t("completed")}</span> : null}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
