"use client";

import * as React from "react";
import type { CurrentUser } from "@moch/contracts";
import { NAV_ITEMS, type NavSectionId } from "@/lib/nav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({
  user,
  navIds,
  children,
}: {
  user: CurrentUser;
  /** Permission-filtered section ids — icons stay client-side (not serializable). */
  navIds: NavSectionId[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navItems = NAV_ITEMS.filter((item) => navIds.includes(item.id));

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar items={navItems} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onOpenMobileNav={() => setMobileOpen(true)} />
        <main id="main" className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
