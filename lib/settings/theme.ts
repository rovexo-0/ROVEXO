export function applyTheme(darkMode: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = darkMode ? "dark" : "light";
}

export function readThemePreference(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.theme === "dark";
}
