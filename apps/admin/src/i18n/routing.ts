import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * The same two locales as the employee app, for the same reason: Hebrew is the
 * default and RTL is the default direction, and English exists from day one so
 * that switching it on is a translation job rather than a rewrite.
 *
 * The message catalogue, however, is the admin's own — see ../../messages. The
 * two apps share a design system and a token file; they do not share strings.
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
