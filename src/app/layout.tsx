import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import { cookies } from 'next/headers';
import AuthProvider from "./AuthProvider";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Vaulty",
  description: "Your personal finance tracker",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore: any = await cookies();
  const langCookie = (cookieStore && typeof cookieStore.get === "function") ? cookieStore.get('vaulty_language')?.value as ("en" | "it") | undefined : undefined;
  return (
    <html lang="en">
      <body className="bg-[#0d0d0d] text-[#9ca3af] antialiased">
        <AuthProvider>
          <I18nProvider initialLang={langCookie}>
            {children}
            <SpeedInsights />
            <Analytics />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}