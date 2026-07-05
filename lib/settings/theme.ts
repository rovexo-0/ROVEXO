import type { AppearanceMode } from "@/lib/settings/types";

/** localStorage key holding the user's appearance MODE ("light"|"dark"|"system"). */
export const THEME_STORAGE_KEY = "rovexo-theme";

export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolveDarkMode(appearanceMode: AppearanceMode, systemPrefers: boolean): boolean {
  if (appearanceMode === "dark") return true;
  if (appearanceMode === "light") return false;
  return systemPrefers;
}

/** Resolve a mode to the concrete theme currently in effect. */
export function resolveTheme(appearanceMode: AppearanceMode): "light" | "dark" {
  return resolveDarkMode(appearanceMode, systemPrefersDark()) ? "dark" : "light";
}

/** Apply a mode to <html data-theme> and return the resolved theme. */
export function applyTheme(appearanceMode: AppearanceMode): "light" | "dark" {
  const resolved = resolveTheme(appearanceMode);
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolved;
  }
  return resolved;
}

/* ── Backward-compatible wrappers (single underlying implementation) ── */

export function applyAppearanceMode(appearanceMode: AppearanceMode) {
  applyTheme(appearanceMode);
}

export function syncThemeFromSettings(input: {
  appearanceMode: AppearanceMode;
  darkMode?: boolean;
}) {
  applyTheme(input.appearanceMode);
}
