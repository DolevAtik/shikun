"use client";

import type { Channel, ChannelSlug, FeedPage, FeedPost, ToggleResponse } from "@moch/contracts";
import { Button, Chip, EmptyState, Skeleton, cn } from "@moch/ui";
import { Check, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import { PostCard } from "./PostCard";

type Scope = "all" | "following" | "bookmarked";

interface Props {
  locale: string;
  channels: Channel[];
  initialPage: FeedPage;
}

export function FeedClient({ locale, channels: initialChannels, initialPage }: Props) {
  const t = useTranslations("feed");

  const [channels, setChannels] = useState(initialChannels);
  const [scope, setScope] = useState<Scope>("all");
  const [activeChannel, setActiveChannel] = useState<ChannelSlug | null>(null);
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<FeedPost[]>(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [isLoading, setIsLoading] = useState(false);

  const buildQuery = useCallback(
    (nextCursor?: string | null) => {
      const params = new URLSearchParams({ limit: "10" });
      if (activeChannel) params.set("channel", activeChannel);
      if (scope === "following") params.set("following", "true");
      if (scope === "bookmarked") params.set("bookmarked", "true");
      if (query.trim()) params.set("q", query.trim());
      if (nextCursor) params.set("cursor", nextCursor);
      return params.toString();
    },
    [activeChannel, scope, query],
  );

  // Refetch whenever the filter changes. Debounced, so typing in the search box
  // does not fire a request per keystroke.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timer = setTimeout(() => {
      clientFetch<FeedPage>(`/feed/posts?${buildQuery()}`)
        .then((page) => {
          if (cancelled) return;
          setPosts(page.items);
          setCursor(page.nextCursor);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, query ? 300 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [buildQuery, query]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  const loadMore = useCallback(async () => {
    const nextCursor = cursorRef.current;
    if (!nextCursor || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const page = await clientFetch<FeedPage>(`/feed/posts?${buildQuery(nextCursor)}`);
      setPosts((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [buildQuery]);

  // Infinite scroll: when the sentinel enters the viewport, fetch the next page.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  async function toggleFollow(channel: Channel) {
    const next = !channel.isFollowing;
    setChannels((current) =>
      current.map((item) => (item.id === channel.id ? { ...item, isFollowing: next } : item)),
    );

    try {
      const result = await clientFetch<ToggleResponse>(`/feed/channels/${channel.slug}/follow`, {
        method: next ? "POST" : "DELETE",
      });
      setChannels((current) =>
        current.map((item) =>
          item.id === channel.id
            ? { ...item, isFollowing: result.active, followerCount: result.count }
            : item,
        ),
      );
    } catch {
      setChannels((current) =>
        current.map((item) => (item.id === channel.id ? { ...item, isFollowing: !next } : item)),
      );
    }
  }

  const activeChannelData = channels.find((channel) => channel.slug === activeChannel);

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-20 border-b border-line bg-bg/95 pb-2 pt-3 backdrop-blur">
        <h1 className="px-4 pb-2 text-xl font-bold text-content">{t("title")}</h1>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-content-muted"
            />
            <label htmlFor="feed-search" className="sr-only">
              {t("search")}
            </label>
            <input
              id="feed-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-full border border-line-strong bg-surface ps-10 pe-4 text-sm text-content"
            />
          </div>
        </div>

        {/* Scope tabs. A real tablist, so arrow keys work and a screen reader
            announces which of three views is selected. */}
        <div role="tablist" aria-label={t("title")} className="flex gap-1 px-4 pb-2">
          {(["all", "following", "bookmarked"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={scope === value}
              onClick={() => setScope(value)}
              className={cn(
                "min-h-9 rounded-full px-3.5 text-sm font-medium transition-colors",
                scope === value
                  ? "bg-brand text-content-onbrand"
                  : "bg-surface text-content-muted hover:text-content",
              )}
            >
              {value === "all" ? t("allChannels") : value === "following" ? t("following") : t("bookmarks")}
            </button>
          ))}
        </div>

        <div className="rail !pb-0">
          {channels.map((channel) => {
            const isActive = activeChannel === channel.slug;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(isActive ? null : channel.slug)}
                aria-pressed={isActive}
                className={cn(
                  "min-h-9 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-transparent text-white"
                    : "border-line bg-surface text-content-muted hover:text-content",
                )}
                style={isActive ? { backgroundColor: channel.color } : undefined}
              >
                {locale === "he" ? channel.nameHe : channel.nameEn}
              </button>
            );
          })}
        </div>
      </div>

      {activeChannelData ? (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-content">
              {locale === "he" ? activeChannelData.nameHe : activeChannelData.nameEn}
            </p>
            <p className="truncate text-xs text-content-muted">
              {locale === "he" ? activeChannelData.descriptionHe : activeChannelData.descriptionEn}
            </p>
          </div>

          {activeChannelData.isMandatory ? (
            <Chip className="bg-surface-tint">{t("mandatory")}</Chip>
          ) : (
            <Button
              size="sm"
              variant={activeChannelData.isFollowing ? "secondary" : "primary"}
              onClick={() => toggleFollow(activeChannelData)}
            >
              {activeChannelData.isFollowing ? (
                <>
                  <Check aria-hidden="true" className="size-4" />
                  {t("unfollow")}
                </>
              ) : (
                <>
                  <Plus aria-hidden="true" className="size-4" />
                  {t("follow")}
                </>
              )}
            </Button>
          )}
        </div>
      ) : null}

      {/* The result count changes politely, so a screen reader hears that the
          filter did something rather than being left in silence. */}
      <p aria-live="polite" className="sr-only">
        {t("posts", { count: posts.length })}
      </p>

      <div className="flex flex-col gap-3 p-4">
        {isLoading && posts.length === 0 ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : posts.length === 0 ? (
          <EmptyState
            title={scope === "bookmarked" ? t("emptyBookmarks") : t("empty")}
            description={scope === "bookmarked" ? t("emptyBookmarksHint") : t("emptyHint")}
          />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}

        {cursor ? (
          <div ref={loadMoreRef} className="flex justify-center py-2">
            <Button variant="secondary" onClick={loadMore} isLoading={isLoading} className="mx-auto">
              {t("loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
