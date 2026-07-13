import type { Permission } from "@moch/contracts";
import {
  LayoutDashboard,
  FileText,
  MessagesSquare,
  MapPinned,
  Users,
  CalendarDays,
  GraduationCap,
  Briefcase,
  Wrench,
  Images,
  Bell,
  BarChart3,
  Settings,
  Shield,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type NavSectionId =
  | "dashboard"
  | "content"
  | "community"
  | "districts"
  | "employees"
  | "events"
  | "learning"
  | "careers"
  | "services"
  | "media"
  | "notifications"
  | "analytics"
  | "settings"
  | "permissions"
  | "audit";

export interface NavItem {
  id: NavSectionId;
  href: string;
  icon: LucideIcon;
  /** Any of these is enough. Empty = anyone with `admin:access`. */
  permissions: readonly Permission[];
}

/**
 * The sidebar registry. One source of truth for links, icons, breadcrumbs, and
 * permission filtering — the server filters before the client ever sees a section
 * it cannot open, so the menu is not a leak of the permission matrix.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "dashboard", href: "/", icon: LayoutDashboard, permissions: [] },
  { id: "content", href: "/content", icon: FileText, permissions: ["content:edit", "content:manage"] },
  {
    id: "community",
    href: "/community",
    icon: MessagesSquare,
    permissions: ["content:edit", "content:manage"],
  },
  {
    id: "districts",
    href: "/districts",
    icon: MapPinned,
    permissions: ["users:manage", "content:manage", "content:approve"],
  },
  { id: "employees", href: "/employees", icon: Users, permissions: ["users:manage"] },
  { id: "events", href: "/events", icon: CalendarDays, permissions: ["content:edit", "content:manage"] },
  {
    id: "learning",
    href: "/learning",
    icon: GraduationCap,
    permissions: ["content:edit", "content:manage"],
  },
  { id: "careers", href: "/careers", icon: Briefcase, permissions: ["content:edit", "content:manage"] },
  { id: "services", href: "/services", icon: Wrench, permissions: ["content:manage", "feeds:manage"] },
  { id: "media", href: "/media", icon: Images, permissions: ["content:manage", "content:edit"] },
  {
    id: "notifications",
    href: "/notifications",
    icon: Bell,
    permissions: ["content:manage", "content:publish"],
  },
  { id: "analytics", href: "/analytics", icon: BarChart3, permissions: ["analytics:view"] },
  { id: "settings", href: "/settings", icon: Settings, permissions: ["content:manage", "feeds:manage"] },
  { id: "permissions", href: "/permissions", icon: Shield, permissions: ["users:manage"] },
  { id: "audit", href: "/audit", icon: ScrollText, permissions: ["analytics:view", "users:manage"] },
] as const;

export function visibleNav(permissions: readonly Permission[]): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.permissions.length === 0) return true;
    return item.permissions.some((permission) => permissions.includes(permission));
  });
}

/** Match a pathname (without locale) to the deepest nav item that owns it. */
export function navForPath(pathname: string): NavItem | undefined {
  const cleaned = pathname.replace(/^\/(he|en)(?=\/|$)/, "") || "/";
  const ranked = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  return ranked.find((item) =>
    item.href === "/" ? cleaned === "/" : cleaned === item.href || cleaned.startsWith(`${item.href}/`),
  );
}
