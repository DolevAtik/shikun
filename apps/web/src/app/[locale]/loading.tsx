import { Skeleton } from "@moch/ui";
import { BottomNav } from "@/components/BottomNav";
import { CityBackdrop, HeaderSkyline } from "@/components/CityBackdrop";
import { PageSkeleton } from "@/components/PageSkeleton";
import { SideNav } from "@/components/SideNav";

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
    <div className="relative min-h-dvh lg:ps-56">
      <CityBackdrop />
      <SideNav />
      <header className="sticky top-0 z-30 bg-gradient-to-b from-[var(--hero-to)] to-surface-brand">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2.5 px-4 sm:px-6">
          {/* The emblem is not data. It is the one thing here that can be real,
              so it is — the shell reads as the Ministry's from the first frame. */}
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white p-1">
            <img src="/ministry-logo.svg" alt="" className="size-full object-contain" />
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-44 bg-white/25" />
            <Skeleton className="h-2.5 w-28 bg-white/15" />
          </div>

          <Skeleton className="size-8 shrink-0 rounded-full bg-white/25" />
        </div>
        <HeaderSkyline />
      </header>

      <main className="relative z-10 mx-auto max-w-2xl pb-28 lg:pb-10">
        <PageSkeleton />
      </main>

      {/* The real nav, not a placeholder: it reads the path, never the viewer, so
          it needs no data and is live and pressable while the rest loads. */}
      <BottomNav />
    </div>
  );
}
