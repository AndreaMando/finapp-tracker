"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  Target,
  Wallet,
  SettingsIcon,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import Cookies from 'js-cookie';

// navItems labels will be translated inside the component
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/recurring", label: "Recurring Expenses", icon: RefreshCw },
  { href: "/expenses", label: "Expenses", icon: ShoppingBag },
  { href: "/goals", label: "Savings Goals", icon: Target },
];

const logout = () => {
  Cookies.remove('auth_token');
  window.location.href = '../../';
};

export function Navbar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // close dropdown if clicking outside of it
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="w-full bg-gray-900 text-white border-b border-gray-700">
      <div className="flex items-center justify-between px-6 py-3">

        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-tight">Vaulty</p>
            <p className="text-gray-400 text-xs">{t("Personal Finance")}</p>
          </div>
        </div>

        {/* Navigation — centered */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors ${
                  isActive
                    ? "bg-green-800 text-white text-sm"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white text-xs"
                }`}
              >
                <Icon size={18} />
                {t(label)}
              </Link>
            );
          })}
        </nav>

         {/* Settings */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
          >
            <SettingsIcon size={20} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-lg py-2 z-50">

              {/* Language selector */}
              <div className="px-4 py-2">
                <p className="text-xs text-gray-400 mb-1.5">{t("Language")}</p>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as "en" | "it")}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="it">Italiano</option>
                </select>
              </div>
              
              <div className="border-t border-gray-700 my-1" />

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors cursor-pointer"
              >
                {t("Logout")}
              </button>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}