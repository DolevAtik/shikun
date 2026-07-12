import type { Channel, FeedPage } from "@moch/contracts";
import { setRequestLocale } from "next-intl/server";
import { FeedClient } from "@/components/feed/FeedClient";
import { serverFetchOrLogin } from "@/lib/api";

export default async function FeedRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The first page is rendered on the server so the feed is readable before any
  // JavaScript executes; everything after that is client-side.
  const [channels, firstPage] = await Promise.all([
    serverFetchOrLogin<Channel[]>("/feed/channels", locale),
    serverFetchOrLogin<FeedPage>("/feed/posts?limit=10", locale),
  ]);

  return <FeedClient locale={locale} channels={channels} initialPage={firstPage} />;
}
