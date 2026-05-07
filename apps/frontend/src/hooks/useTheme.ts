import { useState, useEffect } from "react";
import type { Theme } from "../types/sensor";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return saved === "light" ? "light" : "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
