"use client";

import { Home, Newspaper, Briefcase, LayoutGrid, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@moch/ui";

const TABS = [
  { href: "/", key: "home", Icon: Home },
  { href: "/feed", key: "feed", Icon: Newspaper },
  { href: "/jobs", key: "jobs", Icon: Briefcase },
  { href: "/services", key: "services", Icon: LayoutGrid },
  { href: "/profile", key: "profile", Icon: User },
] as const;

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("primary")}
      className={cn(
        // Solid, not translucent: content scrolling underneath was showing
        // through the bar and muddying the labels.
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface shadow-lg",
        // Clears the iPhone home indicator without hardcoding a magic number.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {TABS.map(({ href, key, Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

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
