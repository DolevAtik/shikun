"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Moon, Sun } from "lucide-react";
import type { CurrentUser } from "@moch/contracts";
import { Link, usePathname } from "@/i18n/routing";
import { navForPath } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { GlobalSearch } from "./GlobalSearch";
import { UserMenu } from "./UserMenu";

export function Topbar({
  user,
  onOpenMobileNav,
}: {
  user: CurrentUser;
  onOpenMobileNav: () => void;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const locale = useLocale();
  const active = navForPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label={t("menu")}
      >
        <Menu className="size-5" />
      </Button>

      <Breadcrumb className="hidden min-w-0 flex-1 sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/" className="transition-colors hover:text-content">
              {t("dashboard")}
            </Link>
          </BreadcrumbItem>
          {active && active.id !== "dashboard" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t(active.id)}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ms-auto flex items-center gap-1 sm:gap-2">
        <GlobalSearch />
        <ThemeToggle label={tCommon("theme")} />
        <LocaleToggle locale={locale} label={tCommon("language")} />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  }

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label={label} aria-pressed={dark}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function LocaleToggle({ locale, label }: { locale: string; label: string }) {
  const pathname = usePathname();
  const next = locale === "he" ? "en" : "he";

  return (
    <Button type="button" variant="ghost" size="sm" className="min-w-10 px-2" asChild>
      <Link href={pathname} locale={next} aria-label={label} hrefLang={next}>
        {next === "he" ? "עב" : "EN"}
      </Link>
    </Button>
  );
}
