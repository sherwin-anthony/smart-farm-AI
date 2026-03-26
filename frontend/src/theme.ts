export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "smartfarm-theme";

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark";

export const getSystemTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const getStoredTheme = (): ThemeMode | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(storedTheme) ? storedTheme : null;
};

export const getInitialTheme = (): ThemeMode => getStoredTheme() ?? getSystemTheme();

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

export const persistTheme = (theme: ThemeMode) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
};
