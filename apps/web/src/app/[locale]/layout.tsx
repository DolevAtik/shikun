import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Assistant } from "next/font/google";
import { DIRECTION, routing, type Locale } from "@/i18n/routing";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a3a70" },
    { media: "(prefers-color-scheme: dark)", color: "#0d151f" },
  ],
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
 * Applies the saved theme before first paint. Without this the app flashes
 * light before turning dark, which looks broken and is genuinely unpleasant at
 * 7am — which is exactly when people open this app.
 */
function ThemeScript() {
  const script = `
    try {
      var saved = localStorage.getItem('theme');
      var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (dark) document.documentElement.classList.add('dark');
    } catch (e) {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
