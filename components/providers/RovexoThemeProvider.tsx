"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyRovexoThemeToDocument,
  normalizeRovexoTheme,
  persistRovexoTheme,
  type RovexoThemeMode,
  ROVEXO_THEME_DEFAULT,
} from "@/lib/theme/rovexo-theme-v1";

const THEME_CHANGE_EVENT = "rovexo-theme-change";

type RovexoThemeContextValue = {
  theme: RovexoThemeMode;
  isDark: boolean;
  setTheme: (theme: RovexoThemeMode) => void;
  toggleTheme: () => void;
};

const RovexoThemeContext = createContext<RovexoThemeContextValue | null>(null);

function readDocumentTheme(): RovexoThemeMode {
  if (typeof document === "undefined") return ROVEXO_THEME_DEFAULT;
  return normalizeRovexoTheme(document.documentElement.getAttribute("data-theme"));
}

function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onChange = () => onStoreChange();
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function emitThemeChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function useDocumentThemeController(): RovexoThemeContextValue {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readDocumentTheme,
    () => ROVEXO_THEME_DEFAULT,
  );

  const setTheme = useCallback((next: RovexoThemeMode) => {
    const normalized = normalizeRovexoTheme(next);
    applyRovexoThemeToDocument(normalized);
    persistRovexoTheme(normalized);
    emitThemeChange();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readDocumentTheme() === "dark" ? "light" : "dark";
    applyRovexoThemeToDocument(next);
    persistRovexoTheme(next);
    emitThemeChange();
  }, []);

  return useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );
}

/**
 * Single application theme owner (desktop + mobile + tablet).
 * Persistence: localStorage `rovexo-theme`. Document `data-theme` is SSOT.
 */
export function RovexoThemeProvider({ children }: { children: ReactNode }) {
  const value = useDocumentThemeController();
  return <RovexoThemeContext.Provider value={value}>{children}</RovexoThemeContext.Provider>;
}

/**
 * Always binds to document `data-theme` — never throws, never viewport-specific.
 * Provider is optional for correctness; present for tree consistency.
 */
export function useRovexoTheme(): RovexoThemeContextValue {
  return useDocumentThemeController();
}
