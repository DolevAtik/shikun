import { setRequestLocale } from "next-intl/server";
import type { AdminContentDetail } from "@moch/contracts";
import { ContentEditor } from "@/components/content/ContentEditor";
import { serverFetch } from "@/lib/api";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const item = await serverFetch<AdminContentDetail>(`/admin/content/${id}`);
  return <ContentEditor mode="edit" initial={item} />;
}
