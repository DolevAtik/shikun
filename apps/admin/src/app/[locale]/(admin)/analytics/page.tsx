import { setRequestLocale } from "next-intl/server";
import type { DashboardRange, WorldMetrics } from "@moch/contracts";
import { DashboardRangeSchema } from "@moch/contracts";
import { WorldMetricsView } from "@/components/world/WorldMetricsView";
import { serverFetchOrLogin } from "@/lib/api";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const range: DashboardRange = DashboardRangeSchema.catch("30d").parse(query.range);
  const initial = await serverFetchOrLogin<WorldMetrics>(`/admin/world/metrics?range=${range}`, locale);

  return <WorldMetricsView initial={initial} initialRange={range} />;
}
