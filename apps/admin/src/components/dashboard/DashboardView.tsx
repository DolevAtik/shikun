"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminDashboard, DashboardRange } from "@moch/contracts";
import { Link } from "@/i18n/routing";
import { api, toSearchParams } from "@/lib/client-api";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const RANGES: DashboardRange[] = ["7d", "30d", "90d"];

export function DashboardView({
  initial,
  initialRange,
}: {
  initial: AdminDashboard;
  initialRange: DashboardRange;
}) {
  const t = useTranslations("dashboard");
  const [range, setRange] = React.useState<DashboardRange>(initialRange);

  const query = useQuery({
    queryKey: qk.dashboard.overview(range),
    queryFn: () => api.get<AdminDashboard>(`/admin/dashboard?${toSearchParams({ range })}`),
    initialData: range === initialRange ? initial : undefined,
  });

  const data = query.data ?? initial;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
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

      <section aria-label={t("stats")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.stats.map((stat) => (
          <StatCard key={stat.key} statKey={stat.key} value={stat.value} changePct={stat.changePct} collectingSince={stat.collectingSince} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("communityActivity")}</CardTitle>
            <CardDescription>{t("communityActivityHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CommunityChart data={data.communityActivity} label={t("comments")} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("contentByStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.contentByStatus.length === 0 ? (
              <p className="text-sm text-content-muted">{t("empty")}</p>
            ) : (
              data.contentByStatus.map((row) => (
                <div key={row.status} className="flex items-center justify-between text-sm">
                  <span className="text-content-muted">{t(`status.${row.status}`)}</span>
                  <span className="numeric font-medium text-content">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ListCard
          title={t("topContent")}
          empty={t("empty")}
          items={data.topContent.map((item) => ({
            id: item.id,
            primary: item.title,
            secondary: `${item.comments} ${t("comments")} · ${item.likes} ${t("likes")}`,
            href: `/content/${item.id}`,
          }))}
        />
        <ListCard
          title={t("topDistricts")}
          empty={t("empty")}
          items={data.topDistricts.map((item) => ({
            id: item.id,
            primary: item.name,
            secondary: `${item.score} ${t("interactions")}`,
            href: `/districts/${item.id}`,
            color: item.color,
          }))}
        />
        <ListCard
          title={t("topDepartments")}
          empty={t("empty")}
          items={data.topDepartments.map((item) => ({
            id: item.id,
            primary: item.name,
            secondary: `${item.score} ${t("interactions")}`,
            href: `/employees?department=${item.id}`,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{t("upcomingEvents")}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/events">{t("viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingEvents.length === 0 ? (
              <p className="text-sm text-content-muted">{t("empty")}</p>
            ) : (
              data.upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">{event.title}</p>
                    <p className="mt-0.5 text-xs text-content-muted">
                      <span className="numeric">{formatDate(event.startsAt)}</span>
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary" className="numeric shrink-0">
                    {event.registrations}
                    {event.capacity != null ? `/${event.capacity}` : ""}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentActivity")}</CardTitle>
            <CardDescription>{t("recentActivityHint")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-content-muted">{t("activityEmpty")}</p>
            ) : (
              data.recentActivity.map((entry) => (
                <div key={entry.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                  <p className="text-sm text-content">{entry.summary}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {entry.actor} · <span className="numeric">{formatDate(entry.at)}</span>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/content">{t("actions.newContent")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employees">{t("actions.employees")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">{t("actions.homeLayout")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/analytics">{t("actions.analytics")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  statKey,
  value,
  changePct,
  collectingSince,
}: {
  statKey: string;
  value: number | null;
  changePct: number | null;
  collectingSince: string | null;
}) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{t(`stats.${statKey}`)}</CardDescription>
        {value === null ? (
          <CardTitle className="text-base font-medium text-content-muted">
            {collectingSince
              ? t("collectingSince", { date: formatDay(collectingSince) })
              : t("notCollecting")}
          </CardTitle>
        ) : (
          <CardTitle className="numeric text-3xl font-semibold tracking-tight">{formatNumber(value)}</CardTitle>
        )}
      </CardHeader>
      {changePct != null && value !== null && (
        <CardContent>
          <p
            className={cn(
              "numeric text-xs font-medium",
              changePct >= 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]",
            )}
          >
            {changePct >= 0 ? "+" : ""}
            {changePct}% {t("vsPrevious")}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function ListCard({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; primary: string; secondary: string; href: string; color?: string | null }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-content-muted">{empty}</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start gap-2 rounded-sm border-b border-line pb-3 last:border-0 last:pb-0 hover:text-brand"
            >
              {item.color && (
                <span
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ background: item.color }}
                  aria-hidden
                />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-content">{item.primary}</span>
                <span className="mt-0.5 block text-xs text-content-muted">{item.secondary}</span>
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CommunityChart({
  data,
  label,
}: {
  data: AdminDashboard["communityActivity"];
  label: string;
}) {
  const tableId = "community-activity-table";

  return (
    <div>
      {/* WCAG 1.1.1 — Recharts is SVG; a visually-hidden table is the text alternative. */}
      <table id={tableId} className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{label}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="communityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              tickFormatter={(value: string) => value.slice(5)}
            />
            <YAxis
              allowDecimals={false}
              width={32}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text)",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name={label}
              stroke="var(--chart-1)"
              fill="url(#communityFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("he-IL").format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
