"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Target,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Logo } from "@/components/Logo";

// Expenses and Recurring Expenses now live on one merged page (Expenses
// section first, Recurring section beneath) — see expenses/page.tsx. The
// old /recurring route still exists as a redirect for bookmarks, but it's
// no longer a separate primary destination, so the nav is four items now.
const navItems = [
  { href: "/dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { href: "/income",    label: "Income",        icon: TrendingUp      },
  { href: "/expenses",  label: "Expenses",      icon: ShoppingBag     },
  { href: "/goals",     label: "Savings Goals", icon: Target          },
];

// The session is a NextAuth JWT cookie, not a hand-rolled "auth_token" one —
// removing a cookie that was never set left the real session alive, so
// clicking "Logout" didn't actually log anyone out. signOut() clears the
// real session and redirects.
const logout = () => {
  signOut({ callbackUrl: "/" });
};

export function Navbar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // P2: close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // P1: close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    // P1: semantic <header> with landmark. Full page width, no side padding
    // beyond a comfortable gutter — the old shell centered everything inside
    // a fixed max-width even on wide desktops.
    <header
      className="w-full bg-surface border-b border-hairline"
      role="banner"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Logo size={38} className="text-ink shrink-0" />
          <p className="font-bold text-ink text-2xl tracking-tight leading-none">Vaulty</p>
        </div>

        {/* P1: nav landmark with aria-label */}
        <nav
          aria-label={t("Main navigation")}
          className="hidden md:flex items-center gap-1"
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                  ${isActive
                    ? "bg-accent text-accent-contrast"
                    : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                  }
                `}
              >
                <Icon size={16} aria-hidden="true" />
                {t(label)}
              </Link>
            );
          })}
        </nav>

        {/* Settings dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          {/* P2: 44×44 touch target */}
          <button
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={t("Open settings")}
            className="
              w-11 h-11 flex items-center justify-center rounded-lg
              text-ink-muted hover:bg-surface-sunken hover:text-ink
              transition-colors duration-150 cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface
              active:scale-95
            "
          >
            <Settings size={18} aria-hidden="true" />
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              role="menu"
              aria-label={t("Settings menu")}
              className="
                absolute right-0 mt-2 w-60
                bg-surface border border-hairline
                rounded-lg shadow-lg py-2 z-50
                animate-in fade-in slide-in-from-top-2 duration-150
              "
            >
              {/* Theme toggle */}
              <div className="px-4 py-2.5">
                <p className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase mb-2">
                  {t("Theme")}
                </p>
                <div className="flex bg-surface-sunken border border-hairline rounded-lg p-1" role="radiogroup" aria-label={t("Theme")}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={theme === "light"}
                    onClick={() => theme !== "light" && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      theme === "light" ? "bg-accent text-accent-contrast" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Sun size={13} aria-hidden="true" />
                    {t("Light")}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={theme === "dark"}
                    onClick={() => theme !== "dark" && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      theme === "dark" ? "bg-accent text-accent-contrast" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Moon size={13} aria-hidden="true" />
                    {t("Dark")}
                  </button>
                </div>
              </div>

              {/* Language selector */}
              <div className="px-4 py-2.5">
                <p className="text-[10px] font-mono font-semibold text-ink-faint tracking-widest uppercase mb-2">
                  {t("Language")}
                </p>
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-ink-faint shrink-0" aria-hidden="true" />
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as "en" | "it")}
                    aria-label={t("Select language")}
                    className="
                      flex-1 bg-surface-sunken border border-hairline
                      rounded-md px-2 py-1.5 text-sm text-ink
                      cursor-pointer appearance-none
                      focus:outline-none focus:ring-1 focus:ring-accent
                    "
                  >
                    <option value="en">English</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-hairline my-1" />

              {/* Logout */}
              <button
                role="menuitem"
                onClick={logout}
                className="
                  w-full text-left px-4 py-2.5 text-sm
                  text-negative hover:bg-surface-sunken
                  transition-colors duration-150 cursor-pointer
                  flex items-center gap-2.5
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-negative focus-visible:ring-inset
                "
              >
                <LogOut size={14} aria-hidden="true" />
                {t("Logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* P9: mobile bottom nav (visible only on small screens), fixed to the
          viewport bottom like a real app tab bar, safe-area padded. */}
      <nav
        aria-label={t("Mobile navigation")}
        className="
          md:hidden flex items-center justify-around
          fixed inset-x-0 bottom-0 z-40
          bg-surface border-t border-hairline py-2 px-4
          pb-[calc(0.5rem+env(safe-area-inset-bottom))]
        "
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={t(label)}
              className={`
                flex flex-col items-center gap-1
                min-w-[44px] min-h-[44px] justify-center
                rounded-lg transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
                ${isActive ? "text-accent" : "text-ink-muted hover:text-ink"}
              `}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-[10px] font-medium">{t(label)}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
