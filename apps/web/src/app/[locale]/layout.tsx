import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Assistant } from "next/font/google";
import { DIRECTION, routing, type Locale } from "@/i18n/routing";
import { APPEARANCE_SCRIPT, THEME_COLOR } from "@/lib/appearance";
import "../globals.css";

/**
 * gov.il uses Almoni, which is commercially licensed. Until the Ministry
 * supplies that license this is Assistant — a free Hebrew face with a similar
 * institutional register. Nothing in the design depends on Almoni's metrics, so
 * the swap is one line here.
 */
const hebrew = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "משרד הבינוי והשיכון — הבית הדיגיטלי",
  description: "הבית הדיגיטלי של עובדי משרד הבינוי והשיכון",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/ministry-logo.svg", apple: "/ministry-logo.svg" },
};

export const viewport: Viewport = {
  // One colour, because the app does not follow the OS: it is the default design
  // in light mode unless the person chose otherwise. The appearance script
  // rewrites this tag before first paint when they did.
  themeColor: THEME_COLOR.mosaic.light,
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
 * Applies the saved design and theme before first paint. The default is design 2
 * in light mode — the OS preference is deliberately ignored — so only an explicit
 * choice on the profile page changes it. Doing it here rather than on mount
 * avoids a flash of the default before it switches.
 */
function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />;
}
