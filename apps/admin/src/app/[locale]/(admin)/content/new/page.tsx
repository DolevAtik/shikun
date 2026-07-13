import { setRequestLocale } from "next-intl/server";
import { ContentEditor } from "@/components/content/ContentEditor";

export default async function NewContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentEditor mode="create" />;
}
