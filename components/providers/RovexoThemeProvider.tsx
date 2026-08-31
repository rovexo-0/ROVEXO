"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  applyRovexoThemeToDocument,
  normalizeRovexoTheme,
  persistRovexoTheme,
  readStoredRovexoTheme,
  type RovexoThemeMode,
  ROVEXO_THEME_DEFAULT,
} from "@/lib/theme/rovexo-theme-v1";
import {
  loadBlackUndergroundThemeCss,
  prefetchBlackUndergroundThemeCssIdle,
} from "@/lib/theme/load-black-underground-theme-css-v1";

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

async function applyThemeWithCss(next: RovexoThemeMode): Promise<void> {
  const normalized = normalizeRovexoTheme(next);
  if (normalized === "dark") {
    await loadBlackUndergroundThemeCss();
  }
  applyRovexoThemeToDocument(normalized);
  persistRovexoTheme(normalized);
  emitThemeChange();
}

function useDocumentThemeController(): RovexoThemeContextValue {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readDocumentTheme,
    () => ROVEXO_THEME_DEFAULT,
  );

  const setTheme = useCallback((next: RovexoThemeMode) => {
    void applyThemeWithCss(next);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readDocumentTheme() === "dark" ? "light" : "dark";
    void applyThemeWithCss(next);
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
 *
 * Hydration contract: SSR + first client render keep `data-theme="light"`.
 * Stored preference is applied only after mount (no beforeInteractive DOM mutation).
 * OPT-HP-PERF: dark CSS loads only when needed (or idle-prefetch for light users).
 */
export function RovexoThemeProvider({ children }: { children: ReactNode }) {
  const value = useDocumentThemeController();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = readStoredRovexoTheme();
      if (stored === "dark") {
        await loadBlackUndergroundThemeCss();
      } else {
        prefetchBlackUndergroundThemeCssIdle();
      }
      if (cancelled) return;
      if (stored === readDocumentTheme()) return;
      applyRovexoThemeToDocument(stored);
      emitThemeChange();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <RovexoThemeContext.Provider value={value}>{children}</RovexoThemeContext.Provider>;
}

/**
 * Always binds to document `data-theme` — never throws, never viewport-specific.
 * Provider is optional for correctness; present for tree consistency.
 */
export function useRovexoTheme(): RovexoThemeContextValue {
  return useDocumentThemeController();
}
