/**
 * ROVEXO THEME SWITCH v1.0 — Black Underground
 * ONE application theme state. Client persistence only (localStorage).
 * Product / listing photographs must never be filtered or transformed.
 */

export const ROVEXO_THEME_NAME = "ROVEXO THEME SWITCH" as const;
export const ROVEXO_THEME_VERSION = "1.0" as const;
export const ROVEXO_THEME_STORAGE_KEY = "rovexo-theme" as const;

export type RovexoThemeMode = "light" | "dark";

/** Default = existing white / light theme. */
export const ROVEXO_THEME_DEFAULT: RovexoThemeMode = "light";

/** Canonical Black Underground palette (ON). */
export const BLACK_UNDERGROUND_PALETTE = {
  page: "#0D0F14",
  surface: "#171A21",
  secondarySurface: "#1E222B",
  border: "#2B2F38",
  divider: "#343A45",
  primaryText: "#FFFFFF",
  secondaryText: "#B6BCC8",
  /** Existing canonical ROVEXO Purple — never invent a second accent. */
  accent: "#9333ea",
} as const;

/** Canonical CSS custom properties (Theme Switch v1.0). */
export const ROVEXO_THEME_CSS_VARS = {
  page: "--rvx-page",
  surface: "--rvx-surface",
  surfaceSecondary: "--rvx-surface-secondary",
  border: "--rvx-border",
  divider: "--rvx-divider",
  textPrimary: "--rvx-text-primary",
  textSecondary: "--rvx-text-secondary",
  accent: "--rvx-accent",
} as const;

export function normalizeRovexoTheme(value: unknown): RovexoThemeMode {
  return value === "dark" ? "dark" : "light";
}

export function isRovexoDarkTheme(theme: RovexoThemeMode): boolean {
  return theme === "dark";
}

/** Apply theme to documentElement — no reload, no API. */
export function applyRovexoThemeToDocument(theme: RovexoThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", normalizeRovexoTheme(theme));
}

export function readStoredRovexoTheme(): RovexoThemeMode {
  if (typeof window === "undefined") return ROVEXO_THEME_DEFAULT;
  try {
    return normalizeRovexoTheme(window.localStorage.getItem(ROVEXO_THEME_STORAGE_KEY));
  } catch {
    return ROVEXO_THEME_DEFAULT;
  }
}

export function persistRovexoTheme(theme: RovexoThemeMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROVEXO_THEME_STORAGE_KEY, normalizeRovexoTheme(theme));
  } catch {
    /* private mode / quota — theme still applies in-session via data-theme */
  }
}

export function setRovexoTheme(theme: RovexoThemeMode): RovexoThemeMode {
  const next = normalizeRovexoTheme(theme);
  applyRovexoThemeToDocument(next);
  persistRovexoTheme(next);
  return next;
}

export function toggleRovexoTheme(current: RovexoThemeMode): RovexoThemeMode {
  return setRovexoTheme(current === "dark" ? "light" : "dark");
}

/**
 * beforeInteractive bootstrap — same persistence pattern as locale (localStorage).
 * Fail-closed: anything other than "dark" → light.
 */
export const ROVEXO_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(ROVEXO_THEME_STORAGE_KEY)});document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){try{document.documentElement.setAttribute("data-theme","light");}catch(_){}}})();`;

export function rovexoThemeSnapshot() {
  return {
    name: ROVEXO_THEME_NAME,
    version: ROVEXO_THEME_VERSION,
    storageKey: ROVEXO_THEME_STORAGE_KEY,
    defaultTheme: ROVEXO_THEME_DEFAULT,
    blackUnderground: BLACK_UNDERGROUND_PALETTE,
    profileControl: {
      location: "Profile → under Rovexo Ideas",
      off: "light (existing white)",
      on: "dark (Black Underground)",
    },
    productImageProtection: {
      filters: "FORBIDDEN",
      transformations: "FORBIDDEN",
      urlChanges: "FORBIDDEN",
    },
  } as const;
}
