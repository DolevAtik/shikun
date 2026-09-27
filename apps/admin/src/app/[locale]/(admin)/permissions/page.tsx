import { setRequestLocale } from "next-intl/server";
import type { AdminRoleCounts } from "@moch/contracts";
import { PermissionsView } from "@/components/permissions/PermissionsView";
import { serverFetchOrLogin } from "@/lib/api";

export default async function PermissionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const counts = await serverFetchOrLogin<AdminRoleCounts>("/admin/employees/role-counts", locale);
  return <PermissionsView initial={counts} />;
}
