import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();
const STORAGE_KEY = "brawltrack-theme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    let t = "dark";
    try {
      t = localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {}
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    return t;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: "dark", setTheme: () => {}, toggleTheme: () => {} };
  return ctx;
}