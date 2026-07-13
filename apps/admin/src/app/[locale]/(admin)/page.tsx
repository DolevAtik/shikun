import { setRequestLocale } from "next-intl/server";
import type { AdminDashboard, DashboardRange } from "@moch/contracts";
import { DashboardRangeSchema } from "@moch/contracts";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { serverFetch } from "@/lib/api";

export default async function DashboardPage({
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
  const data = await serverFetch<AdminDashboard>(`/admin/dashboard?range=${range}`);

  return <DashboardView initial={data} initialRange={range} />;
}
