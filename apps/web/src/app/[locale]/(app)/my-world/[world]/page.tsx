import type { WorldDetail } from "@moch/contracts";
import { WorldFocusSchema } from "@moch/contracts";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { WorldDetailView } from "@/components/my-world/WorldDetailView";
import { NotFoundError, serverFetchOrLogin } from "@/lib/api";

export default async function WorldPage({ params }: { params: Promise<{ locale: string; world: string }> }) {
  const { locale, world } = await params;
  setRequestLocale(locale);
  if (!WorldFocusSchema.safeParse(world).success) notFound();

  let detail: WorldDetail;
  try {
    detail = await serverFetchOrLogin<WorldDetail>(`/me/progress/worlds/${world}`, locale);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl px-4 pb-8 pt-4 sm:px-6">
      <WorldDetailView detail={detail} />
    </div>
  );
}
