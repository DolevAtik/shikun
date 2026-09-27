import { getTranslations, setRequestLocale } from "next-intl/server";
import type { AdminContentPage } from "@moch/contracts";
import { ContentList } from "@/components/content/ContentList";
import { serverFetch } from "@/lib/api";

/** Careers are content of kind CAREER: the content table, fixed to that kind. */
export default async function CareersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("careers");

  const initial = await serverFetch<AdminContentPage>(
    "/admin/content?page=1&pageSize=20&sort=updatedAt&dir=desc&kind=CAREER",
  );

  return <ContentList initial={initial} fixedKind="CAREER" title={t("title")} subtitle={t("subtitle")} />;
}
