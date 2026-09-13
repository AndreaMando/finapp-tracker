import type { Metadata } from "next";
import { Public_Sans, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider, type Theme } from "@/lib/theme";
import { cookies } from 'next/headers';
import AuthProvider from "./AuthProvider";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

// "Newsprint Financial Page" direction: one quiet civic/financial-document
// grotesk for everything, plus a monospace reserved for currency figures and
// date/category micro-labels (ledger-column authenticity, not a mono costume).
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vaulty",
  description: "Your personal finance tracker",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore: any = await cookies();
  const langCookie = (cookieStore && typeof cookieStore.get === "function") ? cookieStore.get('vaulty_language')?.value as ("en" | "it") | undefined : undefined;
  const themeCookie = (cookieStore && typeof cookieStore.get === "function") ? cookieStore.get('vaulty_theme')?.value as Theme | undefined : undefined;
  const theme: Theme = themeCookie === "dark" ? "dark" : "light";
  return (
    <html lang="en" data-theme={theme} className={`${publicSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-ink antialiased font-sans">
        <AuthProvider>
          <ThemeProvider initialTheme={theme}>
            <I18nProvider initialLang={langCookie}>
              {children}
              <SpeedInsights />
              <Analytics />
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
