import { Skeleton } from "@moch/ui";
import { BottomNav } from "@/components/BottomNav";
import { PageSkeleton } from "@/components/PageSkeleton";

/**
 * The app shell, shown while the screen beneath it resolves.
 *
 * This boundary sits at `[locale]` rather than inside `(app)` on purpose. A
 * `loading.tsx` only wraps the *page* beside it, never the layout — and it is
 * `(app)/layout.tsx` that awaits `/auth/me` for the header. A boundary inside
 * `(app)` would therefore not cover the very fetch that makes arriving from the
 * login form slow. Placed here, it covers the layout and the page both.
 *
 * That is what stops the login button from sitting on "מתחבר…" for the length of
 * a full server render: the navigation commits immediately onto this, and the
 * real screen swaps in behind it.
 */
export default function LocaleLoading() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-brand">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          {/* The emblem is not data. It is the one thing here that can be real,
              so it is — the shell reads as the Ministry's from the first frame. */}
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white p-1">
            <img src="/ministry-logo.svg" alt="" className="size-full object-contain" />
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-44 bg-white/25" />
            <Skeleton className="h-2.5 w-28 bg-white/15" />
          </div>

          <Skeleton className="size-9 shrink-0 rounded-full bg-white/25" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl pb-24">
        <PageSkeleton />
      </main>

      {/* The real nav, not a placeholder: it reads the path, never the viewer, so
          it needs no data and is live and pressable while the rest loads. */}
      <BottomNav />
    </div>
  );
}
