"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@moch/ui";
import { isNavActive, NAV_ITEMS } from "@/components/nav-items";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("primary")}
      className={cn(
        // Solid, not translucent: content scrolling underneath was showing
        // through the bar and muddying the labels.
        "fixed inset-x-3 bottom-3 z-40 rounded-full border border-line bg-surface shadow-lg lg:hidden",
        // Clears the iPhone home indicator without hardcoding a magic number.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {NAV_ITEMS.map(({ href, key, Icon }) => {
          const isActive = isNavActive(pathname, href);

          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  // 44px+ touch target, and the label is always visible — an icon
                  // alone is a guessing game for anyone who is not us.
                  "flex min-h-[3.5rem] flex-col items-center justify-center gap-1 py-2",
                  "text-[0.7rem] font-medium transition-colors duration-[--duration-fast]",
                  isActive ? "text-brand" : "text-content-muted hover:text-content",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-5", isActive && "fill-brand/10")}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
