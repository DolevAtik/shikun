import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * Hebrew is the default locale and RTL is the default direction. English exists
 * from day one — every string goes through i18n — so switching it on is a
 * translation job, not a rewrite.
 */
export const routing = defineRouting({
  locales: ["he", "en"],
  defaultLocale: "he",
});

export type Locale = (typeof routing.locales)[number];

export const DIRECTION: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
