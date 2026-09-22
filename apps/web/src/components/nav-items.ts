import { Compass, Home, LayoutGrid, Newspaper, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: "/" | "/feed" | "/services" | "/my-world" | "/profile";
  key: "home" | "feed" | "services" | "myWorld" | "profile";
  Icon: LucideIcon;
}

/** Five destinations. Jobs live inside Services. Personal progress lives in העולם שלי. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", key: "home", Icon: Home },
  { href: "/feed", key: "feed", Icon: Newspaper },
  { href: "/services", key: "services", Icon: LayoutGrid },
  { href: "/my-world", key: "myWorld", Icon: Compass },
  { href: "/profile", key: "profile", Icon: User },
];

export function isNavActive(pathname: string, href: NavItem["href"]): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
