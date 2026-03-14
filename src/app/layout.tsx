import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "FinTrack – Personal Finance",
  description: "Track your income, expenses, and savings goals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <I18nProvider>
          <div className="w64 min-h-screen">
            {/* make the scrollable area contain its overscroll behaviour so mobile browsers (especially iPad Safari) don’t allow you to ‘pull’ past the end of the content and see whitespace */}
            <main className="flex-1 overflow-auto overscroll-y-contain">{children}</main>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
