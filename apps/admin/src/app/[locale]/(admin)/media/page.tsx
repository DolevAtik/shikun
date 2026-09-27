import { setRequestLocale } from "next-intl/server";
import { MediaUploader } from "@/components/media/MediaUploader";

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MediaUploader />;
}
