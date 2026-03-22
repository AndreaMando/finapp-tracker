"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  Target,
  Settings,
  LogOut,
  Globe,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Cookies from "js-cookie";

const navItems = [
  { href: "/dashboard", label: "Dashboard",         icon: LayoutDashboard },
  { href: "/income",    label: "Income",             icon: TrendingUp      },
  { href: "/recurring", label: "Recurring Expenses", icon: RefreshCw       },
  { href: "/expenses",  label: "Expenses",           icon: ShoppingBag     },
  { href: "/goals",     label: "Savings Goals",      icon: Target          },
];

const logout = () => {
  Cookies.remove("auth_token");
  window.location.href = "../../";
};

export function Navbar() {
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();
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
    // P1: semantic <header> with landmark
    <header
      className="w-full bg-[#111318] border-b border-[#1a1d24]"
      role="banner"
    >
      <div className="flex items-center justify-between px-6 h-14">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            style={{ width: 52, height: 52, borderRadius: "22%", overflow: "hidden", flexShrink: 0 }}
          >
            <Image
              src="/logo.png"
              alt="Vaulty logo"
              width={144}
              height={144}
              sizes="52px"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              priority
            />
          </div>
          <div>
            <p className="font-bold text-white text-3xl tracking-tight leading-none">Vaulty</p>
          </div>
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
                // P1: aria-current for screen readers
                aria-current={isActive ? "page" : undefined}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl font-medium
                  transition-colors duration-150
                  // P2: min touch target via padding
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]
                  ${isActive
                    ? "bg-[#00FFA3] text-[#0d0d0d] text-sm"
                    : "text-[#9ca3af] hover:bg-[#1a1d24] hover:text-white text-xs"
                  }
                `}
              >
                {/* P1: icon aria-hidden since label is present */}
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
            // P1: aria-expanded + aria-haspopup + aria-label
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={t("Open settings")}
            className="
              w-11 h-11 flex items-center justify-center rounded-xl
              text-[#9ca3af] hover:bg-[#1a1d24] hover:text-white
              transition-colors duration-150 cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]
              // P2: scale feedback on press
              active:scale-95
            "
          >
            <Settings size={18} aria-hidden="true" />
          </button>

          {/* Dropdown menu */}
          {open && (
            // P1: role="menu" for screen readers
            <div
              role="menu"
              aria-label={t("Settings menu")}
              className="
                absolute right-0 mt-2 w-56
                bg-[#1a1d24] border border-[#252830]
                rounded-xl shadow-2xl py-2 z-50
                // P7: subtle entrance animation
                animate-in fade-in slide-in-from-top-2 duration-150
              "
            >
              {/* Language selector */}
              <div className="px-4 py-2.5">
                <p className="text-[10px] font-semibold text-[#6b7280] tracking-widest uppercase mb-2">
                  {t("Language")}
                </p>
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-[#6b7280] shrink-0" aria-hidden="true" />
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as "en" | "it")}
                    // P1: aria-label on select
                    aria-label={t("Select language")}
                    className="
                      flex-1 bg-[#111318] border border-[#252830]
                      rounded-lg px-2 py-1.5 text-sm text-white
                      cursor-pointer appearance-none
                      focus:outline-none focus:ring-1 focus:ring-[#00FFA3]
                    "
                  >
                    <option value="en">English</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#252830] my-1" />

              {/* Logout */}
              {/* P1: role="menuitem", P8: destructive action visually separated */}
              <button
                role="menuitem"
                onClick={logout}
                className="
                  w-full text-left px-4 py-2.5 text-sm
                  text-red-400 hover:bg-[#252830] hover:text-red-300
                  transition-colors duration-150 cursor-pointer
                  flex items-center gap-2.5
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-inset
                "
              >
                <LogOut size={14} aria-hidden="true" />
                {t("Logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* P9: mobile bottom nav (visible only on small screens) */}
      <nav
        aria-label={t("Mobile navigation")}
        className="
          md:hidden flex items-center justify-around
          border-t border-[#1a1d24] py-2 px-4
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
                // P2: 44×44 min touch target
                min-w-[44px] min-h-[44px] justify-center
                rounded-xl transition-colors duration-150
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FFA3]
                ${isActive ? "text-[#00FFA3]" : "text-[#6b7280] hover:text-white"}
              `}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="text-[9px] font-medium">{t(label)}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}