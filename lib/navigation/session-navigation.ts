const PREVIOUS_PATH_KEY = "rovexo:nav-previous";

/** Records the prior in-app path before each client navigation. */
export function syncNavigationPath(from: string | null, to: string): void {
  if (typeof window === "undefined" || !from || from === to) return;
  sessionStorage.setItem(PREVIOUS_PATH_KEY, from);
}

export function readPreviousNavigationPath(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PREVIOUS_PATH_KEY);
}
