import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Assistant } from "next/font/google";
import { DIRECTION, routing, type Locale } from "@/i18n/routing";
import "../globals.css";

const hebrew = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מערכת הניהול — משרד הבינוי והשיכון",
  description: "מערכת ניהול התוכן והמשתמשים של הבית הדיגיטלי",
  // An admin console has no business being indexed, and no business being a PWA.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a3a70",
  // No maximum-scale: pinch-zoom must never be disabled — WCAG 1.4.4.
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={DIRECTION[locale as Locale]}
      className={hebrew.variable}
      suppressHydrationWarning
    >
      <body>
        <ThemeScript />
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

/**
 * Applies the saved theme before first paint, so a dark-mode user does not get a
 * white flash on every navigation. Light is the default; only an explicit choice
 * of dark, kept in localStorage, turns the console dark.
 */
function ThemeScript() {
  const script = `
    try {
      if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');
    } catch (e) {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
