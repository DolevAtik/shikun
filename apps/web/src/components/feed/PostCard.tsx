"use client";

import type { Comment, CommentsPage, FeedPost, ToggleResponse } from "@moch/contracts";
import { Avatar, Button, Card, Chip, cn } from "@moch/ui";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MediaImage } from "@/components/MediaImage";
import { clientFetch } from "@/lib/client-api";
import { formatRelative } from "@/lib/format";

export function PostCard({ post: initial }: { post: FeedPost }) {
  const t = useTranslations("feed");
  const locale = useLocale();

  const [post, setPost] = useState(initial);
  const [showComments, setShowComments] = useState(false);
  const [expanding, setExpanding] = useState(false);

  /**
   * Optimistic, then reconciled with the server's count. A like that takes a
   * round-trip to appear feels broken; a like that lies about the total is
   * worse. So we do both: paint immediately, correct on response.
   */
  async function toggle(kind: "like" | "bookmark") {
    const isLike = kind === "like";
    const previous = post;

    setPost((current) => ({
      ...current,
      isLiked: isLike ? !current.isLiked : current.isLiked,
      likeCount: isLike ? current.likeCount + (current.isLiked ? -1 : 1) : current.likeCount,
      isBookmarked: isLike ? current.isBookmarked : !current.isBookmarked,
    }));

    try {
      const result = await clientFetch<ToggleResponse>(`/feed/posts/${post.id}/${kind}`, {
        method: "POST",
      });
      setPost((current) =>
        isLike
          ? { ...current, isLiked: result.active, likeCount: result.count }
          : { ...current, isBookmarked: result.active },
      );
    } catch {
      setPost(previous);
    }
  }

  async function expandBody() {
    if (!post.isTruncated || expanding) return;
    setExpanding(true);
    try {
      const full = await clientFetch<FeedPost>(`/feed/posts/${post.id}`);
      setPost((current) => ({
        ...current,
        body: full.body,
        excerpt: full.excerpt,
        isTruncated: false,
      }));
    } finally {
      setExpanding(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <article>
        <header className="flex items-center gap-3 p-4 pb-3">
          {post.author ? (
            <Avatar
              name={post.author.fullName}
              initials={post.author.initials}
              src={post.author.avatarUrl}
            />
          ) : null}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-content">
              {post.author?.fullName ?? post.channel.nameHe}
            </p>
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-content-muted">
              {post.author?.title ? <span className="truncate">{post.author.title}</span> : null}
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt}>{formatRelative(post.publishedAt, locale)}</time>
            </p>
          </div>

          <Chip color={post.channel.color}>
            {locale === "he" ? post.channel.nameHe : post.channel.nameEn}
          </Chip>
        </header>

        <div className="px-4 pb-3">
          {post.title ? (
            <h2 className="mb-1 font-semibold leading-snug text-content">{post.title}</h2>
          ) : null}
          <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-content">{post.body}</p>
          {post.isTruncated ? (
            <button
              type="button"
              onClick={expandBody}
              disabled={expanding}
              className="mt-1 text-sm font-medium text-brand hover:underline"
            >
              {expanding ? t("loading") : t("readMore")}
            </button>
          ) : null}

          {(post.districtName || post.tags.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {post.districtName ? <Chip color={post.districtColor}>{post.districtName}</Chip> : null}
              {post.tags.map((tag) => (
                <Chip key={tag.id}>#{tag.label}</Chip>
              ))}
            </div>
          )}
        </div>

        {post.media
          .filter((media) => media.kind === "IMAGE")
          .map((media) => (
            <div key={media.id} className="relative aspect-video w-full bg-surface-sunken">
              <MediaImage
                src={media.url}
                // Alt text is required at publish time, so by the time a post
                // renders here it has one. This is not a fallback — it is the
                // author's own description.
                alt={media.alt ?? ""}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
              />
            </div>
          ))}

        <footer className="flex items-center gap-1 border-t border-line px-2 py-1">
          <ActionButton
            onClick={() => toggle("like")}
            isActive={post.isLiked}
            activeClass="text-accent-red"
            label={t("like")}
            count={post.likeCount}
            Icon={Heart}
          />
          <ActionButton
            onClick={() => setShowComments((value) => !value)}
            isActive={showComments}
            activeClass="text-brand"
            label={t("comment")}
            count={post.commentCount}
            Icon={MessageCircle}
            expanded={showComments}
          />
          <ActionButton
            onClick={() => toggle("bookmark")}
            isActive={post.isBookmarked}
            activeClass="text-brand"
            label={post.isBookmarked ? t("bookmarked") : t("bookmark")}
            Icon={Bookmark}
            className="ms-auto"
          />
        </footer>

        {showComments ? <CommentThread postId={post.id} /> : null}
      </article>
    </Card>
  );
}

interface ActionButtonProps {
  onClick: () => void;
  isActive: boolean;
  activeClass: string;
  label: string;
  count?: number;
  Icon: typeof Heart;
  className?: string;
  expanded?: boolean;
}

function ActionButton({
  onClick,
  isActive,
  activeClass,
  label,
  count,
  Icon,
  className,
  expanded,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={expanded === undefined ? isActive : undefined}
      aria-expanded={expanded}
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
        "transition-colors duration-[--duration-fast] hover:bg-surface-tint",
        isActive ? activeClass : "text-content-muted",
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn("size-[1.15rem]", isActive && "fill-current")} />
      <span>{label}</span>
      {count !== undefined && count > 0 ? (
        <span className="numeric tabular-nums text-xs">{count}</span>
      ) : null}
    </button>
  );
}

function CommentThread({ postId }: { postId: string }) {
  const t = useTranslations("feed");
  const locale = useLocale();

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;

    clientFetch<CommentsPage>(`/feed/posts/${postId}/comments?limit=20`)
      .then((page) => {
        if (cancelled) return;
        setComments(page.items);
        setCursor(page.nextCursor);
      })
      .catch(() => {
        if (!cancelled) {
          setComments([]);
          setCursor(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function loadMoreComments() {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await clientFetch<CommentsPage>(
        `/feed/posts/${postId}/comments?limit=20&cursor=${encodeURIComponent(cursor)}`,
      );
      setComments((current) => [...(current ?? []), ...page.items]);
      setCursor(page.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;

    setIsSending(true);
    try {
      const created = await clientFetch<Comment>(`/feed/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: draft }),
      });
      setComments((current) => [...(current ?? []), created]);
      setDraft("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-t border-line bg-surface-tint/50 p-4">
      <h3 className="sr-only">{t("comments")}</h3>

      {comments && comments.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <Avatar
                name={comment.author.fullName}
                initials={comment.author.initials}
                src={comment.author.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1 rounded-md rounded-ss-none bg-surface px-3 py-2">
                <p className="text-xs font-semibold text-content">{comment.author.fullName}</p>
                <p className="mt-0.5 text-sm leading-snug text-content">{comment.body}</p>
                <p className="mt-1 text-[0.7rem] text-content-muted">
                  {formatRelative(comment.createdAt, locale)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : comments ? (
        <p className="mb-3 text-sm text-content-muted">{t("noComments")}</p>
      ) : null}

      {cursor ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mb-3"
          onClick={loadMoreComments}
          isLoading={isLoadingMore}
        >
          {t("loadMoreComments")}
        </Button>
      ) : null}

      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor={`comment-${postId}`} className="sr-only">
          {t("addComment")}
        </label>
        <input
          id={`comment-${postId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("addComment")}
          className="h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm text-content"
        />
        <Button type="submit" size="sm" isLoading={isSending} disabled={!draft.trim()} aria-label={t("send")}>
          <Send aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </Button>
      </form>
    </div>
  );
}
