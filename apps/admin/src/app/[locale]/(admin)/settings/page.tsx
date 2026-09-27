import { redirect } from "next/navigation";

/** The Home layout editor used to live here; old links and bookmarks still land on it. */
export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/home-screen`);
}
