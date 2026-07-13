import { PageSkeleton } from "@/components/PageSkeleton";

/**
 * Moving between tabs, the header and nav are already on screen and the layout
 * is not re-rendered — only the page is. So this boundary replaces the content
 * and leaves the chrome standing, rather than skeletonising a shell that is
 * already there and correct.
 */
export default function AppLoading() {
  return <PageSkeleton />;
}
