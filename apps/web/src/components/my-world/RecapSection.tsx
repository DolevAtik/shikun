"use client";

import type { MonthlyRecap } from "@moch/contracts";
import { Button, SectionHeader } from "@moch/ui";
import { Award, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { Numeric } from "./Numeric";
import { formatXp } from "./progress";
import { WORLD_COLOR } from "./world-tone";

/**
 * A month looked back on: what I read, where I was, who thanked me and whom I
 * thanked. The same rows as the rest of the screen, counted by month. A quiet
 * month is said plainly, without guilt.
 */
export function RecapSection({ initial }: { initial: MonthlyRecap }) {
  const t = useTranslations("myWorld");
  const locale = useLocale();
  const [recap, setRecap] = useState(initial);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const index = recap.months.indexOf(recap.month);
  const older = index >= 0 ? recap.months[index + 1] : undefined;
  const newer = index > 0 ? recap.months[index - 1] : undefined;
  const monthName = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "he-IL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${recap.month}-01T12:00:00Z`));

  const open = async (month: string) => {
    setPending(true);
    setFailed(false);
    try {
      setRecap(await clientFetch<MonthlyRecap>(`/me/progress/recap?month=${month}`));
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  const registrations = recap.acts.training + recap.acts.event;
  const attended = recap.acts.trainingAttended + recap.acts.eventAttended;
  const total = Object.values(recap.acts).reduce((sum, count) => sum + count, 0);
  const quiet = total === 0 && recap.recognitionsReceived === 0 && recap.recognitionsGiven === 0;

  return (
    <section id="recap" className="scroll-mt-20" aria-busy={pending}>
      <SectionHeader title={t("recap.title")} titleClassName="text-lg" />
      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => older && open(older)}
            disabled={!older || pending}
            aria-label={t("recap.older")}
            className="px-2"
          >
            <ChevronRight aria-hidden="true" className="size-5 ltr:rotate-180" />
          </Button>
          <h3 className="text-base font-bold text-content" aria-live="polite">
            {monthName}
          </h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => newer && open(newer)}
            disabled={!newer || pending}
            aria-label={t("recap.newer")}
            className="px-2"
          >
            <ChevronLeft aria-hidden="true" className="size-5 ltr:rotate-180" />
          </Button>
        </div>

        {failed ? (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {t("recap.error")}
          </p>
        ) : null}

        {quiet ? (
          <p className="mt-4 text-center text-sm text-content-muted">{t("recap.quiet")}</p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label={t("recap.xp")} value={`${formatXp(recap.xp, locale)} XP`} />
              <Stat label={t("recap.activeDays")} value={formatXp(recap.activeDays, locale)} />
              <Stat label={t("recap.received")} value={formatXp(recap.recognitionsReceived, locale)} />
              <Stat label={t("recap.given")} value={formatXp(recap.recognitionsGiven, locale)} />
            </dl>
            <ul className="mt-4 flex flex-col gap-2 text-sm text-content">
              {recap.acts.read > 0 ? <li>{t("recap.reads", { count: recap.acts.read })}</li> : null}
              {registrations > 0 ? <li>{t("recap.registrations", { count: registrations })}</li> : null}
              {attended > 0 ? <li>{t("recap.attended", { count: attended })}</li> : null}
              {recap.acts.profile > 0 ? <li>{t("recap.profile")}</li> : null}
              {recap.topWorld ? (
                <li className="font-semibold" style={{ color: WORLD_COLOR[recap.topWorld] }}>
                  {t("recap.topWorld", { world: t(`worlds.${recap.topWorld}.name`) })}
                </li>
              ) : null}
              {recap.levelEnd > recap.levelStart ? (
                <li className="inline-flex items-center gap-1.5 font-semibold text-success">
                  <TrendingUp aria-hidden="true" className="size-4" />
                  {t("recap.levelUp", { from: recap.levelStart, to: recap.levelEnd })}
                </li>
              ) : null}
            </ul>
            {recap.achievements.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-content">{t("recap.achievements")}</p>
                <ul className="flex flex-wrap gap-2">
                  {recap.achievements.map((id) => (
                    <li key={id} className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-sm text-content">
                      <Award aria-hidden="true" className="size-3.5 text-accent-amber" />
                      {t(`achievements.items.${id}.title`)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col-reverse rounded-lg bg-surface-tint px-3 py-3 text-center">
      <dt className="text-xs text-content-muted">{label}</dt>
      <dd className="text-lg font-bold text-content">
        <Numeric>{value}</Numeric>
      </dd>
    </div>
  );
}
