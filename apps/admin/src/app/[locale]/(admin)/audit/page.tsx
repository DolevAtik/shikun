import { setRequestLocale } from "next-intl/server";
import type { AuditFacets, AuditLogPage } from "@moch/contracts";
import { AuditList } from "@/components/audit/AuditList";
import { serverFetch } from "@/lib/api";

export default async function AuditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [initial, facets] = await Promise.all([
    serverFetch<AuditLogPage>("/admin/audit?page=1&pageSize=20&dir=desc"),
    serverFetch<AuditFacets>("/admin/audit/facets"),
  ]);

  return <AuditList initial={initial} facets={facets} />;
}
