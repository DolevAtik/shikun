import { setRequestLocale } from "next-intl/server";
import type { AdminChannel } from "@moch/contracts";
import { CommunityView } from "@/components/community/CommunityView";
import { serverFetchOrLogin } from "@/lib/api";

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const channels = await serverFetchOrLogin<AdminChannel[]>("/admin/community/channels", locale);
  return <CommunityView channels={channels} />;
}
