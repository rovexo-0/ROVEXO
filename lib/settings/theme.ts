import type { AppearanceMode } from "@/lib/settings/types";

export function resolveDarkMode(appearanceMode: AppearanceMode, systemPrefersDark: boolean): boolean {
  if (appearanceMode === "dark") return true;
  if (appearanceMode === "light") return false;
  return systemPrefersDark;
}

export function applyAppearanceMode(appearanceMode: AppearanceMode) {
  if (typeof document === "undefined") return;

  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const dark = resolveDarkMode(appearanceMode, prefersDark);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function syncThemeFromSettings(input: {
  appearanceMode: AppearanceMode;
  darkMode: boolean;
}) {
  if (input.appearanceMode === "system") {
    applyAppearanceMode("system");
    return;
  }
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = input.darkMode ? "dark" : "light";
}
