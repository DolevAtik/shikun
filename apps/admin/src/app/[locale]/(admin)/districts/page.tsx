import { setRequestLocale } from "next-intl/server";
import type { AdminDistricts } from "@moch/contracts";
import { DistrictList } from "@/components/districts/DistrictList";
import { serverFetch } from "@/lib/api";

export default async function DistrictsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initial = await serverFetch<AdminDistricts>("/admin/districts");

  return <DistrictList initial={initial} />;
}
