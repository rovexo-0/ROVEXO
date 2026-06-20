const STORAGE_KEY = "rovexo-search-history";
const MAX_ITEMS = 10;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(term: string): string[] {
  const normalized = term.trim();
  if (!normalized || typeof window === "undefined") return getSearchHistory();

  const next = [normalized, ...getSearchHistory().filter((item) => item !== normalized)].slice(
    0,
    MAX_ITEMS,
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
