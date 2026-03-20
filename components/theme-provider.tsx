"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "formal" | "hacker" | "casual";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("formal");
  const [mounted, setMounted] = useState(false);

  // Ambil tema dari localStorage saat web pertama kali dimuat
  useEffect(() => {
    const savedTheme = localStorage.getItem("vault_theme") as Theme;
    if (savedTheme && ["formal", "hacker", "casual"].includes(savedTheme)) {
      setThemeState(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
    setMounted(true);
  }, []);

  // Fungsi untuk mengganti tema secara global
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("vault_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Mencegah hydration mismatch (flicker) di Next.js
  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom Hook agar mudah dipanggil di komponen mana saja
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme harus digunakan di dalam ThemeProvider");
  }
  return context;
}