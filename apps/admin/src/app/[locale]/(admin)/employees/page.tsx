import { setRequestLocale } from "next-intl/server";
import type { AdminEmployeePage, District } from "@moch/contracts";
import { RoleSchema } from "@moch/contracts";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { serverFetch } from "@/lib/api";

export default async function EmployeesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const role = RoleSchema.optional().catch(undefined).parse(query.role);
  const [initial, districts] = await Promise.all([
    serverFetch<AdminEmployeePage>(
      `/admin/employees?page=1&pageSize=20&sort=name&dir=asc${role ? `&role=${role}` : ""}`,
    ),
    serverFetch<District[]>("/org/districts"),
  ]);

  return <EmployeeList initial={initial} districts={districts} initialRole={role} />;
}
