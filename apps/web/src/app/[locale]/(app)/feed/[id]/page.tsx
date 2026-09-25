import type { FeedPost } from "@moch/contracts";
import { ArrowRight, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PostCard } from "@/components/feed/PostCard";
import { xpText } from "@/components/my-world/progress";
import { Link } from "@/i18n/routing";
import { NotFoundError, serverFetchOrLogin } from "@/lib/api";

/**
 * One post, in full. This is where a "read" mission lands: loading it records
 * the read, and the API answers with the XP only the first time.
 */
export default async function PostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("myWorld");
  const tFeed = await getTranslations("feed");

  let post: FeedPost;
  try {
    post = await serverFetchOrLogin<FeedPost>(`/feed/posts/${encodeURIComponent(id)}`, locale);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-8 pt-4">
      <Link
        href="/feed"
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand focus-visible:outline-none focus-visible:shadow-focus"
      >
        <ArrowRight aria-hidden="true" className="size-4 ltr:rotate-180" />
        {tFeed("backToFeed")}
      </Link>

      {post.reward ? (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl bg-success-soft px-4 py-3 text-success shadow-sm">
          <Sparkles aria-hidden="true" className="size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{t("reward.title", { xp: xpText(post.reward.xp, locale, true) })}</p>
            <p className="text-sm">{t("reward.body", { world: t(`worlds.${post.reward.world}.name`) })}</p>
          </div>
          <Link
            href="/my-world"
            className="inline-flex h-11 items-center rounded-md bg-surface px-4 text-sm font-semibold text-content shadow-sm hover:bg-surface-tint focus-visible:outline-none focus-visible:shadow-focus"
          >
            {t("reward.back")}
          </Link>
        </div>
      ) : null}

      <PostCard post={post} />
    </div>
  );
}
