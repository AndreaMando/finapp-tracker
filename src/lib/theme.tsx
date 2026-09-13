"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "vaulty_theme";
const COOKIE_KEY = "vaulty_theme";
const DEFAULT_THEME: Theme = "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyThemeAttr(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", t);
}

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? DEFAULT_THEME);

  // Server already stamped data-theme on <html> from the cookie (see layout.tsx)
  // so there's no flash; this effect only reconciles localStorage on first mount
  // when the server had no cookie yet, matching the i18n provider's pattern.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      if (!initialTheme) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
        applyThemeAttr(stored);
      }
    } else if (initialTheme) {
      window.localStorage.setItem(STORAGE_KEY, initialTheme);
    }
  }, [initialTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyThemeAttr(t);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, t);
      document.cookie = `${COOKIE_KEY}=${t}; path=/; max-age=31536000; samesite=lax`;
    }
  };

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
