// client/src/store/themeStore.js
import { create } from "zustand";

const getInitialTheme = () => {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme");
  if (stored && ["dark", "light", "system"].includes(stored)) {
    return stored;
  }
  return "dark";
};

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  let active = theme;
  if (theme === "system") {
    active =
      typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
  }

  if (active === "light") {
    root.setAttribute("data-theme", "light");
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.setAttribute("data-theme", "dark");
    root.classList.add("dark");
    root.classList.remove("light");
  }
}

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),

  setTheme: (newTheme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
    applyTheme(newTheme);
    set({ theme: newTheme });
  },

  initTheme: () => {
    const current = getInitialTheme();
    applyTheme(current);
  },
}));

// Apply immediately on bundle evaluation
if (typeof window !== "undefined") {
  applyTheme(getInitialTheme());
}
