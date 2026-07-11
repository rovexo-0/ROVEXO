export const IMAGE_SEARCH_STORAGE_KEY = "rovexo-image-search-query-v1";

export function storeImageSearchQuery(dataUrl: string): void {
  try {
    sessionStorage.setItem(IMAGE_SEARCH_STORAGE_KEY, dataUrl);
  } catch {
    // Quota exceeded — caller may fall back to in-memory handoff.
  }
}

export function readImageSearchQuery(): string | null {
  try {
    return sessionStorage.getItem(IMAGE_SEARCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearImageSearchQuery(): void {
  try {
    sessionStorage.removeItem(IMAGE_SEARCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
