"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { type NavItem, navForPath } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const COLLAPSED_KEY = "admin-sidebar-collapsed";

export function Sidebar({
  items,
  mobileOpen,
  onMobileOpenChange,
}: {
  items: NavItem[];
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const pathname = usePathname();
  const active = navForPath(pathname);

  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const nav = (
    <nav aria-label={t("menu")} className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-line px-3",
          collapsed && "justify-center px-2",
        )}
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-brand text-xs font-bold text-content-onbrand"
          aria-hidden
        >
          מב״ש
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-content">{tApp("title")}</p>
            <p className="truncate text-xs text-content-muted">{tApp("ministry")}</p>
          </div>
        )}
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active?.id === item.id;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={() => onMobileOpenChange(false)}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? t(item.id) : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-secondary font-medium text-brand"
                    : "text-content-muted hover:bg-secondary hover:text-content",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{t(item.id)}</span>}
                {collapsed && <span className="sr-only">{t(item.id)}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <Separator />
      <div className={cn("hidden p-2 lg:block", collapsed && "flex justify-center")}>
        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("w-full", !collapsed && "justify-start")}
          onClick={toggleCollapsed}
          aria-pressed={collapsed}
          aria-label={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && <span>{t("collapse")}</span>}
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-e border-line bg-surface lg:block",
          collapsed ? "w-[3.75rem]" : "w-60",
        )}
      >
        {nav}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent className="w-72 p-0">
          <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
          {nav}
        </SheetContent>
      </Sheet>
    </>
  );
}
