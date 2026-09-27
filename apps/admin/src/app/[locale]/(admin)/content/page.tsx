import { setRequestLocale } from "next-intl/server";
import type { AdminContentPage } from "@moch/contracts";
import { ContentKindSchema } from "@moch/contracts";
import { ContentList } from "@/components/content/ContentList";
import { serverFetch } from "@/lib/api";

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  // `?kind=ALERT` pre-selects the filter — the Home screen editor links here per section.
  const kind = ContentKindSchema.optional().catch(undefined).parse(query.kind);
  const initial = await serverFetch<AdminContentPage>(
    `/admin/content?page=1&pageSize=20&sort=updatedAt&dir=desc${kind ? `&kind=${kind}` : ""}`,
  );

  return <ContentList initial={initial} initialKind={kind} />;
}
