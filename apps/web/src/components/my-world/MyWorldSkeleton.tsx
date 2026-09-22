import { Skeleton } from "@moch/ui";

/** The shape of העולם שלי while the server prepares the real one. */
export function MyWorldSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-8 px-4 pb-8 pt-6 sm:px-6">
      <p className="sr-only">{label}</p>
      <Skeleton className="h-56 w-full rounded-xl sm:h-48" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-36" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="hidden h-40 rounded-lg xl:block" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="hidden h-36 rounded-lg xl:block" />
          <Skeleton className="hidden h-36 rounded-lg xl:block" />
        </div>
      </div>
    </div>
  );
}
