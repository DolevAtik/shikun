"use client";

import { ChevronLeft, Languages, LogOut, Moon, Sun } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { Card, cn } from "@moch/ui";

export function ProfileActions() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // A toggle between the two locales, so the row advertises the language you are
  // about to get, not the one you are already reading.
  const other = locale === "he" ? { next: "en", label: "English" } : { next: "he", label: "עברית" };

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });

    // A hard navigation, not `router.push`. Signing out has to leave nothing
    // behind, and Next's client-side router cache is holding rendered payloads
    // of the screens this person was just looking at — a soft navigation does
    // not drop them. This does.
    window.location.href = `/${locale}/login`;
  }

  return (
    <Card className="divide-y divide-line">
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-surface-tint"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-tint">
          {isDark ? (
            <Sun aria-hidden="true" className="size-4" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-content-muted">{t("settings.theme")}</span>
          <span className="block truncate text-sm font-medium text-content">
            {isDark ? t("settings.themeDark") : t("settings.themeLight")}
          </span>
        </span>
        {/* A pill that reads as on/off at a glance, not just a row you can press. */}
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
            isDark ? "bg-brand" : "bg-line",
          )}
        >
          <span
            className={cn(
              "size-5 rounded-full bg-white shadow-sm transition-transform",
              isDark ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0",
            )}
          />
        </span>
      </button>

      <button
        type="button"
        onClick={() => router.replace(pathname, { locale: other.next })}
        className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-surface-tint"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-tint">
          <Languages aria-hidden="true" className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-content-muted">{t("settings.language")}</span>
          <span className="block truncate text-sm font-medium text-content">{other.label}</span>
        </span>
        {/* The chevron points the way out of the row, whichever way the page reads. */}
        <ChevronLeft aria-hidden="true" className="size-4 shrink-0 text-content-muted rtl:rotate-180" />
      </button>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 p-4 text-start text-danger transition-colors hover:bg-danger-soft"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-danger-soft">
          <LogOut aria-hidden="true" className="size-4" />
        </span>
        <span className="text-sm font-medium">{t("auth.logout")}</span>
      </button>
    </Card>
  );
}
