import { setRequestLocale } from "next-intl/server";
import type { AdminServices } from "@moch/contracts";
import { ServicesManager } from "@/components/services/ServicesManager";
import { serverFetchOrLogin } from "@/lib/api";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initial = await serverFetchOrLogin<AdminServices>("/admin/services", locale);
  return <ServicesManager initial={initial} />;
}
