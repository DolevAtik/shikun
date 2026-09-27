"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { DashboardRange, WorldMetrics } from "@moch/contracts";
import { api, toSearchParams } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RANGES: DashboardRange[] = ["7d", "30d", "90d"];

/**
 * Does העולם שלי change what people do? Each figure is an aggregate and says
 * what it counts over. There is no per-person view here, by design.
 */
export function WorldMetricsView({ initial, initialRange }: { initial: WorldMetrics; initialRange: DashboardRange }) {
  const t = useTranslations("worldMetrics");
  const locale = useLocale();
  const [range, setRange] = React.useState<DashboardRange>(initialRange);
  const query = useQuery({
    queryKey: qk.worldMetrics(range),
    queryFn: () => api.get<WorldMetrics>(`/admin/world/metrics?${toSearchParams({ range })}`),
    initialData: range === initialRange ? initial : undefined,
  });
  const data = query.data ?? initial;
  const number = (value: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "he-IL").format(value);
  const percent = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");
  const perUser = (acts: number, users: number) =>
    users > 0 ? new Intl.NumberFormat(locale === "en" ? "en-US" : "he-IL", { maximumFractionDigits: 1 }).format(acts / users) : "—";
  const attendanceTotal = data.attendance.attended + data.attendance.missed + data.attendance.unanswered;
  const maxGiven = Math.max(1, ...data.recognitionWeeks.map((week) => week.given));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-content">{t("title")}</h1>
          <p className="mt-1 text-sm text-content-muted">{t("subtitle")}</p>
        </div>
        <div className="flex gap-1 rounded-sm border border-line bg-surface p-1" role="group" aria-label={t("range")}>
          {RANGES.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={range === value ? "secondary" : "ghost"}
              aria-pressed={range === value}
              onClick={() => setRange(value)}
            >
              {t(`ranges.${value}`)}
            </Button>
          ))}
        </div>
      </div>

      <section aria-label={t("headline")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label={t("visitors")} value={number(data.visitors)} hint={t("visitorsHint")} />
        <Tile
          label={t("returnRate")}
          value={percent(data.returned, data.returnBase)}
          hint={t("returnHint", { returned: data.returned, base: data.returnBase })}
        />
        <Tile
          label={t("missionRate")}
          value={percent(data.missionCompleted, data.missionOpens)}
          hint={t("missionHint", { completed: data.missionCompleted, opens: data.missionOpens })}
        />
        <Tile
          label={t("attendanceRate")}
          value={percent(data.attendance.attended, data.attendance.attended + data.attendance.missed)}
          hint={t("attendanceHint", {
            attended: data.attendance.attended,
            missed: data.attendance.missed,
            unanswered: data.attendance.unanswered,
            total: attendanceTotal,
          })}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("focusTitle")}</CardTitle>
            <CardDescription>{t("focusHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-surface-tint p-4">
                <dt className="text-sm text-content-muted">{t("withFocus", { users: data.focus.withFocus.users })}</dt>
                <dd className="mt-1 text-2xl font-semibold text-content">{perUser(data.focus.withFocus.acts, data.focus.withFocus.users)}</dd>
              </div>
              <div className="rounded-md bg-surface-tint p-4">
                <dt className="text-sm text-content-muted">{t("withoutFocus", { users: data.focus.withoutFocus.users })}</dt>
                <dd className="mt-1 text-2xl font-semibold text-content">
                  {perUser(data.focus.withoutFocus.acts, data.focus.withoutFocus.users)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-content-muted">{t("focusNote")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("actsTitle")}</CardTitle>
            <CardDescription>{t("actsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <caption className="sr-only">{t("actsTitle")}</caption>
              <tbody className="divide-y divide-line">
                {(Object.keys(data.acts) as (keyof WorldMetrics["acts"])[]).map((act) => (
                  <tr key={act}>
                    <th scope="row" className="py-2 text-start font-normal text-content-muted">
                      {t(`acts.${act}`)}
                    </th>
                    <td className="py-2 text-end font-medium text-content">{number(data.acts[act])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recognitionTitle")}</CardTitle>
          <CardDescription>{t("recognitionHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-8 items-end gap-2" aria-label={t("recognitionTitle")}>
            {data.recognitionWeeks.map((week) => (
              <li key={week.week} className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-content">{number(week.given)}</span>
                <span className="flex h-24 w-full items-end" aria-hidden="true">
                  <span className="w-full rounded-t-sm bg-brand" style={{ height: `${Math.max(4, (week.given / maxGiven) * 100)}%` }} />
                </span>
                <span className="text-[0.7rem] text-content-muted">
                  {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "he-IL", { day: "numeric", month: "numeric", timeZone: "UTC" }).format(
                    new Date(`${week.week}T12:00:00Z`),
                  )}
                </span>
                <span className="sr-only">{t("recognitionWeek", { given: week.given, givers: week.givers })}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <p className="text-xs text-content-muted">{t("privacy")}</p>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-content-muted">{label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-content">{value}</p>
        <p className="mt-2 text-xs text-content-muted">{hint}</p>
      </CardContent>
    </Card>
  );
}
