"use client";

import { LogOut, Moon, Palette, Sun } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Card, cn } from "@moch/ui";
import { applyAppearance, currentDesign, type Design } from "@/lib/appearance";

/**
 * A swatch per design, so the choice is recognisable before it is read. Literal
 * colors on purpose: each swatch previews its own design, whichever is active.
 */
const DESIGNS: { id: Design; label: "settings.designMosaic" | "settings.designClassic"; swatch: string[] }[] = [
  { id: "mosaic", label: "settings.designMosaic", swatch: ["#274a8e", "#e4322b", "#f7c51e"] },
  { id: "classic", label: "settings.designClassic", swatch: ["#2c2118", "#7a3412", "#f6c98a"] },
];

export function ProfileActions() {
  const t = useTranslations();
  const locale = useLocale();
  const [isDark, setIsDark] = useState(false);
  const [design, setDesign] = useState<Design>("mosaic");

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setDesign(currentDesign());
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    applyAppearance(design, next);
  }

  function chooseDesign(next: Design) {
    setDesign(next);
    applyAppearance(next, isDark);
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
      <div className="flex items-center gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-tint">
          <Palette aria-hidden="true" className="size-4" />
        </span>
        <span id="design-label" className="min-w-0 flex-1 text-xs text-content-muted">
          {t("settings.design")}
        </span>
        {/* Two options, both visible: a design is picked by sight, not toggled blind. */}
        <div
          role="radiogroup"
          aria-labelledby="design-label"
          className="flex shrink-0 gap-1 rounded-full bg-surface-sunken p-1"
        >
          {DESIGNS.map((option) => {
            const selected = design === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseDesign(option.id)}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
                  selected ? "bg-surface text-content shadow-sm" : "text-content-muted hover:text-content",
                )}
              >
                <span aria-hidden="true" className="flex gap-0.5">
                  {option.swatch.map((color) => (
                    <span
                      key={color}
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                {t(option.label)}
              </button>
            );
          })}
        </div>
      </div>

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
