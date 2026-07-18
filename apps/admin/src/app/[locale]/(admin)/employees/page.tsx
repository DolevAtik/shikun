import { setRequestLocale } from "next-intl/server";
import type { AdminEmployeePage, District } from "@moch/contracts";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { serverFetch } from "@/lib/api";

export default async function EmployeesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [initial, districts] = await Promise.all([
    serverFetch<AdminEmployeePage>("/admin/employees?page=1&pageSize=20&sort=name&dir=asc"),
    serverFetch<District[]>("/org/districts"),
  ]);

  return <EmployeeList initial={initial} districts={districts} />;
}
