import { setRequestLocale } from "next-intl/server";
import type { AdminQuests } from "@moch/contracts";
import { QuestList } from "@/components/world/QuestList";
import { serverFetchOrLogin } from "@/lib/api";

export default async function QuestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initial = await serverFetchOrLogin<AdminQuests>("/admin/quests", locale);

  return <QuestList initial={initial} />;
}
