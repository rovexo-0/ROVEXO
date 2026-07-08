"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppearanceMode } from "@/lib/settings/types";
import { THEME_STORAGE_KEY, applyTheme, systemPrefersDark } from "@/lib/settings/theme";

type ThemeName = AppearanceMode; // "light" | "dark" | "system"

export type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: ThemeName;
};

type ThemeContextValue = {
  theme: ThemeName;
  resolvedTheme: "light" | "dark";
  systemTheme: "light" | "dark";
  themes: ThemeName[];
  /** User action: apply + persist to localStorage AND the account (DB). */
  setTheme: (theme: ThemeName) => void;
  /** Apply + persist locally only (e.g. reconciling from the DB on load). */
  syncTheme: (theme: ThemeName) => void;
};

const THEMES: ThemeName[] = ["light", "dark", "system"];
const DEFAULT_THEME: ThemeName = "light";
const THEME_CHANGE_EVENT = "rovexo-theme-change";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const defaultContext: ThemeContextValue = {
  theme: DEFAULT_THEME,
  resolvedTheme: "light",
  systemTheme: "light",
  themes: THEMES,
  setTheme: () => undefined,
  syncTheme: () => undefined,
};

function readStoredTheme(fallback: ThemeName): ThemeName {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* localStorage unavailable (private mode) — fall back */
  }
  return fallback;
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function notifyThemeChange() {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function subscribeSystemTheme(callback: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSystemThemeSnapshot(): "light" | "dark" {
  return systemPrefersDark() ? "dark" : "light";
}

function getServerSystemThemeSnapshot(): "light" | "dark" {
  return "light";
}

function persistToAccount(mode: ThemeName): void {
  // Best-effort DB sync; ignored for signed-out users (401) or offline.
  void fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appearanceMode: mode }),
  }).catch(() => undefined);
}

/**
 * ROVEXO Theme Engine — the single centralized appearance provider.
 * Light / Dark / System with instant switching (no reload), OS-follow when
 * "system" is selected, persisted to localStorage + the account, and no
 * hydration mismatch (SSR renders the light default; the anti-flash script in
 * app/layout.tsx corrects <html data-theme> before first paint).
 *
 * Intentionally script-free: the pre-paint script lives in the document head,
 * not in the React tree (avoids React 19 hydration warnings).
 */
export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => readStoredTheme(defaultTheme),
    () => defaultTheme,
  );

  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getServerSystemThemeSnapshot,
  );

  const resolvedTheme: "light" | "dark" = theme === "system" ? systemTheme : theme;

  const applyLocal = useCallback((next: ThemeName) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
    notifyThemeChange();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme === "system") applyTheme("system");
  }, [theme, systemTheme]);

  const setTheme = useCallback(
    (next: ThemeName) => {
      applyLocal(next);
      persistToAccount(next);
    },
    [applyLocal],
  );

  const syncTheme = useCallback(
    (next: ThemeName) => {
      applyLocal(next);
    },
    [applyLocal],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, systemTheme, themes: THEMES, setTheme, syncTheme }),
    [theme, resolvedTheme, systemTheme, setTheme, syncTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? defaultContext;
}
