import { setRequestLocale } from "next-intl/server";
import { ContentKindSchema } from "@moch/contracts";
import { ContentEditor } from "@/components/content/ContentEditor";

export default async function NewContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  // `/content/new?kind=EVENT` — the Events, Learning and Careers screens link here.
  const kind = ContentKindSchema.catch("ANNOUNCEMENT").parse(query.kind);
  return <ContentEditor mode="create" defaultKind={kind} />;
}
