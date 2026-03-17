import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import AuthProvider from "./AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinTrack",
  description: "Your personal finance tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider><I18nProvider>{children}</I18nProvider></AuthProvider></body>
    </html>
  );
}