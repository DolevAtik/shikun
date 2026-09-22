import { getTranslations } from "next-intl/server";
import { MyWorldSkeleton } from "@/components/my-world/MyWorldSkeleton";

export default async function MyWorldLoading() {
  const t = await getTranslations("myWorld");
  return <MyWorldSkeleton label={t("loading")} />;
}
