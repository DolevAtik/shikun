import { Skeleton } from "@moch/ui";

/**
 * The shape of a screen while the server renders the real one.
 *
 * Deliberately generic: it promises "cards are coming", not what is in them. A
 * skeleton that mimics one specific screen is a lie on every other screen, and
 * Home is assembled from audience-targeted sections, so nobody — including this
 * component — knows what the viewer is about to get.
 */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      {/* The greeting line. */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-32" />
      </div>

      {[0, 1, 2].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
