import type { Metadata } from "next";
import "@/app/globals.css";
//import { Sidebar } from "@/app/(authenticated)/components/layout/Sidebar";      // old sidebar, now replaced by a top navbar
import { Navbar } from "@/app/(authenticated)/components/layout/Sidebar";
import { I18nProvider } from "@/lib/i18n";
import AuthProvider from "../AuthProvider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Vaulty",
  description: "Your personal finance tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <I18nProvider>
            <div className="w64 min-h-screen">
              <Navbar />
              {/* make the scrollable area contain its overscroll behaviour so mobile browsers (especially iPad Safari) don’t allow you to ‘pull’ past the end of the content and see whitespace */}
              <main className="flex-1 overflow-auto overscroll-y-contain">{children}</main>
            </div>
            <SpeedInsights />
            <Analytics />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
