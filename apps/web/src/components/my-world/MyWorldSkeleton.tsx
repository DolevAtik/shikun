import { Skeleton } from "@moch/ui";

/** The shape of העולם שלי while the server prepares the real one. */
export function MyWorldSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-10 px-4 pb-8 pt-4 sm:px-6">
      <p className="sr-only">{label}</p>
      <Skeleton className="h-72 w-full rounded-xl sm:h-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
    </div>
  );
}
