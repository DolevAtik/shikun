"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@moch/ui";
import { isNavActive, NAV_ITEMS } from "@/components/nav-items";

/** Same five destinations as the bottom bar. Shown from the `lg` breakpoint up. */
export function SideNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-y-0 start-0 z-40 hidden w-56 flex-col border-e border-line bg-surface py-4 lg:flex"
    >
      <ul className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, key, Icon }) => {
          const isActive = isNavActive(pathname, href);

          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3",
                  "text-sm font-medium transition-colors duration-[--duration-fast]",
                  isActive
                    ? "bg-brand-soft text-brand"
                    : "text-content-muted hover:bg-surface-tint hover:text-content",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={isActive ? 2.4 : 1.9} />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
