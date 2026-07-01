"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemeName = "light" | "dark" | "system";

export type ThemeProviderProps = {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: ThemeName;
  forcedTheme?: ThemeName;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: ThemeName;
  resolvedTheme: "light" | "dark";
  forcedTheme?: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: ThemeName[];
  systemTheme?: "light" | "dark";
};

const FORCED_THEME = "light" as const;

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const defaultContext: ThemeContextValue = {
  theme: FORCED_THEME,
  resolvedTheme: FORCED_THEME,
  forcedTheme: FORCED_THEME,
  setTheme: () => undefined,
  themes: [FORCED_THEME],
  systemTheme: FORCED_THEME,
};

/**
 * ROVEXO V1.0 uses a forced light theme on <html data-theme="light">.
 * The previous theme package injected an inline script inside the React tree,
 * which triggers React 19 hydration warnings. This provider matches the useTheme
 * without rendering scripts or reading localStorage during render.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(FORCED_THEME);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: FORCED_THEME,
      forcedTheme: FORCED_THEME,
      setTheme,
      themes: [FORCED_THEME],
      systemTheme: FORCED_THEME,
    }),
    [setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? defaultContext;
}
