import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import AuthProvider from "./AuthProvider";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: "Vaulty",
  description: "Your personal finance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <I18nProvider>
            {children}
            <SpeedInsights />
            <Analytics />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}