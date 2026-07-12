"use client";

import { Moon, Sun, LogOut, Languages } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { Avatar } from "@moch/ui";

interface AppHeaderProps {
  name: string;
  initials: string;
  avatarUrl: string | null;
}

export function AppHeader({ name, initials, avatarUrl }: AppHeaderProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    nextRouter.push(`/${locale}/login`);
    nextRouter.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface-brand text-content-onsurfacebrand">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
        {/* The Ministry's own mark, on its own white plate — a government emblem
            should never sit directly on a colored field. */}
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white p-1">
          <img src="/ministry-logo.svg" alt="" className="size-full object-contain" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{t("app.name")}</p>
          <p className="truncate text-xs leading-tight opacity-80">{t("app.shortName")}</p>
        </div>

        <button
          type="button"
          onClick={() => router.replace(pathname, { locale: locale === "he" ? "en" : "he" })}
          aria-label={t("a11y.switchLanguage")}
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          <Languages aria-hidden="true" className="size-5" />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t("a11y.toggleTheme")}
          aria-pressed={isDark}
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          {isDark ? (
            <Sun aria-hidden="true" className="size-5" />
          ) : (
            <Moon aria-hidden="true" className="size-5" />
          )}
        </button>

        <button
          type="button"
          onClick={logout}
          aria-label={t("auth.logout")}
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10"
        >
          <LogOut aria-hidden="true" className="size-5" />
        </button>

        <Avatar
          name={name}
          initials={initials}
          src={avatarUrl}
          size="sm"
          className="bg-white/20 text-content-onsurfacebrand"
        />
      </div>
    </header>
  );
}
