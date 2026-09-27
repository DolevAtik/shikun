import { setRequestLocale } from "next-intl/server";
import type { AdminSessionPage } from "@moch/contracts";
import { SessionsView } from "@/components/sessions/SessionsView";
import { serverFetchOrLogin } from "@/lib/api";

export default async function LearningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initial = await serverFetchOrLogin<AdminSessionPage>(
    "/admin/sessions?kind=TRAINING&when=upcoming&page=1&pageSize=20",
    locale,
  );

  return <SessionsView kind="TRAINING" initial={initial} />;
}
