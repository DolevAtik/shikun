import { setRequestLocale } from "next-intl/server";
import type { AdminContentPage } from "@moch/contracts";
import { ContentList } from "@/components/content/ContentList";
import { serverFetch } from "@/lib/api";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initial = await serverFetch<AdminContentPage>(
    "/admin/content?page=1&pageSize=20&sort=updatedAt&dir=desc",
  );

  return <ContentList initial={initial} />;
}
